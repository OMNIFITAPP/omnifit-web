import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/',      icon: '○', label: 'Today'  },
  { to: '/myway', icon: '◐', label: 'My Way' },
  { to: '/club',  icon: '❋', label: 'Club'   },
] as const

export function NavBar() {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        background: 'rgba(245, 237, 228, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--line)',
        display: 'flex',
        padding: '10px 0 24px',
        zIndex: 100,
      }}
    >
      {NAV_ITEMS.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            flex: 1,
            background: 'none',
            border: 'none',
            color: isActive ? 'var(--ink)' : 'var(--ink2)',
            fontFamily: 'inherit',
            fontSize: '10px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '6px',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '3px',
          })}
        >
          <span style={{ fontSize: '16px', fontWeight: 300 }}>{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
