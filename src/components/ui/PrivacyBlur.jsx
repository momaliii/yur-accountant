import { useSettingsStore } from '../../stores/useStore';

export default function PrivacyBlur({ children, className = '' }) {
  const { privacyMode } = useSettingsStore();

  if (!privacyMode) {
    return <>{children}</>;
  }

  return (
    <span
      className={`relative inline-block ${className}`}
      style={{
        filter: 'blur(8px)',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
      title="Data hidden in privacy mode"
    >
      {children}
    </span>
  );
}

export function PrivacyValue({ value, placeholder = '••••••' }) {
  const { privacyMode } = useSettingsStore();

  if (!privacyMode) {
    return <>{value}</>;
  }

  return (
    <span className="text-slate-500 select-none" title="Data hidden in privacy mode">
      {placeholder}
    </span>
  );
}

