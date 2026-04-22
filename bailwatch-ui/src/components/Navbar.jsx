import { NavLink } from 'react-router-dom'

export default function Navbar() {
  const linkStyle = ({ isActive }) => ({
    color: isActive ? 'var(--gold-bright)' : 'var(--white-dim)',
    borderBottom: isActive ? '1px solid var(--gold)' : '1px solid transparent',
    paddingBottom: '2px',
    textDecoration: 'none',
    transition: 'color 0.2s',
    textTransform: 'uppercase',
  })

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 h-16"
      style={{
        background: 'rgba(6, 8, 14, 0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <NavLink to="/" style={{ textDecoration: 'none' }}>
        <div
          className="flex items-center gap-1 select-none"
          style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.1em' }}
        >
          <span style={{ color: 'var(--gold)' }}>[</span>
          <span style={{ color: 'var(--white)' }}>BAIL</span>
          <span style={{ color: 'var(--gold)' }}>WATCH</span>
          <span style={{ color: 'var(--gold)' }}>]</span>
        </div>
      </NavLink>

      <div
        className="absolute left-1/2 -translate-x-1/2 hidden md:block"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          letterSpacing: '0.22em',
          color: 'var(--white-ghost)',
          textTransform: 'uppercase',
        }}
      >
        Judicial Bias Audit System · SDG 16.3
      </div>

      <div
        className="flex items-center gap-5"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.15em' }}
      >
        <span style={{ color: 'rgba(232,228,220,0.2)', fontSize: '0.6rem' }}>v2.4.1</span>
        <span style={{ color: 'var(--border-lit)' }}>|</span>
        <NavLink to="/"        end   style={linkStyle}>About</NavLink>
        <NavLink to="/audit"         style={linkStyle}>Audit</NavLink>
        <NavLink to="/results"       style={linkStyle}>Results</NavLink>
        <NavLink to="/history"       style={linkStyle}>History</NavLink>
      </div>
    </nav>
  )
}