import logoImage from "@assets/calai-icon-apple-only-white (1)_1755732139798.png";

interface CalAILogoProps {
  size?: number;
  className?: string;
}

export function CalAILogo({ size = 32, className = "" }: CalAILogoProps) {
  return (
    <img
      src={logoImage}
      alt="CalAI Logo"
      className={`${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export default CalAILogo;