// Estado da prévia: em memória + localStorage (cada pessoa que abre o link tem a sua cópia)
import { useSyncExternalStore } from 'react';
import { seed } from './data';
import { HOJE } from './util';

const KEY = 'giu-preview-v1';
const subs = new Set();
let state = carregar();

function carregar() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 1) return s;
  } catch { /* sem storage: segue com os dados de demo */ }
  return seed();
}
function salvar() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignora */ } }

export function update(fn) {
  const rascunho = structuredClone(state);
  fn(rascunho);
  state = rascunho;
  salvar();
  subs.forEach(f => f());
}
export function resetar() { state = seed(); salvar(); subs.forEach(f => f()); }
export const getState = () => state;

export function useStore() {
  return useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f); }, () => state);
}

// ---------- derivados ----------
export function statusParcela(p) {
  if (p.pago) return { key: 'pago', label: 'Pago', cls: 'b-ok' };
  if (p.venc < HOJE) return { key: 'atrasado', label: 'Em atraso', cls: 'b-bad' };
  return { key: 'pendente', label: 'Pendente', cls: 'b-warn' };
}

export function financeiro(p) {
  const total = p.parcelas.reduce((s, x) => s + x.valor, 0);
  const pago = p.parcelas.filter(x => x.pago).reduce((s, x) => s + x.valor, 0);
  const atrasado = p.parcelas.filter(x => !x.pago && x.venc < HOJE).reduce((s, x) => s + x.valor, 0);
  return { total, pago, atrasado, falta: total - pago, pct: total ? Math.round((pago / total) * 100) : 0, pagas: p.parcelas.filter(x => x.pago).length };
}

export const projeto = (s, id) => s.projetos.find(p => p.id === id);
