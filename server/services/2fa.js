import crypto from 'crypto';

// Dynamic imports for optional dependencies
let speakeasy, QRCode;
const load2FADependencies = async () => {
  if (!speakeasy) {
    try {
      speakeasy = (await import('speakeasy')).default;
    } catch (error) {
      console.warn('speakeasy not installed. 2FA features will be limited.');
    }
  }
  if (!QRCode) {
    try {
      QRCode = (await import('qrcode')).default;
    } catch (error) {
      console.warn('qrcode not installed. QR code generation will fail.');
    }
  }
};

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

// Encrypt sensitive data
function encrypt(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

// Decrypt sensitive data
function decrypt(encryptedData) {
  if (!encryptedData || !encryptedData.encrypted) return null;
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'hex'),
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Generate TOTP secret
export async function generateSecret(userEmail) {
  await load2FADependencies();
  
  if (!speakeasy) {
    throw new Error('speakeasy is not installed. Please run: npm install speakeasy qrcode');
  }
  
  const secret = speakeasy.generateSecret({
    name: `YUR Finance (${userEmail})`,
    issuer: 'YUR Finance',
    length: 32,
  });
  
  // Encrypt the secret before storing
  const encryptedSecret = encrypt(secret.base32);
  
  return {
    secret: secret.base32,
    encryptedSecret,
    otpauthUrl: secret.otpauth_url,
  };
}

// Generate QR code for authenticator app
export async function generateQRCode(otpauthUrl) {
  await load2FADependencies();
  
  if (!QRCode) {
    throw new Error('qrcode is not installed. Please run: npm install qrcode');
  }
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Verify TOTP token
export async function verifyToken(secret, token) {
  await load2FADependencies();
  
  if (!speakeasy) {
    throw new Error('speakeasy is not installed');
  }
  
  try {
    // If secret is encrypted, decrypt it first
    let decryptedSecret = secret;
    if (typeof secret === 'object' && secret.encrypted) {
      decryptedSecret = decrypt(secret);
    }
    
    return speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (60 seconds) before/after
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
}

// Generate backup codes
export function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-digit code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
    codes.push(code);
  }
  
  // Encrypt backup codes
  const encryptedCodes = codes.map(code => encrypt(code));
  
  return {
    codes, // Plain codes to show user once
    encryptedCodes, // Encrypted codes for storage
  };
}

// Verify backup code
export function verifyBackupCode(encryptedCodes, code) {
  try {
    for (const encryptedCode of encryptedCodes) {
      const decrypted = decrypt(encryptedCode);
      if (decrypted === code.toUpperCase()) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error verifying backup code:', error);
    return false;
  }
}

export default {
  generateSecret,
  generateQRCode,
  verifyToken,
  generateBackupCodes,
  verifyBackupCode,
};
