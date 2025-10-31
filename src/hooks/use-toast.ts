// Simple toast hook implementation
import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...options, id };
    
    // For now, just use console.log and alert
    // You can replace this with a proper toast UI component later
    if (options.variant === 'destructive') {
      console.error(`❌ ${options.title}`, options.description);
    } else {
      console.log(`✅ ${options.title}`, options.description);
    }
    
    setToasts((prev) => [...prev, newToast]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return { toast, toasts };
}
