// Open-box illustration for the empty Orders state.
export default function EmptyBox() {
  return (
    <svg viewBox="0 0 200 150" width="200" height="150" aria-hidden="true" className="sl-box">
      <ellipse cx="100" cy="128" rx="62" ry="12" fill="rgba(120,150,210,0.14)" />
      <g stroke="rgba(190,205,235,0.9)" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M100 8v16M72 18l10 12M128 18l-10 12" />
      </g>
      <path d="M100 62 148 82 148 112 100 132 52 112 52 82Z" fill="rgba(120,145,190,0.5)" stroke="rgba(190,205,235,0.55)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M100 62 52 82 100 102 148 82Z" fill="rgba(60,80,120,0.7)" stroke="rgba(190,205,235,0.55)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M52 82 36 66 84 50 100 62Z" fill="rgba(170,190,225,0.55)" stroke="rgba(190,205,235,0.6)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M148 82 164 66 116 50 100 62Z" fill="rgba(150,172,212,0.5)" stroke="rgba(190,205,235,0.6)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M100 102v30" stroke="rgba(190,205,235,0.5)" strokeWidth="1.5" />
    </svg>
  )
}
