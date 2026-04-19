import { useToastStore } from './useToast';

export function Toaster() {
  const { toasts, removeToast } = useToastStore();
  return (
    <div className="toaster">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)}>×</button>
        </div>
      ))}
    </div>
  );
}