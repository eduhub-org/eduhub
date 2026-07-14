import { FC, memo } from 'react';
import { ExternalLink } from 'lucide-react';

// StuJo brand pink (see apps/stujo/styles/globals.css --stujo-primary).
const STUJO_PINK = '#a71580';

/**
 * Small pill for the top-right corner of a job tile: the StuJo bird, the word
 * "StuJo" and an external-link arrow. Signals both "from StuJo" and "opens
 * elsewhere". Styled like the TileBase bannerText pill (rounded-full, light
 * background, subtle shadow, small text).
 */
const StujoSignComponent: FC = () => (
  <span
    className="flex items-center gap-1 rounded-full border border-border-primary bg-white px-2 py-1 text-xs font-semibold shadow-sm"
    style={{ color: STUJO_PINK }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/images/stujo/stujo_bird.png" alt="StuJo" className="h-4 w-4 object-contain" />
    StuJo
    <ExternalLink size={12} className="shrink-0" />
  </span>
);

export const StujoSign = memo(StujoSignComponent);
