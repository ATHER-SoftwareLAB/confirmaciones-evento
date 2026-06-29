import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [invitados, setInvitados] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvitados()
    // Realtime
    const channel = supabase.channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invitados' }, () => fetchInvitados())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchInvitados = async () => {
    const { data } = await supabase.from('invitados').select('*').order('nombre')
    setInvitados(data || [])
    setLoading(false)
  }

  const total = invitados.length
  const confirmados = invitados.filter(i => i.estado === 'confirmado').length
  const noAsisten = invitados.filter(i => i.estado === 'no_asiste').length
  const pendientes = invitados.filter(i => i.estado === 'pendiente').length

  const pct = (n) => total > 0 ? (n / total * 100).toFixed(0) : 0

  const estadoBadge = (estado) => {
    if (estado === 'confirmado') return <span className="badge badge-green">✓ Confirmado</span>
    if (estado === 'no_asiste') return <span className="badge badge-red">✗ No asiste</span>
    return <span className="badge badge-yellow">· Pendiente</span>
  }

  const msg1 = invitados.filter(i => i.mensaje1_enviado).length
  const msg2 = invitados.filter(i => i.mensaje2_enviado).length

  if (loading) return <div className="empty"><div className="loading-dot" /></div>

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-sub">Resumen de confirmaciones en tiempo real</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total invitados</div>
          <div className="stat-value total">{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmados</div>
          <div className="stat-value confirmados">{confirmados}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">No asisten</div>
          <div className="stat-value no-asisten">{noAsisten}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sin respuesta</div>
          <div className="stat-value pendientes">{pendientes}</div>
        </div>
      </div>

      {total > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="progress-label">
            <span>Respuestas recibidas</span>
            <span>{confirmados + noAsisten} de {total} ({pct(confirmados + noAsisten)}%)</span>
          </div>
          <div className="progress-bar">
            <div className="progress-seg-green" style={{ width: `${pct(confirmados)}%` }} />
            <div className="progress-seg-red" style={{ width: `${pct(noAsisten)}%` }} />
            <div className="progress-seg-yellow" style={{ width: `${pct(pendientes)}%` }} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 12, color: 'var(--text2)' }}>
            <span style={{ color: 'var(--green)' }}>■ Confirmados {pct(confirmados)}%</span>
            <span style={{ color: 'var(--red)' }}>■ No asisten {pct(noAsisten)}%</span>
            <span style={{ color: 'var(--yellow)' }}>■ Pendientes {pct(pendientes)}%</span>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 32, fontSize: 13 }}>
          <div>
            <span style={{ color: 'var(--text2)' }}>Invitación enviada: </span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{msg1} / {total}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text2)' }}>Solicitud de confirmación enviada: </span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{msg2} / {total}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title" style={{ marginBottom: 16 }}>Lista de invitados</div>
        {invitados.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👥</div>
            <div className="empty-text">Aún no hay invitados. Ve a la sección Invitados para agregarlos.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Invit. enviada</th>
                  <th>Confirm. enviada</th>
                </tr>
              </thead>
              <tbody>
                {invitados.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.nombre}</td>
                    <td style={{ color: 'var(--text2)', fontFamily: 'monospace' }}>{inv.telefono}</td>
                    <td>{estadoBadge(inv.estado)}</td>
                    <td>{inv.mensaje1_enviado ? <span style={{ color: 'var(--green)' }}>✓</span> : <span style={{ color: 'var(--text2)' }}>—</span>}</td>
                    <td>{inv.mensaje2_enviado ? <span style={{ color: 'var(--green)' }}>✓</span> : <span style={{ color: 'var(--text2)' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
