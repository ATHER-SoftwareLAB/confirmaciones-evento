import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function EventoConfig() {
  const [cfg, setCfg] = useState({
    evento_nombre: '', evento_fecha: '', evento_hora: '', evento_fecha_limite: '',
    evento_ubicacion_nombre: '', evento_maps_url: '', evento_imagen_url: '',
    evento_ciudad: '',
    misa_habilitada: false, misa_hora: '', misa_maps_url: '', misa_nombre_lugar: ''
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
        evento_fecha: data.evento_fecha ? data.evento_fecha.slice(0, 10) : '',
        evento_hora: data.evento_hora || '',
        evento_fecha_limite: data.evento_fecha_limite ? data.evento_fecha_limite.slice(0, 16) : '',
        evento_ubicacion_nombre: data.evento_ubicacion_nombre || '',
        evento_maps_url: data.evento_maps_url || '',
        evento_imagen_url: data.evento_imagen_url || '',
        evento_ciudad: data.evento_ciudad || '',
        misa_habilitada: data.misa_habilitada || false,
        misa_hora: data.misa_hora || '',
        misa_maps_url: data.misa_maps_url || '',
        misa_nombre_lugar: data.misa_nombre_lugar || '',
      })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      evento_nombre: cfg.evento_nombre,
      evento_fecha: cfg.evento_fecha || null,
      evento_hora: cfg.evento_hora,
      evento_fecha_limite: cfg.evento_fecha_limite || null,
      evento_ubicacion_nombre: cfg.evento_ubicacion_nombre,
      evento_maps_url: cfg.evento_maps_url,
      evento_imagen_url: cfg.evento_imagen_url,
      evento_ciudad: cfg.evento_ciudad,
      misa_habilitada: cfg.misa_habilitada,
      misa_hora: cfg.misa_hora,
      misa_maps_url: cfg.misa_maps_url,
      misa_nombre_lugar: cfg.misa_nombre_lugar,
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
            <label className="form-label">Fecha del evento</label>
            <input type="date" className="form-input" value={cfg.evento_fecha} onChange={e => setCfg(c => ({ ...c, evento_fecha: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Fecha límite para confirmar</label>
            <input type="datetime-local" className="form-input" value={cfg.evento_fecha_limite} onChange={e => setCfg(c => ({ ...c, evento_fecha_limite: e.target.value }))} />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Nombre del lugar (recepción)</label>
          <input className="form-input" value={cfg.evento_ubicacion_nombre} onChange={e => setCfg(c => ({ ...c, evento_ubicacion_nombre: e.target.value }))} placeholder="Ej: Salón Catalina" />
        </div>

        <div className="two-col">
          <div className="form-field">
            <label className="form-label">Hora de la recepción</label>
            <input type="time" className="form-input" value={cfg.evento_hora} onChange={e => setCfg(c => ({ ...c, evento_hora: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Link de Google Maps — recepción</label>
            <input className="form-input" value={cfg.evento_maps_url} onChange={e => setCfg(c => ({ ...c, evento_maps_url: e.target.value }))} placeholder="https://maps.app.goo.gl/..." />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Imagen de la invitación (URL)</label>
          <input className="form-input" value={cfg.evento_imagen_url} onChange={e => setCfg(c => ({ ...c, evento_imagen_url: e.target.value }))} placeholder="https://i.ibb.co/..." />
        </div>

        <div className="form-field">
          <label className="form-label">Ciudad</label>
          <input className="form-input" value={cfg.evento_ciudad} onChange={e => setCfg(c => ({ ...c, evento_ciudad: e.target.value }))} placeholder="Ej: Cosamaloapan, Veracruz" />
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: cfg.misa_habilitada ? 18 : 0 }}>
          <input
            type="checkbox"
            id="misa"
            checked={cfg.misa_habilitada}
            onChange={e => setCfg(c => ({ ...c, misa_habilitada: e.target.checked }))}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
          <label htmlFor="misa" style={{ fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Incluir Celebración religiosa (misa)
          </label>
        </div>

        {cfg.misa_habilitada && (
          <div>
            <div className="form-field">
              <label className="form-label">Nombre del lugar (iglesia/templo)</label>
              <input className="form-input" value={cfg.misa_nombre_lugar} onChange={e => setCfg(c => ({ ...c, misa_nombre_lugar: e.target.value }))} placeholder="Ej: Parroquia San José" />
            </div>
            <div className="two-col">
              <div className="form-field">
                <label className="form-label">Hora de la misa</label>
                <input type="time" className="form-input" value={cfg.misa_hora} onChange={e => setCfg(c => ({ ...c, misa_hora: e.target.value }))} />
              </div>
              <div className="form-field">
                <label className="form-label">Link de Google Maps — misa</label>
                <input className="form-input" value={cfg.misa_maps_url} onChange={e => setCfg(c => ({ ...c, misa_maps_url: e.target.value }))} placeholder="https://maps.app.goo.gl/..." />
              </div>
            </div>
          </div>
        )}
      </div>

      <button className="btn-accent" onClick={handleSave} disabled={saving}>
        {saving ? 'Guardando...' : '✓ Guardar evento'}
      </button>
    </div>
  )
}
