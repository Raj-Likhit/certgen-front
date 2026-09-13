import { useState, useEffect } from 'react'
import AdminDesign from './components/admin/AdminDesign'
import ParticipantClaim from './components/participant/ParticipantClaim'
import ErrorBoundary from './components/common/ErrorBoundary'
import { Toaster } from 'sonner'

function App() {
  // Simple router for prototype
  const [view, setView] = useState('participant') // 'admin', 'participant'

  // Basic URL routing simulation
  const [path, setPath] = useState(window.location.pathname)
  const searchParams = new URLSearchParams(window.location.search)
  const queryId = searchParams.get('id')

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname)
    }
    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  useEffect(() => {
    if (path === '/admin') {
      setView('admin')
    } else {
      setView('participant')
    }
  }, [path])

  const navigate = (newView, newPath = '/') => {
    window.history.pushState({}, '', newPath)
    setPath(newPath)
    setView(newView)
  }

  return (
    <>
      <Toaster 
        richColors 
        position="top-right" 
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgba(10, 10, 10, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            color: '#fff',
            borderRadius: '12px'
          },
        }}
      />
      <ErrorBoundary>
        <div className="min-h-screen bg-bg text-primary font-sans selection:bg-accent/30 overflow-x-hidden">
        {/* Navbar */}
        <nav className="fixed top-0 w-full z-50 px-4 sm:px-6 md:px-12 py-3.5 sm:py-5 flex justify-between items-center bg-bg/60 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-2.5 sm:gap-4 cursor-pointer group" onClick={() => navigate('participant')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/logo.svg" alt="CertGen" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base md:text-lg tracking-tight leading-none text-white">CertGen</span>
              <span className="text-[9px] md:text-[10px] font-medium text-primary-dim mt-1">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-6 md:gap-8">
            <button 
                onClick={() => navigate('participant')} 
                className={`text-sm font-medium transition-all ${view === 'participant' ? 'text-white' : 'text-primary-dim hover:text-white'}`}
            >
                Portal
            </button>
            <button 
                onClick={() => navigate('admin', '/admin')} 
                className={`text-sm font-medium transition-all ${view === 'admin' ? 'text-white' : 'text-primary-dim hover:text-white'}`}
            >
                Admin
            </button>
          </div>
        </nav>

        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-bg">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] opacity-50" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[140px] opacity-30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent" />
        </div>

        {/* Main Content */}
        <main className="pt-24 pb-12 min-h-screen flex flex-col justify-center items-center relative">
          {view === 'admin' && (
            <section className="w-full flex-1 animate-in fade-in duration-700" aria-label="Admin Dashboard">
              <AdminDesign />
            </section>
          )}

          {view === 'participant' && (
            <section className="w-full flex-1 flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in-95 duration-700" aria-label="Certificate Claim">
              <ParticipantClaim />
            </section>
          )}
        </main>
      </div>
      </ErrorBoundary>
    </>
  )
}

export default App
