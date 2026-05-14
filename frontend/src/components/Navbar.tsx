import { Link, useLocation } from 'react-router-dom'
import SyncIndicator from './SyncIndicator'

const links = [
  { to: '/',          label: 'Início',   emoji: '🏠' },
  { to: '/avaliar',   label: 'Avaliar',  emoji: '⭐' },
  { to: '/dashboard', label: 'Dashboard',emoji: '📊' },
  { to: '/cardapio',  label: 'Cardápio', emoji: '📋' },
  { to: '/analise',   label: 'IA',       emoji: '🤖' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed top-0 inset-x-0 z-40 bg-brand-700 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg shrink-0">
          <span className="text-2xl">🍽️</span>
          <span className="hidden md:block">PratoCerto Escolar</span>
        </Link>

        <div className="flex items-center gap-2">
          <SyncIndicator />

          <ul className="flex items-center gap-0.5">
            {links.map(({ to, label, emoji }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === to
                      ? 'bg-white text-brand-700'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="hidden sm:inline">{emoji}</span>
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}
