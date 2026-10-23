import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Check, Undo2, Pencil, Trash2, Wallet, Search } from 'lucide-react';
import { useStore, update, projeto } from '../store';
import { FORMAS, CAT_SAIDA, CAT_ENTRADA } from '../data';
import { HOJE, addDias, addMes, mesDe, fmtMes, fmtData, uid } from '../util';
import { Money, Modal, toast } from '../ui';

function linhas(s) {
  const out = s.lancamentos.map(l => ({
    key: l.id, origem: 'lanc', ref: l, data: l.data, desc: l.desc, cat: l.cat, forma: l.forma, tipo: l.tipo, valor: l.valor, pago: l.pago,
    projetoId: l.projetoId, sub: l.projetoId ? projeto(s, l.projetoId)?.nome : l.cat,
  }));
  s.projetos.forEach(p => p.parcelas.forEach(x => out.push({
    key: x.id, origem: 'parc', ref: x, pid: p.id, data: x.pago && x.pagoEm ? x.pagoEm : x.venc, desc: `${x.nome.split(' — ')[0]} — ${p.nome}`,
    cat: 'Projetos', forma: x.forma, tipo: 'entrada', valor: x.valor, pago: x.pago, projetoId: p.id, sub: p.cliente,
  })));
  return out;
}
const situ = l => l.pago ? 'pago' : l.data < HOJE ? 'vencido' : 'pendente';
const BADGE = { pago: ['b-ok', 'Pago'], pendente: ['b-warn', 'Pendente'], vencido: ['b-bad', 'Vencido'] };

function Lancamento({ tipo, lanc, onClose, projetos }) {
  const novo = !lanc;
  const cats = tipo === 'saida' ? CAT_SAIDA : CAT_ENTRADA;
  const [f, setF] = useState(lanc ? { ...lanc } : { id: uid(), tipo, desc: '', cat: cats[0], valor: '', data: HOJE, forma: 'PIX', pago: false, projetoId: null, obs: '' });
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={novo ? (tipo === 'saida' ? 'Nova despesa' : 'Nova receita') : 'Editar lançamento'} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" onClick={() => {
        if (!f.desc.trim() || !(+f.valor > 0)) return toast('Preencha a descrição e o valor');
        const x = { ...f, desc: f.desc.trim(), valor: +f.valor, projetoId: f.projetoId || null };
        update(s => { if (novo) s.lancamentos.push(x); else s.lancamentos = s.lancamentos.map(y => y.id === x.id ? x : y); });
        toast('Lançamento salvo'); onClose();
      }}>Salvar</button></>}>
      <div className="f"><label>Descrição</label><input value={f.desc} onChange={set('desc')} placeholder={tipo === 'saida' ? 'Ex.: Plotagem do anteprojeto (8 pranchas A1)' : 'Ex.: Consultoria de Feng Shui avulsa'} autoFocus /></div>
      <div className="f"><label>Categoria</label><select value={f.cat} onChange={set('cat')}>{cats.map(c => <option key={c}>{c}</option>)}</select></div>
      <div className="row2">
        <div className="f"><label>Valor (R$)</label><input inputMode="decimal" value={f.valor} onChange={set('valor')} /></div>
        <div className="f"><label>Vencimento</label><input type="date" value={f.data} onChange={set('data')} /></div>
      </div>
      <div className="row2">
        <div className="f"><label>Forma de pagamento</label><select value={f.forma} onChange={set('forma')}>{FORMAS.map(c => <option key={c}>{c}</option>)}</select></div>
        <div className="f"><label>Situação</label><select value={f.pago ? 's' : 'n'} onChange={e => setF({ ...f, pago: e.target.value === 's' })}><option value="n">Pendente</option><option value="s">Pago</option></select></div>
      </div>
      <div className="f"><label>Projeto (opcional)</label><select value={f.projetoId || ''} onChange={set('projetoId')}><option value="">Despesa do escritório</option>{projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
      <div className="f"><label>Observação</label><textarea value={f.obs || ''} onChange={set('obs')} /></div>
    </Modal>
  );
}

