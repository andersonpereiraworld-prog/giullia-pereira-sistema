// Cronograma com dependências: quem tem predecessora começa depois do fim dela (+ intervalo).
// Mudou uma data ou duração, tudo que vem depois na cadeia se ajusta, preservando a duração.
import { addDias, diffDias, HOJE } from './util';

export function calcular(acts) {
  const by = Object.fromEntries(acts.map(a => [a.id, a]));
  const memo = {}, visitando = new Set();
  const ir = id => {
    if (memo[id]) return memo[id];
    const a = by[id];
    let ini = a.inicio;
    if (!visitando.has(id) && a.preds?.length) {
      visitando.add(id);
      let maior = null;
      for (const p of a.preds) {
        if (!by[p.id]) continue;
        const c = addDias(ir(p.id).fim, 1 + (Number(p.gap) || 0));
        if (!maior || c > maior) maior = c;
      }
      visitando.delete(id);
      if (maior) ini = maior;
    }
    return (memo[id] = { ini, fim: addDias(ini, Math.max(1, a.dur) - 1) });
  };
  acts.forEach(a => ir(a.id));
  return memo;
}

// não deixa criar ciclo: b depende (direta ou indiretamente) de a?
export function dependeDe(acts, b, a) {
  const by = Object.fromEntries(acts.map(x => [x.id, x]));
  const pilha = [b], vistos = new Set();
  while (pilha.length) {
    const id = pilha.pop();
    if (id === a) return true;
    if (vistos.has(id)) continue;
    vistos.add(id);
    (by[id]?.preds || []).forEach(p => pilha.push(p.id));
  }
  return false;
}

export function progresso(acts) {
  const tot = acts.reduce((s, a) => s + a.dur, 0);
  return tot ? Math.round(acts.reduce((s, a) => s + a.dur * a.pct, 0) / tot) : 0;
}

export function limites(acts) {
  const r = calcular(acts);
  const v = Object.values(r);
  if (!v.length) return { ini: HOJE, fim: HOJE };
  return { ini: v.reduce((m, x) => x.ini < m ? x.ini : m, v[0].ini), fim: v.reduce((m, x) => x.fim > m ? x.fim : m, v[0].fim) };
}

// % sugerido pela data de hoje (usado nos dados de demonstração)
export function pctPelaData(ini, fim, dur) {
  if (fim < HOJE) return 100;
  if (ini > HOJE) return 0;
  return Math.min(95, Math.round(((diffDias(ini, HOJE) + 1) / dur) * 20) * 5);
}
