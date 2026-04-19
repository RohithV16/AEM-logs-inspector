import { useToastStore } from './useToast';

export function Toaster() {
  const { toasts, removeToast } = useToastStore();
  return (
    <div id="toastContainer" className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <div className="toast-content">
            {toast.message}
          </div>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>&times;</button>
        </div>
      ))}
    </div>
  );
}