/**
 * Executive Floating Toast Notification System
 * Replaces blocking window.alert() and static banners with refined micro-animated toasts
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.initContainer();
  }

  initContainer() {
    if (typeof document === 'undefined') return;
    let el = document.getElementById('executiveToastContainer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'executiveToastContainer';
      el.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0';
      document.body.appendChild(el);
    }
    this.container = el;
  }

  show({ message, title = '', type = 'info', duration = 3500 }) {
    if (typeof document === 'undefined') return;
    this.initContainer();

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto transform transition-all duration-300 ease-out translate-y-2 opacity-0 flex items-start gap-3 p-3.5 rounded-2xl shadow-xl backdrop-blur-md border text-xs sm:text-sm font-medium ${this.getTypeStyles(type)}`;

    const icon = this.getIcon(type);

    toast.innerHTML = `
      <div class="shrink-0 mt-0.5">${icon}</div>
      <div class="flex-1 min-w-0">
        ${title ? `<div class="font-bold text-slate-900 tracking-tight mb-0.5 text-xs">${title}</div>` : ''}
        <div class="leading-relaxed break-words">${message}</div>
      </div>
      <button type="button" class="shrink-0 text-slate-400 hover:text-slate-700 transition font-bold text-xs p-1 rounded-lg hover:bg-black/5" aria-label="Close notification">
        ✕
      </button>
    `;

    const closeBtn = toast.querySelector('button');
    let timer = null;

    const dismiss = () => {
      if (timer) clearTimeout(timer);
      toast.classList.add('opacity-0', 'scale-95', 'translate-x-4');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    };

    closeBtn.addEventListener('click', dismiss);

    this.container.appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    if (duration > 0) {
      timer = setTimeout(dismiss, duration);
    }

    return { dismiss };
  }

  success(message, title = 'Success') {
    return this.show({ message, title, type: 'success' });
  }

  error(message, title = 'Attention') {
    return this.show({ message, title, type: 'error', duration: 5000 });
  }

  info(message, title = 'Information') {
    return this.show({ message, title, type: 'info' });
  }

  warning(message, title = 'Notice') {
    return this.show({ message, title, type: 'warning', duration: 4500 });
  }

  getTypeStyles(type) {
    switch (type) {
      case 'success':
        return 'bg-white/95 text-emerald-950 border-emerald-200/80 shadow-emerald-900/5';
      case 'error':
        return 'bg-white/95 text-rose-950 border-rose-200/80 shadow-rose-900/5';
      case 'warning':
        return 'bg-white/95 text-amber-950 border-amber-200/80 shadow-amber-900/5';
      case 'info':
      default:
        return 'bg-white/95 text-indigo-950 border-indigo-200/80 shadow-indigo-900/5';
    }
  }

  getIcon(type) {
    switch (type) {
      case 'success':
        return `<div class="w-6 h-6 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shadow-xs">✓</div>`;
      case 'error':
        return `<div class="w-6 h-6 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shadow-xs">✕</div>`;
      case 'warning':
        return `<div class="w-6 h-6 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs shadow-xs">⚠️</div>`;
      case 'info':
      default:
        return `<div class="w-6 h-6 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-xs">ℹ</div>`;
    }
  }
}

export const toast = new ToastManager();

// Backwards-compatible bridge for legacy callers
export function showFeedback(msg, isError = false) {
  if (isError) {
    toast.error(msg);
  } else {
    toast.success(msg);
  }
}
