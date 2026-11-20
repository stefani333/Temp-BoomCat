/**
 * 派对大厅场景：墙面、窗户、猫爬架、沙发、电视柜、地毯与灯光均为原创 SVG 绘制。
 * 该层只负责氛围，不承载交互。
 */
export function LobbyScene() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="bc-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFECC4" />
            <stop offset="0.58" stopColor="#FAD79B" />
            <stop offset="1" stopColor="#F0C183" />
          </linearGradient>
          <radialGradient id="bc-sun-glow" cx="0.76" cy="0.1" r="0.72">
            <stop offset="0" stopColor="#FFF9E4" stopOpacity="0.95" />
            <stop offset="1" stopColor="#FFF9E4" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bc-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#DCA36C" />
            <stop offset="0.5" stopColor="#C98B56" />
            <stop offset="1" stopColor="#AB6B40" />
          </linearGradient>
          <linearGradient id="bc-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D2955D" />
            <stop offset="1" stopColor="#98602F" />
          </linearGradient>
          <linearGradient id="bc-wood-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#A96B3E" />
            <stop offset="1" stopColor="#7A4826" />
          </linearGradient>
          <linearGradient id="bc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9FDDF2" />
            <stop offset="0.62" stopColor="#D3EBE6" />
            <stop offset="1" stopColor="#FFE2AC" />
          </linearGradient>
          <linearGradient id="bc-sofa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F2A66C" />
            <stop offset="1" stopColor="#DD7442" />
          </linearGradient>
          <linearGradient id="bc-sofa-seat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F8B77F" />
            <stop offset="1" stopColor="#E88850" />
          </linearGradient>
          <linearGradient id="bc-rug" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F0B26B" />
            <stop offset="0.55" stopColor="#E39A54" />
            <stop offset="1" stopColor="#CE7F41" />
          </linearGradient>
          <linearGradient id="bc-post" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#F8E7CB" />
            <stop offset="0.5" stopColor="#EAD0AA" />
            <stop offset="1" stopColor="#D7B486" />
          </linearGradient>
          <linearGradient id="bc-curtain" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#F0A16B" />
            <stop offset="0.55" stopColor="#E28751" />
            <stop offset="1" stopColor="#C96D3D" />
          </linearGradient>
          <linearGradient id="bc-screen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#74BDB2" />
            <stop offset="1" stopColor="#356E68" />
          </linearGradient>
          <linearGradient id="bc-shaft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF6D8" stopOpacity="0.5" />
            <stop offset="1" stopColor="#FFF6D8" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="bc-hero-glow">
            <stop offset="0" stopColor="#FFF6D4" stopOpacity="0.75" />
            <stop offset="1" stopColor="#FFF6D4" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bc-vignette" cx="0.5" cy="0.46" r="0.75">
            <stop offset="0.55" stopColor="#5A3115" stopOpacity="0" />
            <stop offset="1" stopColor="#4A2610" stopOpacity="0.3" />
          </radialGradient>
          <pattern id="bc-stripes" width="72" height="72" patternUnits="userSpaceOnUse">
            <rect width="72" height="72" fill="none" />
            <rect width="30" height="72" fill="#FFFFFF" opacity="0.05" />
          </pattern>
          <filter id="bc-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="0"
              dy="10"
              stdDeviation="12"
              floodColor="#6B3A1C"
              floodOpacity="0.22"
            />
          </filter>
          <filter id="bc-blur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="20" />
          </filter>
        </defs>

        {/* 墙面与护墙板 */}
        <rect width="1600" height="660" fill="url(#bc-wall)" />
        <rect width="1600" height="660" fill="url(#bc-stripes)" />
        <path
          d="M470 660 L470 260 Q470 70 780 70 Q1090 70 1090 260 L1090 660 Z"
          fill="#FFF0CC"
          opacity="0.38"
        />
        <rect width="1600" height="660" fill="url(#bc-sun-glow)" />
        <rect x="0" y="584" width="1600" height="62" fill="#F4D29C" />
        <rect x="0" y="578" width="1600" height="10" fill="#E5B273" />
        <rect x="0" y="644" width="1600" height="18" fill="#D9A066" />

        {/* 地板 */}
        <rect x="0" y="660" width="1600" height="240" fill="url(#bc-floor)" />
        <g stroke="#8F572F" strokeOpacity="0.26" strokeWidth="3">
          <path d="M0 700 H1600" />
          <path d="M0 748 H1600" />
          <path d="M0 804 H1600" />
          <path d="M0 868 H1600" />
          <path d="M170 660 V700 M520 660 V700 M980 660 V700 M1370 660 V700" />
          <path d="M70 700 V748 M420 700 V748 M760 700 V748 M1180 700 V748 M1500 700 V748" />
          <path d="M250 748 V804 M640 748 V804 M1040 748 V804 M1450 748 V804" />
          <path d="M120 804 V868 M560 804 V868 M930 804 V868 M1300 804 V868" />
        </g>
        <rect x="0" y="660" width="1600" height="240" fill="#6B3A1C" opacity="0.06" />

        {/* 窗户 */}
        <g>
          <line
            x1="930"
            y1="52"
            x2="1330"
            y2="52"
            stroke="#7A4924"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <circle cx="924" cy="52" r="11" fill="#8A5A33" />
          <circle cx="1336" cy="52" r="11" fill="#8A5A33" />
          <rect
            x="930"
            y="60"
            width="370"
            height="368"
            rx="24"
            fill="#A96B3E"
            filter="url(#bc-soft)"
          />
          <rect x="948" y="78" width="334" height="332" rx="14" fill="url(#bc-sky)" />
          <circle cx="1222" cy="150" r="62" fill="#FFF1B8" opacity="0.4" />
          <circle cx="1222" cy="150" r="36" fill="#FFEEA8" />
          <g fill="#FFFFFF" opacity="0.85">
            <ellipse cx="1030" cy="140" rx="42" ry="18" />
            <ellipse cx="1062" cy="132" rx="30" ry="15" />
            <ellipse cx="1002" cy="133" rx="22" ry="12" />
            <ellipse cx="1140" cy="238" rx="34" ry="14" />
            <ellipse cx="1168" cy="232" rx="22" ry="11" />
          </g>
          <path
            d="M1085 195 q9 -9 18 0 M1112 182 q7 -7 14 0"
            fill="none"
            stroke="#A57A54"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect x="1113" y="78" width="12" height="332" fill="#A96B3E" />
          <rect x="948" y="240" width="334" height="12" fill="#A96B3E" />
          <rect
            x="948"
            y="78"
            width="334"
            height="332"
            rx="14"
            fill="none"
            stroke="#8A4A22"
            strokeWidth="4"
            opacity="0.5"
          />
          <rect x="908" y="428" width="414" height="20" rx="10" fill="#8F5730" />
          <rect x="914" y="430" width="402" height="7" rx="4" fill="#D5A068" opacity="0.7" />

          {/* 窗帘 */}
          <path
            d="M924 52 Q900 200 918 300 Q932 380 906 462 L988 462 Q964 330 982 240 Q996 150 986 52 Z"
            fill="url(#bc-curtain)"
          />
          <path
            d="M1306 52 Q1330 200 1312 300 Q1298 380 1324 462 L1242 462 Q1266 330 1248 240 Q1234 150 1244 52 Z"
            fill="url(#bc-curtain)"
          />
          <g stroke="#B96232" strokeWidth="4" opacity="0.35" fill="none">
            <path d="M944 60 Q930 220 942 450" />
            <path d="M966 60 Q952 220 966 450" />
            <path d="M1268 60 Q1282 220 1270 450" />
            <path d="M1290 60 Q1304 220 1292 450" />
          </g>

          {/* 窗台绿植 */}
          <g>
            <path
              d="M1258 428 Q1246 388 1262 356 Q1274 390 1268 428 Z"
              fill="#4E9E6A"
            />
            <path
              d="M1268 428 Q1266 380 1290 344 Q1298 388 1278 428 Z"
              fill="#6EBE83"
            />
            <path
              d="M1272 428 Q1288 396 1318 386 Q1306 420 1282 430 Z"
              fill="#3F8F5E"
            />
            <path d="M1248 424 H1302 L1296 458 H1254 Z" fill="#D9793F" />
            <rect x="1246" y="420" width="58" height="10" rx="5" fill="#B85E2D" />
          </g>
        </g>

        {/* 窗光落在地面 */}
        <path
          d="M1050 440 L1280 440 L1460 800 L840 800 Z"
          fill="url(#bc-shaft)"
          opacity="0.55"
        />
        <ellipse
          cx="1150"
          cy="760"
          rx="300"
          ry="90"
          fill="#FFF1C7"
          opacity="0.3"
          filter="url(#bc-blur)"
        />

        {/* 墙面装饰：鱼骨画框 */}
        <g transform="translate(392 118) rotate(-3)" filter="url(#bc-soft)">
          <line x1="80" y1="0" x2="80" y2="14" stroke="#8A5A33" strokeWidth="4" />
          <circle cx="80" cy="0" r="6" fill="#8A5A33" />
          <rect x="0" y="14" width="150" height="176" rx="12" fill="#B57A48" />
          <rect x="12" y="26" width="126" height="152" rx="8" fill="#FFF3D8" />
          <ellipse cx="76" cy="104" rx="38" ry="25" fill="#63BFB0" />
          <path d="M112 104 L142 84 L142 124 Z" fill="#63BFB0" />
          <circle cx="58" cy="98" r="5" fill="#2F5D57" />
          <path
            d="M62 112 q12 10 26 0"
            fill="none"
            stroke="#2F5D57"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M58 78 q-10 -16 -24 -14 M70 74 q0 -18 10 -24"
            fill="none"
            stroke="#63BFB0"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="34" cy="56" r="5" fill="#8FD6C9" />
          <circle cx="48" cy="40" r="3.5" fill="#8FD6C9" />
        </g>

        {/* 墙面装饰：BOMB CAT 木牌 */}
        <g className="scene-sign" filter="url(#bc-soft)">
          <path
            d="M612 108 L644 88 M870 108 L838 88"
            stroke="#8A5A33"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <rect x="600" y="104" width="272" height="104" rx="18" fill="#E7AA67" />
          <rect
            x="600"
            y="104"
            width="272"
            height="104"
            rx="18"
            fill="none"
            stroke="#8A4A22"
            strokeWidth="6"
          />
          <rect
            x="614"
            y="118"
            width="244"
            height="76"
            rx="11"
            fill="none"
            stroke="#FBE4BD"
            strokeWidth="3"
            opacity="0.55"
          />
          <text
            x="736"
            y="166"
            textAnchor="middle"
            fontFamily="inherit"
            fontSize="38"
            fontWeight="900"
            letterSpacing="2"
            fill="#6B3417"
            stroke="#FFF0CE"
            strokeWidth="5"
            paintOrder="stroke"
          >
            BOMB CAT
          </text>
          <text
            x="736"
            y="188"
            textAnchor="middle"
            fontFamily="inherit"
            fontSize="10"
            fontWeight="700"
            letterSpacing="4"
            fill="#8A4A22"
          >
            PARTY LOUNGE
          </text>
        </g>

        {/* 墙面置物架 */}
        <g filter="url(#bc-soft)">
          <rect x="150" y="250" width="258" height="15" rx="7" fill="url(#bc-wood)" />
          <path d="M176 265 L200 292 L176 292 Z" fill="#8A5A33" />
          <path d="M382 265 L358 292 L382 292 Z" fill="#8A5A33" />
          <g>
            <path
              d="M196 250 Q186 216 200 192 Q212 218 206 250 Z"
              fill="#4E9E6A"
            />
            <path
              d="M204 250 Q212 210 234 200 Q230 236 212 250 Z"
              fill="#6EBE83"
            />
            <path d="M190 250 H230 L224 220 H196 Z" fill="#D9793F" />
          </g>
          <g>
            <rect x="252" y="212" width="44" height="38" rx="8" fill="#FFF0CE" opacity="0.9" />
            <rect x="252" y="212" width="44" height="38" rx="8" fill="none" stroke="#C99A64" strokeWidth="3" />
            <rect x="260" y="204" width="28" height="10" rx="4" fill="#B57A48" />
            <circle cx="274" cy="232" r="6" fill="#E8843B" />
          </g>
          <g>
            <rect x="314" y="216" width="14" height="34" rx="3" fill="#4FA9A0" />
            <rect x="330" y="208" width="14" height="42" rx="3" fill="#E8843B" />
            <rect x="346" y="220" width="14" height="30" rx="3" fill="#F2C14E" />
          </g>
        </g>

        {/* 星星串灯 */}
        <path
          d="M-30 52 Q180 130 390 78 Q520 46 610 74"
          fill="none"
          stroke="#8A5A33"
          strokeWidth="3"
          opacity="0.55"
        />
        {[
          { x: 90, y: 82, d: '0s' },
          { x: 210, y: 108, d: '0.6s' },
          { x: 330, y: 96, d: '1.2s' },
          { x: 450, y: 68, d: '0.3s' },
          { x: 560, y: 68, d: '0.9s' },
        ].map((bulb) => (
          <g key={bulb.x} className="twinkle" style={{ animationDelay: bulb.d }}>
            <circle cx={bulb.x} cy={bulb.y} r="10" fill="#FFE7A3" opacity="0.25" />
            <circle cx={bulb.x} cy={bulb.y} r="4.5" fill="#FFF0B8" />
          </g>
        ))}

        {/* 地面主体：地毯 */}
        <ellipse cx="790" cy="812" rx="530" ry="94" fill="#6B3A1C" opacity="0.16" />
        <ellipse cx="790" cy="806" rx="520" ry="90" fill="url(#bc-rug)" />
        <ellipse
          cx="790"
          cy="806"
          rx="470"
          ry="70"
          fill="none"
          stroke="#FFD9A0"
          strokeWidth="6"
          strokeDasharray="2 20"
          strokeLinecap="round"
          opacity="0.7"
        />
        <ellipse
          cx="790"
          cy="806"
          rx="400"
          ry="54"
          fill="none"
          stroke="#B96B33"
          strokeWidth="4"
          opacity="0.35"
        />

        {/* 猫爬架 */}
        <g filter="url(#bc-soft)">
          <ellipse cx="200" cy="636" rx="140" ry="18" fill="#6B3A1C" opacity="0.18" />
          <rect x="76" y="610" width="252" height="28" rx="14" fill="#D9B27F" />
          <rect x="150" y="330" width="34" height="290" rx="17" fill="url(#bc-post)" stroke="#B58C5A" strokeWidth="3" />
          <rect x="245" y="412" width="28" height="206" rx="14" fill="url(#bc-post)" stroke="#B58C5A" strokeWidth="3" />
          <rect x="106" y="314" width="146" height="30" rx="15" fill="#F6E3C4" stroke="#C69A63" strokeWidth="3" />
          <rect x="218" y="398" width="116" height="26" rx="13" fill="#F6E3C4" stroke="#C69A63" strokeWidth="3" />
          <g fill="#D3AE7C" opacity="0.75">
            <circle cx="140" cy="329" r="4" />
            <circle cx="155" cy="324" r="4" />
            <circle cx="170" cy="329" r="4" />
            <circle cx="268" cy="411" r="3.5" />
            <circle cx="282" cy="406" r="3.5" />
            <circle cx="296" cy="411" r="3.5" />
          </g>
          <rect x="104" y="478" width="118" height="124" rx="24" fill="#F3DDBB" stroke="#C69A63" strokeWidth="3" />
          <circle cx="163" cy="538" r="36" fill="#6E4426" />
          <circle cx="163" cy="538" r="44" fill="none" stroke="#F8E7CB" strokeWidth="5" opacity="0.75" />
          <path d="M170 344 V386" stroke="#8A5A33" strokeWidth="4" />
          <circle cx="170" cy="404" r="17" fill="#E8843B" stroke="#8A4A22" strokeWidth="3" />
          <path
            d="M158 398 Q170 410 182 398"
            fill="none"
            stroke="#FFD9A0"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* 沙发 */}
        <g filter="url(#bc-soft)">
          <path
            d="M330 452 Q330 424 360 424 H742 Q772 424 772 452 V566 H330 Z"
            fill="url(#bc-sofa)"
          />
          <path
            d="M352 458 Q352 444 368 444 H734 Q750 444 750 458 V548 H352 Z"
            fill="#F6A76C"
            opacity="0.75"
          />
          <rect x="312" y="548" width="466" height="78" rx="28" fill="url(#bc-sofa-seat)" />
          <rect x="296" y="488" width="58" height="128" rx="28" fill="#DE7441" />
          <rect x="736" y="488" width="58" height="128" rx="28" fill="#D96D3B" />
          <rect x="344" y="620" width="24" height="28" rx="8" fill="#8A5A33" />
          <rect x="716" y="620" width="24" height="28" rx="8" fill="#8A5A33" />
          <g transform="translate(368 470) rotate(-7)">
            <rect width="72" height="70" rx="16" fill="#4FB7A8" />
            <circle cx="36" cy="30" r="11" fill="#EFFBF6" opacity="0.85" />
            <circle cx="22" cy="24" r="5" fill="#EFFBF6" opacity="0.85" />
            <circle cx="50" cy="24" r="5" fill="#EFFBF6" opacity="0.85" />
            <circle cx="16" cy="36" r="5" fill="#EFFBF6" opacity="0.85" />
            <circle cx="56" cy="36" r="5" fill="#EFFBF6" opacity="0.85" />
          </g>
          <g transform="translate(632 476) rotate(6)">
            <rect width="70" height="64" rx="16" fill="#FFE3B8" />
            <path
              d="M35 22 L39 32 L50 32 L41 39 L44 50 L35 43 L26 50 L29 39 L20 32 L31 32 Z"
              fill="#E8843B"
            />
          </g>
          <path
            d="M742 566 Q776 580 756 626 Q738 612 730 570 Z"
            fill="#F2C14E"
            opacity="0.85"
          />
        </g>

        {/* 电视柜与电视 */}
        <g filter="url(#bc-soft)">
          <ellipse cx="1450" cy="664" rx="140" ry="16" fill="#6B3A1C" opacity="0.18" />
          <rect x="1320" y="590" width="300" height="70" rx="14" fill="url(#bc-wood)" />
          <rect x="1338" y="604" width="122" height="42" rx="8" fill="#B57A48" />
          <rect x="1476" y="604" width="122" height="42" rx="8" fill="#B57A48" />
          <circle cx="1444" cy="625" r="4" fill="#FFE3B8" />
          <circle cx="1492" cy="625" r="4" fill="#FFE3B8" />
          <rect x="1338" y="660" width="22" height="16" rx="6" fill="#8A5A33" />
          <rect x="1580" y="660" width="22" height="16" rx="6" fill="#8A5A33" />
          <rect x="1352" y="454" width="220" height="128" rx="16" fill="#4A3A32" />
          <rect x="1368" y="470" width="188" height="82" rx="9" fill="url(#bc-screen)" />
          <path
            d="M1428 478 L1396 478 L1396 528 L1442 528 Q1454 528 1454 516 Q1454 504 1442 504 L1420 504 Q1412 504 1412 496 Q1412 486 1422 486 L1440 486"
            fill="#EFFBF6"
            opacity="0.55"
          />
          <circle cx="1520" cy="512" r="14" fill="#FFE7A3" opacity="0.55" />
          <path d="M1370 454 L1338 412 M1552 454 L1590 410" stroke="#4A3A32" strokeWidth="7" strokeLinecap="round" />
          <rect x="1432" y="582" width="60" height="10" rx="4" fill="#3A2A24" />
          <circle cx="1516" cy="570" r="4" fill="#9BE0C5" />
        </g>

        {/* 地面道具 */}
        <g filter="url(#bc-soft)">
          <ellipse cx="600" cy="828" rx="52" ry="14" fill="#6B3A1C" opacity="0.18" />
          <circle cx="600" cy="796" r="30" fill="#F08A3C" stroke="#A9540F" strokeWidth="4" />
          <path
            d="M576 780 Q604 796 576 812 M596 770 Q620 796 596 824"
            fill="none"
            stroke="#FFD9A0"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M628 804 Q668 816 700 798"
            fill="none"
            stroke="#E8843B"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>

        <g filter="url(#bc-soft)">
          <ellipse cx="1010" cy="846" rx="62" ry="14" fill="#6B3A1C" opacity="0.18" />
          <g transform="translate(960 780) rotate(-8)">
            <rect width="84" height="60" rx="10" fill="#C96D3D" stroke="#8A4A22" strokeWidth="3" />
            <rect x="6" y="-6" width="84" height="60" rx="10" fill="#4FA9A0" stroke="#2F6E68" strokeWidth="3" />
            <rect x="12" y="-12" width="84" height="60" rx="10" fill="#FFF3D8" stroke="#B58C5A" strokeWidth="3" />
            <path
              d="M54 -4 L28 14 L54 32 L80 14 Z"
              fill="#F08A3C"
              opacity="0.9"
            />
            <circle cx="54" cy="13" r="6" fill="#6B3417" />
          </g>
        </g>

        <g filter="url(#bc-soft)">
          <ellipse cx="1116" cy="842" rx="48" ry="12" fill="#6B3A1C" opacity="0.16" />
          <g transform="translate(1072 800) rotate(9)">
            <ellipse cx="34" cy="22" rx="34" ry="21" fill="#63BFB0" />
            <path d="M0 22 L-22 6 L-22 38 Z" fill="#4FA9A0" />
            <circle cx="20" cy="18" r="4" fill="#2F5D57" />
            <path d="M32 12 Q40 22 32 32" fill="none" stroke="#EFFBF6" strokeWidth="3" opacity="0.7" />
          </g>
        </g>

        {/* 落地绿植 */}
        <g filter="url(#bc-soft)">
          <ellipse cx="908" cy="656" rx="52" ry="12" fill="#6B3A1C" opacity="0.18" />
          <path d="M872 604 H944 L934 656 H882 Z" fill="#D9793F" />
          <rect x="868" y="598" width="80" height="12" rx="6" fill="#B85E2D" />
          <path d="M908 600 Q884 548 900 500 Q922 548 916 600 Z" fill="#4E9E6A" />
          <path d="M908 600 Q886 562 852 552 Q868 590 898 604 Z" fill="#6EBE83" />
          <path d="M912 600 Q938 560 968 552 Q950 592 918 604 Z" fill="#3F8F5E" />
        </g>

        {/* 猫咪身后的暖光与浮尘 */}
        <ellipse cx="810" cy="560" rx="360" ry="320" fill="url(#bc-hero-glow)" />
        {[
          { x: 690, y: 520, r: 4, d: '0s' },
          { x: 930, y: 470, r: 3, d: '1.4s' },
          { x: 780, y: 640, r: 3.5, d: '2.6s' },
          { x: 620, y: 600, r: 3, d: '3.4s' },
          { x: 1010, y: 590, r: 4.5, d: '4.2s' },
          { x: 860, y: 390, r: 3, d: '2s' },
        ].map((mote) => (
          <circle
            key={`${mote.x}-${mote.y}`}
            cx={mote.x}
            cy={mote.y}
            r={mote.r}
            fill="#FFF3C4"
            className="mote"
            style={{ animationDelay: mote.d }}
          />
        ))}

        <rect width="1600" height="900" fill="url(#bc-vignette)" />
      </svg>
    </div>
  );
}
