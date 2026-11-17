type IconProps = { className?: string };

export function MenuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 14" className={className} aria-hidden="true">
      <path d="M0 1h22M0 7h16M0 13h22" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M16 16.5 20.5 21" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 19.2c1.4-3 3.8-4.4 7-4.4s5.6 1.4 7 4.4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function BagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M6.5 8h11l-.8 11.2a1 1 0 0 1-1 .8H8.3a1 1 0 0 1-1-.8L6.5 8Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 8V6.8A3 3 0 0 1 12 3.8 3 3 0 0 1 15 6.8V8" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function HeartIcon({ className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 19.2s-6.4-3.9-6.4-8.1A3.5 3.5 0 0 1 12 8.6a3.5 3.5 0 0 1 6.4 2.5c0 4.2-6.4 8.1-6.4 8.1Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HangerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 7.2a2 2 0 1 0-2-2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 7.2 4 14.2h16L12 7.2Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M15.5 3.8A7.6 7.6 0 1 0 20.2 15 6.2 6.2 0 0 1 15.5 3.8Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M5 7h14M9 7V5h6v2M8 7l.7 12h6.6L16 7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
