/**
 * BOMB CAT 原创主视觉角色：橙虎斑猫 + 深色眼罩纹样 + 青色领巾 + 火花尾尖。
 * 全部由 SVG 路径绘制，未使用任何竞品素材；后续可在这里替换为正式立绘或骨骼动画。
 */
export function CatCharacter() {
  return (
    <svg
      viewBox="0 0 520 620"
      className="h-auto w-full overflow-visible"
      role="img"
      aria-label="BOMB CAT 原创猫咪角色，戴青色领巾，尾巴尖端有火花"
    >
      <defs>
        <radialGradient id="cat-head" cx="0.34" cy="0.22" r="0.9">
          <stop offset="0" stopColor="#FFD08F" />
          <stop offset="0.45" stopColor="#F9A951" />
          <stop offset="1" stopColor="#E27C27" />
        </radialGradient>
        <linearGradient id="cat-body" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#FFB45F" />
          <stop offset="0.6" stopColor="#F59B3E" />
          <stop offset="1" stopColor="#E07F2A" />
        </linearGradient>
        <linearGradient id="cat-tail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F7A047" />
          <stop offset="1" stopColor="#E37F27" />
        </linearGradient>
        <linearGradient id="cat-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4CC9BB" />
          <stop offset="1" stopColor="#1E8F85" />
        </linearGradient>
        <filter id="cat-shadow-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* 地面投影 */}
      <ellipse
        cx="266"
        cy="596"
        rx="162"
        ry="24"
        fill="#6B3A1C"
        opacity="0.22"
        filter="url(#cat-shadow-blur)"
      />

      {/* 尾巴与火花尾尖 */}
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-2.5 334 540; 4 334 540; -2.5 334 540"
          dur="4.6s"
          repeatCount="indefinite"
        />
        <path
          d="M330 540 C408 566 478 528 468 456"
          fill="none"
          stroke="#8A4A22"
          strokeWidth="62"
          strokeLinecap="round"
        />
        <path
          d="M330 540 C408 566 478 528 468 456"
          fill="none"
          stroke="url(#cat-tail)"
          strokeWidth="50"
          strokeLinecap="round"
        />
        <path
          d="M356 535 C412 550 452 522 452 470 M348 524 C396 534 430 512 434 476"
          fill="none"
          stroke="#D9731F"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.55"
        />
        <circle cx="468" cy="455" r="27" fill="#4E2C1D" stroke="#8A4A22" strokeWidth="6" />
        <g className="cat-spark">
          <circle cx="472" cy="424" r="10" fill="#FFD34E" />
          <circle cx="472" cy="424" r="19" fill="#FFD34E" opacity="0.22" />
          <path
            d="M472 399 V408 M472 440 V449 M447 424 H456 M488 424 H497 M454 406 L460 412 M484 436 L490 442 M490 406 L484 412 M460 436 L454 442"
            stroke="#FFE082"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      </g>

      <g className="cat-breathe">
        {/* 后脚 */}
        <ellipse cx="180" cy="558" rx="44" ry="30" fill="#FFE3BA" stroke="#B57A42" strokeWidth="5" />
        <ellipse cx="342" cy="558" rx="44" ry="30" fill="#FFE3BA" stroke="#B57A42" strokeWidth="5" />

        {/* 身体 */}
        <path
          d="M172 558 C150 506 158 436 194 398 C214 376 306 376 326 398 C362 436 370 506 348 558 C328 588 192 588 172 558 Z"
          fill="url(#cat-body)"
          stroke="#8A4A22"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <path
          d="M218 462 C214 430 306 430 302 462 L302 538 C302 566 218 566 218 538 Z"
          fill="#FFE7C4"
          opacity="0.95"
        />
        <path
          d="M224 470 Q260 456 296 470"
          fill="none"
          stroke="#F3C793"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* 前爪 */}
        <rect x="202" y="524" width="54" height="58" rx="27" fill="#FFE7C4" stroke="#B57A42" strokeWidth="4" />
        <rect x="264" y="524" width="54" height="58" rx="27" fill="#FFE7C4" stroke="#B57A42" strokeWidth="4" />
        <path
          d="M220 556 V566 M238 556 V566 M282 556 V566 M300 556 V566"
          stroke="#D9A468"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* 领巾 */}
        <path
          d="M168 388 C210 408 310 408 352 388 L342 424 C304 442 216 442 178 424 Z"
          fill="url(#cat-band)"
          stroke="#1F7E76"
          strokeWidth="4"
        />
        <path
          d="M186 420 C224 438 296 438 334 420 L286 492 C274 508 246 508 234 492 Z"
          fill="url(#cat-band)"
          stroke="#1F7E76"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M200 430 C232 442 288 442 320 430"
          fill="none"
          stroke="#8DE3D8"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path d="M342 394 L370 384 L360 410 Z" fill="#23988D" stroke="#1F7E76" strokeWidth="3" />
        <path d="M342 412 L366 424 L348 432 Z" fill="#23988D" stroke="#1F7E76" strokeWidth="3" />
        <circle cx="260" cy="452" r="18" fill="#4B2E1E" stroke="#F2C14E" strokeWidth="3" />
        <path
          d="M260 441 Q270 444 268 452"
          fill="none"
          stroke="#F2C14E"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="269" cy="437" r="3.5" fill="#FFD34E" />
        <g fill="#F2C14E" opacity="0.75">
          <circle cx="206" cy="440" r="3" />
          <circle cx="314" cy="440" r="3" />
          <circle cx="226" cy="448" r="2.5" />
          <circle cx="294" cy="448" r="2.5" />
        </g>

        {/* 耳朵 */}
        <g className="cat-ear">
          <path
            d="M126 198 L92 72 Q88 58 103 66 L202 124 Z"
            fill="url(#cat-head)"
            stroke="#8A4A22"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path d="M128 176 L110 96 Q108 86 118 92 L182 128 Z" fill="#F7BCA4" />
          <path d="M104 78 L118 96 M112 72 L124 88" stroke="#FFE7C4" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
        </g>
        <g className="cat-ear">
          <path
            d="M394 198 L428 72 Q432 58 417 66 L318 124 Z"
            fill="url(#cat-head)"
            stroke="#8A4A22"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path d="M392 176 L410 96 Q412 86 402 92 L338 128 Z" fill="#F7BCA4" />
          <path d="M416 78 L402 96 M408 72 L396 88" stroke="#FFE7C4" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
        </g>

        {/* 头部 */}
        <path
          d="M112 250 C112 158 174 106 260 106 C346 106 408 158 408 250 C408 334 350 394 260 394 C170 394 112 334 112 250 Z"
          fill="url(#cat-head)"
          stroke="#8A4A22"
          strokeWidth="6"
        />
        <path
          d="M246 100 Q252 84 260 96 Q268 80 276 100"
          fill="url(#cat-head)"
          stroke="#8A4A22"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <ellipse
          cx="198"
          cy="176"
          rx="62"
          ry="38"
          fill="#FFF0D2"
          opacity="0.16"
          transform="rotate(-16 198 176)"
        />

        {/* 额头虎斑 */}
        <g stroke="#D9731F" strokeWidth="9" strokeLinecap="round" opacity="0.5">
          <path d="M220 132 Q226 152 222 170" />
          <path d="M258 126 Q260 148 258 168" />
          <path d="M296 132 Q290 152 294 170" />
        </g>

        {/* 眼罩纹样 */}
        <path
          d="M140 246 C152 208 204 196 240 222 C252 231 268 231 280 222 C316 196 368 208 380 246 C392 278 374 308 344 306 C320 304 302 288 290 272 C278 258 242 258 230 272 C218 288 200 304 176 306 C146 308 128 278 140 246 Z"
          fill="#4E2C1D"
        />
        <path
          d="M172 196 Q200 186 228 198"
          fill="none"
          stroke="#FFD9A0"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.65"
        />
        <path
          d="M292 198 Q320 186 348 196"
          fill="none"
          stroke="#FFD9A0"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.65"
        />

        {/* 眼睛 */}
        <g>
          <ellipse cx="200" cy="252" rx="30" ry="36" fill="#FFCE55" stroke="#3B2216" strokeWidth="5" />
          <ellipse cx="200" cy="254" rx="9" ry="21" fill="#33200F" />
          <circle cx="190" cy="238" r="7" fill="#FFFFFF" />
          <circle cx="208" cy="268" r="3.5" fill="#FFFFFF" opacity="0.9" />
          <ellipse className="cat-lid" cx="200" cy="252" rx="31" ry="37" fill="#4E2C1D" />
        </g>
        <g>
          <ellipse cx="320" cy="252" rx="30" ry="36" fill="#FFCE55" stroke="#3B2216" strokeWidth="5" />
          <ellipse cx="320" cy="254" rx="9" ry="21" fill="#33200F" />
          <circle cx="310" cy="238" r="7" fill="#FFFFFF" />
          <circle cx="328" cy="268" r="3.5" fill="#FFFFFF" opacity="0.9" />
          <ellipse className="cat-lid" cx="320" cy="252" rx="31" ry="37" fill="#4E2C1D" />
        </g>

        {/* 腮红与口鼻 */}
        <ellipse cx="160" cy="296" rx="26" ry="13" fill="#F08A6F" opacity="0.35" />
        <ellipse cx="360" cy="296" rx="26" ry="13" fill="#F08A6F" opacity="0.35" />
        <ellipse cx="234" cy="322" rx="44" ry="30" fill="#FFE7C4" />
        <ellipse cx="286" cy="322" rx="44" ry="30" fill="#FFE7C4" />
        <path
          d="M246 306 Q260 300 274 306 Q268 318 260 318 Q252 318 246 306 Z"
          fill="#E97B6A"
          stroke="#A94F3F"
          strokeWidth="2.5"
        />
        <path
          d="M260 318 V327 M260 327 Q246 341 236 332 M260 327 Q274 341 284 332"
          fill="none"
          stroke="#5C3218"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M280 331 L289 331 L284 343 Z"
          fill="#FFF9E8"
          stroke="#C58A4E"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* 胡须 */}
        <g stroke="#8A5A33" strokeWidth="3.5" strokeLinecap="round" opacity="0.45" fill="none">
          <path d="M192 314 Q150 304 118 300" />
          <path d="M190 328 Q146 328 112 334" />
          <path d="M192 342 Q152 352 122 362" />
          <path d="M328 314 Q370 304 402 300" />
          <path d="M330 328 Q374 328 408 334" />
          <path d="M328 342 Q368 352 398 362" />
        </g>
      </g>
    </svg>
  );
}
