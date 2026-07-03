import { FC } from 'react';

interface IProps {
  /** Profile image URL. When absent, initials from `name` are shown as fallback. */
  imageUrl?: string | null;
  /** Full name; used for the initials fallback and the hover title. */
  name?: string;
  /** Diameter in pixels. Defaults to 40. */
  size?: number;
  /** Extra classes, e.g. an overlap ring (`border-2 border-fill-primary`). */
  className?: string;
}

// Escape characters that would break out of the CSS url("…") context, preventing
// CSS injection via crafted image URLs in the inline style attribute.
const escapeCssUrl = (url: string): string => url.replace(/["\\]/g, '\\$&');

const initialsOf = (name?: string): string =>
  (name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

// Fixed palette for the initials fallback. Colors are dark enough that white
// text stays legible in both the dark theme and `.light` sections (e.g. tiles).
const AVATAR_COLORS = [
  '#0D9488', // teal
  '#2563EB', // blue
  '#7C3AED', // violet
  '#DB2777', // pink
  '#DC2626', // red
  '#EA580C', // orange
  '#CA8A04', // amber
  '#16A34A', // green
  '#0891B2', // cyan
  '#4F46E5', // indigo
];

// Deterministic color from the name so a given person always gets the same
// circle color while different people get visually distinct ones.
const colorOf = (name?: string): string => {
  const key = name ?? '';
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Standard profile avatar. Renders the picture as a cover background (the same
// approach used across the app for external/Keycloak picture URLs) and falls
// back to the user's initials on a deterministic colored circle when no picture
// is available.
export const Avatar: FC<IProps> = ({ imageUrl, name, size = 40, className = '' }) => {
  const initials = imageUrl ? '' : initialsOf(name);
  const showInitials = !imageUrl && initials.length > 0;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-cover bg-center font-medium ${
        showInitials ? 'text-white' : 'bg-fill-secondary text-label-primary'
      } ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.36)),
        backgroundImage: imageUrl ? `url("${escapeCssUrl(imageUrl)}")` : undefined,
        backgroundColor: showInitials ? colorOf(name) : undefined,
      }}
      title={name || undefined}
    >
      {showInitials ? initials : null}
    </div>
  );
};
