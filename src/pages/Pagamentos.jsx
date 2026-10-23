import { useState } from 'react';
import { Plus, Wand2, Check, Undo2, Trash2, Pencil, Receipt } from 'lucide-react';
import { update, projeto, statusParcela, financeiro } from '../store';
import { gerarParcelas, FORMAS } from '../data';
import { HOJE, addDias, fmtData, fmtCurta, brl, uid, diffDias } from '../util';
import { Money, Modal, toast, zap, WhatsIcon } from '../ui';

function Gerar({ p, onClose }) {
  const restante = Math.max(0, p.valor - p.parcelas.reduce((s, x) => s + x.valor, 0));
  const [modo, setModo] = useState('parc');
  const [f, setF] = useState({ total: restante || p.valor || 10000, entrada: Math.round((restante || p.valor || 10000) * 0.3), entradaForma: 'PIX', entradaVenc: HOJE, n: 5, forma: 'PIX', intervalo: 30 });
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const cfg = modo === 'unico'
    ? { total: +f.total, entrada: +f.total, entradaForma: f.entradaForma, entradaVenc: f.entradaVenc, n: 0 }
    : { ...f, total: +f.total, entrada: +f.entrada, n: +f.n, intervalo: +f.intervalo, primeira: addDias(f.entradaVenc, +f.intervalo) };
  const prev = gerarParcelas(cfg);
  if (modo === 'unico' && prev[0]) prev[0].nome = 'Pagamento único';
  const ok = prev.length && +f.total > 0 && (modo === 'unico' || +f.entrada <= +f.total);
  return (
    <Modal title="Cadastrar pagamentos" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" disabled={!ok} onClick={() => {
        update(s => { projeto(s, p.id).parcelas.push(...prev); });
        toast(`${prev.length} ${prev.length === 1 ? 'pagamento cadastrado' : 'pagamentos cadastrados'}`); onClose();
      }}>Confirmar</button></>}>
      <div className="total-box"><small>Valor a cadastrar</small><b>{brl(+f.total)}</b></div>
      {restante === 0 && p.parcelas.length > 0 && <p className="hint" style={{ marginTop: -6, marginBottom: 14, color: 'var(--warn)' }}>Os {brl(p.valor)} do contrato já estão todos cadastrados. Use isso pra um aditivo ou serviço extra.</p>}
      <div className="f"><label>Valor total (R$)</label><input inputMode="decimal" value={f.total} onChange={set('total')} /></div>
      <div className="sub">Como o cliente vai pagar?</div>
      <div className="mode">
        <button className={modo === 'parc' ? 'on' : ''} onClick={() => setModo('parc')}><i /><div><b>Entrada + parcelas</b><span>Divide em uma entrada e parcelas com intervalo fixo.</span></div></button>
        <button className={modo === 'unico' ? 'on' : ''} onClick={() => setModo('unico')}><i /><div><b>Pagamento único</b><span>O cliente paga o valor total de uma vez.</span></div></button>
      </div>
      <div className="sub">{modo === 'unico' ? 'Pagamento' : 'Entrada'}</div>
      <div className="row3">
        {modo === 'parc' && <div className="f"><label>Valor da entrada</label><input inputMode="decimal" value={f.entrada} onChange={set('entrada')} /></div>}
        <div className="f"><label>Forma</label><select value={f.entradaForma} onChange={set('entradaForma')}>{FORMAS.map(x => <option key={x}>{x}</option>)}</select></div>
        <div className="f"><label>Vencimento</label><input type="date" value={f.entradaVenc} onChange={set('entradaVenc')} /></div>
      </div>
      {modo === 'parc' && <>
        <div className="sub">Parcelas</div>
        <div className="row3">
          <div className="f"><label>Número de parcelas</label><select value={f.n} onChange={set('n')}>{[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n}x de {brl(Math.max(0, (+f.total - +f.entrada) / n))}</option>)}</select></div>
          <div className="f"><label>Forma</label><select value={f.forma} onChange={set('forma')}>{FORMAS.map(x => <option key={x}>{x}</option>)}</select></div>
          <div className="f"><label>Intervalo</label><select value={f.intervalo} onChange={set('intervalo')}>{[7, 15, 30, 45, 60].map(n => <option key={n} value={n}>{n} dias</option>)}</select></div>
        </div>
      </>}
      <div className="sub">Vai ficar assim</div>
      <div className="prev-list">{prev.map(x => <div key={x.id}><span>{x.nome} · {fmtCurta(x.venc)}</span><b>{brl(x.valor)}</b></div>)}</div>
    </Modal>
  );
}

function Editar({ p, par, onClose }) {
  const novo = !par;
  const [f, setF] = useState(par ? { ...par } : { id: uid(), nome: '', venc: addDias(HOJE, 7), forma: 'PIX', valor: '', pago: false, pagoEm: null });
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={novo ? 'Novo pagamento' : 'Editar pagamento'} onClose={onClose} center
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" onClick={() => {
        if (!f.nome.trim() || !(+f.valor > 0)) return toast('Preencha a descrição e o valor');
        const x = { ...f, valor: +f.valor, nome: f.nome.trim() };
        update(s => { const pr = projeto(s, p.id); if (novo) pr.parcelas.push(x); else pr.parcelas = pr.parcelas.map(y => y.id === x.id ? x : y); });
        toast('Pagamento salvo'); onClose();
      }}>Salvar</button></>}>
      <div className="f"><label>Descrição</label><input value={f.nome} onChange={set('nome')} placeholder="Ex.: Ajuste final — revisões pós-entrega" /></div>
      <div className="row3">
        <div className="f"><label>Valor (R$)</label><input inputMode="decimal" value={f.valor} onChange={set('valor')} /></div>
        <div className="f"><label>Vencimento</label><input type="date" value={f.venc} onChange={set('venc')} /></div>
        <div className="f"><label>Forma</label><select value={f.forma} onChange={set('forma')}>{FORMAS.map(x => <option key={x}>{x}</option>)}</select></div>
      </div>
    </Modal>
  );
}

