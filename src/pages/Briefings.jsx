import { useEffect, useState } from 'react';
import { ClipboardList, Copy, ExternalLink, Inbox, Link2, ChevronRight } from 'lucide-react';
import { useStore, update, projeto } from '../store';
import { DIRECOES } from '../fengshui';
import { fmtData, relDias, link } from '../util';
import { Modal, copiar, toast, zap, WhatsIcon } from '../ui';
import { KuaCard } from './FengShui';

export const PERGUNTAS = {
  residencial: [
    ['Seus dados de contato', 'Texto curto'], ['Tipo de imóvel e área', 'Escolha única'], ['Direção da porta de entrada', 'Bússola'],
    ['Moradores e datas de nascimento', 'Lista · calcula o Kua'], ['O que você quer com o projeto', 'Múltipla escolha'],
    ['Estilo preferido', 'Múltipla escolha'], ['Cores que gosta e que evita', 'Texto longo'], ['O que é indispensável', 'Texto longo'],
  ],
  consultorio: [
    ['Seus dados de contato', 'Texto curto'], ['Especialidade e área da sala', 'Escolha única'], ['Direção da porta de entrada', 'Bússola'],
    ['Quem trabalha no espaço', 'Lista · calcula o Kua'], ['Como o paciente deve se sentir', 'Múltipla escolha'],
    ['Estilo preferido', 'Múltipla escolha'], ['Cores da marca e cores a evitar', 'Texto longo'], ['O que é indispensável', 'Texto longo'],
  ],
};

