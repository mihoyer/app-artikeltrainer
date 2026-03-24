import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { initUser } from './api'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Exercise from './pages/Exercise'
import { Impressum, Datenschutz } from './pages/Legal'

export default function App() {
  useEffect(() => {
    initUser().catch(console.error)
  }, [])

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />

        {/*
          Dreispaltiges Layout:
          - Links und rechts: sticky Skyscraper-Werbung (nur auf lg+)
          - Mitte: eigentlicher Seiteninhalt (max-w-2xl)
        */}
        <div className="flex flex-1 justify-center w-full max-w-screen-xl mx-auto px-2">

          {/* Linke Seitenleiste – nur Desktop */}
          <Sidebar slot="2233445566" side="left" />

          {/* Haupt-Content */}
          <div className="flex-1 min-w-0">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ueben" element={<Exercise />} />
              <Route path="/ueben/:category" element={<Exercise />} />
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/datenschutz" element={<Datenschutz />} />
            </Routes>
          </div>

          {/* Rechte Seitenleiste – nur Desktop */}
          <Sidebar slot="6655443322" side="right" />

        </div>

        <Footer />
      </div>
    </BrowserRouter>
  )
}
