import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

/**
 * App-wide dialog system that replaces the native window.confirm / alert.
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title, message, tone: 'danger' })) { ... }
 *
 *   const toast = useToast();
 *   toast.error('Something went wrong');
 *
 * Purely presentational — no business logic lives here.
 */
const ConfirmContext = createContext(() => Promise.resolve(false));
const ToastContext = createContext({ show() {}, success() {}, error() {}, warning() {}, info() {} });

export const useConfirm = () => useContext(ConfirmContext);
export const useToast = () => useContext(ToastContext);

let toastSeq = 0;

const toastStyles = {
  success: { icon: CheckCircleIcon, ring: 'border-emerald-500/30', glow: 'text-emerald-400', bar: 'from-emerald-500 to-green-500' },
  error: { icon: XCircleIcon, ring: 'border-red-500/30', glow: 'text-red-400', bar: 'from-red-500 to-rose-500' },
  warning: { icon: ExclamationTriangleIcon, ring: 'border-amber-500/30', glow: 'text-amber-400', bar: 'from-amber-500 to-orange-500' },
  info: { icon: InformationCircleIcon, ring: 'border-blue-500/30', glow: 'text-blue-400', bar: 'from-blue-500 to-purple-500' },
};

export const DialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null); // { title, message, confirmText, cancelText, tone, resolve }
  const [toasts, setToasts] = useState([]);

  // ---- confirm ----
  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setDialog({
        title: opts.title || 'Are you sure?',
        message: opts.message || '',
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
        tone: opts.tone || 'danger',
        resolve,
      });
    });
  }, []);

  const settle = useCallback((result) => {
    setDialog((cur) => {
      if (cur) cur.resolve(result);
      return null;
    });
  }, []);

  // keyboard: Esc cancels, Enter confirms
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => {
      if (e.key === 'Escape') settle(false);
      if (e.key === 'Enter') settle(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, settle]);

  // ---- toasts ----
  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'info', duration = 4500) => {
    const id = ++toastSeq;
    setToasts((list) => [...list, { id, message, type }]);
    if (duration) setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  const toast = useMemo(() => ({
    show,
    success: (m, d) => show(m, 'success', d),
    error: (m, d) => show(m, 'error', d),
    warning: (m, d) => show(m, 'warning', d),
    info: (m, d) => show(m, 'info', d),
  }), [show]);

  const danger = dialog?.tone === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      <ToastContext.Provider value={toast}>
        {children}

        {/* Confirmation modal */}
        <AnimatePresence>
          {dialog && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => settle(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.96 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                className="relative w-full max-w-md bg-[#10162A] border border-white/10 rounded-2xl p-6 shadow-2xl"
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 h-11 w-11 rounded-xl flex items-center justify-center ${
                    danger ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-400'
                  }`}>
                    <ExclamationTriangleIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white">{dialog.title}</h3>
                    {dialog.message && (
                      <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{dialog.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
                  <button
                    onClick={() => settle(false)}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-medium transition-all duration-200"
                  >
                    {dialog.cancelText}
                  </button>
                  <button
                    onClick={() => settle(true)}
                    autoFocus
                    className={`w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r ${
                      danger ? 'from-red-500 to-rose-600 shadow-red-500/25' : 'from-blue-500 to-purple-600 shadow-blue-500/25'
                    }`}
                  >
                    {dialog.confirmText}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Toasts */}
        <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:top-4 z-[100] flex flex-col gap-3 pointer-events-none sm:w-96">
          <AnimatePresence>
            {toasts.map((t) => {
              const s = toastStyles[t.type] || toastStyles.info;
              const Icon = s.icon;
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.96 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                  className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 rounded-xl border ${s.ring} bg-[#10162A]/95 backdrop-blur-xl px-4 py-3 shadow-2xl`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${s.bar}`} />
                  <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${s.glow}`} />
                  <p className="flex-1 text-sm text-gray-200 leading-relaxed break-words">{t.message}</p>
                  <button
                    onClick={() => remove(t.id)}
                    aria-label="Dismiss"
                    className="shrink-0 text-gray-500 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ToastContext.Provider>
    </ConfirmContext.Provider>
  );
};

export default DialogProvider;