function Resposta({ r, s, onClose }) {
  const [pid, setPid] = useState(r.projetoId || '');
  const form = s.forms.find(f => f.id === r.formId);
  const vincular = () => {
    if (!pid) return toast('Escolha um projeto');
    update(d => {
      const x = d.respostas.find(y => y.id === r.id);
      x.projetoId = pid;
      const p = projeto(d, pid);
      p.briefingId = r.id;
      p.fengshui.porta = r.imovel.porta || p.fengshui.porta;
      p.fengshui.pessoas = structuredClone(r.pessoas);
    });
    toast('Briefing vinculado. Moradores e porta foram pro Feng Shui do projeto.');
  };
  return (
    <Modal title={r.nome} onClose={onClose}
      footer={<><a className="btn" target="_blank" rel="noopener" href={zap(`Oi, ${r.nome.split(' ')[0]}! Aqui é a Giullia. Recebi seu briefing, obrigada! Vamos marcar uma conversa pra eu te mostrar as primeiras ideias?`)}><WhatsIcon width={16} height={16} />Responder no WhatsApp</a><button className="btn pri" onClick={onClose}>Fechar</button></>}>
      <span className="badge b-mag">{form?.nome}</span>
      <p className="mut" style={{ fontSize: 12.5, marginTop: 8 }}>Respondido em {fmtData(r.data)} · {r.whatsapp} · {r.email}</p>
      <dl className="ans">
        <dt>Imóvel</dt><dd>{r.imovel.tipo} · {r.imovel.area} m² · {r.imovel.bairro}</dd>
        <dt>Porta de entrada</dt><dd>{DIRECOES[r.imovel.porta] || 'Não sabe'}</dd>
        <dt>Objetivos</dt><dd>{r.objetivos.join(', ')}</dd>
        <dt>Estilo</dt><dd>{r.estilo.join(', ')}</dd>
        <dt>Cores que gosta</dt><dd>{r.cores || '—'}</dd>
        <dt>Cores que evita</dt><dd>{r.evitar || '—'}</dd>
        <dt>Indispensável</dt><dd>{r.indispensavel || '—'}</dd>
      </dl>
      <div className="sub" style={{ marginTop: 20 }}>Número Kua de quem vai usar o espaço</div>
      <div className="stack">{r.pessoas.map(x => <KuaCard key={x.id} pessoa={x} />)}</div>
      <div className="sub" style={{ marginTop: 20 }}>Projeto</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={pid} onChange={e => setPid(e.target.value)} style={{ flex: 1, height: 38, border: '1px solid var(--line)', borderRadius: 10, padding: '0 10px' }}>
          <option value="">Escolha o projeto…</option>
          {s.projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <button className="btn pet" onClick={vincular}><Link2 />Vincular</button>
      </div>
      {r.projetoId && <a className="btn ghost sm" style={{ marginTop: 10 }} href={`#/projeto/${r.projetoId}/fengshui`}>Abrir Feng Shui do projeto <ChevronRight size={14} /></a>}
    </Modal>
  );
}

export default function Briefings({ abrir }) {
  const s = useStore();
  const [aberta, setAberta] = useState(abrir || null);
  useEffect(() => { setAberta(abrir || null); }, [abrir]);
  useEffect(() => {
    if (aberta) update(d => { const x = d.respostas.find(y => y.id === aberta); if (x && !x.lida) x.lida = true; });
  }, [aberta]);
  const r = s.respostas.find(x => x.id === aberta);

  return (
    <>
      <div className="ph">
        <div><h1>Briefings</h1><p>Questionários que o cliente responde pelo link, sem criar conta e sem troca de áudio no WhatsApp.</p></div>
      </div>
      <div className="forms">
        {s.forms.map(f => {
          const n = s.respostas.filter(x => x.formId === f.id).length;
          return (
            <div className="card form-card" key={f.id}>
              <div style={{ display: 'flex', gap: 8 }}><span className="badge b-ok">{f.status}</span><span className="badge b-mut">{n} {n === 1 ? 'resposta' : 'respostas'}</span></div>
              <h3>{f.nome}</h3>
              <p className="mut" style={{ fontSize: 13 }}>{f.tipo === 'residencial' ? 'Pra casas e apartamentos. Já calcula o número Kua de cada morador.' : 'Pra consultórios e clínicas. Calcula o Kua de quem trabalha no espaço.'}</p>
              <div className="qs">{PERGUNTAS[f.tipo].map(([q, t], i) => <div key={q}><span>{i + 1}.</span>{q}<span className={`badge ${t.includes('Kua') || t === 'Bússola' ? 'b-pet' : 'b-mut'}`} style={{ width: 'auto' }}>{t}</span></div>)}</div>
              <div className="acts">
                <button className="btn sm" onClick={() => copiar(link(`b/${f.id}`))}><Copy />Copiar link</button>
                <a className="btn sm pri" href={`#/b/${f.id}`}><ExternalLink />Abrir como cliente</a>
              </div>
            </div>
          );
        })}
      </div>
      <div className="card">
        <div className="card-h"><h3><span className="hi"><Inbox /></span>Respostas</h3></div>
        {s.respostas.length ? (
          <div className="tbl-wrap">
            <table className="t cards">
              <thead><tr><th>Cliente</th><th>Formulário</th><th>Recebido</th><th>Projeto</th><th /></tr></thead>
              <tbody>
                {s.respostas.slice().sort((a, b) => b.data.localeCompare(a.data)).map(x => (
                  <tr key={x.id} onClick={() => setAberta(x.id)} style={{ cursor: 'pointer' }}>
                    <td data-c="main"><span style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: x.lida ? 500 : 700 }}>{!x.lida && <i className="unread" />}{x.nome}</span><small>{x.imovel.tipo} · {x.imovel.bairro}</small></td>
                    <td data-c="hide">{s.forms.find(f => f.id === x.formId)?.nome}</td>
                    <td data-c="meta">{relDias(x.data)}</td>
                    <td data-c="st">{x.projetoId ? <span className="badge b-pet">{projeto(s, x.projetoId)?.nome}</span> : <span className="badge b-mag">Novo lead</span>}</td>
                    <td data-c="hide" className="r"><ChevronRight size={16} color="var(--mut)" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty"><ClipboardList />Nenhuma resposta ainda.</div>}
      </div>
      {r && <Resposta r={r} s={s} onClose={() => { setAberta(null); if (abrir) location.hash = '#/briefings'; }} />}
    </>
  );
}
