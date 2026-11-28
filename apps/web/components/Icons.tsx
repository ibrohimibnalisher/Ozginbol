const P = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const Logo = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5fe39a" />
        <stop offset="1" stopColor="#12a150" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="10" fill="url(#lg)" />
    <circle cx="16" cy="16" r="8.5" fill="none" stroke="#04110a" strokeWidth="3" strokeDasharray="40 60" strokeLinecap="round" transform="rotate(-90 16 16)" />
    <circle cx="16" cy="16" r="2.6" fill="#04110a" />
  </svg>
);
export const Sun = () => (
  <svg {...P}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
export const Moon = () => (
  <svg {...P}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);
export const Flame = () => (
  <svg {...P}>
    <path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3 1-6.5 1-8.5z" />
  </svg>
);
export const TrendDown = () => (
  <svg {...P}>
    <path d="M3 7l6 6 4-4 8 8M21 11v6h-6" />
  </svg>
);
export const Scale = () => (
  <svg {...P}>
    <rect x="3" y="4" width="18" height="16" rx="4" />
    <path d="M8 9a4 4 0 0 1 8 0M12 9l1.5-2" />
  </svg>
);
export const Dumbbell = () => (
  <svg {...P}>
    <path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12" />
  </svg>
);
export const Drop = () => (
  <svg {...P}>
    <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
  </svg>
);
export const Send = () => (
  <svg {...P} width={18} height={18}>
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);
export const Ruler = () => (
  <svg {...P}>
    <path d="M3 17L17 3l4 4L7 21z M7 13l2 2M10 10l2 2M13 7l2 2" />
  </svg>
);
