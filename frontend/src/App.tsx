import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Evaluation from './pages/Evaluation'
import Dashboard from './pages/Dashboard'
import MenuManagement from './pages/MenuManagement'
import AIAnalysis from './pages/AIAnalysis'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          <Routes>
            <Route path="/"          element={<Home />} />
            <Route path="/avaliar"   element={<Evaluation />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cardapio"  element={<MenuManagement />} />
            <Route path="/analise"   element={<AIAnalysis />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
