const icons = {
  arrow_forward: [
    ['path', { d: 'M5 12h14' }],
    ['path', { d: 'm13 6 6 6-6 6' }],
  ],
  arrow_back: [
    ['path', { d: 'M19 12H5' }],
    ['path', { d: 'm11 6-6 6 6 6' }],
  ],
  expand_more: [['path', { d: 'm6 9 6 6 6-6' }]],
  close: [
    ['path', { d: 'M18 6 6 18' }],
    ['path', { d: 'm6 6 12 12' }],
  ],
  refresh: [
    ['path', { d: 'M20 12a8 8 0 1 1-2.34-5.66' }],
    ['path', { d: 'M20 4v6h-6' }],
  ],
  calculate: [
    ['rect', { x: '5', y: '3', width: '14', height: '18', rx: '2' }],
    ['path', { d: 'M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0' }],
  ],
  chat: [
    ['path', { d: 'M21 12a8 8 0 0 1-8 8H7l-4 3 1.4-5A8 8 0 1 1 21 12Z' }],
  ],
  forum: [
    ['path', { d: 'M4 5h12a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-5 4v-4a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z' }],
    ['path', { d: 'M8 9h7M8 12h5' }],
  ],
  send: [
    ['path', { d: 'm22 2-7 20-4-9-9-4 20-7Z' }],
    ['path', { d: 'M22 2 11 13' }],
  ],
  play_arrow: [['path', { d: 'm8 5 11 7-11 7V5Z' }]],
  flag: [
    ['path', { d: 'M5 21V4' }],
    ['path', { d: 'M5 4h12l-2 5 2 5H5' }],
  ],
  person_add: [
    ['path', { d: 'M15 19a6 6 0 0 0-12 0' }],
    ['circle', { cx: '9', cy: '7', r: '4' }],
    ['path', { d: 'M19 8v6M16 11h6' }],
  ],
  home: [
    ['path', { d: 'm3 11 9-8 9 8' }],
    ['path', { d: 'M5 10v10h14V10' }],
  ],
  dashboard: [
    ['rect', { x: '3', y: '3', width: '8', height: '8', rx: '2' }],
    ['rect', { x: '13', y: '3', width: '8', height: '5', rx: '2' }],
    ['rect', { x: '13', y: '10', width: '8', height: '11', rx: '2' }],
    ['rect', { x: '3', y: '13', width: '8', height: '8', rx: '2' }],
  ],
  receipt_long: [
    ['path', { d: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Z' }],
    ['path', { d: 'M9 8h6M9 12h6M9 16h4' }],
  ],
  inventory_2: [
    ['path', { d: 'M4 7h16v13H4z' }],
    ['path', { d: 'M4 7l2-4h12l2 4M9 12h6' }],
  ],
  groups: [
    ['circle', { cx: '8', cy: '8', r: '3' }],
    ['circle', { cx: '16', cy: '8', r: '3' }],
    ['path', { d: 'M2 20a6 6 0 0 1 12 0M10 20a6 6 0 0 1 12 0' }],
  ],
  auto_awesome: [
    ['path', { d: 'm12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2Z' }],
    ['path', { d: 'm5 15 .8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15ZM19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7L19 14Z' }],
  ],
  query_stats: [
    ['path', { d: 'M4 19V5' }],
    ['path', { d: 'M4 19h16' }],
    ['path', { d: 'm6 15 4-4 3 3 6-7' }],
  ],
  verified_user: [
    ['path', { d: 'M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z' }],
    ['path', { d: 'm9 12 2 2 4-5' }],
  ],
  security: [
    ['path', { d: 'M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z' }],
  ],
  code: [
    ['path', { d: 'm8 9-4 3 4 3' }],
    ['path', { d: 'm16 9 4 3-4 3' }],
    ['path', { d: 'm14 5-4 14' }],
  ],
  code_blocks: [
    ['path', { d: 'm8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14' }],
    ['rect', { x: '3', y: '3', width: '18', height: '18', rx: '3' }],
  ],
  phone_iphone: [
    ['rect', { x: '7', y: '2', width: '10', height: '20', rx: '2' }],
    ['path', { d: 'M11 18h2' }],
  ],
  shopping_cart: [
    ['path', { d: 'M4 5h2l2 10h9l3-7H7' }],
    ['circle', { cx: '10', cy: '20', r: '1' }],
    ['circle', { cx: '17', cy: '20', r: '1' }],
  ],
  monitoring: [
    ['path', { d: 'M4 19V5' }],
    ['path', { d: 'M4 19h16' }],
    ['path', { d: 'M7 15v-4M12 15V8M17 15v-7' }],
  ],
  favorite: [
    ['path', { d: 'M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 21l8.8-8a5.2 5.2 0 0 0 0-7.4Z' }],
  ],
  calendar_month: [
    ['rect', { x: '4', y: '5', width: '16', height: '16', rx: '2' }],
    ['path', { d: 'M8 3v4M16 3v4M4 10h16' }],
  ],
  check_circle: [
    ['circle', { cx: '12', cy: '12', r: '9' }],
    ['path', { d: 'm8 12 3 3 5-6' }],
  ],
  restaurant: [
    ['path', { d: 'M7 2v20' }],
    ['path', { d: 'M4 2v6a3 3 0 0 0 6 0V2' }],
    ['path', { d: 'M17 2v20' }],
    ['path', { d: 'M17 2c2 1.5 3 3.5 3 6 0 2.8-1.2 5-3 6' }],
  ],
  storefront: [
    ['path', { d: 'M4 10h16' }],
    ['path', { d: 'M5 10l1-6h12l1 6' }],
    ['path', { d: 'M6 10v10h12V10' }],
    ['path', { d: 'M9 20v-6h6v6' }],
  ],
  hardware: [
    ['path', { d: 'M14 7 7 14' }],
    ['path', { d: 'M8 13l3 3' }],
    ['path', { d: 'M16 5l3 3-3 3-3-3 3-3Z' }],
    ['path', { d: 'M5 19l4-4' }],
  ],
  local_shipping: [
    ['path', { d: 'M3 7h11v10H3z' }],
    ['path', { d: 'M14 11h4l3 3v3h-7z' }],
    ['circle', { cx: '7', cy: '18', r: '2' }],
    ['circle', { cx: '17', cy: '18', r: '2' }],
  ],
  medical_services: [
    ['rect', { x: '4', y: '5', width: '16', height: '15', rx: '2' }],
    ['path', { d: 'M9 5V3h6v2' }],
    ['path', { d: 'M12 10v5M9.5 12.5h5' }],
  ],
  fitness_center: [
    ['path', { d: 'M6 7v10M18 7v10' }],
    ['path', { d: 'M3 10v4M21 10v4' }],
    ['path', { d: 'M6 12h12' }],
  ],
  content_cut: [
    ['circle', { cx: '6', cy: '7', r: '3' }],
    ['circle', { cx: '6', cy: '17', r: '3' }],
    ['path', { d: 'M8.5 8.5 20 20' }],
    ['path', { d: 'M8.5 15.5 20 4' }],
  ],
  build: [
    ['path', { d: 'M14.7 6.3a4 4 0 0 0-5 5L4 17v3h3l5.7-5.7a4 4 0 0 0 5-5l-2.4 2.4-2.8-2.8 2.2-2.6Z' }],
  ],
  apartment: [
    ['path', { d: 'M5 21V4h10v17' }],
    ['path', { d: 'M15 9h4v12' }],
    ['path', { d: 'M8 8h2M8 12h2M8 16h2M13 12h2M13 16h2' }],
  ],
  school: [
    ['path', { d: 'm3 9 9-5 9 5-9 5-9-5Z' }],
    ['path', { d: 'M7 12v4c2 2 8 2 10 0v-4' }],
    ['path', { d: 'M21 9v6' }],
  ],
  rocket_launch: [
    ['path', { d: 'M13 4c3 0 5 2 5 5 0 4-4 8-8 11l-4-4c3-4 7-8 7-12Z' }],
    ['path', { d: 'M9 15l-4 1 1-4' }],
    ['circle', { cx: '14', cy: '8', r: '1.5' }],
  ],
  handyman: [
    ['path', { d: 'M4 20 14 10' }],
    ['path', { d: 'm13 5 6 6' }],
    ['path', { d: 'm15 3 6 6-2 2-6-6 2-2Z' }],
    ['path', { d: 'M4 16l4 4' }],
  ],
}

export function Icon({ name, className = '', size = 20 }) {
  const shapes = icons[name] || [['circle', { cx: '12', cy: '12', r: '4' }]]

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`inline-block shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapes.map(([Tag, props], index) => <Tag key={`${name}-${index}`} {...props} />)}
    </svg>
  )
}
