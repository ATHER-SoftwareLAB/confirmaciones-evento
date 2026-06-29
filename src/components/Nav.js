import React from 'react'
import { supabase } from '../lib/supabase'

const links = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'invitados', label: 'Invitados' },
  { id: 'mensajes', label: 'Mensajes' },
  { id: 'envios', label: 'Envíos' },
]

export default function Nav({ page, setPage, session }) {
  const handleLogout = () => supabase.auth.signOut()

  return (
    <nav className="nav">
      <div className="nav-brand">✦ Confirmaciones</div>
      <div className="nav-links">
        {links.map(l => (
          <button key={l.id} className={`nav-link ${page === l.id ? 'active' : ''}`} onClick={() => setPage(l.id)}>
            {l.label}
          </button>
        ))}
      </div>
      <div className="nav-right">
        <span className="nav-email">{session?.user?.email}</span>
        <button className="btn-logout" onClick={handleLogout}>Salir</button>
      </div>
    </nav>
  )
}
