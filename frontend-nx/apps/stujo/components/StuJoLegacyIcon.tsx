import { FC } from 'react';

type StuJoLegacyIconName = 'home' | 'plus' | 'search' | 'unlocked';

interface Props {
  className?: string;
  name: StuJoLegacyIconName;
}

const glyphs: Record<StuJoLegacyIconName, { path: string; transform: string; viewBox: string }> = {
  // Bootstrap 3.4.1 Glyphicons Halflings, code point U+E021.
  home: {
    path: 'M18 618l620 608q8 7 18.5 7t17.5-7l608-608q8-8 5.5-13t-12.5-5h-175v-575q0-10-7.5-17.5t-17.5-7.5h-250q-10 0-17.5 7.5t-7.5 17.5v375h-300v-375q0-10-7.5-17.5t-17.5-7.5h-250q-10 0-17.5 7.5t-7.5 17.5v575h-175q-10 0-12.5 5t5.5 13z',
    transform: 'translate(0 1233) scale(1 -1)',
    viewBox: '0 0 1300 1233',
  },
  // Bootstrap 3.4.1 Glyphicons Halflings, code point U+002B.
  plus: {
    path: 'M450 1100h200q21 0 35.5-14.5t14.5-35.5v-350h350q21 0 35.5-14.5t14.5-35.5v-200q0-21-14.5-35.5t-35.5-14.5h-350v-350q0-21-14.5-35.5t-35.5-14.5h-200q-21 0-35.5 14.5t-14.5 35.5v350h-350q-21 0-35.5 14.5t-14.5 35.5v200q0 21 14.5 35.5t35.5 14.5h350v350q0 21 14.5 35.5t35.5 14.5z',
    transform: 'translate(0 1100) scale(1 -1)',
    viewBox: '0 0 1100 1100',
  },
  // Bootstrap 3.4.1 Glyphicons Halflings, code point U+E003.
  search: {
    path: 'M500 1191q100 0 191-39t156.5-104.5t104.5-156.5t39-191l-1-2l1-5q0-141-78-262l275-274q23-26 22.5-44.5t-22.5-42.5l-59-58q-26-20-46.5-20t-39.5 20l-275 274q-119-77-261-77l-5 1l-2-1q-100 0-191 39t-156.5 104.5t-104.5 156.5t-39 191t39 191t104.5 156.5t156.5 104.5t191 39zM500 1022q-88 0-162-43t-117-117t-43-162t43-162t117-117t162-43t162 43t117 117t43 162t-43 162t-117 117t-162 43z',
    transform: 'translate(0 1191) scale(1 -1)',
    viewBox: '0 0 1220 1200',
  },
  // StuJo's legacy IcoMoon icon-unlocked glyph, code point U+E902.
  unlocked: {
    path: 'M768 896c105.87 0 192-86.13 192-192v-192h-128v192c0 35.29-28.71 64-64 64h-128c-35.29 0-64-28.71-64-64v-192h16c26.4 0 48-21.6 48-48v-480c0-26.4-21.6-48-48-48h-544c-26.4 0-48 21.6-48 48v480c0 26.4 21.6 48 48 48h400v192c0 105.87 86.13 192 192 192h128z',
    transform: 'translate(0 896) scale(1 -1)',
    viewBox: '0 0 1024 960',
  },
};

const StuJoLegacyIcon: FC<Props> = ({ className, name }) => {
  const glyph = glyphs[name];

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      focusable="false"
      viewBox={glyph.viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform={glyph.transform}>
        <path d={glyph.path} />
      </g>
    </svg>
  );
};

export default StuJoLegacyIcon;
