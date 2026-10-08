const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }

export default function Icon({ name, size = 22 }) {
  const body = {
    bag: (<><path d="M6 8h12l1 12H5L6 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>),
    coins: (<><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>),
    bars: (<><path d="M6 20v-7M12 20V5M18 20v-10" strokeWidth="3" /></>),
    percent: (<><path d="M18 6 6 18" /><circle cx="7.5" cy="7.5" r="2" /><circle cx="16.5" cy="16.5" r="2" /></>),
    car: (<><path d="M5 15.5 6.6 10a2 2 0 0 1 1.9-1.5h7a2 2 0 0 1 1.9 1.5l1.6 5.5" /><rect x="3.5" y="15.5" width="17" height="4" rx="1.5" /><circle cx="7.5" cy="17.5" r=".6" /><circle cx="16.5" cy="17.5" r=".6" /></>),
    doc: (<><path d="M7 3h7l4 4v14H7V3Z" /><path d="M14 3v4h4M9.5 12h5M9.5 16h5" /></>),
    calendar: (<><rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>),
    chevron: (<path d="m6 9 6 6 6-6" />),
    pie: (<><path d="M12 3v9h9" /><path d="M20.5 14A9 9 0 1 1 10 3.5" /></>),
    barchart: (<path d="M6 20v-7M12 20V5M18 20v-10" strokeWidth="2.6" />),
    users: (<><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c.5-3 2.7-4.5 5.5-4.5s5 1.5 5.5 4.5" /><circle cx="17" cy="9.5" r="2.4" /><path d="M16 14.7c2.4-.2 4.2 1 4.6 3.8" /></>),
    share: (<><circle cx="6.5" cy="12" r="2.5" /><circle cx="17" cy="6.5" r="2.5" /><circle cx="17" cy="17.5" r="2.5" /><path d="m8.7 10.8 6-3.1M8.7 13.2l6 3.1" /></>),
    list: (<><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.8" cy="6" r=".6" /><circle cx="4.8" cy="12" r=".6" /><circle cx="4.8" cy="18" r=".6" /></>),
    home: (<><path d="M4 11.5 12 4.5l8 7" /><path d="M6 10.5V20h12v-9.5" /><path d="M10 20v-5.5h4V20" /></>),
    cart: (<><path d="M3 4.5h2.4l2.1 10.5h10.2l2-7.5H6.6" /><circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></>),
    logout: (<><path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" /><path d="m15 8 4 4-4 4M19 12H9.5" /></>),
    tag: (<><path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-5.6 5.6a1.5 1.5 0 0 1-2.1 0L3.5 12.2Z" /><circle cx="8" cy="8" r="1.3" /></>),
    truck: (<><path d="M2.5 6.5h11v9h-11z" /><path d="M13.5 9.5h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.7" /><circle cx="17" cy="17.5" r="1.7" /></>),
    pencil: (<><path d="m4 20 1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z" /><path d="m14.5 6.5 3 3" /></>),
    plus: (<path d="M12 5v14M5 12h14" strokeWidth="2.2" />),
    trend: (<><path d="m3.5 17 5.5-6 4 4 7-8" /><path d="M15.5 7h5v5" /></>),
    arrowLeft: (<path d="M19 12H5M11 6l-6 6 6 6" strokeWidth="2" />),
    trash: (<><path d="M4.5 7h15M9.5 7V4.5h5V7" /><path d="M6.5 7l.9 12.5h9.2L17.5 7" /><path d="M10 11v5M14 11v5" /></>),
    save: (<><path d="M5 4.5h11l3 3V19.5H5z" /><path d="M8.5 4.5v4.5h6V4.5M8.5 19.5v-6h7v6" /></>),
    info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.8v.2" strokeWidth="2.2" /></>),
    warn: (<><path d="M12 4 3 19.5h18L12 4Z" /><path d="M12 10v4.5M12 17v.2" strokeWidth="2" /></>),
    check: (<path d="m5 12.5 4.5 4.5L19 7.5" strokeWidth="2.4" />),
    x: (<path d="M6 6l12 12M18 6 6 18" strokeWidth="2" />),
    user: (<><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c.6-3.8 3.6-5.8 7.5-5.8s6.9 2 7.5 5.8" /></>),
    box: (<><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>),
  }[name]
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...P}>
      {body}
    </svg>
  )
}
