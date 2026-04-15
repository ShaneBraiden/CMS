/**
 * BrandMark — institutional identity block
 * Renders the seal + "SRI RAMACHANDRA / ENGINEERING AND TECHNOLOGY" text.
 * Sizes: sm | md | lg   Theme: dark (on cardinal) | light (on white)
 */
const SIZES = {
  sm: { seal: 'w-9 h-9',  title: 'text-[11px]',  sub: 'text-[8px]' },
  md: { seal: 'w-12 h-12', title: 'text-[13px]', sub: 'text-[9px]' },
  lg: { seal: 'w-20 h-20', title: 'text-[18px]', sub: 'text-[11px]' },
  xl: { seal: 'w-32 h-32', title: 'text-[22px]', sub: 'text-[13px]' },
};

const BrandMark = ({ size = 'md', theme = 'light', showText = true, className = '' }) => {
  const s = SIZES[size] || SIZES.md;
  const titleClr = theme === 'dark' ? 'text-white'       : 'text-cardinal-700';
  const subClr   = theme === 'dark' ? 'text-gold-300/90' : 'text-gold-700';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/logo_sret.png"
        alt="Sri Ramachandra Engineering and Technology"
        className={`${s.seal} flex-shrink-0 select-none drop-shadow-sm object-contain`}
        draggable={false}
      />
      {showText && (
        <div className="leading-tight">
          <div className={`font-serif font-semibold tracking-wide ${titleClr} ${s.title}`}>
            SRI RAMACHANDRA
          </div>
          <div className={`font-sans font-medium tracking-[0.18em] uppercase ${subClr} ${s.sub} mt-0.5`}>
            Engineering · Technology
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandMark;
