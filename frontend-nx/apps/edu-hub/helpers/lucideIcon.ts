import { icons, type LucideIcon } from 'lucide-react';

// Resolve a stored lucide icon name (e.g. "trophy", "graduation-cap") to its
// PascalCase component key.
const toPascalCase = (name: string): string =>
  name
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

/** Look up a lucide icon component by its (kebab/snake/space) name. */
export const getLucideIcon = (name: string | null | undefined): LucideIcon | undefined =>
  name ? (icons as Record<string, LucideIcon>)[toPascalCase(name)] : undefined;
