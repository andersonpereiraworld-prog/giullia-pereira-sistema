import { useState } from 'react';
import { LayoutGrid, CalendarRange, Receipt, Compass, Globe, Images, ClipboardList, ChevronRight, MapPin, Ruler, CalendarDays, Clock, Copy, ExternalLink, CircleDollarSign, Flag, NotebookPen, Plus } from 'lucide-react';
import { useStore, update, financeiro, projeto } from '../store';
import { calcular, progresso, limites } from '../schedule';
import { HOJE, fmtData, fmtCurta, diffDias, link, uid } from '../util';
import { DIRECOES } from '../fengshui';
import { Money, Ring, img, Lightbox, copiar, Modal, toast } from '../ui';
import { corStatus } from './Projetos';
import Cronograma from './Cronograma';
import Pagamentos from './Pagamentos';
import FengShui from './FengShui';

const ABAS = [['geral', 'Visão geral', LayoutGrid], ['cronograma', 'Cronograma', CalendarRange], ['pagamentos', 'Pagamentos', Receipt], ['fengshui', 'Feng Shui', Compass]];

function NovoRegistro({ p, onClose }) {
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState(p.fotos[0]);
  return (
    <Modal title="Novo registro no diário da obra" onClose={onClose} center
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" onClick={() => {
        if (!texto.trim()) return toast('Escreva o que aconteceu na obra');
        update(s => projeto(s, p.id).diario.push({ id: uid(), data: HOJE, texto: texto.trim(), foto }));
        toast('Registro publicado. O cliente já vê no portal.'); onClose();
      }}>Publicar</button></>}>
      <div className="f"><label>O que aconteceu hoje?</label><textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Ex.: Marcenaria da cozinha instalada. Faltam os puxadores." autoFocus /></div>
      <div className="f"><label>Foto</label>
        <div className="thumbs" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
          {p.fotos.map(f => <button key={f} onClick={() => setFoto(f)} style={{ outline: foto === f ? '3px solid var(--mag)' : 'none', outlineOffset: 2 }}><img src={img(f)} alt="" /></button>)}
        </div>
        <span className="hint">No sistema de verdade, a foto sai direto da câmera do celular.</span>
      </div>
    </Modal>
  );
}

