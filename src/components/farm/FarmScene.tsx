import { useId } from "react";

/**
 * Original illustrated Zimbabwean farm scene (dawn over the highveld: granite hills, a baobab, maize rows and a
 * small herd). Tiny, free of licensing questions and always available offline; used as the backdrop whenever a
 * real photo or clip is missing or still loading.
 */
export function FarmScene({ className = "", dim = false }: { className?: string; dim?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={className} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d4d3a" /><stop offset="0.45" stopColor="#d9893f" /><stop offset="0.75" stopColor="#f6c56b" /><stop offset="1" stopColor="#fde6a8" />
        </linearGradient>
        <radialGradient id={`${id}g`} cx="0.72" cy="0.55" r="0.5"><stop offset="0" stopColor="#fff3c4" stopOpacity="0.95" /><stop offset="1" stopColor="#fff3c4" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4f8a3a" /><stop offset="1" stopColor="#2a5a2a" /></linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}s)`} />
      <rect width="400" height="300" fill={`url(#${id}g)`} />
      <circle cx="288" cy="150" r="22" fill="#fff6d6" />
      {/* granite kopjes */}
      <path d="M0 190 L40 150 L70 168 L110 128 L150 170 L190 160 L230 185 L230 215 L0 215Z" fill="#8a6a4a" opacity="0.55" />
      <path d="M170 200 L230 160 L270 178 L330 140 L400 182 L400 220 L170 220Z" fill="#6f5a3f" opacity="0.6" />
      {/* baobab */}
      <g fill="#3a2a1c">
        <path d="M78 222 C74 190 70 176 72 160 L84 160 C86 176 84 192 90 222Z" />
        <path d="M70 162 L52 140 M70 160 L62 132 M86 160 L100 134 M88 162 L108 146 M78 160 L78 126" stroke="#3a2a1c" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <circle cx="52" cy="138" r="9" /><circle cx="62" cy="130" r="9" /><circle cx="78" cy="124" r="10" /><circle cx="100" cy="132" r="9" /><circle cx="108" cy="145" r="8" />
      </g>
      {/* field and maize rows */}
      <rect y="214" width="400" height="86" fill={`url(#${id}f)`} />
      {Array.from({ length: 9 }).map((_, i) => {
        const x = 20 + i * 45;
        return <path key={i} d={`M200 214 L${x - 80 + i * 20} 300`} stroke="#1f4a22" strokeWidth={2 + i * 0.25} opacity="0.55" />;
      })}
      {Array.from({ length: 14 }).map((_, i) => (
        <g key={i} transform={`translate(${12 + i * 29} ${236 + (i % 3) * 14})`} fill="#2f6b2c">
          <path d="M0 0 C-6 -10 -10 -12 -14 -18 C-6 -14 -2 -10 0 -4 C2 -10 6 -14 14 -18 C10 -12 6 -10 0 0Z" /><rect x="-1" y="-2" width="2" height="10" />
        </g>
      ))}
      {/* herd */}
      <g fill="#2a1d14" transform="translate(238 226)">
        {[0, 38, 70].map((dx, i) => (
          <g key={dx} transform={`translate(${dx} ${i === 1 ? -4 : 0}) scale(${i === 1 ? 0.8 : 1})`}>
            <ellipse cx="14" cy="6" rx="15" ry="7" /><rect x="3" y="9" width="3" height="10" /><rect x="22" y="9" width="3" height="10" />
            <path d="M27 3 L36 -2 L38 4 L30 9Z" /><path d="M35 -2 L37 -7 M38 -1 L42 -4" stroke="#2a1d14" strokeWidth="1.5" fill="none" />
          </g>
        ))}
      </g>
      {dim && <rect width="400" height="300" fill="#0b2a18" opacity="0.35" />}
    </svg>
  );
}
