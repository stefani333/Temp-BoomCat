interface CoinIconProps {
  className?: string;
}

/** 金币图标，原创几何绘制，无外部素材依赖。 */
export function CoinIcon({ className = '' }: CoinIconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="17.5" r="13.5" fill="#B96E12" />
      <circle cx="16" cy="15.5" r="13.5" fill="#FFC93C" stroke="#FFE6A3" strokeWidth="2" />
      <circle cx="16" cy="15.5" r="9.4" fill="none" stroke="#D98A19" strokeWidth="2" />
      <ellipse cx="12" cy="10.5" rx="4.2" ry="2.6" fill="#FFE082" opacity="0.8" />
      <g fill="#B96E12">
        <ellipse cx="16" cy="18.4" rx="3.1" ry="2.5" />
        <circle cx="12.6" cy="15.7" r="1.14" />
        <circle cx="15.2" cy="14.4" r="1.14" />
        <circle cx="17.9" cy="14.4" r="1.14" />
        <circle cx="20.3" cy="15.9" r="1.14" />
      </g>
    </svg>
  );
}
