import { useState } from 'react';
import { Compass, Plus, Trash2, Users, DoorOpen, Map, Globe } from 'lucide-react';
import { update, projeto } from '../store';
import { kua, perfilKua, DIRECOES, BAGUA } from '../fengshui';
import { fmtData, uid } from '../util';
import { Modal, toast } from '../ui';

const ROSA = [['NO', 'N', 'NE'], ['O', null, 'E'], ['SO', 'S', 'SE']];

export function KuaCard({ pessoa, onRemover }) {
  const k = kua(pessoa.nasc, pessoa.genero);
  const pf = perfilKua(k);
  if (!pf) return null;
  return (
    <div className="kua">
      <div className="kua-h">
        <div className="kua-n">{k}</div>
        <div style={{ flex: 1 }}><b>{pessoa.nome}</b><span>Kua {k} · {pf.grupo} · nasc. {fmtData(pessoa.nasc)}</span></div>
        {onRemover && <button className="icon-act" onClick={onRemover} aria-label={`Remover ${pessoa.nome}`}><Trash2 /></button>}
      </div>
      <div className="dirs">
        {pf.favoraveis.map(f => <div className="dir" key={f.nome}><b>{DIRECOES[f.dir]}</b><span>{f.sentido} · {f.uso}</span></div>)}
      </div>
      <p className="desf">Evitar como direção principal: <b>{pf.desfavoraveis.map(d => DIRECOES[d]).join(', ')}</b></p>
    </div>
  );
}

export function Rosa({ valor, onChange }) {
  return (
    <div className="compass" role="radiogroup" aria-label="Direção da porta de entrada">
      {ROSA.flat().map((d, i) => d
        ? <button key={d} role="radio" aria-checked={valor === d} className={valor === d ? 'on' : ''} onClick={() => onChange(d)} title={DIRECOES[d]}>{d}</button>
        : <div key={i} className="c"><Compass size={22} /></div>)}
    </div>
  );
}

function Planta({ comercial }) {
  const salas = comercial
    ? [[50, 40, 380, 300, 'Consultório 1'], [380, 40, 520, 200, 'Banheiro'], [520, 40, 950, 300, 'Sala de procedimentos'], [50, 300, 330, 520, 'Consultório 2'], [50, 520, 330, 680, 'Copa'], [330, 300, 760, 680, 'Recepção e espera'], [760, 300, 950, 500, 'Esterilização'], [760, 500, 950, 680, 'Depósito']]
    : [[50, 40, 380, 300, 'Suíte'], [380, 40, 520, 200, 'Banho'], [520, 40, 760, 300, 'Quarto'], [760, 40, 950, 300, 'Varanda'], [50, 300, 380, 500, 'Home office'], [50, 500, 220, 680, 'Lavabo'], [220, 500, 380, 680, 'Hall'], [380, 300, 760, 680, 'Estar e jantar'], [760, 300, 950, 520, 'Cozinha'], [760, 520, 950, 680, 'Serviço']];
  return (
    <svg className="base" viewBox="0 0 1000 740" aria-hidden="true">
      <rect x="0" y="0" width="1000" height="740" fill="#FDFBFA" />
      {salas.map(([x1, y1, x2, y2, n]) => (
        <g key={n}>
          <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="none" stroke="#CFC5C1" strokeWidth="5" strokeDasharray={n === 'Varanda' ? '14 10' : ''} />
          <text x={x1 + 16} y={y2 - 16} textAnchor="start" fontSize="17" fill="#B3A8A4" fontStyle="italic" fontFamily="Inter Tight, sans-serif">{n}</text>
        </g>
      ))}
      <rect x="50" y="40" width="900" height="640" fill="none" stroke="#5E5350" strokeWidth="10" />
      <rect x="455" y="672" width="90" height="16" fill="#FDFBFA" />
      <path d="M455 680 L455 592 A88 88 0 0 1 543 680" fill="none" stroke="#5E5350" strokeWidth="3" strokeDasharray="6 6" />
    </svg>
  );
}

function AddPessoa({ onAdd, onClose }) {
  const [f, setF] = useState({ nome: '', nasc: '', genero: 'F' });
  const k = kua(f.nasc, f.genero);
  return (
    <Modal title="Adicionar morador" onClose={onClose} center
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" onClick={() => {
        if (!f.nome.trim() || !f.nasc) return toast('Preencha nome e data de nascimento');
        onAdd({ id: uid(), ...f, nome: f.nome.trim() }); onClose();
      }}>Adicionar</button></>}>
      <div className="f"><label>Nome</label><input value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} autoFocus /></div>
      <div className="row2">
        <div className="f"><label>Data de nascimento</label><input type="date" value={f.nasc} onChange={e => setF({ ...f, nasc: e.target.value })} /></div>
        <div className="f"><label>Gênero (para o cálculo)</label><select value={f.genero} onChange={e => setF({ ...f, genero: e.target.value })}><option value="F">Feminino</option><option value="M">Masculino</option></select></div>
      </div>
      {k && <p className="hint">Número Kua calculado: <b style={{ color: 'var(--pet)' }}>{k}</b> ({perfilKua(k).grupo})</p>}
    </Modal>
  );
}

