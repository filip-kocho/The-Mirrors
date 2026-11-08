/** Decorative fortifications only; the authored room graph supplies every playable doorway. */
export function CastleBackdrop({ id }: { id: string }) {
  return (
    <g className="castle-architecture" pointerEvents="none" aria-hidden="true">
      <defs>
        <pattern
          id={`${id}-masonry`}
          width="32"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <rect width="32" height="20" fill="#505353" />
          <path
            d="M0 0H32M0 10H32M0 20H32M16 0V10M0 10V20M32 10V20"
            fill="none"
            stroke="#292f34"
            strokeWidth="1.5"
          />
          <path
            d="M1 2H30M1 12H30"
            stroke="#929082"
            strokeWidth=".6"
            opacity=".45"
          />
        </pattern>
        <pattern
          id={`${id}-floor`}
          width="17"
          height="17"
          patternUnits="userSpaceOnUse"
        >
          <rect width="17" height="17" fill="#555a5b" />
          <path
            d="M0 0H17V17H0Z"
            fill="none"
            stroke="#393f42"
            strokeWidth="1"
          />
          <path d="M2 2H15" stroke="#b1aa95" strokeWidth=".6" opacity=".25" />
        </pattern>
        <radialGradient id={`${id}-grounds`}>
          <stop stopColor="#303b39" />
          <stop offset="1" stopColor="#0d171e" />
        </radialGradient>
      </defs>
      <rect
        x="-36"
        y="-36"
        width="872"
        height="872"
        rx="30"
        fill={`url(#${id}-grounds)`}
      />
      <circle
        cx="400"
        cy="400"
        r="413"
        fill="none"
        stroke="#17353d"
        strokeWidth="24"
      />
      <circle
        cx="400"
        cy="400"
        r="398"
        fill="#252f31"
        stroke="#10191e"
        strokeWidth="9"
      />
      <circle
        cx="400"
        cy="400"
        r="387"
        fill={`url(#${id}-masonry)`}
        stroke="#8b887b"
        strokeWidth="8"
      />
      <circle
        cx="400"
        cy="400"
        r="368"
        fill="#242e30"
        stroke="#343b3e"
        strokeWidth="2"
      />
      {Array.from({ length: 64 }, (_, i) => (
        <rect
          key={i}
          x="394"
          y="3"
          width="12"
          height="15"
          fill="#858376"
          stroke="#282c2d"
          strokeWidth="2"
          transform={`rotate(${(i * 360) / 64} 400 400)`}
        />
      ))}
      {Array.from({ length: 5 }, (_, wing) => (
        <g key={wing} transform={`rotate(${wing * 72} 400 400)`}>
          <path
            d="M350 465H450V566H546V766H254V566H350Z"
            fill={`url(#${id}-masonry)`}
            stroke="#171e23"
            strokeWidth="9"
            strokeLinejoin="round"
          />
          <path
            d="M350 465H450V566H546V766H254V566H350Z"
            fill="none"
            stroke="#8c8878"
            strokeWidth="2"
          />
          <path
            d="M375 548H425M259 669H541"
            stroke="#9d9580"
            strokeWidth="3"
            opacity=".7"
          />
          <g transform="translate(400,17) rotate(36 0 383)">
            <path
              d="M-25-16H25V19L18 27H-18L-25 19Z"
              fill={`url(#${id}-masonry)`}
              stroke="#131d22"
              strokeWidth="4"
            />
            <path
              d="M-27-18V-27H-18V-18H-9V-27H0V-18H9V-27H18V-18H27V-7H-27Z"
              fill="#8e8a79"
              stroke="#333838"
              strokeWidth="2"
            />
            <path d="M-5 12V0Q0-9 5 0V12Z" fill="#141d24" stroke="#aaa185" />
          </g>
        </g>
      ))}
      <circle
        cx="400"
        cy="400"
        r="161"
        fill={`url(#${id}-floor)`}
        stroke="#929080"
        strokeWidth="5"
      />
      <circle
        cx="400"
        cy="400"
        r="145"
        fill="none"
        stroke="#c0ac78"
        strokeWidth="1"
        opacity=".5"
      />
      <g transform="translate(400,790)">
        <path
          d="M-24-6V-28H-15V-19H-6V-28H6V-19H15V-28H24V-6Z"
          fill={`url(#${id}-masonry)`}
          stroke="#aaa28b"
          strokeWidth="2"
        />
        <path
          d="M-14 3V-9Q0-32 14-9V3Z"
          fill="#0c151b"
          stroke="#ada286"
          strokeWidth="3"
        />
        <path
          d="M-14 3-19 32H19L14 3Z"
          fill="#76614a"
          stroke="#292a28"
          strokeWidth="2"
        />
        <path
          d="M-16 10H16M-17 18H17M-18 26H18"
          stroke="#332e28"
          strokeWidth="2"
        />
      </g>
    </g>
  );
}
