// Datas sempre como 'AAAA-MM-DD' (sem fuso), dinheiro em reais
const pad = n => String(n).padStart(2, '0');

export const hoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const HOJE = toISO(hoje());

export const addDias = (s, n) => { const d = fromISO(s); d.setDate(d.getDate() + n); return toISO(d); };
export const diffDias = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000);
export const mesDe = s => s.slice(0, 7);
export const addMes = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return toISO(d).slice(0, 7); };

export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const MESES_C = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const fmtData = s => s ? fromISO(s).toLocaleDateString('pt-BR') : '—';
export const fmtCurta = s => { const d = fromISO(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
export const fmtLonga = s => { const d = fromISO(s); return `${d.getDate()} de ${MESES[d.getMonth()]}`; };
export const fmtMes = ym => { const [y, m] = ym.split('-').map(Number); return `${MESES[m - 1][0].toUpperCase() + MESES[m - 1].slice(1)} de ${y}`; };
export const brl = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const uid = () => Math.random().toString(36).slice(2, 9);
export const relDias = s => {
  const d = diffDias(HOJE, s);
  if (d === 0) return 'Hoje';
  if (d === 1) return 'Amanhã';
  if (d === -1) return 'Ontem';
  return d > 0 ? `Em ${d} dias` : `Há ${-d} dias`;
};
export const link = rota => `${location.origin}${location.pathname}#/${rota}`;