function Geral({ p, s }) {
  const [lb, setLb] = useState(null);
  const [reg, setReg] = useState(false);
  const r = calcular(p.cronograma);
  const pr = progresso(p.cronograma);
  const f = financeiro(p);
  const lim = limites(p.cronograma);
  const resta = diffDias(HOJE, lim.fim);
  const prox = p.cronograma.filter(a => r[a.id].fim >= HOJE && a.pct < 100).sort((a, b) => r[a.id].ini.localeCompare(r[b.id].ini))[0];
  const resp = s.respostas.find(x => x.id === p.briefingId);

  const hist = [
    ...p.parcelas.filter(x => x.pago).map(x => ({ data: x.pagoEm, t: `${x.nome.split(' — ')[0]} recebida`, d: <Money v={x.valor} />, ok: true })),
    ...p.cronograma.filter(a => r[a.id].fim < HOJE && a.pct === 100).map(a => ({ data: r[a.id].fim, t: `${a.nome} concluído`, d: a.resp, ok: true })),
    ...p.diario.map(x => ({ data: x.data, t: 'Diário da obra', d: x.texto, foto: x.foto })),
  ].filter(x => x.data <= HOJE).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 7);

  const secs = [
    ['cronograma', CalendarRange, 'Cronograma', `${p.cronograma.length} atividades · ${pr}% concluído`, 'var(--pet-s)', 'var(--pet)'],
    ['pagamentos', Receipt, 'Pagamentos', `${f.pagas}/${p.parcelas.length} parcelas pagas`, 'var(--ok-s)', 'var(--ok)'],
    ['fengshui', Compass, 'Feng Shui', `${p.fengshui.pessoas.length} moradores · porta a ${DIRECOES[p.fengshui.porta]}`, '#EEE7F7', '#6B3FA0'],
  ];

  return (
    <>
      <div className="kpis">
        <div className="kpi ring-kpi"><Ring pct={pr} /><div><small>Progresso</small><b style={{ fontSize: '1.05rem' }}>{pr === 100 ? 'Concluído' : 'Em andamento'}</b><span>pelo cronograma</span></div></div>
        <div className="kpi k-ok"><small>Financeiro</small><b>{f.pct}%</b><span><Money v={f.pago} /> de <Money v={f.total || p.valor} /></span><div className="kico"><CircleDollarSign /></div></div>
        <div className="kpi k-warn"><small>Prazo de entrega</small><b>{resta < 0 ? 'Entregue' : `${resta} dias`}</b><span>{fmtData(lim.fim)}</span><div className="kico"><Clock /></div></div>
        <div className="kpi k-mag"><small>Próxima etapa</small><b style={{ fontSize: '1.02rem', marginTop: 8 }}>{prox ? prox.nome : 'Tudo entregue'}</b><span>{prox ? `${fmtCurta(r[prox.id].ini)} → ${fmtCurta(r[prox.id].fim)}` : ''}</span><div className="kico"><Flag /></div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-h"><h3><span className="hi"><LayoutGrid /></span>Seções do projeto</h3></div>
        <div className="card-b">
          <div className="secs">
            {secs.map(([k, I, t, d, bg, c]) => (
              <a key={k} className="sec" href={`#/projeto/${p.id}/${k}`}><div className="si" style={{ background: bg, color: c }}><I /></div><div><b>{t}</b><span>{d}</span></div></a>
            ))}
            <div className="sec">
              <div className="si" style={{ background: 'var(--mag-s)', color: 'var(--mag)' }}><Globe /></div>
              <div style={{ flex: 1 }}>
                <b>Portal do cliente</b>
                <span>{p.portal ? 'Ativo: o cliente acompanha por link' : 'Desativado'}</span>
                <div className="acts" style={{ marginTop: 8 }}>
                  <button className={`btn sm ${p.portal ? 'on' : ''}`} onClick={() => update(d => { projeto(d, p.id).portal = !p.portal; })}>{p.portal ? 'Ativo' : 'Ativar'}</button>
                  {p.portal && <><button className="btn sm" onClick={() => copiar(link(`portal/${p.id}`))}><Copy />Copiar</button><a className="btn sm" href={`#/portal/${p.id}`}><ExternalLink />Abrir</a></>}
                </div>
              </div>
            </div>
            <button className="sec" onClick={() => setLb(0)}><div className="si" style={{ background: 'var(--warn-s)', color: 'var(--warn)' }}><Images /></div><div><b>Fotos</b><span>{p.fotos.length} fotos do projeto</span></div></button>
            <a className="sec" href={resp ? `#/briefings/${resp.id}` : '#/briefings'}><div className="si" style={{ background: 'var(--bg)', color: 'var(--mut)' }}><ClipboardList /></div><div><b>Briefing</b><span>{resp ? `Respondido em ${fmtData(resp.data)}` : 'Enviar briefing por link'}</span></div></a>
          </div>
        </div>
      </div>

      <div className="g-main">
        <div className="card">
          <div className="card-h"><h3><span className="hi"><NotebookPen /></span>Linha do tempo</h3><button className="btn sm" onClick={() => setReg(true)}><Plus />Registro no diário</button></div>
          <div className="card-b">
            <div className="tl">
              {hist.length ? hist.map((x, i) => (
                <div key={i} className={`tl-i${x.ok ? ' ok' : ''}`}>
                  <b>{x.t}</b><span>{fmtData(x.data)} · {x.d}</span>
                  {x.foto && <img src={img(x.foto)} alt="" loading="lazy" />}
                </div>
              )) : <p className="mut">O histórico aparece aqui conforme o projeto anda.</p>}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3><span className="hi"><Images /></span>Fotos</h3><span className="mut" style={{ fontSize: 12 }}>{p.fotos.length} fotos</span></div>
          <div className="card-b"><div className="thumbs">{p.fotos.slice(0, 9).map((f, i) => <button key={f} onClick={() => setLb(i)} aria-label={`Foto ${i + 1}`}><img src={img(f)} alt="" loading="lazy" /></button>)}</div></div>
        </div>
      </div>
      {lb !== null && <Lightbox fotos={p.fotos} inicio={lb} onClose={() => setLb(null)} />}
      {reg && <NovoRegistro p={p} onClose={() => setReg(false)} />}
    </>
  );
}

export default function Projeto({ id, aba }) {
  const s = useStore();
  const p = projeto(s, id);
  if (!p) return <div className="empty">Projeto não encontrado. <a href="#/projetos" style={{ color: 'var(--mag)' }}>Voltar aos projetos</a></div>;
  return (
    <>
      <div className="crumbs"><a href="#/projetos">Projetos</a><ChevronRight />{p.nome}</div>
      <div className="phero">
        <img src={img(p.capa, false)} alt="" />
        <div className="in">
          <div>
            <small>{p.tipo}</small>
            <h1>{p.nome}</h1>
            <p>para {p.cliente}</p>
          </div>
          <div className="facts">
            <span className={`badge ${corStatus(p.status)}`} style={{ height: 28 }}>{p.status === 'Projeto' ? 'Em projeto' : p.status === 'Obra' ? 'Em obra' : 'Concluído'}</span>
            {p.bairro && <span><MapPin />{p.bairro}</span>}
            {p.area > 0 && <span><Ruler />{p.area} m²</span>}
            <span><CalendarDays />{fmtCurta(limites(p.cronograma).ini)} → {fmtCurta(limites(p.cronograma).fim)}</span>
          </div>
        </div>
      </div>
      <nav className="ptabs" aria-label="Seções do projeto">
        {ABAS.map(([k, t, I]) => <a key={k} href={`#/projeto/${p.id}${k === 'geral' ? '' : '/' + k}`} className={aba === k ? 'on' : ''}><I />{t}</a>)}
        <a href={`#/portal/${p.id}`}><Globe />Portal do cliente</a>
      </nav>
      {aba === 'cronograma' ? <Cronograma p={p} /> : aba === 'pagamentos' ? <Pagamentos p={p} /> : aba === 'fengshui' ? <FengShui p={p} /> : <Geral p={p} s={s} />}
    </>
  );
}
