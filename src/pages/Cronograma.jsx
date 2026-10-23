import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Share2, Crosshair, Trash2, X, Copy, ExternalLink, Info } from 'lucide-react';
import { update, projeto } from '../store';
import { calcular, dependeDe, progresso, limites } from '../schedule';
import { CATS } from '../data';
import { HOJE, addDias, diffDias, fmtCurta, fmtData, fromISO, MESES_C, uid, link } from '../util';
import { Modal, toast, copiar } from '../ui';

const ROW = 36, HEAD = 50;
const ESC = { dia: 30, semana: 12, mes: 4 };
const corCat = id => CATS.find(c => c.id === id)?.cor || '#888';

function aplicarDrag(acts, { id, mode, days }) {
  return acts.map(a => {
    if (a.id !== id) return a;
    if (mode === 'resize') return { ...a, dur: Math.max(1, a.dur + days) };
    if (a.preds.length) return { ...a, preds: a.preds.map(p => ({ ...p, gap: (Number(p.gap) || 0) + days })) };
    return { ...a, inicio: addDias(a.inicio, days) };
  });
}

function Atividade({ p, act, onClose }) {
  const novo = !act;
  const [f, setF] = useState(() => act ? structuredClone(act) : { id: uid(), cat: 'proj', nome: '', inicio: HOJE, dur: 5, pct: 0, resp: 'Giullia Pereira', desc: '', preds: [] });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const lista = novo ? [...p.cronograma, f] : p.cronograma.map(a => a.id === f.id ? f : a);
  const r = calcular(lista);
  const by = Object.fromEntries(p.cronograma.map(a => [a.id, a]));
  const opcoes = p.cronograma.filter(a => a.id !== f.id && !dependeDe(p.cronograma, a.id, f.id));
  const amarra = f.preds.length ? f.preds.map(x => ({ x, ini: addDias(r[x.id]?.fim || HOJE, 1 + (+x.gap || 0)) })).sort((a, b) => b.ini.localeCompare(a.ini))[0] : null;
  const situ = f.pct >= 100 ? 'c' : f.pct > 0 ? 'a' : 'n';

  const salvar = () => {
    if (!f.nome.trim()) return toast('Dê um nome pra atividade');
    const limpo = { ...f, nome: f.nome.trim(), dur: Math.max(1, +f.dur || 1), pct: Math.min(100, Math.max(0, +f.pct || 0)), preds: f.preds.filter(x => x.id) };
    const antes = calcular(p.cronograma);
    update(s => {
      const pr = projeto(s, p.id);
      if (novo) pr.cronograma.push(limpo); else pr.cronograma = pr.cronograma.map(a => a.id === limpo.id ? limpo : a);
      const depois = calcular(pr.cronograma);
      const mudou = pr.cronograma.filter(a => a.id !== limpo.id && antes[a.id] && antes[a.id].ini !== depois[a.id].ini).length;
      toast(mudou ? `Salvo. ${mudou} ${mudou === 1 ? 'atividade seguinte se ajustou' : 'atividades seguintes se ajustaram'}.` : 'Atividade salva');
    });
    onClose();
  };
  const excluir = () => {
    update(s => {
      const pr = projeto(s, p.id);
      pr.cronograma = pr.cronograma.filter(a => a.id !== f.id).map(a => ({ ...a, preds: a.preds.filter(x => x.id !== f.id) }));
    });
    toast('Atividade excluída'); onClose();
  };

  return (
    <Modal title={novo ? 'Nova atividade' : 'Editar atividade'} onClose={onClose}
      footer={<>{!novo && <button className="btn danger" onClick={excluir}><Trash2 />Excluir</button>}<span className="sp" /><button className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" onClick={salvar}>Salvar</button></>}>
      <div className="row2" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="f"><label>Nome da atividade</label><input value={f.nome} onChange={e => set('nome', e.target.value)} autoFocus={novo} /></div>
        <div className="f"><label>Situação</label>
          <select value={situ} onChange={e => set('pct', e.target.value === 'c' ? 100 : e.target.value === 'n' ? 0 : (f.pct > 0 && f.pct < 100 ? f.pct : 50))}>
            <option value="n">Não iniciada</option><option value="a">Em andamento</option><option value="c">Concluída</option>
          </select>
        </div>
      </div>
      <div className="f"><label>Categoria</label><select value={f.cat} onChange={e => set('cat', e.target.value)}>{CATS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
      <div className="row3">
        <div className="f"><label>Data de início</label><input type="date" value={r[f.id]?.ini || f.inicio} disabled={!!f.preds.length} onChange={e => e.target.value && set('inicio', e.target.value)} /></div>
        <div className="f"><label>Duração (dias)</label><input type="number" min="1" value={f.dur} disabled={f.marco} onChange={e => set('dur', e.target.value)} /></div>
        <div className="f"><label>Término</label><input value={fmtData(r[f.id]?.fim)} disabled /></div>
      </div>
      {amarra && <p className="hint" style={{ marginTop: -6, marginBottom: 14 }}>Começa em {fmtCurta(amarra.ini)}, {1 + (+amarra.x.gap || 0)} {1 + (+amarra.x.gap || 0) === 1 ? 'dia' : 'dias'} depois de “{by[amarra.x.id]?.nome}”. A data é calculada pelas predecessoras.</p>}
      <div className="row2">
        <div className="f"><label>% de conclusão</label><input type="number" min="0" max="100" step="5" value={f.pct} onChange={e => set('pct', e.target.value)} /></div>
        <div className="f"><label>Responsável</label><input value={f.resp} onChange={e => set('resp', e.target.value)} /></div>
      </div>
      <label className="check"><input type="checkbox" checked={!!f.marco} onChange={e => setF(x => ({ ...x, marco: e.target.checked, dur: e.target.checked ? 1 : x.dur }))} />É um marco (entrega ou aprovação de um dia)</label>

      <div className="sub">Predecessoras e intervalos</div>
      {f.preds.map((x, i) => (
        <div className="pred" key={i}>
          <div><label className="hint">Depois de</label>
            <select value={x.id} onChange={e => set('preds', f.preds.map((y, j) => j === i ? { ...y, id: e.target.value } : y))}>
              <option value="">Escolha…</option>
              {opcoes.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
          <div><label className="hint">Intervalo (dias)</label><input type="number" value={x.gap} onChange={e => set('preds', f.preds.map((y, j) => j === i ? { ...y, gap: e.target.value } : y))} /></div>
          <button className="icon-act" onClick={() => set('preds', f.preds.filter((_, j) => j !== i))} aria-label="Remover predecessora"><X /></button>
        </div>
      ))}
      <button className="btn sm" onClick={() => set('preds', [...f.preds, { id: '', gap: 0 }])} style={{ marginBottom: 16 }}><Plus />Adicionar predecessora</button>
      <div className="f"><label>Descrição (opcional)</label><textarea value={f.desc} onChange={e => set('desc', e.target.value)} placeholder="Ex.: concretagem marcada pra sexta, com bomba lança." /></div>
    </Modal>
  );
}

function Compartilhar({ p, onClose }) {
  return (
    <Modal title="Compartilhar com o cliente" onClose={onClose} center footer={<button className="btn" onClick={onClose}>Fechar</button>}>
      <p style={{ marginBottom: 14 }}>O cliente abre o portal pelo link e vê o cronograma, as parcelas e o diário da obra. Não precisa criar conta e não consegue editar nada.</p>
      <label className="check"><input type="checkbox" checked={p.portal} onChange={() => update(s => { projeto(s, p.id).portal = !p.portal; })} />Portal do cliente ativo</label>
      {p.portal ? (
        <div className="share-box"><code>{link(`portal/${p.id}`)}</code><button className="btn sm" onClick={() => copiar(link(`portal/${p.id}`))}><Copy />Copiar</button><a className="btn sm" href={`#/portal/${p.id}`}><ExternalLink />Abrir</a></div>
      ) : <p className="hint">Com o portal desativado, o link para de funcionar na hora.</p>}
    </Modal>
  );
}

export default function Cronograma({ p }) {
  const [esc, setEsc] = useState('semana');
  const [drag, setDrag] = useState(null);
  const [edit, setEdit] = useState(undefined);
  const [share, setShare] = useState(false);
  const scroller = useRef(null);
  const travaClique = useRef(false);
  const dayW = ESC[esc];

  const acts = useMemo(() => drag ? aplicarDrag(p.cronograma, drag) : p.cronograma, [p.cronograma, drag]);
  const r = calcular(acts);
  const lim = limites(acts);
  const start = addDias(lim.ini < HOJE ? lim.ini : HOJE, esc === 'mes' ? -10 : -4);
  const fimGrade = addDias(lim.fim > HOJE ? lim.fim : HOJE, esc === 'mes' ? 40 : 14);
  const total = diffDias(start, fimGrade) + 1;
  const W = total * dayW;
  const x = d => diffDias(start, d) * dayW;

  const rows = [];
  CATS.forEach(c => {
    const as = acts.filter(a => a.cat === c.id).sort((a, b) => r[a.id].ini.localeCompare(r[b.id].ini));
    if (!as.length) return;
    const ini = as.reduce((m, a) => r[a.id].ini < m ? r[a.id].ini : m, r[as[0].id].ini);
    const fim = as.reduce((m, a) => r[a.id].fim > m ? r[a.id].fim : m, r[as[0].id].fim);
    rows.push({ cat: c, ini, fim, dur: diffDias(ini, fim) + 1, pct: progresso(as) });
    as.forEach(a => rows.push({ a, cor: c.cor }));
  });
  const linhaDe = Object.fromEntries(rows.map((rw, i) => [rw.a?.id, i]).filter(e => e[0]));

  const meses = [];
  for (let d = start; d <= fimGrade;) {
    const dt = fromISO(d);
    const prox = addDias(d, new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate() - dt.getDate() + 1);
    const ate = prox > fimGrade ? addDias(fimGrade, 1) : prox;
    meses.push({ d, label: `${MESES_C[dt.getMonth()]} ${dt.getFullYear()}`, x: x(d), w: diffDias(d, ate) * dayW });
    d = prox;
  }
  const marcas = [];
  for (let i = 0; i < total; i++) {
    const d = addDias(start, i), dt = fromISO(d);
    if (esc === 'dia') marcas.push({ d, x: i * dayW, label: dt.getDate(), linha: true });
    else if (esc === 'semana' && dt.getDay() === 1) marcas.push({ d, x: i * dayW, label: fmtCurta(d), linha: true });
    else if (esc === 'mes' && dt.getDate() === 1) marcas.push({ d, x: i * dayW, label: '', linha: true });
  }

  const irHoje = (suave = true) => scroller.current?.scrollTo({ left: Math.max(0, x(HOJE) - (scroller.current?.clientWidth || 600) * 0.35), behavior: suave ? 'smooth' : 'auto' });
  useEffect(() => { irHoje(false); }, [esc]); // eslint-disable-line react-hooks/exhaustive-deps

  const segurar = (e, a, mode) => {
    if (e.pointerType === 'touch' || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const x0 = e.clientX;
    const dias = ev => Math.round((ev.clientX - x0) / dayW);
    const mover = ev => setDrag({ id: a.id, mode, days: dias(ev) });
    const soltar = ev => {
      removeEventListener('pointermove', mover); removeEventListener('pointerup', soltar);
      const d = dias(ev);
      setDrag(null);
      if (!d) return;
      travaClique.current = true; setTimeout(() => { travaClique.current = false; }, 50);
      const antes = calcular(p.cronograma);
      update(s => {
        const pr = projeto(s, p.id);
        pr.cronograma = aplicarDrag(pr.cronograma, { id: a.id, mode, days: d });
        const depois = calcular(pr.cronograma);
        const mudou = pr.cronograma.filter(o => o.id !== a.id && antes[o.id].ini !== depois[o.id].ini).length;
        toast(mudou ? `${mode === 'resize' ? 'Duração' : 'Data'} alterada. ${mudou} ${mudou === 1 ? 'atividade seguinte se ajustou' : 'atividades seguintes se ajustaram'}.` : `${mode === 'resize' ? 'Duração' : 'Data'} alterada`);
      });
    };
    addEventListener('pointermove', mover); addEventListener('pointerup', soltar);
  };
  const abrir = a => { if (!travaClique.current) setEdit(a); };

  const setas = [];
  rows.forEach((rw, i) => {
    if (!rw.a) return;
    rw.a.preds.forEach(pd => {
      if (linhaDe[pd.id] === undefined) return;
      const j = linhaDe[pd.id];
      const x1 = x(r[pd.id].fim) + dayW, y1 = j * ROW + ROW / 2;
      const x2 = x(r[rw.a.id].ini) + (rw.a.marco ? dayW / 2 - 9 : 0), y2 = i * ROW + ROW / 2;
      setas.push(`M${x1} ${y1} h6 V${y2} H${Math.max(x1 + 6, x2 - 2)}`);
    });
  });

  return (
    <>
      <div className="gbar">
        <div className="acts">
          <div className="seg">{[['dia', 'Dia'], ['semana', 'Semana'], ['mes', 'Mês']].map(([k, t]) => <button key={k} className={esc === k ? 'on' : ''} onClick={() => setEsc(k)}>{t}</button>)}</div>
          <button className="btn sm" onClick={() => irHoje()}><Crosshair />Hoje</button>
        </div>
        <div className="acts">
          <button className={`btn sm ${p.portal ? 'on' : ''}`} onClick={() => setShare(true)}><Share2 />{p.portal ? 'Compartilhado' : 'Compartilhar com cliente'}</button>
          <button className="btn sm pri" onClick={() => setEdit(null)}><Plus />Nova atividade</button>
        </div>
      </div>
      <div className="legend">
        {CATS.map(c => <span key={c.id}><i style={{ background: c.cor }} />{c.nome}</span>)}
        <span><i style={{ background: '#6B3FA0', transform: 'rotate(45deg)', borderRadius: 2 }} />Marco</span>
      </div>

      <div className="gantt">
        <div className="g-left">
          <div className="g-head"><span>Atividade</span><span>Início</span><span style={{ textAlign: 'right' }}>Dias</span></div>
          {rows.map((rw, i) => rw.cat ? (
            <div key={'c' + i} className="g-row cat"><span className="nm"><i style={{ background: rw.cat.cor }} />{rw.cat.nome}</span><span className="c2">{fmtCurta(rw.ini)}</span><span className="c3">{rw.dur}</span></div>
          ) : (
            <div key={rw.a.id} className="g-row" onClick={() => setEdit(rw.a)} title={rw.a.nome}>
              <span className="nm">{rw.a.marco && <span className="dia" />}{rw.a.nome}</span><span className="c2">{fmtCurta(r[rw.a.id].ini)}</span><span className="c3">{rw.a.dur}</span>
            </div>
          ))}
        </div>
        <div className="g-right" ref={scroller}>
          <div className="g-canvas" style={{ width: W, height: HEAD + rows.length * ROW }}>
            <div className="g-head" style={{ position: 'absolute', left: 0, top: 0, width: W }} />
            <div className="g-months">{meses.map(m => <div key={m.d} style={{ width: m.w }}>{m.label}</div>)}</div>
            <div className="g-days" style={{ width: W }}>
              {marcas.filter(m => m.label !== '').map(m => <span key={m.d} className={m.d === HOJE ? 'today' : ''} style={{ left: m.x, width: esc === 'dia' ? dayW : 60, textAlign: esc === 'dia' ? 'center' : 'left', paddingLeft: esc === 'dia' ? 0 : 4 }}>{m.label}</span>)}
            </div>
            <div className="g-body" style={{ position: 'absolute', top: HEAD, left: 0, width: W, height: rows.length * ROW }}>
              {marcas.filter(m => m.linha).map(m => <div key={m.d} className="g-line" style={{ left: m.x }} />)}
              {rows.map((rw, i) => <div key={i} className={`g-brow${rw.cat ? ' cat' : ''}`} style={{ top: i * ROW }} />)}
              <div className="g-today" style={{ left: x(HOJE) + dayW / 2 }} />
              <svg className="g-arrows" width={W} height={rows.length * ROW}>
                <defs><marker id="ah" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 z" fill="#B9ADA9" stroke="none" /></marker></defs>
                {setas.map((d, i) => <path key={i} d={d} markerEnd="url(#ah)" />)}
              </svg>
              {rows.map((rw, i) => {
                if (rw.cat) return <div key={'s' + i} className="bar sum" style={{ top: i * ROW + 13, left: x(rw.ini), width: rw.dur * dayW, background: rw.cat.cor }} />;
                const a = rw.a, w = Math.max(dayW, a.dur * dayW);
                const cabe = w > a.nome.length * 6.1 + 18;
                if (a.marco) return (
                  <div key={a.id}>
                    <div className="bar marco" style={{ top: i * ROW + 10, left: x(r[a.id].ini) + dayW / 2 - 8 }} onPointerDown={e => segurar(e, a, 'move')} onClick={() => abrir(a)} title={a.nome} />
                    <span className="blabel" style={{ top: i * ROW + 9, left: x(r[a.id].ini) + dayW / 2 + 14 }}>{a.nome}</span>
                  </div>
                );
                return (
                  <div key={a.id}>
                    <div className={`bar${drag?.id === a.id ? ' drag' : ''}`} style={{ top: i * ROW + 8, left: x(r[a.id].ini), width: w, background: rw.cor }}
                      onPointerDown={e => segurar(e, a, 'move')} onClick={() => abrir(a)} title={`${a.nome} · ${fmtCurta(r[a.id].ini)} a ${fmtCurta(r[a.id].fim)} · ${a.pct}%`}>
                      <i className="done" style={{ width: `${a.pct}%` }} />
                      {cabe && <span>{a.nome}</span>}
                      <i className="rs" onPointerDown={e => segurar(e, a, 'resize')} />
                    </div>
                    {!cabe && <span className="blabel" style={{ top: i * ROW + 9, left: x(r[a.id].ini) + w + 6 }}>{a.nome}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <p className="hint" style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}><Info size={14} />No computador: arraste a barra pra mudar a data e puxe a ponta direita pra mudar a duração. Tudo que depende dela se ajusta sozinho. No celular, toque na atividade pra editar.</p>

      {edit !== undefined && <Atividade p={p} act={edit} onClose={() => setEdit(undefined)} />}
      {share && <Compartilhar p={p} onClose={() => setShare(false)} />}
    </>
  );
}
