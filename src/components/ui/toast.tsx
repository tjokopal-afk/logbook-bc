// =========================================
// PROFESSIONAL TOAST NOTIFICATION SYSTEM
// Material UI inspired with brand styling
// =========================================

import * as React from 'react'
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// =========================================
// TYPES
// =========================================

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

// =========================================
// CONTEXT
// =========================================

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

// =========================================
// PROVIDER
// =========================================

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const showToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    }

    setToasts((prev) => [...prev, newToast])

    if (newToast.duration) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// =========================================
// TOAST CONTAINER
// =========================================

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

// =========================================
// TOAST ITEM
// =========================================

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isExiting, setIsExiting] = React.useState(false)

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300)
  }

  const config = getToastConfig(toast.type)

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg shadow-lg border',
        'bg-white backdrop-blur-sm',
        'transition-all duration-300 ease-out',
        'animate-in slide-in-from-right-full',
        isExiting && 'animate-out slide-out-to-right-full',
        config.borderClass
      )}
      role="alert"
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 mt-0.5', config.iconClass)}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-gray-900 mb-0.5">
            {toast.title}
          </p>
        )}
        <p className="text-sm text-gray-700">
          {toast.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className={cn(
          'flex-shrink-0 rounded-md p-1 transition-colors',
          'hover:bg-gray-100 focus:outline-none focus:ring-2',
          'focus:ring-gray-300'
        )}
        aria-label="Tutup notifikasi"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  )
}

// =========================================
// CONFIGURATION
// =========================================

function getToastConfig(type: ToastType) {
  const configs = {
    success: {
      icon: <CheckCircle2 className="h-5 w-5" />,
      iconClass: 'text-brand-green',
      borderClass: 'border-brand-green/20 bg-brand-green/5',
    },
    error: {
      icon: <XCircle className="h-5 w-5" />,
      iconClass: 'text-red-600',
      borderClass: 'border-red-200 bg-red-50/50',
    },
    warning: {
      icon: <AlertCircle className="h-5 w-5" />,
      iconClass: 'text-amber-600',
      borderClass: 'border-amber-200 bg-amber-50/50',
    },
    info: {
      icon: <Info className="h-5 w-5" />,
      iconClass: 'text-blue-600',
      borderClass: 'border-blue-200 bg-blue-50/50',
    },
  }

  return configs[type]
}

// =========================================
// HELPER FUNCTIONS
// =========================================

export const toast = {
  success: (message: string, title?: string) => {
    // This will be replaced by useToast hook in components
    console.log('Success:', title, message)
  },
  error: (message: string, title?: string) => {
    console.log('Error:', title, message)
  },
  warning: (message: string, title?: string) => {
    console.log('Warning:', title, message)
  },
  info: (message: string, title?: string) => {
    console.log('Info:', title, message)
  },
}
