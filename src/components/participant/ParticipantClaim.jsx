import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    IconPointer as Search, 
    IconLayout as Loader2, 
    IconCheck as CheckCircle2, 
    IconAlert as AlertCircle,
    IconSave as Download,
    IconUser,
    IconChevronDown
} from '../common/Icons'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'

const CLAIM_STATES = {
    IDLE: 'IDLE',
    SEARCHING: 'SEARCHING',
    GENERATING: 'GENERATING',
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR'
}

export default function ParticipantClaim() {
    const [name, setName] = useState('')
    const [availableNames, setAvailableNames] = useState([])
    const [status, setStatus] = useState(CLAIM_STATES.IDLE)
    const [error, setError] = useState(null)
    const [cert, setCert] = useState(null)

    // Custom dropdown states
    const [isOpen, setIsOpen] = useState(false)
    const [highlightIndex, setHighlightIndex] = useState(-1)
    const dropdownRef = useRef(null)
    const inputRef = useRef(null)

    const prefersReducedMotion = typeof window !== 'undefined' 
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
        : false

    useEffect(() => {
        api.get('/participants/names')
            .then(res => {
                if (Array.isArray(res.data)) {
                    setAvailableNames(res.data.filter(n => typeof n === 'string' && n.trim().length > 0))
                } else {
                    setAvailableNames([])
                }
            })
            .catch(err => {
                console.error("Failed to load names", err)
                setAvailableNames([])
            })
    }, [])

    // Click outside listener
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
                setHighlightIndex(-1)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const safeNames = Array.isArray(availableNames) ? availableNames : []
    const cleanInput = (name || '').trim().toLowerCase()
    const filteredNames = cleanInput
        ? safeNames.filter(n => typeof n === 'string' && n.toLowerCase().includes(cleanInput)).slice(0, 8)
        : safeNames.slice(0, 8)

    const handleSelectName = (selectedName) => {
        setName(selectedName)
        setIsOpen(false)
        setHighlightIndex(-1)
        if (inputRef.current) inputRef.current.focus()
    }

    const handleKeyDown = (e) => {
        if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            setIsOpen(true)
            return
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightIndex(prev => (prev < filteredNames.length - 1 ? prev + 1 : 0))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightIndex(prev => (prev > 0 ? prev - 1 : filteredNames.length - 1))
        } else if (e.key === 'Enter') {
            if (isOpen && highlightIndex >= 0 && filteredNames[highlightIndex]) {
                e.preventDefault()
                handleSelectName(filteredNames[highlightIndex])
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false)
            setHighlightIndex(-1)
        }
    }

    const highlightMatch = (text, query) => {
        if (!query) return text
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
        const parts = text.split(regex)
        return parts.map((part, i) => 
            regex.test(part) ? (
                <span key={i} className="text-white font-bold">
                    {part}
                </span>
            ) : part
        )
    }

    const loading = status === CLAIM_STATES.SEARCHING || status === CLAIM_STATES.GENERATING

    const handleClaim = async (e) => {
        e.preventDefault()
        if (!name) return

        setIsOpen(false)
        setStatus(CLAIM_STATES.SEARCHING)
        setError(null)
        setCert(null)

        try {
            const cleanName = name.trim()
            
            const res = await api.post('/claim', {
                name: cleanName,
                frontend_url: window.location.origin
            })

            setStatus(CLAIM_STATES.GENERATING)
            
            // Artificial delay to prevent UI flickering on very fast responses
            await new Promise(r => setTimeout(r, 1200))

            setCert(res.data)
            setStatus(CLAIM_STATES.SUCCESS)
            if (!prefersReducedMotion) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#10b981', '#34d399', '#ffffff']
                })
            }
        } catch (err) {
            setStatus(CLAIM_STATES.ERROR)
            console.error("Claim Error Details:", err)
            if (err.response?.status === 404) {
                toast.error("Name not found", {
                    description: "Our registry doesn't have a record matching this name."
                })
            } else {
                const msg = err.response?.data?.detail || err.message || "We couldn't process your request."
                toast.error("Process Failed", {
                    description: msg
                })
            }
        }
    }

    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error("Download failed, falling back to open", e);
            window.open(url, '_blank');
        }
    }

    return (
        <div className="relative w-full max-w-xl mx-auto flex items-center justify-center px-2 py-4 sm:p-4">
            <motion.div
                initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-lg mx-auto"
            >
                <div className="brutalist-card bg-surface/50 backdrop-blur-3xl border border-white/10 shadow-2xl w-full rounded-2xl sm:rounded-3xl relative">
                    
                    {/* Header */}
                    <div className="p-6 sm:p-8 md:p-10 text-center relative border-b border-white/5">
                        <div className="flex justify-center mb-5 sm:mb-6">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xl transform -rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden">
                                <img src="/logo.svg" alt="CertGen Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                            </div>
                        </div>

                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                            Claim Certificate
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-primary-dim max-w-xs sm:max-w-sm mx-auto leading-relaxed">
                            Enter your registered full name to retrieve your institutional digital certificate.
                        </p>
                    </div>

                    <div className="w-full">
                        {!cert ? (
                            <div className="p-6 sm:p-8 md:p-10 space-y-5 sm:space-y-6">
                                <form onSubmit={handleClaim} className="space-y-5 sm:space-y-6">
                                    <div className="space-y-2 relative" ref={dropdownRef}>
                                        <label htmlFor="participant-name-input" className="text-[11px] font-bold text-primary-dim uppercase tracking-wider ml-1 flex items-center justify-between">
                                            <span>Participant Name</span>
                                            {Array.isArray(availableNames) && availableNames.length > 0 && (
                                                <span className="text-[10px] text-zinc-500 font-normal">
                                                    {availableNames.length} registered
                                                </span>
                                            )}
                                        </label>

                                        {/* Input Box with Touch-Optimized Actions */}
                                        <div className="relative flex items-center">
                                            <input
                                                id="participant-name-input"
                                                ref={inputRef}
                                                type="text"
                                                role="combobox"
                                                aria-autocomplete="list"
                                                aria-expanded={isOpen}
                                                aria-controls="name-suggestions-dropdown"
                                                placeholder="e.g. Alex"
                                                value={name}
                                                autoComplete="off"
                                                autoCorrect="off"
                                                spellCheck="false"
                                                onChange={(e) => {
                                                    setName(e.target.value)
                                                    setIsOpen(true)
                                                    setHighlightIndex(-1)
                                                }}
                                                onFocus={() => setIsOpen(true)}
                                                onKeyDown={handleKeyDown}
                                                className="w-full brutalist-input h-14 pl-4 pr-20 text-white text-base sm:text-lg font-medium bg-white/[0.04] border border-white/10 rounded-2xl focus:border-accent/60 focus:bg-white/[0.07] transition-all outline-none"
                                            />

                                            <div className="absolute right-2 flex items-center gap-1">
                                                {/* Clear Button (Mobile friendly) */}
                                                {name && (
                                                    <button
                                                        type="button"
                                                        tabIndex={-1}
                                                        onClick={() => {
                                                            setName('')
                                                            setHighlightIndex(-1)
                                                            if (inputRef.current) inputRef.current.focus()
                                                        }}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
                                                        aria-label="Clear input"
                                                    >
                                                        <span className="text-xs font-mono font-bold leading-none">✕</span>
                                                    </button>
                                                )}

                                                {/* Dropdown toggle / Chevron button */}
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onClick={() => setIsOpen(prev => !prev)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
                                                    aria-label="Toggle names dropdown"
                                                >
                                                    <motion.div
                                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                                        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                                                    >
                                                        <IconChevronDown className="w-4 h-4" />
                                                    </motion.div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Custom Floating Glassmorphic Dropdown */}
                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    id="name-suggestions-dropdown"
                                                    role="listbox"
                                                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                                    transition={{ duration: prefersReducedMotion ? 0 : 0.15, ease: 'easeOut' }}
                                                    className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#121216] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)] rounded-2xl p-2 max-h-56 sm:max-h-64 overflow-y-auto overscroll-contain touch-pan-y divide-y divide-white/[0.06]"
                                                >
                                                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-zinc-500 flex justify-between items-center">
                                                        <span>{cleanInput ? 'Matching Names' : 'Registered Participants'}</span>
                                                        <span className="text-[9px] text-zinc-600 hidden sm:inline">Click or use ↑↓</span>
                                                    </div>

                                                    {Array.isArray(filteredNames) && filteredNames.length > 0 ? (
                                                        <div className="space-y-1 pt-1">
                                                            {filteredNames.map((n, idx) => {
                                                                const isHighlighted = idx === highlightIndex
                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        role="option"
                                                                        aria-selected={isHighlighted}
                                                                        onMouseEnter={() => setHighlightIndex(idx)}
                                                                        onMouseDown={(e) => {
                                                                            e.preventDefault()
                                                                            handleSelectName(n)
                                                                        }}
                                                                        onTouchStart={(e) => {
                                                                            e.stopPropagation()
                                                                            handleSelectName(n)
                                                                        }}
                                                                        className={`flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl cursor-pointer touch-manipulation transition-all ${
                                                                            isHighlighted 
                                                                                ? 'bg-accent/25 text-white border border-accent/40 shadow-lg' 
                                                                                : 'hover:bg-white/[0.06] active:bg-white/[0.12] text-zinc-300'
                                                                        }`}
                                                                    >
                                                                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 text-xs transition-colors ${
                                                                            isHighlighted ? 'bg-accent text-white' : 'bg-white/5 text-zinc-400'
                                                                        }`}>
                                                                            <IconUser className="w-3.5 h-3.5" />
                                                                        </div>
                                                                        <span className="text-sm sm:text-base font-medium truncate flex-1 leading-snug">
                                                                            {highlightMatch(n, cleanInput)}
                                                                        </span>
                                                                        {isHighlighted && (
                                                                            <span className="text-[10px] text-accent font-bold uppercase tracking-wider shrink-0">
                                                                                Select
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 text-center">
                                                            <p className="text-xs text-zinc-400">No participant matching &ldquo;{name}&rdquo;</p>
                                                            <p className="text-[10px] text-zinc-500 mt-1">Please verify spelling or check with event admin.</p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !name}
                                        className="w-full h-14 rounded-2xl bg-white text-black font-bold text-base sm:text-lg tracking-tight hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3"
                                    >
                                        {status === CLAIM_STATES.SEARCHING ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Searching Record...</>
                                        ) : status === CLAIM_STATES.GENERATING ? (
                                            <><Loader2 className="w-5 h-5 animate-spin text-accent" /> Rendering Certificate...</>
                                        ) : (
                                            <>Get My Certificate</>
                                        )}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-6 sm:p-8 md:p-10 space-y-5 sm:space-y-6"
                            >
                                <div className="flex items-center gap-3.5 sm:gap-4 border border-white/5 bg-white/[0.03] p-4 sm:p-5 rounded-2xl">
                                    <div className="w-12 h-12 rounded-xl bg-success/20 border border-success/30 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-6 h-6 text-success" />
                                    </div>
                                    <div className="min-w-0 text-left flex-1">
                                        <h3 className="text-sm font-semibold text-white">Certificate Ready</h3>
                                        <p className="text-xs sm:text-sm font-medium text-primary-dim mt-0.5 truncate">{cert.name}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3.5 sm:gap-4">
                                    <button
                                        onClick={() => handleDownload(cert.cert_url, `Certificate.pdf`)}
                                        className="h-14 rounded-2xl bg-white text-black font-bold text-base sm:text-lg tracking-tight shadow-xl shadow-white/5 hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                    >
                                        <Download className="w-5 h-5" /> Download PDF Certificate
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCert(null)
                                            setName('')
                                            setStatus(CLAIM_STATES.IDLE)
                                        }}
                                        className="text-xs text-primary-dim hover:text-white transition-colors text-center py-2"
                                    >
                                        Claim another certificate
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
