import Icon from '../dashboard/Icon'

// Icons only the Reports page needs; everything else comes from the shared Icon component.
const EXTRA = {
  download: (<><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" /><path d="M4.5 19.5h15" /></>),
  pin: (<><path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0C5.5 15.4 12 21 12 21Z" /><circle cx="12" cy="10" r="2.3" /></>),
  megaphone: (<><path d="M4 10v4h3l7 4V6L7 10H4Z" /><path d="M17.5 9.5a4 4 0 0 1 0 5" /></>),
  userPlus: (<><circle cx="9.5" cy="8.5" r="3.2" /><path d="M3.5 19.5c.5-3.2 3-5 6-5s5.5 1.8 6 5" /><path d="M18 8v6M15 11h6" /></>),
}

export default function ReportIcon({ name, size = 22 }) {
  const body = EXTRA[name]
  if (!body) return <Icon name={name} size={size} />
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor"
         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {body}
    </svg>
  )
}
