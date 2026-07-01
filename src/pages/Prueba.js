import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const SESSION_KEY = 'prueba_fuego'

export default function Prueba() {
  const [botUrl, setBotUrl] = useState('')
  const [botStatus, setBotStatus] = useState(null) // null | 'connected' | 'error'
  const [form, setForm] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || { nombre: '', telefono: '', mensaje: '' } }
    catch { return { nombre: '', telefono: '', mensaje: '' } }
  })
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null) // null | 'si' | 'no'

  // Cargar bot URL desde configuracion
  useEffect(() => {
    supabase.from('configuracion').select('green_api_instance').limit(1).maybeSingle()
      .then(({ data }) => {
        if (data?.green_api_instance) {
          setBotUrl(data.green_api_instance)
          checkBot(data.green_api_instance)
        }
      })
    // Limpiar sessionStorage al cerrar sesión
    return () => {}
  }, [])

  // Persistir form en sessionStorage (se borra al cerrar tab/sesión)
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(form))
  }, [form])

  const checkBot = async (url) => {
    try {
      const res = await fetch(`${url || botUrl}/`)
      const data = await res.json()
      setBotStatus(data.whatsapp === 'connected' ? 'connected' : 'error')
    } catch {
      setBotStatus('error')
    }
  }

  const handleEnviar = async () => {
    if (!form.nombre.trim() || !form.telefono.trim() || !form.mensaje.trim()) {
      return toast.error('Completa todos los campos')
    }
    if (!botUrl) return toast.error('URL del bot no configurada en Envíos')
    setEnviando(true)
    setResultado(null)
    try {
      const res = await fetch(`${botUrl}/send/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono: form.telefono.replace(/\D/g, ''),
          mensaje: form.mensaje.replace(/\{nombre\}/g, form.nombre)
        })
      })
      const data = await res.json()
      if (data.ok) {
        toast.success('¡Prueba enviada!')
      } else {
        toast.error('Error al enviar: ' + (data.error || 'desconocido'))
      }
    } catch {
      toast.error('No se pudo conectar con el bot')
    }
    setEnviando(false)
  }

  const previewText = form.mensaje.replace(/\{nombre\}/g, form.nombre || 'Nombre')

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🔥 Prueba de fuego</div>
        <div className="page-sub">Envía un mensaje de prueba para verificar que el sistema funciona correctamente</div>
      </div>

      {/* Estado del bot */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: botStatus === 'connected' ? 'var(--green)' : botStatus === 'error' ? 'var(--red)' : 'var(--yellow)'
          }} />
          <span style={{ fontSize: 13 }}>
            {botStatus === 'connected' ? 'Bot conectado y listo' : botStatus === 'error' ? 'Bot desconectado — verifica en Envíos' : 'Verificando bot...'}
          </span>
        </div>
        <button className="btn-secondary" onClick={() => checkBot()}>Verificar</button>
      </div>

      <div className="two-col">
        {/* Formulario */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Datos de prueba</div>

          <div className="form-field">
            <label className="form-label">Nombre</label>
            <input
              className="form-input"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre de la persona a la que quieras dirigir la prueba"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Número de teléfono</label>
            <input
              className="form-input"
              value={form.telefono}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
              placeholder="Este puede ser tu número o alguno al que puedas acceder con WhatsApp"
            />
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
              Formato: 521XXXXXXXXXX (con código de país)
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Mensaje</label>
            <textarea
              className="form-textarea"
              value={form.mensaje}
              onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
              placeholder="¿Qué mensaje deseas enviar? Usa {nombre} para personalizar."
              style={{ minHeight: 120 }}
            />
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
              Usa <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>{'{nombre}'}</code> para insertar el nombre automáticamente
            </div>
          </div>

          <button
            className="btn-accent"
            style={{ width: '100%' }}
            onClick={handleEnviar}
            disabled={enviando || botStatus !== 'connected'}
          >
            {enviando ? 'Enviando...' : '📤 Enviar prueba'}
          </button>

          {/* Resultado */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>¿Recibiste el mensaje correctamente?</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setResultado('si')}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${resultado === 'si' ? 'var(--green)' : 'var(--border)'}`,
                  background: resultado === 'si' ? 'rgba(74,222,128,0.1)' : 'var(--bg3)',
                  color: resultado === 'si' ? 'var(--green)' : 'var(--text2)', cursor: 'pointer', fontSize: 13, fontWeight: 500
                }}
              >
                ✓ Sí
              </button>
              <button
                onClick={() => setResultado('no')}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${resultado === 'no' ? 'var(--red)' : 'var(--border)'}`,
                  background: resultado === 'no' ? 'rgba(248,113,113,0.1)' : 'var(--bg3)',
                  color: resultado === 'no' ? 'var(--red)' : 'var(--text2)', cursor: 'pointer', fontSize: 13, fontWeight: 500
                }}
              >
                ✕ No
              </button>
            </div>

            {resultado === 'si' && (
              <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10 }}>
                <div style={{ color: 'var(--green)', fontWeight: 600, marginBottom: 4 }}>🎉 ¡Felicidades!</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>El sistema está funcionando correctamente. Estás listo para enviar las invitaciones.</div>
              </div>
            )}

            {resultado === 'no' && (
              <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10 }}>
                <div style={{ color: 'var(--red)', fontWeight: 600, marginBottom: 8 }}>⚠️ Algo no funcionó</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8 }}>
                  <div>1. Verifica que el número tenga formato <strong style={{ color: 'var(--text)' }}>521XXXXXXXXXX</strong></div>
                  <div>2. Confirma que el bot esté <strong style={{ color: 'var(--text)' }}>conectado</strong> (indicador verde arriba)</div>
                  <div>3. Ve a <strong style={{ color: 'var(--text)' }}>Envíos → Verificar</strong> y reconecta el bot si es necesario</div>
                  <div>4. Si persiste, visita <strong style={{ color: 'var(--text)' }}>tu-bot.onrender.com/qr</strong> y vuelve a escanear el QR</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vista previa */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Vista previa en WhatsApp</div>
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
            <div className="preview-phone">
              <div style={{ fontSize: 11, color: '#888', marginBottom: 12, textAlign: 'center' }}>WhatsApp</div>
              <div className="preview-bubble">
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6, minHeight: 40 }}>
                  {previewText || <span style={{ color: '#888', fontStyle: 'italic' }}>Tu mensaje aparecerá aquí...</span>}
                </div>
                <div style={{ fontSize: 10, color: '#888', textAlign: 'right', marginTop: 6 }}>
                  {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(201,169,110,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, border: '1px solid rgba(201,169,110,0.15)' }}>
            <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>Nota</div>
            <div>Los datos de esta prueba son temporales y se eliminan al cerrar sesión. No se guardan en la base de datos de invitados.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
