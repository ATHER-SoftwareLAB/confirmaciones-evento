import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Envios() {
  const [config, setConfig] = useState({ bot_url: '' })
  const [configId, setConfigId] = useState(null)
  const [msg1, setMsg1] = useState(null)
  const [msg2, setMsg2] = useState(null)
  const [invitados, setInvitados] = useState([])
  const [botStatus, setBotStatus] = useState(null)
  const [sending1, setSending1] = useState(false)
  const [sending2, setSending2] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: cfg }, { data: msgs }, { data: invs }] = await Promise.all([
      supabase.from('configuracion').select('*').limit(1).maybeSingle(),
      supabase.from('mensajes').select('*'),
      supabase.from('invitados').select('*').order('nombre'),
    ])
    if (cfg) { setConfig({ bot_url: cfg.green_api_instance || '' }); setConfigId(cfg.id) }
    if (msgs) {
      setMsg1(msgs.find(m => m.tipo === 'mensaje1') || null)
      setMsg2(msgs.find(m => m.tipo === 'mensaje2') || null)
    }
    setInvitados(invs || [])
  }

  const saveConfig = async () => {
    setSavingConfig(true)
    const payload = { green_api_instance: config.bot_url, green_api_token: '' }
    if (configId) {
      await supabase.from('configuracion').update(payload).eq('id', configId)
    } else {
      const { data } = await supabase.from('configuracion').insert(payload).select().single()
      if (data) setConfigId(data.id)
    }
    toast.success('URL del bot guardada')
    setSavingConfig(false)
  }

  const checkBot = async () => {
    if (!config.bot_url) return toast.error('Primero guarda la URL del bot')
    try {
      const res = await fetch(`${config.bot_url}/`)
      const data = await res.json()
      setBotStatus(data)
      toast.success(`Bot: ${data.whatsapp}`)
    } catch (e) {
      setBotStatus(null)
      toast.error('No se pudo conectar con el bot')
    }
  }

  const handleBlast = async (tipo) => {
    if (!config.bot_url) return toast.error('Configura la URL del bot primero')
    if (tipo === 'mensaje1' && !msg1) return toast.error('Configura el Mensaje 1 primero')
    if (tipo === 'mensaje2' && !msg2) return toast.error('Configura el Mensaje 2 primero')

    if (tipo === 'mensaje1') setSending1(true)
    else setSending2(true)

    try {
      const res = await fetch(`${config.bot_url}/blast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo })
      })
      const data = await res.json()
      if (data.ok) {
        toast.success('Envío iniciado — el bot está procesando en background. Revisa el Dashboard.')
      } else {
        toast.error('Error al iniciar el envío')
      }
    } catch (e) {
      toast.error('No se pudo conectar con el bot')
    }

    if (tipo === 'mensaje1') setSending1(false)
    else setSending2(false)
    fetchAll()
  }

  const pendientes1 = invitados.filter(i => !i.mensaje1_enviado).length
  const pendientes2 = invitados.filter(i => i.mensaje1_enviado && !i.mensaje2_enviado).length

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Envíos</div>
        <div className="page-sub">Controla el bot de WhatsApp y envía mensajes a tus invitados</div>
      </div>

      {/* Bot Config */}
      <div className="envio-card">
        <div className="envio-header">
          <div className="envio-title">🤖 Configuración del Bot</div>
          {botStatus && (
            <span className={`badge ${botStatus.whatsapp === 'connected' ? 'badge-green' : 'badge-yellow'}`}>
              {botStatus.whatsapp === 'connected' ? '✓ WhatsApp conectado' : '⏳ Conectando...'}
            </span>
          )}
        </div>
        <div className="envio-desc">
          Pega aquí la URL pública de tu bot en Railway. La encuentras en tu proyecto de Railway → <strong>Settings → Domains</strong>.
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">URL del bot en Railway</label>
            <input
              className="form-input"
              value={config.bot_url}
              onChange={e => setConfig(c => ({ ...c, bot_url: e.target.value }))}
              placeholder="https://confirmaciones-bot.up.railway.app"
            />
          </div>
          <button className="btn-secondary" onClick={saveConfig} disabled={savingConfig}>
            {savingConfig ? 'Guardando...' : 'Guardar'}
          </button>
          <button className="btn-secondary" onClick={checkBot}>
            Verificar
          </button>
        </div>
      </div>

      {/* Mensaje 1 */}
      <div className="envio-card">
        <div className="envio-header">
          <div className="envio-title">📩 Mensaje 1 — Invitación</div>
          <span className="badge badge-yellow">{pendientes1} pendientes</span>
        </div>
        <div className="envio-desc">
          Envía la invitación a todos los invitados que aún no la han recibido. El bot procesará los envíos con 3 segundos de intervalo.
          {msg1 ? (
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, fontSize: 12, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>
              {msg1.texto.replace('{nombre}', '[nombre]')}
            </div>
          ) : (
            <div style={{ marginTop: 10, color: 'var(--red)', fontSize: 12 }}>⚠️ Configura el Mensaje 1 en la sección Mensajes.</div>
          )}
        </div>
        <button
          className="btn-accent"
          onClick={() => handleBlast('mensaje1')}
          disabled={sending1 || !msg1 || pendientes1 === 0}
        >
          {sending1 ? 'Iniciando...' : `Enviar invitación a ${pendientes1} invitados`}
        </button>
      </div>

      {/* Mensaje 2 */}
      <div className="envio-card">
        <div className="envio-header">
          <div className="envio-title">✅ Mensaje 2 — Confirmación de asistencia</div>
          <span className="badge badge-yellow">{pendientes2} pendientes</span>
        </div>
        <div className="envio-desc">
          Envía la solicitud de confirmación a quienes ya recibieron la invitación. El bot escucha sus respuestas y actualiza el dashboard automáticamente.
          {msg2 ? (
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, fontSize: 12, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>
              {msg2.texto.replace('{nombre}', '[nombre]')}{'\n\n'}{msg2.boton_si}{'\n'}{msg2.boton_no}
            </div>
          ) : (
            <div style={{ marginTop: 10, color: 'var(--red)', fontSize: 12 }}>⚠️ Configura el Mensaje 2 en la sección Mensajes.</div>
          )}
        </div>
        <button
          className="btn-accent"
          onClick={() => handleBlast('mensaje2')}
          disabled={sending2 || !msg2 || pendientes2 === 0}
        >
          {sending2 ? 'Iniciando...' : `Solicitar confirmación a ${pendientes2} invitados`}
        </button>
      </div>

      <div className="card" style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>📋 Cómo funciona</div>
        <div>• El bot vive en Railway 24/7 — tu PC puede estar apagada.</div>
        <div>• Cuando un invitado responde "Sí" o "No", el bot lo detecta y actualiza el Dashboard automáticamente.</div>
        <div>• También detecta: "confirmo", "voy", "no puedo", "no podré" y variantes.</div>
        <div>• El bot responde automáticamente confirmando que recibió su respuesta.</div>
        <div>• Puedes cambiar el estado de cualquier invitado manualmente desde la sección Invitados.</div>
      </div>
    </div>
  )
}
