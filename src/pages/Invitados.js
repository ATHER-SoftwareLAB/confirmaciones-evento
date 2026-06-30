import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

export default function Invitados() {
  const [invitados, setInvitados] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', telefono: '' })
  const fileRef = useRef()

  useEffect(() => { fetchInvitados() }, [])

  const fetchInvitados = async () => {
    const { data } = await supabase.from('invitados').select('*').order('nombre')
    setInvitados(data || [])
    setLoading(false)
  }

  const openAdd = () => { setForm({ nombre: '', telefono: '' }); setEditando(null); setShowModal(true) }
  const openEdit = (inv) => { setForm({ nombre: inv.nombre, telefono: inv.telefono }); setEditando(inv); setShowModal(true) }

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.telefono.trim()) return toast.error('Nombre y teléfono son requeridos')
    // Formato: asegurar que empieza con código de país
    let tel = form.telefono.replace(/\D/g, '')
    if (tel.startsWith('0')) tel = '52' + tel.slice(1)
    if (!tel.startsWith('52') && tel.length === 10) tel = '52' + tel

    if (editando) {
      const { error } = await supabase.from('invitados').update({ nombre: form.nombre.trim(), telefono: tel }).eq('id', editando.id)
      if (error) return toast.error('Error al actualizar')
      toast.success('Invitado actualizado')
    } else {
      const { error } = await supabase.from('invitados').insert({ nombre: form.nombre.trim(), telefono: tel })
      if (error) {
        if (error.code === '23505') return toast.error('Ese número ya existe')
        return toast.error('Error al guardar')
      }
      toast.success('Invitado agregado')
    }
    setShowModal(false)
    fetchInvitados()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este invitado?')) return
    await supabase.from('invitados').delete().eq('id', id)
    toast.success('Invitado eliminado')
    fetchInvitados()
  }

  const handleEstado = async (id, estado) => {
    await supabase.from('invitados').update({ estado }).eq('id', id)
    fetchInvitados()
  }

  // Importar Excel
  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws)
      let ok = 0, err = 0
      for (const row of rows) {
        const nombre = row['nombre'] || row['Nombre'] || row['NOMBRE']
        const telefono = String(row['telefono'] || row['Telefono'] || row['TELEFONO'] || row['número'] || '').replace(/\D/g, '')
        if (!nombre || !telefono) { err++; continue }
        let tel = telefono
        if (tel.length === 10) tel = '52' + tel
        const { error } = await supabase.from('invitados').upsert({ nombre: String(nombre).trim(), telefono: tel }, { onConflict: 'telefono' })
        if (error) err++; else ok++
      }
      toast.success(`Importados: ${ok} | Errores: ${err}`)
      fetchInvitados()
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  // Exportar Excel
  const handleExport = () => {
    const data = invitados.map(i => ({
      Nombre: i.nombre,
      Telefono: i.telefono,
      Estado: i.estado,
      'Invitación enviada': i.mensaje1_enviado ? 'Sí' : 'No',
      'Confirmación enviada': i.mensaje2_enviado ? 'Sí' : 'No',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Invitados')
    XLSX.writeFile(wb, 'invitados.xlsx')
    toast.success('Excel exportado')
  }

  // Descargar plantilla
  const handlePlantilla = () => {
    const data = [{ nombre: 'María García', telefono: '5512345678' }, { nombre: 'Juan López', telefono: '5598765432' }]
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Invitados')
    XLSX.writeFile(wb, 'plantilla_invitados.xlsx')
  }

  const filtered = invitados.filter(i =>
    i.nombre.toLowerCase().includes(search.toLowerCase()) ||
    i.telefono.includes(search)
  )

  const estadoBadge = (estado) => {
    if (estado === 'confirmado') return <span className="badge badge-green">✓ Confirmado</span>
    if (estado === 'no_asiste') return <span className="badge badge-red">✗ No asiste</span>
    return <span className="badge badge-yellow">· Pendiente</span>
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Invitados</div>
        <div className="page-sub">Gestiona tu lista de invitados</div>
      </div>

      <div className="actions-row">
        <input className="search-input" placeholder="Buscar por nombre o teléfono..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn-secondary" onClick={handlePlantilla}>↓ Plantilla</button>
        <button className="btn-secondary" onClick={() => fileRef.current.click()}>↑ Importar Excel</button>
        <input ref={fileRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={handleImport} />
        <button className="btn-secondary" onClick={handleExport}>↓ Exportar</button>
        <button className="btn-accent" onClick={openAdd}>+ Agregar</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty"><div className="loading-dot" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👥</div>
            <div className="empty-text">{search ? 'Sin resultados' : 'Agrega invitados o importa un Excel'}</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Cambiar estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 500 }}>{inv.nombre}</td>
                    <td style={{ color: 'var(--text2)', fontFamily: 'monospace', fontSize: 12 }}>{inv.telefono}</td>
                    <td>{estadoBadge(inv.estado)}</td>
                    <td>
                      <select
                        value={inv.estado}
                        onChange={e => handleEstado(inv.id, e.target.value)}
                        style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="no_asiste">No asiste</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-danger" onClick={() => openEdit(inv)} title="Editar">✎</button>
                        <button className="btn-danger" onClick={() => handleDelete(inv.id)} title="Eliminar">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editando ? 'Editar invitado' : 'Nuevo invitado'}</div>
            <div className="form-field">
              <label className="form-label">Nombre completo</label>
              <input className="form-input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="María García" />
            </div>
            <div className="form-field">
              <label className="form-label">Teléfono (10 dígitos o con código de país)</label>
              <input className="form-input" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="5512345678" />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-accent" onClick={handleSave}>{editando ? 'Guardar' : 'Agregar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
