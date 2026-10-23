import { useEffect, useState } from 'react';
import { X, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { brl } from './util';

export const img = (p, sm = true) => `./img/${p}${sm ? '-sm' : ''}.webp`;

export function Money({ v, className = '' }) {
  return <span className={`money ${className}`}>{brl(v)}</span>;
}

export function Modal({ title, onClose, children, footer, center }) {
  useEffect(() => {
    const f = e => e.key === 'Escape' && onClose();
    addEventListener('keydown', f);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { removeEventListener('keydown', f); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className={`ov${center ? ' center' : ''}`} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={center ? 'dialog' : 'drawer'} role="dialog" aria-modal="true" aria-label={title}>
        <div className="m-h"><h3>{title}</h3><button className="icon-act" onClick={onClose} aria-label="Fechar"><X /></button></div>
        <div className="m-b">{children}</div>
        {footer && <div className="m-f">{footer}</div>}
      </div>
    </div>
  );
}

export function Ring({ pct, size = 58, stroke = 6, color = 'var(--mag)', label }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${pct}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFE9E6" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset .8s' }} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.24} fontWeight="700" fill="var(--ink)">{label ?? `${pct}%`}</text>
    </svg>
  );
}

export function Kpi({ tone = 'mag', icon: Icon, label, value, sub }) {
  return (
    <div className={`kpi k-${tone}`}>
      <small>{label}</small>
      <b>{value}</b>
      {sub && <span>{sub}</span>}
      {Icon && <div className="kico"><Icon /></div>}
    </div>
  );
}

export function toast(msg) { window.dispatchEvent(new CustomEvent('giu-toast', { detail: msg })); }
export function Toaster() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    let t;
    const f = e => { setMsg(e.detail); clearTimeout(t); t = setTimeout(() => setMsg(null), 2600); };
    addEventListener('giu-toast', f);
    return () => removeEventListener('giu-toast', f);
  }, []);
  return msg ? <div className="toast" role="status"><CheckCircle2 />{msg}</div> : null;
}

export async function copiar(texto, msg = 'Link copiado') {
  try { await navigator.clipboard.writeText(texto); } catch { /* sem permissão: segue */ }
  toast(msg);
}

export function Lightbox({ fotos, inicio, onClose }) {
  const [i, setI] = useState(inicio);
  useEffect(() => {
    const f = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI(x => (x + 1) % fotos.length);
      if (e.key === 'ArrowLeft') setI(x => (x - 1 + fotos.length) % fotos.length);
    };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  }, [fotos.length, onClose]);
  return (
    <div className="lbx" onClick={e => e.target === e.currentTarget && onClose()}>
      <img src={img(fotos[i], false)} alt="" />
      <button className="x" onClick={onClose} aria-label="Fechar"><X /></button>
      <button className="p" onClick={() => setI((i - 1 + fotos.length) % fotos.length)} aria-label="Anterior"><ChevronLeft /></button>
      <button className="n" onClick={() => setI((i + 1) % fotos.length)} aria-label="Próxima"><ChevronRight /></button>
    </div>
  );
}

export function WhatsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.7 11.7 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z" /></svg>
  );
}

// WhatsApp sem número fixo: abre pra escolher o contato (os dados da prévia são fictícios)
export const zap = texto => `https://wa.me/?text=${encodeURIComponent(texto)}`;
