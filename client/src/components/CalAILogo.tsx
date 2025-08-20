interface CalAILogoProps {
  size?: number;
  className?: string;
}

export function CalAILogo({ size = 32, className = "" }: CalAILogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rounded square background with CalAI gradient */}
        <defs>
          <linearGradient id="calai-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        
        {/* Main rounded square */}
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          rx="20"
          ry="20"
          fill="url(#calai-gradient)"
        />
        
        {/* Viewfinder corners */}
        <g stroke="white" strokeWidth="3" fill="none" strokeLinecap="round">
          {/* Top left */}
          <path d="M15 25 L15 15 L25 15" />
          {/* Top right */}
          <path d="M75 15 L85 15 L85 25" />
          {/* Bottom left */}
          <path d="M15 75 L15 85 L25 85" />
          {/* Bottom right */}
          <path d="M85 75 L85 85 L75 85" />
        </g>
        
        {/* Small circle in top right */}
        <circle cx="78" cy="22" r="3" fill="white" />
        
        {/* Apple shape */}
        <path
          d="M35 40 C35 30 42 25 50 25 C58 25 65 30 65 40 C65 45 63 50 60 54 C58 57 56 60 55 65 C54 70 52 75 50 75 C48 75 46 70 45 65 C44 60 42 57 40 54 C37 50 35 45 35 40 Z"
          fill="white"
        />
        
        {/* Apple leaf */}
        <ellipse
          cx="55"
          cy="28"
          rx="4"
          ry="2"
          fill="#22C55E"
          transform="rotate(30 55 28)"
        />
        
        {/* Apple indent at top */}
        <path
          d="M47 27 C47 25 48 24 50 24 C52 24 53 25 53 27"
          fill="url(#calai-gradient)"
        />
      </svg>
    </div>
  );
}

export default CalAILogo;