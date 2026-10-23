import { useState } from 'react';
import { ArrowLeft, Check, Clock, AlertCircle, CalendarRange, Receipt, Compass, NotebookPen, Images, Lock, CircleDot } from 'lucide-react';
import { useStore, projeto, statusParcela, financeiro } from '../store';
import { calcular, progresso, limites } from '../schedule';
import { CATS } from '../data';
import { HOJE, fmtData, fmtCurta, fmtLonga, diffDias } from '../util';
import { DIRECOES } from '../fengshui';
import { Money, Ring, img, Lightbox, zap, WhatsIcon } from '../ui';
import { KuaCard } from './FengShui';

export default function Portal({ id }) {
  const s = useStore();
  const p = projeto(s, id);
  const [lb, setLb] = useState(null);

  if (!p || !p.portal) {
    return (
      <div className="pub">
        <header className="pub-top"><img src="./img/logo-magenta.png" alt="Giullia Pereira Arquitetura & Feng Shui" /></header>
        <main className="pub-main"><div className="card empty" style={{ marginTop: 40 }}><Lock />Este link não está ativo no momento.<br />Fale com a Giullia pra receber um novo.</div></main>
        <a className="back-demo" href={p ? `#/projeto/${p.id}` : '#/'}><ArrowLeft />Voltar ao sistema (demo)</a>
      </div>
    );
  }

  const r = calcular(p.cronograma);
  const pr = progresso(p.cronograma);
  const f = financeiro(p);
  const lim = limites(p.cronograma);
  const prox = p.cronograma.filter(a => r[a.id].fim >= HOJE && a.pct < 100).sort((a, b) => r[a.id].ini.localeCompare(r[b.id].ini))[0];
  const etapas = CATS.map(c => {
    const as = p.cronograma.filter(a => a.cat === c.id);
    if (!as.length) return null;
    const ini = as.reduce((m, a) => r[a.id].ini < m ? r[a.id].ini : m, r[as[0].id].ini);
    const fim = as.reduce((m, a) => r[a.id].fim > m ? r[a.id].fim : m, r[as[0].id].fim);
    const pc = progresso(as);
    const agora = as.filter(a => a.pct > 0 && a.pct < 100).map(a => a.nome);
    return { c, ini, fim, pc, agora, st: pc === 100 ? 'done' : pc > 0 || ini <= HOJE ? 'now' : 'next' };
  }).filter(Boolean);
  const diario = p.diario.slice().sort((a, b) => b.data.localeCompare(a.data));
  const primeiro = p.cliente.replace(/^(Dra?\.|Família)\s+/, '').split(' ')[0];

  return (
    <div className="pub">
      <header className="pub-top"><img src="./img/logo-magenta.png" alt="Giullia Pereira Arquitetura & Feng Shui" /><span className="badge b-mag">Portal do cliente</span></header>
      <main className="pub-main">
        <section className="portal-hero">
          <img src={img(p.capa, false)} alt="" />
          <div className="in">
            <small>Olá, {primeiro}!</small>
            <h1>{p.nome.split(' ').slice(0, -1).join(' ')} <em>{p.nome.split(' ').slice(-1)}</em></h1>
            <p style={{ opacity: .88, maxWidth: 520 }}>Aqui você acompanha as etapas, os pagamentos e as novidades do seu projeto, sempre atualizado.</p>
          </div>
        </section>

        <div className="pkpis">
          <div className="kpi ring-kpi"><Ring pct={pr} /><div><small>Progresso do projeto</small><b style={{ fontSize: '1.05rem' }}>{pr === 100 ? 'Entregue' : 'Em andamento'}</b><span>entrega prevista em {fmtData(lim.fim)}</span></div></div>
          <div className="kpi k-mag"><small>Próxima etapa</small><b style={{ fontSize: '1.02rem', marginTop: 8 }}>{prox ? prox.nome : 'Projeto entregue 🎉'}</b><span>{prox ? `${fmtCurta(r[prox.id].ini)} a ${fmtCurta(r[prox.id].fim)}` : ''}</span><div className="kico"><CalendarRange /></div></div>
          <div className="kpi k-ok"><small>Pagamentos</small><b style={{ fontSize: '1.2rem' }}>{f.pagas} de {p.parcelas.length} pagos</b><div className="progress" style={{ marginTop: 10, height: 6 }}><i style={{ width: f.pct + '%' }} /></div><div className="kico"><Receipt /></div></div>
        </div>

        <div className="g-main">
          <div className="stack">
            <div className="card psec">
              <div className="card-h"><h3><span className="hi"><CalendarRange /></span>Etapas do projeto</h3></div>
              <div className="steps-v">
                {etapas.map(e => (
                  <div key={e.c.id} className={`st ${e.st}`}>
                    <div className="ic">{e.st === 'done' ? <Check /> : e.st === 'now' ? <CircleDot /> : <Clock />}</div>
                    <div style={{ flex: 1 }}>
                      <b>{e.c.nome}</b>
                      <span>{fmtCurta(e.ini)} a {fmtCurta(e.fim)} · {e.st === 'done' ? 'Concluída' : e.st === 'now' ? `${e.pc}% concluída` : `Começa ${diffDias(HOJE, e.ini) <= 1 ? 'amanhã' : `em ${fmtLonga(e.ini)}`}`}</span>
                      {e.st === 'now' && <>
                        <div className="progress mag"><i style={{ width: e.pc + '%' }} /></div>
                        {e.agora.length > 0 && <span style={{ display: 'block', marginTop: 6 }}>Agora: {e.agora.join(', ')}</span>}
                      </>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {diario.length > 0 && (
              <div className="card">
                <div className="card-h"><h3><span className="hi"><NotebookPen /></span>Novidades da obra</h3></div>
                <div className="card-b"><div className="tl">
                  {diario.map(d => <div key={d.id} className="tl-i"><b>{fmtLonga(d.data)}</b><span>{d.texto}</span>{d.foto && <img src={img(d.foto)} alt="" loading="lazy" />}</div>)}
                </div></div>
              </div>
            )}

            {p.fengshui.pessoas.length > 0 && (
              <div className="card">
                <div className="card-h"><h3><span className="hi" style={{ background: '#EEE7F7', color: '#6B3FA0' }}><Compass /></span>Seu Feng Shui</h3><span className="mut" style={{ fontSize: 12.5 }}>Porta de entrada a {DIRECOES[p.fengshui.porta]}</span></div>
                <div className="card-b"><div className="g2">{p.fengshui.pessoas.map(x => <KuaCard key={x.id} pessoa={x} />)}</div></div>
              </div>
            )}
          </div>

          <div className="stack">
            <div className="card psec">
              <div className="card-h"><h3><span className="hi" style={{ background: 'var(--ok-s)', color: 'var(--ok)' }}><Receipt /></span>Pagamentos</h3><span className="mut" style={{ fontSize: 12.5 }}>{f.pct}% pago</span></div>
              <div style={{ padding: '12px 18px 4px' }}><div className="progress"><i style={{ width: f.pct + '%' }} /></div></div>
              {p.parcelas.slice().sort((a, b) => a.venc.localeCompare(b.venc)).map(x => {
                const st = statusParcela(x);
                const I = st.key === 'pago' ? Check : st.key === 'atrasado' ? AlertCircle : Clock;
                const cor = st.key === 'pago' ? ['var(--ok)', '#fff'] : st.key === 'atrasado' ? ['var(--bad)', '#fff'] : ['var(--warn-s)', 'var(--warn)'];
                return (
                  <div key={x.id} className={`pay ${st.key}`}>
                    <div className="ic" style={{ background: cor[0], color: cor[1] }}><I /></div>
                    <div className="pi"><b>{x.nome}</b><span>Vencimento {fmtData(x.venc)} · <span className={`badge ${st.cls}`} style={{ height: 18, fontSize: 10.5 }}>{st.label}</span></span></div>
                    <span className="val"><Money v={x.valor} /></span>
                  </div>
                );
              })}
              <div className="totals" style={{ justifyContent: 'space-between' }}><div style={{ textAlign: 'left' }}>Pago<b style={{ color: 'var(--ok)' }}><Money v={f.pago} /></b></div><div>Falta<b><Money v={f.falta} /></b></div></div>
            </div>
            <div className="card">
              <div className="card-h"><h3><span className="hi" style={{ background: 'var(--warn-s)', color: 'var(--warn)' }}><Images /></span>Imagens do projeto</h3></div>
              <div className="card-b"><div className="thumbs">{p.fotos.slice(0, 6).map((ft, i) => <button key={ft} onClick={() => setLb(i)}><img src={img(ft)} alt="" loading="lazy" /></button>)}</div></div>
            </div>
            <div className="card card-b" style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: 12 }}>Ficou com alguma dúvida?</p>
              <a className="wa-btn" target="_blank" rel="noopener" href={zap(`Oi, Giullia! Estou vendo o portal do ${p.nome} e queria tirar uma dúvida.`)}><WhatsIcon />Falar com a Giullia</a>
            </div>
          </div>
        </div>
      </main>
      {lb !== null && <Lightbox fotos={p.fotos} inicio={lb} onClose={() => setLb(null)} />}
      <a className="back-demo" href={`#/projeto/${p.id}`}><ArrowLeft />Voltar ao sistema (demo)</a>
    </div>
  );
}
