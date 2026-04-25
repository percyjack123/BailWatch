import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AboutPage   from './pages/AboutPage'
import UploadPage  from './pages/UploadPage'
import ResultsPage from './pages/Resultspage'
import HistoryPage from './pages/HistoryPage'
import Navbar      from './components/Navbar'

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen" style={{ background: 'var(--ink)' }}>
        <div className="grid-bg" />
        <Navbar />
        <Routes>
          <Route path="/"        element={<AboutPage />} />
          <Route path="/audit"   element={<UploadPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}