export default function FengShui({ p }) {
  const fs = p.fengshui;
  const [sel, setSel] = useState('saude');
  const [add, setAdd] = useState(false);
  const area = BAGUA.find(a => a.id === sel);
  const mut = fn => update(s => fn(projeto(s, p.id).fengshui));
  const comercial = p.tipo.startsWith('Comercial');

  return (
    <>
      <div className="g-main" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-h">
            <h3><span className="hi" style={{ background: '#EEE7F7', color: '#6B3FA0' }}><Users /></span>{comercial ? 'Quem usa o espaço' : 'Moradores'} e número Kua</h3>
            <button className="btn sm" onClick={() => setAdd(true)}><Plus />Adicionar</button>
          </div>
          <div className="card-b">
            {fs.pessoas.length ? (
              <div className="g2">{fs.pessoas.map(x => <KuaCard key={x.id} pessoa={x} onRemover={() => mut(f => { f.pessoas = f.pessoas.filter(y => y.id !== x.id); })} />)}</div>
            ) : <div className="empty"><Users />Adicione quem vai usar o espaço pra calcular o número Kua.<br />Se o cliente respondeu o briefing, os dados já vêm de lá.</div>}
            <p className="hint" style={{ marginTop: 12 }}>Cálculo pela Escola das Oito Mansões, com o ano solar chinês virando em 4 de fevereiro.</p>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3><span className="hi" style={{ background: 'var(--pet-s)', color: 'var(--pet)' }}><DoorOpen /></span>Porta de entrada</h3></div>
          <div className="card-b" style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <Rosa valor={fs.porta} onChange={d => mut(f => { f.porta = d; })} />
            <div style={{ flex: 1, minWidth: 160 }}>
              <b style={{ fontSize: 15 }}>Voltada para o {DIRECOES[fs.porta]}</b>
              <p className="mut" style={{ fontSize: 13, marginTop: 4 }}>O mapa Bagua abaixo é alinhado pela parede da porta: Carreira fica sempre na entrada.</p>
              {p.portal && <a className="btn sm" style={{ marginTop: 10 }} href={`#/portal/${p.id}`}><Globe />Ver orientações no portal</a>}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h"><h3><span className="hi"><Map /></span>Mapa Bagua da planta</h3><span className="mut" style={{ fontSize: 12.5 }}>Toque numa área pra ver as orientações e anotar</span></div>
        <div className="card-b">
          <div className="bagua-wrap">
            <div className="planta">
              <Planta comercial={comercial} />
              <div className="bgrid" style={{ inset: '5.41% 5% 8.11%' }}>
                {BAGUA.map(a => (
                  <button key={a.id} onClick={() => setSel(a.id)}
                    className={[sel === a.id && 'sel', fs.faltantes.includes(a.id) && 'falta'].filter(Boolean).join(' ')}
                    style={{ background: a.cor + (sel === a.id ? '33' : '14') }}>
                    {a.nome}<small>{a.el}</small>
                  </button>
                ))}
              </div>
              <span className="door"><DoorOpen size={12} />Entrada · {DIRECOES[fs.porta]}</span>
            </div>
            <div className="area-info">
              <span className="badge b-mut"><i className="el-dot" style={{ background: area.cor }} />{area.tri} · {area.el}</span>
              <h4 style={{ marginTop: 10 }}>{area.nome}</h4>
              <dl>
                <dt>Cores</dt><dd>{area.cores}</dd>
                <dt>Formas</dt><dd>{area.formas}</dd>
                <dt>Usar</dt><dd>{area.usar}</dd>
                <dt>Evitar</dt><dd>{area.evitar}</dd>
              </dl>
              <label className="check"><input type="checkbox" checked={fs.faltantes.includes(area.id)} onChange={e => mut(f => { f.faltantes = e.target.checked ? [...f.faltantes, area.id] : f.faltantes.filter(x => x !== area.id); })} />Área faltante na planta (recorte)</label>
              <div className="f" style={{ marginBottom: 0 }}>
                <label>Notas da arquiteta</label>
                <textarea key={area.id} defaultValue={fs.notas[area.id] || ''} placeholder="O que fazer nessa área do projeto…"
                  onBlur={e => { const v = e.target.value; if (v !== (fs.notas[area.id] || '')) { mut(f => { f.notas[area.id] = v; }); toast('Nota salva'); } }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {add && <AddPessoa onClose={() => setAdd(false)} onAdd={x => { mut(f => { f.pessoas.push(x); }); toast(`${x.nome} adicionado(a)`); }} />}
    </>
  );
}
