'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { ConfirmModal } from '@/components/ConfirmModal'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    mode: 'alert',
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    danger: false,
    resolve: null,
  })

  const alert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        mode: 'alert',
        title: options.title ?? '',
        message: String(message),
        confirmLabel: 'OK',
        danger: false,
        resolve: () => {
          setState((s) => ({ ...s, open: false, resolve: null }))
          resolve()
        },
      })
    })
  }, [])

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        mode: 'confirm',
        title: options.title ?? '',
        message: String(message),
        confirmLabel: options.confirmLabel ?? 'Confirm',
        danger: options.danger ?? false,
        resolve: (ok) => {
          setState((s) => ({ ...s, open: false, resolve: null }))
          resolve(!!ok)
        },
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state.resolve?.(true)
    setState((s) => ({ ...s, open: false, resolve: null }))
  }, [state.resolve])

  const handleCancel = useCallback(() => {
    setState((s) => {
      if (s.mode === 'confirm') s.resolve?.(false)
      else s.resolve?.()
      return { ...s, open: false, resolve: null }
    })
  }, [])

  return (
    <ConfirmContext.Provider value={{ alert, confirm }}>
      {children}
      <ConfirmModal
        open={state.open}
        mode={state.mode}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        danger={state.danger}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
