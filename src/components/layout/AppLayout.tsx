import { Outlet, useLocation } from 'react-router-dom'
import { NavBar } from './NavBar'

export function AppLayout() {
  const { key } = useLocation()

  return (
    <>
      {/* App shell: centered column, max 430px */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '430px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Scrollable screen content */}
        <div
          className="no-scrollbar"
          data-app-scroll="true"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            paddingBottom: '92px',  /* nav height clearance */
          }}
        >
          {/* key forces a fresh mount + fade animation on route change */}
          <div key={key} className="screen-enter">
            <Outlet />
          </div>
        </div>
      </div>

      <NavBar />
    </>
  )
}
