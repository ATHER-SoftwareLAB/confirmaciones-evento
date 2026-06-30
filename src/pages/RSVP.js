import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RSVP() {
  const { id } = useParams()
  const [invitado, setInvitado] = useState(null)
  const [evento, setEvento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [respondiendo, setRespondiendo] = useState(false)
  const [respondido, setRespondido] = useState(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    fetchData()
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [id])

  const fetchData = async () => {
    const [{ data: inv }, { data: cfg }] = await Promise.all([
      supabase.from('invitados').select('*').eq('id', id).maybeSingle(),
      supabase.from('configuracion').select('*').limit(1).maybeSingle(),
    ])
    setInvitado(inv)
    setEvento(cfg)
    if (inv?.estado && inv.estado !== 'pendiente') setRespondido(inv.estado)
    setLoading(false)
  }

  const responder = async (estado) => {
    setRespondiendo(true)
    await supabase.from('invitados').update({ estado }).eq('id', id)
    setRespondido(estado)
    setRespondiendo(false)
  }

  if (loading) return <div style={S.loadingScreen}><div style={S.loadingDot} /></div>

  if (!invitado) {
    return (
      <div style={S.page}>
        <div style={S.errorCard}>
          <div style={S.errorIcon}>✦</div>
          <p style={S.errorText}>No encontramos tu invitación. Verifica el link que recibiste.</p>
        </div>
      </div>
    )
  }

  const horaInicio = evento?.misa_habilitada && evento?.misa_hora ? evento.misa_hora : (evento?.evento_hora || '00:00')
  const fechaEvento = evento?.evento_fecha ? new Date(`${evento.evento_fecha}T${horaInicio}:00`) : null
  const countdownEvento = fechaEvento ? getCountdown(fechaEvento, now) : null
  const fechaLimite = evento?.evento_fecha_limite ? new Date(evento.evento_fecha_limite) : null
  const countdownLimite = fechaLimite ? getCountdown(fechaLimite, now) : null
  const limiteExpirado = fechaLimite && now > fechaLimite

  return (
    <div style={S.page}>
      <div style={S.container}>

        {evento?.evento_imagen_url && (
          <div style={S.imageWrap}>
            <img src={evento.evento_imagen_url} alt="Invitación" style={S.image} />
          </div>
        )}

        <div style={S.card}>
          <div style={S.eyebrow}>Estás invitado</div>
          <h1 style={S.title}>{evento?.evento_nombre || 'Nuestro Evento'}</h1>

          {fechaEvento && (
            <div style={S.dateBlock}>
              <div style={S.dateText}>{formatFechaSolo(fechaEvento)}</div>
              {countdownEvento && !countdownEvento.pasado && (
                <div style={S.countdownRow}>
                  <CountdownUnit value={countdownEvento.dias} label="días" />
                  <CountdownUnit value={countdownEvento.horas} label="hrs" />
                  <CountdownUnit value={countdownEvento.min} label="min" />
                  <CountdownUnit value={countdownEvento.seg} label="seg" />
                </div>
              )}
              {evento?.evento_ciudad && <div style={S.cityText}>{evento.evento_ciudad}</div>}
            </div>
          )}

          {(evento?.evento_ubicacion_nombre || evento?.misa_habilitada) && (
            <div style={S.locationsCol}>
              {evento?.misa_habilitada && (
                <div style={S.locationBlock}>
                  <div style={S.locationIcon}>✛</div>
                  <div style={{ flex: 1 }}>
                    <div style={S.locationLabel}>Celebración religiosa</div>
                    {evento.misa_maps_url ? (
                      <a href={evento.misa_maps_url} target="_blank" rel="noreferrer" style={S.mapsBtn}>
                        {evento.misa_nombre_lugar || 'Ver ubicación'}{evento.misa_hora ? ` — ${formatHora(evento.misa_hora)}` : ''}
                      </a>
                    ) : (
                      <div style={S.locationName}>{evento.misa_nombre_lugar}{evento.misa_hora ? ` — ${formatHora(evento.misa_hora)}` : ''}</div>
                    )}
                  </div>
                </div>
              )}

              {evento?.evento_ubicacion_nombre && (
                <div style={S.locationBlock}>
                  <div style={S.locationIcon}>📍</div>
                  <div style={{ flex: 1 }}>
                    <div style={S.locationLabel}>Recepción</div>
                    {evento.evento_maps_url ? (
                      <a href={evento.evento_maps_url} target="_blank" rel="noreferrer" style={S.mapsBtn}>
                        {evento.evento_ubicacion_nombre}{evento.evento_hora ? ` — ${formatHora(evento.evento_hora)}` : ''}
                      </a>
                    ) : (
                      <div style={S.locationName}>{evento.evento_ubicacion_nombre}{evento.evento_hora ? ` — ${formatHora(evento.evento_hora)}` : ''}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={S.divider} />

          <div style={S.guestSection}>
            <div style={S.guestLabel}>Para</div>
            <div style={S.guestName}>{invitado.nombre}</div>
          </div>

          {respondido ? (
            <div style={S.confirmedBlock}>
              {respondido === 'confirmado' ? (
                <>
                  <div style={S.confirmedIcon}>✓</div>
                  <div style={S.confirmedTitle}>¡Asistencia confirmada!</div>
                  <div style={S.confirmedSub}>Te esperamos, {invitado.nombre.split(' ')[0]}</div>
                </>
              ) : (
                <>
                  <div style={S.declinedIcon}>✕</div>
                  <div style={S.confirmedTitle}>Avisaste que no podrás asistir</div>
                  <div style={S.confirmedSub}>Gracias por hacérnoslo saber</div>
                </>
              )}
              <button style={S.changeLink} onClick={() => setRespondido(null)}>Cambiar respuesta</button>
            </div>
          ) : limiteExpirado ? (
            <div style={S.expiredBlock}>
              <div style={S.expiredText}>El plazo para confirmar ha finalizado</div>
            </div>
          ) : (
            <div style={S.actionBlock}>
              {fechaLimite && countdownLimite && !countdownLimite.pasado && (
                <div style={S.deadlineBlock}>
                  <div style={S.deadlineLabel}>Confirma antes de</div>
                  <div style={S.deadlineRow}>
                    <CountdownUnit value={countdownLimite.dias} label="días" />
                    <CountdownUnit value={countdownLimite.horas} label="hrs" />
                    <CountdownUnit value={countdownLimite.min} label="min" />
                    <CountdownUnit value={countdownLimite.seg} label="seg" />
                  </div>
                </div>
              )}
              <div style={S.question}>¿Podrás acompañarnos?</div>
              <div style={S.buttonsRow}>
                <button style={S.btnYes} onClick={() => responder('confirmado')} disabled={respondiendo}>
                  Sí, ahí estaré
                </button>
                <button style={S.btnNo} onClick={() => responder('no_asiste')} disabled={respondiendo}>
                  No podré ir
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={S.credits}>Distribuido por AES · Powered by ASoftwareLAB · Derechos reservados</div>
      </div>
    </div>
  )
}

function CountdownUnit({ value, label }) {
  return (
    <div style={S.countdownUnit}>
      <div style={S.countdownValue}>{String(value).padStart(2, '0')}</div>
      <div style={S.countdownLabel}>{label}</div>
    </div>
  )
}

function getCountdown(target, now) {
  const diff = target - now
  if (diff <= 0) return { pasado: true }
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const min = Math.floor((diff / (1000 * 60)) % 60)
  const seg = Math.floor((diff / 1000) % 60)
  return { dias, horas, min, seg, pasado: false }
}

function formatFechaSolo(d) {
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatHora(t) {
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${m} ${ampm}`
}

const S = {
  page: {
    minHeight: '100vh', background: 'linear-gradient(180deg, #0f0f1a 0%, #15152a 100%)',
    display: 'flex', justifyContent: 'center', padding: '32px 16px',
    fontFamily: "'Inter', sans-serif", color: '#e8e0d4',
  },
  container: { width: '100%', maxWidth: 460 },
  loadingScreen: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' },
  loadingDot: { width: 12, height: 12, borderRadius: '50%', background: '#c9a96e' },
  errorCard: { textAlign: 'center', padding: '60px 24px', color: '#9990b8' },
  errorIcon: { fontSize: 32, color: '#c9a96e', marginBottom: 16 },
  errorText: { fontSize: 14, lineHeight: 1.6 },
  imageWrap: {
    borderRadius: 20, overflow: 'hidden', marginBottom: -40, position: 'relative', zIndex: 1,
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)', background: '#1a1a2e',
  },
  image: { width: '100%', display: 'block', objectFit: 'contain' },
  card: {
    background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 20,
    padding: '48px 28px 32px', position: 'relative', zIndex: 2,
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  },
  eyebrow: { fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c9a96e', textAlign: 'center', marginBottom: 10 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 28, textAlign: 'center', lineHeight: 1.3, marginBottom: 20, color: '#f0e8d8' },
  dateBlock: { textAlign: 'center', marginBottom: 24 },
  dateText: { fontSize: 14, color: '#c9a96e', textTransform: 'capitalize', marginBottom: 12 },
  countdownRow: { display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 10 },
  cityText: { fontSize: 12, color: '#9990b8', letterSpacing: '0.03em' },
  locationsCol: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 },
  locationBlock: { display: 'flex', gap: 12, alignItems: 'flex-start', background: '#22223b', borderRadius: 12, padding: 16 },
  locationIcon: { fontSize: 18, marginTop: 2 },
  locationLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9990b8', marginBottom: 4 },
  locationName: { fontSize: 14, fontWeight: 500, marginBottom: 6, color: '#e8e0d4' },
  mapsBtn: {
    display: 'inline-block', marginTop: 4, fontSize: 12, color: '#0f0f1a', background: '#c9a96e',
    padding: '8px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 600,
  },
  divider: { height: 1, background: '#2d2d4e', margin: '24px 0' },
  guestSection: { textAlign: 'center', marginBottom: 28 },
  guestLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9990b8', marginBottom: 6 },
  guestName: { fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#f0e8d8' },
  actionBlock: { textAlign: 'center' },
  deadlineBlock: { marginBottom: 22 },
  deadlineLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9990b8', marginBottom: 10 },
  deadlineRow: { display: 'flex', justifyContent: 'center', gap: 10 },
  countdownUnit: { background: '#22223b', borderRadius: 10, padding: '10px 12px', minWidth: 52 },
  countdownValue: { fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#f0e8d8' },
  countdownLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9990b8', marginTop: 2 },
  question: { fontSize: 15, marginBottom: 18, color: '#e8e0d4' },
  buttonsRow: { display: 'flex', flexDirection: 'column', gap: 10 },
  btnYes: {
    padding: '14px', borderRadius: 12, border: 'none', background: '#c9a96e',
    color: '#0f0f1a', fontWeight: 600, fontSize: 14, cursor: 'pointer',
  },
  btnNo: {
    padding: '14px', borderRadius: 12, border: '1px solid #2d2d4e', background: 'transparent',
    color: '#9990b8', fontWeight: 500, fontSize: 14, cursor: 'pointer',
  },
  confirmedBlock: { textAlign: 'center', padding: '12px 0' },
  confirmedIcon: { width: 48, height: 48, borderRadius: '50%', background: 'rgba(74,222,128,0.12)', color: '#4ade80', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  declinedIcon: { width: 48, height: 48, borderRadius: '50%', background: 'rgba(248,113,113,0.12)', color: '#f87171', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  confirmedTitle: { fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#f0e8d8' },
  confirmedSub: { fontSize: 13, color: '#9990b8', marginBottom: 16 },
  changeLink: { background: 'none', border: 'none', color: '#c9a96e', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' },
  expiredBlock: { textAlign: 'center', padding: '12px 0' },
  expiredText: { fontSize: 14, color: '#9990b8' },
  footer: { textAlign: 'center', fontSize: 12, color: '#6b6485', marginTop: 24, fontStyle: 'italic' },
  credits: { textAlign: 'center', fontSize: 10, color: '#4a4566', marginTop: 16, letterSpacing: '0.02em' },
}
