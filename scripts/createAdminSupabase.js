import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  try {
    // Get Supabase credentials
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
      console.error('\nPlease set them in your .env file:');
      console.error('SUPABASE_URL=https://xxxxx.supabase.co');
      console.error('SUPABASE_SERVICE_ROLE_KEY=sb_secret_...');
      process.exit(1);
    }

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('✅ Connected to Supabase\n');

    // Get user input
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password (min 6 chars): ');
    const name = await question('Enter admin name (optional): ');

    if (!email || !password) {
      console.error('❌ Email and password are required');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    // Check if user already exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      process.exit(1);
    }

    const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      console.log('⚠️  User already exists. Updating to admin...');
      
      // Update user metadata to set role as admin
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          ...existingUser.user_metadata,
          name: name || existingUser.user_metadata?.name || '',
          role: 'admin',
        },
      });

      if (updateError) {
        console.error('❌ Error updating user:', updateError.message);
        process.exit(1);
      }

      console.log('✅ User updated to admin successfully!');
    } else {
      // Create new admin user
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: name || '',
          role: 'admin',
        },
      });

      if (createError) {
        console.error('❌ Error creating user:', createError.message);
        process.exit(1);
      }

      if (!authData.user) {
        console.error('❌ Error: No user data returned');
        process.exit(1);
      }

      console.log('✅ Admin user created successfully!');
    }

    console.log('\n📝 Admin Details:');
    console.log(`   Email: ${email.toLowerCase()}`);
    console.log(`   Role: admin`);
    console.log(`   Name: ${name || 'Not set'}`);
    console.log('\n✅ You can now log in with this account!');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

createAdmin();
