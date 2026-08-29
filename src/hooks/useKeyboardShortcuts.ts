import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

interface KeyboardShortcutOptions {
  onOpenSearch?: () => void
}

export function useKeyboardShortcuts({ onOpenSearch }: KeyboardShortcutOptions = {}) {
  const navigate = useNavigate()
  const pendingSequenceRef = useRef<string | null>(null)
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in form inputs, textareas or contenteditable elements
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Cmd+K or Ctrl+K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenSearch?.()
        return
      }

      // / -> Quick Search
      if (e.key === '/') {
        e.preventDefault()
        onOpenSearch?.()
        return
      }

      // Two-key sequence handling (G then D, G then C, G then P)
      const key = e.key.toLowerCase()

      if (pendingSequenceRef.current === 'g') {
        if (key === 'd') {
          e.preventDefault()
          navigate('/dashboard')
        } else if (key === 'c') {
          e.preventDefault()
          navigate('/clients')
        } else if (key === 'p') {
          e.preventDefault()
          navigate('/projects')
        }
        pendingSequenceRef.current = null
        if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current)
        return
      }

      if (key === 'g') {
        pendingSequenceRef.current = 'g'
        if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current)
        sequenceTimerRef.current = setTimeout(() => {
          pendingSequenceRef.current = null
        }, 1000)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, onOpenSearch])
}
