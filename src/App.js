import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Invitados from './pages/Invitados'
import Mensajes from './pages/Mensajes'
import Envios from './pages/Envios'
import EventoConfig from './pages/EventoConfig'
import RSVP from './pages/RSVP'
import Nav from './components/Nav'
import { Toaster } from 'react-hot-toast'
import './index.css'

function Panel() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="loading-screen"><div className="loading-dot" /></div>
  )
  if (!session) return <Login />

  return (
    <div className="app">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a2e', color: '#e8e0d4', border: '1px solid #2d2d4e' } }} />
      <Nav page={page} setPage={setPage} session={session} />
      <main className="main-content">
        {page === 'dashboard' && <Dashboard />}
        {page === 'invitados' && <Invitados />}
        {page === 'mensajes' && <Mensajes />}
        {page === 'envios' && <Envios />}
        {page === 'evento' && <EventoConfig />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/rsvp/:id" element={<RSVP />} />
        <Route path="*" element={<Panel />} />
      </Routes>
    </BrowserRouter>
  )
}
