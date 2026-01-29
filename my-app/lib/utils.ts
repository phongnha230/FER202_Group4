import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getColorFilter = (color: string | undefined, baseColor?: string): React.CSSProperties => {
  if (!color) return {};
  const c = color.toLowerCase();
  const b = baseColor?.toLowerCase();

  // Check if base is dark (Black, Navy, etc)
  const isBaseDark = b && ['black', 'navy', 'dark', 'charcoal'].some(dark => b.includes(dark));

  // If target color is the same as the base color, don't apply any filter
  if (c === b) return {};

  if (isBaseDark) {
    // Strategy for Dark Base (e.g. Black Hoodie)
    // We use brightness > 1 to lift the black to gray/white, then apply color.
    // This is safe for white backgrounds (they just clip to white).
    switch (c) {
      case 'white':
        return { filter: 'brightness(3.0) grayscale(100%) contrast(0.8)' };
      case 'gray':
      case 'grey':
        return { filter: 'brightness(2.0) grayscale(100%)' };
      case 'beige':
      case 'khaki':
        return { filter: 'brightness(2.0) sepia(0.8) hue-rotate(10deg) saturate(0.5)' };
      case 'navy':
        // Black -> Navy: Lift slightly, then blue-ify
        return { filter: 'brightness(1.5) sepia(1) hue-rotate(180deg) saturate(2) contrast(0.9)' };
      case 'blue':
        return { filter: 'brightness(1.8) sepia(1) hue-rotate(190deg) saturate(3)' };
      case 'green':
      case 'olive':
        return { filter: 'brightness(1.5) sepia(1) hue-rotate(60deg) saturate(2)' };
      case 'red':
        return { filter: 'brightness(1.5) sepia(1) hue-rotate(320deg) saturate(3)' };
      case 'black':
        // If target is black but base is a different dark color (e.g. Navy)
        return { filter: 'grayscale(100%) brightness(0.5)' };
      default:
        // Fallback for other colors on dark base
        return { filter: 'brightness(1.5) sepia(1) saturate(2)' };
    }
  }

  // Default Strategy (for Light/Mid Base)
  switch (c) {
    case 'black':
      return { filter: 'grayscale(100%) brightness(0.3)' };
    case 'gray':
    case 'grey':
      return { filter: 'grayscale(100%) brightness(0.9)' };
    case 'white':
      return { filter: 'grayscale(100%) brightness(1.2) contrast(0.8)' };
    case 'beige':
    case 'khaki':
      return { filter: 'sepia(0.6) hue-rotate(10deg) saturate(0.5) brightness(1.1)' };
    case 'navy':
      return { filter: 'sepia(1) hue-rotate(170deg) saturate(1.5) brightness(0.6)' };
    case 'blue':
      return { filter: 'sepia(1) hue-rotate(180deg) saturate(2) brightness(0.9)' };
    case 'green':
    case 'olive':
      return { filter: 'sepia(1) hue-rotate(60deg) saturate(1.5) brightness(0.7)' };
    case 'red':
      return { filter: 'sepia(1) hue-rotate(320deg) saturate(2)' };
    default:
      return {};
  }
};
