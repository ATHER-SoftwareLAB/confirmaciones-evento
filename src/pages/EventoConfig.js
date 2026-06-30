import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function EventoConfig() {
  const [cfg, setCfg] = useState({
    evento_nombre: '', evento_fecha: '', evento_fecha_limite: '',
    evento_ubicacion_nombre: '', evento_maps_url: '', evento_imagen_url: ''
  })
  const [id, setId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCfg() }, [])

  const fetchCfg = async () => {
    const { data } = await supabase.from('configuracion').select('*').limit(1).maybeSingle()
    if (data) {
      setId(data.id)
      setCfg({
        evento_nombre: data.evento_nombre || '',
        evento_fecha: data.evento_fecha ? data.evento_fecha.slice(0, 16) : '',
        evento_fecha_limite: data.evento_fecha_limite ? data.evento_fecha_limite.slice(0, 16) : '',
        evento_ubicacion_nombre: data.evento_ubicacion_nombre || '',
        evento_maps_url: data.evento_maps_url || '',
        evento_imagen_url: data.evento_imagen_url || '',
      })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      evento_nombre: cfg.evento_nombre,
      evento_fecha: cfg.evento_fecha || null,
      evento_fecha_limite: cfg.evento_fecha_limite || null,
      evento_ubicacion_nombre: cfg.evento_ubicacion_nombre,
      evento_maps_url: cfg.evento_maps_url,
      evento_imagen_url: cfg.evento_imagen_url,
    }
    if (id) {
      await supabase.from('configuracion').update(payload).eq('id', id)
    } else {
      const { data } = await supabase.from('configuracion').insert(payload).select().single()
      if (data) setId(data.id)
    }
    toast.success('Evento guardado')
    setSaving(false)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Datos del evento</div>
        <div className="page-sub">Esta información aparece en la página de confirmación que ve cada invitado</div>
      </div>

      <div className="card">
        <div className="form-field">
          <label className="form-label">Nombre del evento</label>
          <input className="form-input" value={cfg.evento_nombre} onChange={e => setCfg(c => ({ ...c, evento_nombre: e.target.value }))} placeholder="Ej: Boda de Ana & Luis" />
        </div>

        <div className="two-col">
          <div className="form-field">
            <label className="form-label">Fecha y hora del evento</label>
            <input type="datetime-local" className="form-input" value={cfg.evento_fecha} onChange={e => setCfg(c => ({ ...c, evento_fecha: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Fecha límite para confirmar</label>
            <input type="datetime-local" className="form-input" value={cfg.evento_fecha_limite} onChange={e => setCfg(c => ({ ...c, evento_fecha_limite: e.target.value }))} />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Nombre del lugar</label>
          <input className="form-input" value={cfg.evento_ubicacion_nombre} onChange={e => setCfg(c => ({ ...c, evento_ubicacion_nombre: e.target.value }))} placeholder="Ej: Salón Jardín Las Palmas" />
        </div>

        <div className="form-field">
          <label className="form-label">Link de Google Maps</label>
          <input className="form-input" value={cfg.evento_maps_url} onChange={e => setCfg(c => ({ ...c, evento_maps_url: e.target.value }))} placeholder="https://maps.app.goo.gl/..." />
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 5 }}>
            💡 Busca el lugar en Google Maps → Compartir → Copiar enlace
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Imagen de la invitación (URL)</label>
          <input className="form-input" value={cfg.evento_imagen_url} onChange={e => setCfg(c => ({ ...c, evento_imagen_url: e.target.value }))} placeholder="https://i.ibb.co/..." />
        </div>

        <button className="btn-accent" style={{ marginTop: 8 }} onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : '✓ Guardar evento'}
        </button>
      </div>
    </div>
  )
}
