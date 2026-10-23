import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore, update, financeiro } from '../store';
import { progresso } from '../schedule';
import { cronogramaPadrao, CAPAS } from '../data';
import { HOJE, uid } from '../util';
import { Money, Modal, img, toast } from '../ui';

const FILTROS = [['todos', 'Todos'], ['Projeto', 'Em projeto'], ['Obra', 'Em obra'], ['Concluído', 'Concluídos']];
export const corStatus = st => ({ Projeto: 'b-mag', Obra: 'b-warn', 'Concluído': 'b-ok' }[st]);

function NovoProjeto({ onClose }) {
  const [f, setF] = useState({ nome: '', cliente: '', tipo: 'Residencial', bairro: '', area: '', valor: '', capa: 'living-verde' });
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const salvar = () => {
    if (!f.nome.trim() || !f.cliente.trim()) return toast('Preencha o nome do projeto e do cliente');
    const id = uid();
    const n = CAPAS.find(c => c[0] === f.capa)[1];
    update(s => s.projetos.unshift({
      id, nome: f.nome.trim(), cliente: f.cliente.trim(), tipo: f.tipo, bairro: f.bairro, area: +f.area || 0, status: 'Projeto',
      capa: `${f.capa}/01`, fotos: Array.from({ length: n }, (_, i) => `${f.capa}/${String(i + 1).padStart(2, '0')}`),
      valor: +f.valor || 0, cronograma: cronogramaPadrao(HOJE, false), parcelas: [], portal: false, diario: [], briefingId: null,
      fengshui: { porta: 'S', pessoas: [], notas: {}, faltantes: [] },
    }));
    toast('Projeto criado com o cronograma padrão');
    onClose();
    location.hash = `#/projeto/${id}`;
  };
  return (
    <Modal title="Novo projeto" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" onClick={salvar}>Criar projeto</button></>}>
      <div className="f"><label>Nome do projeto</label><input value={f.nome} onChange={set('nome')} placeholder="Ex.: Apartamento Beira-Mar" autoFocus /></div>
      <div className="f"><label>Cliente</label><input value={f.cliente} onChange={set('cliente')} placeholder="Nome do cliente" /></div>
      <div className="row2">
        <div className="f"><label>Tipo</label><select value={f.tipo} onChange={set('tipo')}><option>Residencial</option><option>Comercial · Saúde</option><option>Comercial</option><option>Consultoria de Feng Shui</option></select></div>
        <div className="f"><label>Bairro</label><input value={f.bairro} onChange={set('bairro')} /></div>
      </div>
      <div className="row2">
        <div className="f"><label>Área (m²)</label><input inputMode="numeric" value={f.area} onChange={set('area')} /></div>
        <div className="f"><label>Valor do projeto (R$)</label><input inputMode="decimal" value={f.valor} onChange={set('valor')} /></div>
      </div>
      <div className="f">
        <label>Foto de capa</label>
        <div className="thumbs" style={{ gridTemplateColumns: 'repeat(6,1fr)' }}>
          {CAPAS.map(([c]) => (
            <button key={c} onClick={() => setF({ ...f, capa: c })} style={{ outline: f.capa === c ? '3px solid var(--mag)' : 'none', outlineOffset: 2 }} aria-label={c}>
              <img src={img(`${c}/01`)} alt="" />
            </button>
          ))}
        </div>
      </div>
      <p className="hint">O cronograma padrão (projeto → obra → marcenaria → acabamentos e Feng Shui) já vem montado a partir de hoje. Dá pra ajustar tudo depois.</p>
    </Modal>
  );
}

export default function Projetos() {
  const s = useStore();
  const [fil, setFil] = useState('todos');
  const [novo, setNovo] = useState(false);
  const lista = s.projetos.filter(p => fil === 'todos' || p.status === fil);
  return (
    <>
      <div className="ph">
        <div><h1>Projetos</h1><p>{s.projetos.length} projetos · {s.projetos.filter(p => p.status !== 'Concluído').length} em andamento</p></div>
        <div className="acts">
          <div className="seg">{FILTROS.map(([k, t]) => <button key={k} className={fil === k ? 'on' : ''} onClick={() => setFil(k)}>{t}</button>)}</div>
          <button className="btn pri" onClick={() => setNovo(true)}><Plus />Novo projeto</button>
        </div>
      </div>
      <div className="pgrid">
        {lista.map(p => {
          const f = financeiro(p), pr = progresso(p.cronograma);
          return (
            <a key={p.id} className="pcard" href={`#/projeto/${p.id}`}>
              <div className="cv"><img src={img(p.capa)} alt="" loading="lazy" /><span className={`badge ${corStatus(p.status)}`}>{p.status === 'Projeto' ? 'Em projeto' : p.status === 'Obra' ? 'Em obra' : 'Concluído'}</span></div>
              <div className="pb">
                <h3>{p.nome}</h3>
                <div className="meta">{p.cliente} · {p.tipo}{p.area ? ` · ${p.area} m²` : ''}</div>
                <div className="bars">
                  <div>Progresso <b>{pr}%</b><div className="progress mag"><i style={{ width: pr + '%' }} /></div></div>
                  <div>Recebido <b><Money v={f.pago} /></b><div className="progress"><i style={{ width: f.pct + '%' }} /></div></div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
      {novo && <NovoProjeto onClose={() => setNovo(false)} />}
    </>
  );
}
