import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const DEFAULT_MSG1 = {
  tipo: 'mensaje1',
  texto: '¡Hola {nombre}! 🎉\n\nTe hacemos llegar esta invitación especial. Próximamente recibirás un mensaje para confirmar tu asistencia.\n\n¡Esperamos verte pronto!',
  imagen_url: '',
  boton_si: '✅ Sí podré',
  boton_no: '❌ No podré',
}
const DEFAULT_MSG2 = {
  tipo: 'mensaje2',
  texto: 'Hola {nombre} 👋\n\n¿Confirmas tu asistencia al evento?\n\nPor favor selecciona una opción:',
  imagen_url: '',
  boton_si: '✅ Sí podré',
  boton_no: '❌ No podré',
}

export default function Mensajes() {
  const [tab, setTab] = useState('mensaje1')
  const [msg1, setMsg1] = useState(DEFAULT_MSG1)
  const [msg2, setMsg2] = useState(DEFAULT_MSG2)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchMensajes() }, [])

  const fetchMensajes = async () => {
    const { data } = await supabase.from('mensajes').select('*')
    if (data) {
      const m1 = data.find(m => m.tipo === 'mensaje1')
      const m2 = data.find(m => m.tipo === 'mensaje2')
      if (m1) setMsg1(m1)
      if (m2) setMsg2(m2)
    }
  }

  const current = tab === 'mensaje1' ? msg1 : msg2
  const setCurrent = tab === 'mensaje1' ? setMsg1 : setMsg2

  const handleSave = async () => {
    setSaving(true)
    const payload = { tipo: current.tipo, texto: current.texto, imagen_url: current.imagen_url, boton_si: current.boton_si, boton_no: current.boton_no }
    if (current.id) {
      const { error } = await supabase.from('mensajes').update(payload).eq('id', current.id)
      if (error) { toast.error('Error al guardar'); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('mensajes').insert(payload).select().single()
      if (error) { toast.error('Error al guardar'); setSaving(false); return }
      setCurrent(prev => ({ ...prev, id: data.id }))
    }
    toast.success('Mensaje guardado')
    setSaving(false)
  }

  const previewText = current.texto.replace('{nombre}', 'María')

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Configurar mensajes</div>
        <div className="page-sub">Personaliza el texto, imagen y botones de cada mensaje</div>
      </div>

      <div className="msg-tabs">
        <button className={`msg-tab ${tab === 'mensaje1' ? 'active' : ''}`} onClick={() => setTab('mensaje1')}>
          📩 Mensaje 1 — Invitación
        </button>
        <button className={`msg-tab ${tab === 'mensaje2' ? 'active' : ''}`} onClick={() => setTab('mensaje2')}>
          ✅ Mensaje 2 — Confirmación
        </button>
      </div>

      <div className="two-col">
        {/* EDITOR */}
        <div>
          <div className="card">
            <div className="section-title">Editor</div>

            <div className="form-field">
              <label className="form-label">Texto del mensaje</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 140 }}
                value={current.texto}
                onChange={e => setCurrent(c => ({ ...c, texto: e.target.value }))}
                placeholder="Escribe el mensaje aquí. Usa {nombre} para personalizar."
              />
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 5 }}>
                💡 Usa <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>{'{nombre}'}</code> para insertar el nombre del invitado automáticamente.
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">URL de imagen {tab === 'mensaje1' ? '(tu invitación)' : '(opcional)'}</label>
              <input
                className="form-input"
                value={current.imagen_url}
                onChange={e => setCurrent(c => ({ ...c, imagen_url: e.target.value }))}
                placeholder="https://... (sube tu imagen a imgbb.com o similar)"
              />
            </div>

            {tab === 'mensaje2' && (
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>
                💡 El bot agrega automáticamente el link de confirmación al final del mensaje.
              </div>
            )}

            <button className="btn-accent" style={{ width: '100%', marginTop: 8 }} onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : '✓ Guardar mensaje'}
            </button>
          </div>
        </div>

        {/* PREVIEW */}
        <div>
          <div className="card">
            <div className="section-title">Vista previa en WhatsApp</div>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
              <div className="preview-phone">
                <div style={{ fontSize: 11, color: '#888', marginBottom: 12, textAlign: 'center' }}>WhatsApp</div>
                <div className="preview-bubble">
                  {current.imagen_url && (
                    <img src={current.imagen_url} alt="Invitación" style={{ width: '100%', borderRadius: 8, marginBottom: 8 }} />
                  )}
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6 }}>{previewText}</div>
                  {tab === 'mensaje2' && (
                    <div style={{ marginTop: 10, fontSize: 12, color: '#0f0f1a', background: '#c9a96e', padding: '8px 12px', borderRadius: 8, fontWeight: 600 }}>
                      👉 confirmaciones-evento.vercel.app/rsvp/...
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: '#888', textAlign: 'right', marginTop: 6 }}>
                    {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </div>
                </div>
              </div>
            </div>

            {tab === 'mensaje1' && !current.imagen_url && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(201,169,110,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--accent)', border: '1px solid rgba(201,169,110,0.2)' }}>
                💡 Para subir tu imagen de invitación, usa <a href="https://imgbb.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent2)' }}>imgbb.com</a> (gratis) y pega aquí el link directo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