export default function Financeiro() {
  const s = useStore();
  const [mes, setMes] = useState(mesDe(HOJE));
  const [atalho, setAtalho] = useState(null);
  const [tipo, setTipo] = useState('');
  const [st, setSt] = useState('');
  const [proj, setProj] = useState('');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null);

  const todas = linhas(s);
  const base = todas.filter(l => {
    if (atalho === 'vencidos') return situ(l) === 'vencido';
    if (atalho === 'p7') return !l.pago && l.data >= HOJE && l.data <= addDias(HOJE, 7);
    if (atalho === 'p30') return !l.pago && l.data >= HOJE && l.data <= addDias(HOJE, 30);
    return mesDe(l.data) === mes;
  });
  const lista = base.filter(l => (!tipo || l.tipo === tipo) && (!st || situ(l) === st) && (!proj || l.projetoId === proj) && (!q || l.desc.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => a.data.localeCompare(b.data));
  const soma = (arr, t, pago) => arr.filter(l => l.tipo === t && (pago === undefined || l.pago === pago)).reduce((x, l) => x + l.valor, 0);
  const ent = soma(base, 'entrada'), sai = soma(base, 'saida');
  const real = soma(base, 'entrada', true) - soma(base, 'saida', true);
  const nVenc = todas.filter(l => situ(l) === 'vencido').length;

  const baixa = (l, v) => update(d => {
    if (l.origem === 'lanc') d.lancamentos.find(x => x.id === l.key).pago = v;
    else { const x = projeto(d, l.pid).parcelas.find(y => y.id === l.key); x.pago = v; x.pagoEm = v ? HOJE : null; }
  });

  return (
    <>
      <div className="ph">
        <div><h1>Fluxo de caixa</h1><p>Cada entrada e cada saída do escritório, com o saldo do mês. As parcelas dos projetos entram sozinhas.</p></div>
        <div className="acts"><button className="btn" onClick={() => setModal({ tipo: 'entrada' })}><Plus />Nova receita</button><button className="btn pri" onClick={() => setModal({ tipo: 'saida' })}><Plus />Nova despesa</button></div>
      </div>
      <div className="card">
        <div className="fbar">
          <div className="mes">
            <button className="icon-act" onClick={() => { setAtalho(null); setMes(addMes(mes, -1)); }} aria-label="Mês anterior"><ChevronLeft /></button>
            <span>{atalho ? { vencidos: 'Vencidos', p7: 'Próximos 7 dias', p30: 'Próximos 30 dias' }[atalho] : fmtMes(mes)}</span>
            <button className="icon-act" onClick={() => { setAtalho(null); setMes(addMes(mes, 1)); }} aria-label="Próximo mês"><ChevronRight /></button>
          </div>
          <button className={`btn sm ${atalho === 'vencidos' ? 'on' : ''}`} onClick={() => setAtalho(atalho === 'vencidos' ? null : 'vencidos')} style={nVenc && atalho !== 'vencidos' ? { color: 'var(--bad)' } : {}}>Vencidos{nVenc ? ` (${nVenc})` : ''}</button>
          <button className={`btn sm ${atalho === 'p7' ? 'on' : ''}`} onClick={() => setAtalho(atalho === 'p7' ? null : 'p7')}>Próximos 7 dias</button>
          <button className={`btn sm ${atalho === 'p30' ? 'on' : ''}`} onClick={() => setAtalho(atalho === 'p30' ? null : 'p30')}>Próximos 30 dias</button>
        </div>
        <div className="fbar">
          <select value={tipo} onChange={e => setTipo(e.target.value)} aria-label="Tipo"><option value="">Entradas e saídas</option><option value="entrada">Só entradas</option><option value="saida">Só saídas</option></select>
          <select value={st} onChange={e => setSt(e.target.value)} aria-label="Situação"><option value="">Todas as situações</option><option value="pago">Pago</option><option value="pendente">Pendente</option><option value="vencido">Vencido</option></select>
          <select value={proj} onChange={e => setProj(e.target.value)} aria-label="Projeto"><option value="">Todos os projetos</option>{s.projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
          <div style={{ position: 'relative', flex: 1, minWidth: 160, display: 'flex' }}><Search size={15} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--mut)' }} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar na descrição" style={{ paddingLeft: 32, width: '100%' }} /></div>
        </div>
        <div className="fsum">
          <div><small>Entradas</small><b style={{ color: 'var(--ok)' }}><Money v={ent} /></b></div>
          <div><small>Saídas</small><b style={{ color: 'var(--bad)' }}><Money v={sai} /></b></div>
          <div><small>Saldo previsto</small><b style={{ color: ent - sai >= 0 ? 'var(--pet)' : 'var(--bad)' }}><Money v={ent - sai} /></b></div>
          <div><small>Realizado</small><b><Money v={real} /></b></div>
        </div>
        {lista.length ? (
          <div className="tbl-wrap">
            <table className="t cards">
              <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Forma</th><th>Situação</th><th className="r">Entrada</th><th className="r">Saída</th><th /></tr></thead>
              <tbody>
                {lista.map(l => {
                  const sit = situ(l);
                  return (
                    <tr key={l.key} className={sit === 'vencido' ? 'late' : ''}>
                      <td data-c="meta">{fmtData(l.data)}</td>
                      <td data-c="main"><span style={{ fontWeight: 500 }}>{l.desc}</span><small>{l.sub}</small></td>
                      <td data-c="hide">{l.cat}</td>
                      <td data-c="hide">{l.forma}</td>
                      <td data-c="st"><span className={`badge ${BADGE[sit][0]}`}>{BADGE[sit][1]}</span></td>
                      {l.tipo === 'entrada'
                        ? <><td data-c="val" className="r v-in"><Money v={l.valor} /></td><td data-c="hide" /></>
                        : <><td data-c="hide" /><td data-c="val" className="r v-out">−<Money v={l.valor} /></td></>}
                      <td data-c="act" className="r" style={{ whiteSpace: 'nowrap' }}>
                        {l.pago
                          ? <button className="icon-act" onClick={() => baixa(l, false)} title="Desfazer baixa" aria-label="Desfazer baixa"><Undo2 /></button>
                          : <button className="btn sm" style={{ color: 'var(--ok)' }} onClick={() => { baixa(l, true); toast('Baixa registrada'); }}><Check />Dar baixa</button>}
                        {l.origem === 'lanc' && <>
                          <button className="icon-act" onClick={() => setModal({ tipo: l.tipo, lanc: l.ref })} aria-label="Editar"><Pencil /></button>
                          <button className="icon-act" onClick={() => { update(d => { d.lancamentos = d.lancamentos.filter(x => x.id !== l.key); }); toast('Lançamento excluído'); }} aria-label="Excluir"><Trash2 /></button>
                        </>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="empty"><Wallet />Nenhum lançamento com esses filtros.</div>}
      </div>
      {modal && <Lancamento tipo={modal.tipo} lanc={modal.lanc} projetos={s.projetos} onClose={() => setModal(null)} />}
    </>
  );
}
