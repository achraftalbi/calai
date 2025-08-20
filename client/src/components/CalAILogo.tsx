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
        {/* Clean rounded square background */}
        <rect
          x="8"
          y="8"
          width="84"
          height="84"
          rx="18"
          ry="18"
          fill="#06B6D4"
        />
        
        {/* Simple apple shape */}
        <path
          d="M38 45 C38 35 43 30 50 30 C57 30 62 35 62 45 C62 50 60 55 58 59 C56 62 54 65 52 68 C51 71 50 72 50 72 C50 72 49 71 48 68 C46 65 44 62 42 59 C40 55 38 50 38 45 Z"
          fill="white"
        />
        
        {/* Apple leaf - simple green accent */}
        <ellipse
          cx="53"
          cy="32"
          rx="3"
          ry="1.5"
          fill="#22C55E"
          transform="rotate(25 53 32)"
        />
        
        {/* Apple indent at top */}
        <path
          d="M48 32 C48 30.5 49 30 50 30 C51 30 52 30.5 52 32"
          fill="#06B6D4"
        />
      </svg>
    </div>
  );
}

export default CalAILogo;