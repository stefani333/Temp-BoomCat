interface CatAvatarProps {
  className?: string;
}

/** 原创猫咪头像占位素材，后续可替换为正式立绘裁切。 */
export function CatAvatar({ className = '' }: CatAvatarProps) {
  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#ffd794] ${className}`}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <circle cx="32" cy="32" r="32" fill="#FFD794" />
        <path d="M13 24 L9 5 L28 14 Z" fill="#F5A048" />
        <path d="M51 24 L55 5 L36 14 Z" fill="#F5A048" />
        <path d="M16 21 L14 10 L24 15 Z" fill="#F8BBA4" />
        <path d="M48 21 L50 10 L40 15 Z" fill="#F8BBA4" />
        <circle cx="32" cy="35" r="22" fill="#F7A64B" />
        <circle cx="32" cy="38" r="18" fill="#FFB65E" />
        <path
          d="M13 32 C13 24 22 22 27 26 C30 28 34 28 37 26 C42 22 51 24 51 32 C51 38 43 40 38 37 C34 35 30 35 26 37 C21 40 13 38 13 32 Z"
          fill="#4E2C1D"
        />
        <ellipse cx="23.5" cy="31" rx="4.6" ry="5.6" fill="#FFD34E" />
        <ellipse cx="40.5" cy="31" rx="4.6" ry="5.6" fill="#FFD34E" />
        <ellipse cx="23.5" cy="31.5" rx="1.8" ry="3.4" fill="#3B2216" />
        <ellipse cx="40.5" cy="31.5" rx="1.8" ry="3.4" fill="#3B2216" />
        <circle cx="22.3" cy="29.5" r="1.1" fill="#FFFFFF" />
        <circle cx="39.3" cy="29.5" r="1.1" fill="#FFFFFF" />
        <ellipse cx="26" cy="42" rx="7" ry="6" fill="#FFE7C4" />
        <ellipse cx="38" cy="42" rx="7" ry="6" fill="#FFE7C4" />
        <path d="M29 39.5 L35 39.5 L32 42.5 Z" fill="#E97B6A" />
        <path
          d="M32 42.5 L32 45 M32 45 C30 47.5 27.5 47.5 26.5 46 M32 45 C34 47.5 36.5 47.5 37.5 46"
          fill="none"
          stroke="#5C3218"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M8 37 L16 39 M8 42 L16 42 M56 37 L48 39 M56 42 L48 42"
          stroke="#FFF3DC"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