export default function Pagamentos({ p }) {
  const [gerar, setGerar] = useState(false);
  const [edit, setEdit] = useState(undefined);
  const f = financeiro(p);
  const lista = p.parcelas.slice().sort((a, b) => a.venc.localeCompare(b.venc));
  const pagar = (x, v) => update(s => { const y = projeto(s, p.id).parcelas.find(z => z.id === x.id); y.pago = v; y.pagoEm = v ? HOJE : null; });

  return (
    <>
      <div className="kpis">
        <div className="kpi k-pet"><small>Total do projeto</small><b><Money v={f.total} /></b><span>{p.parcelas.length} pagamentos</span></div>
        <div className="kpi k-ok"><small>Recebido</small><b><Money v={f.pago} /></b><span>{f.pct}% do total</span></div>
        <div className="kpi k-warn"><small>A receber</small><b><Money v={f.falta - f.atrasado} /></b><span>no prazo</span></div>
        <div className="kpi k-bad"><small>Em atraso</small><b><Money v={f.atrasado} /></b><span>{f.atrasado ? 'precisa cobrar' : 'nada atrasado'}</span></div>
      </div>
      <div className="card">
        <div className="card-h">
          <h3><span className="hi"><Receipt /></span>Pagamentos</h3>
          <div className="acts"><button className="btn sm" onClick={() => setEdit(null)}><Plus />Pagamento avulso</button><button className="btn sm pri" onClick={() => setGerar(true)}><Wand2 />Gerar parcelas</button></div>
        </div>
        {lista.length ? (
          <div className="tbl-wrap">
            <table className="t cards">
              <thead><tr><th>Vencimento</th><th>Pagamento</th><th>Forma</th><th>Situação</th><th>Pago em</th><th className="r">Valor</th><th /></tr></thead>
              <tbody>
                {lista.map(x => {
                  const st = statusParcela(x);
                  return (
                    <tr key={x.id} className={st.key === 'atrasado' ? 'late' : ''}>
                      <td data-c="meta">{fmtData(x.venc)}{st.key === 'atrasado' && <small style={{ color: 'var(--bad)' }}>há {diffDias(x.venc, HOJE)} dias</small>}</td>
                      <td data-c="main"><b style={{ fontWeight: 500 }}>{x.nome}</b></td>
                      <td data-c="hide">{x.forma}</td>
                      <td data-c="st"><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td data-c="hide">{x.pagoEm ? fmtData(x.pagoEm) : '—'}</td>
                      <td data-c="val" className="r"><b><Money v={x.valor} /></b></td>
                      <td data-c="act" className="r" style={{ whiteSpace: 'nowrap' }}>
                        {x.pago
                          ? <button className="btn sm" onClick={() => pagar(x, false)} title="Desfazer"><Undo2 />Desfazer</button>
                          : <button className="btn sm" style={{ color: 'var(--ok)' }} onClick={() => { pagar(x, true); toast('Marcado como pago. O cliente já vê no portal.'); }}><Check />Marcar pago</button>}
                        {st.key === 'atrasado' && <a className="icon-act" target="_blank" rel="noopener" title="Lembrar no WhatsApp" href={zap(`Oi, ${p.cliente.split(' ')[0]}! Tudo bem? Passando pra lembrar da ${x.nome.split(' — ')[0].toLowerCase()} do ${p.nome} (${brl(x.valor)}), que venceu em ${fmtCurta(x.venc)}. Qualquer coisa me chama!`)}><WhatsIcon width={16} height={16} /></a>}
                        <button className="icon-act" onClick={() => setEdit(x)} aria-label="Editar"><Pencil /></button>
                        <button className="icon-act" onClick={() => { update(s => { const pr = projeto(s, p.id); pr.parcelas = pr.parcelas.filter(y => y.id !== x.id); }); toast('Pagamento excluído'); }} aria-label="Excluir"><Trash2 /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="empty"><Receipt />Nenhum pagamento cadastrado ainda.<br /><button className="btn pri" style={{ marginTop: 14 }} onClick={() => setGerar(true)}><Wand2 />Gerar parcelas</button></div>}
        {lista.length > 0 && (
          <div className="totals">
            <div>Total<b><Money v={f.total} /></b></div>
            <div>Pago<b style={{ color: 'var(--ok)' }}><Money v={f.pago} /></b></div>
            <div>A receber<b><Money v={f.falta} /></b></div>
            <div style={{ minWidth: 160 }}>{f.pct}% pago<div className="progress" style={{ marginTop: 6 }}><i style={{ width: f.pct + '%' }} /></div></div>
          </div>
        )}
      </div>
      {gerar && <Gerar p={p} onClose={() => setGerar(false)} />}
      {edit !== undefined && <Editar p={p} par={edit} onClose={() => setEdit(undefined)} />}
    </>
  );
}
