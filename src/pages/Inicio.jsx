import { useMemo, useState } from 'react';
import { CircleDollarSign, FolderOpen, Hammer, CalendarClock, ChevronLeft, ChevronRight, Users, Flag, PlayCircle, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useStore, statusParcela, financeiro } from '../store';
import { calcular, progresso } from '../schedule';
import { HOJE, addDias, addMes, mesDe, fmtMes, fmtLonga, fmtCurta, fromISO, toISO, SEMANA, brl, relDias, diffDias } from '../util';
import { Kpi, Money, img, zap, WhatsIcon } from '../ui';

function eventos(s) {
  const ev = [];
  s.projetos.forEach(p => {
    const r = calcular(p.cronograma);
    p.cronograma.forEach(a => {
      const { ini, fim } = r[a.id];
      if (a.marco) ev.push({ data: ini, tipo: 'marco', titulo: a.nome, sub: p.nome, href: `#/projeto/${p.id}/cronograma` });
      else {
        ev.push({ data: ini, tipo: 'ini', titulo: `Início: ${a.nome}`, sub: p.nome, href: `#/projeto/${p.id}/cronograma` });
        ev.push({ data: fim, tipo: 'fim', titulo: `Fim: ${a.nome}`, sub: p.nome, href: `#/projeto/${p.id}/cronograma` });
      }
    });
    p.parcelas.filter(x => !x.pago).forEach(x => ev.push({
      data: x.venc, tipo: x.venc < HOJE ? 'late' : 'pag', titulo: `Pagamento: ${x.nome.split(' — ')[0]}`, sub: `${p.nome} · ${brl(x.valor)}`, href: `#/projeto/${p.id}/pagamentos`,
    }));
  });
  s.reunioes.forEach(r => ev.push({ data: r.data, tipo: 'reu', titulo: r.titulo, sub: `${r.hora} · ${r.local}` }));
  return ev;
}
const ICO = { pag: CircleDollarSign, late: AlertTriangle, reu: Users, ini: PlayCircle, fim: CheckCircle2, marco: Flag };

function Ev({ e, when }) {
  const I = ICO[e.tipo];
  const Tag = e.href ? 'a' : 'div';
  return (
    <Tag className={`ev e-${e.tipo}`} href={e.href}>
      <div className="ei"><I /></div>
      <div><b>{e.titulo}</b><span>{e.sub}</span></div>
      {when && <span className="when">{when}</span>}
    </Tag>
  );
}

export default function Inicio() {
  const s = useStore();
  const [mes, setMes] = useState(mesDe(HOJE));
  const [dia, setDia] = useState(HOJE);
  const ev = useMemo(() => eventos(s), [s]);
  const porDia = useMemo(() => ev.reduce((m, e) => ((m[e.data] ||= []).push(e), m), {}), [ev]);

  const mesAtual = mesDe(HOJE);
  const recebido = s.projetos.flatMap(p => p.parcelas).filter(x => x.pago && x.pagoEm && mesDe(x.pagoEm) === mesAtual).reduce((t, x) => t + x.valor, 0)
    + s.lancamentos.filter(l => l.tipo === 'entrada' && l.pago && mesDe(l.data) === mesAtual).reduce((t, l) => t + l.valor, 0);
  const aReceber = s.projetos.flatMap(p => p.parcelas).filter(x => !x.pago && x.venc <= addDias(HOJE, 30));
  const ativos = s.projetos.filter(p => p.status !== 'Concluído');
  const andamento = s.projetos.flatMap(p => p.cronograma).filter(a => a.pct > 0 && a.pct < 100).length;
  const atrasadas = s.projetos.flatMap(p => p.parcelas.filter(x => statusParcela(x).key === 'atrasado').map(x => ({ ...x, p })));

  // calendário
  const prim = fromISO(mes + '-01');
  const iniGrade = addDias(toISO(prim), -prim.getDay());
  const dias = Array.from({ length: 42 }, (_, i) => addDias(iniGrade, i));
  const proximos = ev.filter(e => e.data > HOJE && e.data <= addDias(HOJE, 7) && e.tipo !== 'ini').sort((a, b) => a.data.localeCompare(b.data)).slice(0, 7);
  const doDia = (porDia[dia] || []).slice().sort((a, b) => a.tipo.localeCompare(b.tipo));

  const h = new Date().getHours();
  const saud = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <>
      <div className="hello">
        <div>
          <h1>{saud}, <em>Giullia</em></h1>
          <p>{fmtLonga(HOJE)} · {ativos.length} projetos em andamento{atrasadas.length ? ` · ${atrasadas.length} pagamento em atraso` : ''}</p>
        </div>
        <a className="btn pri" href="#/projetos"><FolderOpen />Ver projetos</a>
      </div>

      <div className="kpis">
        <Kpi tone="ok" icon={CircleDollarSign} label="Recebido no mês" value={<Money v={recebido} />} sub={fmtMes(mesAtual)} />
        <Kpi tone="warn" icon={CalendarClock} label="A receber (30 dias)" value={<Money v={aReceber.reduce((t, x) => t + x.valor, 0)} />} sub={`${aReceber.length} parcelas`} />
        <Kpi tone="mag" icon={FolderOpen} label="Projetos ativos" value={ativos.length} sub={`${ativos.filter(p => p.status === 'Obra').length} em obra`} />
        <Kpi tone="pet" icon={Hammer} label="Atividades em andamento" value={andamento} sub="nos cronogramas" />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-h"><h3><span className="hi"><CalendarClock /></span>Agenda</h3><span className="mut" style={{ fontSize: 12.5 }}>Prazos, pagamentos e reuniões de todos os projetos</span></div>
        <div className="agenda">
          <div>
            <div className="cal-h">
              <button onClick={() => setMes(addMes(mes, -1))} aria-label="Mês anterior"><ChevronLeft size={16} /></button>
              {fmtMes(mes)}
              <button onClick={() => setMes(addMes(mes, 1))} aria-label="Próximo mês"><ChevronRight size={16} /></button>
            </div>
            <div className="cal">
              {SEMANA.map(d => <div className="wd" key={d}>{d[0]}</div>)}
              {dias.map(d => (
                <button key={d} onClick={() => setDia(d)}
                  className={[mesDe(d) !== mes && 'out', d === HOJE && 'today', d === dia && 'sel'].filter(Boolean).join(' ')}>
                  {fromISO(d).getDate()}{porDia[d] && <i />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="ev-h">{dia === HOJE ? 'Hoje' : fmtLonga(dia)} <span className="badge b-mag">{doDia.length} {doDia.length === 1 ? 'evento' : 'eventos'}</span></div>
            {doDia.length ? doDia.map((e, i) => <Ev key={i} e={e} />) : <p className="mut" style={{ fontSize: 13 }}>Nada marcado pra esse dia.</p>}
          </div>
          <div>
            <div className="ev-h">Próximos 7 dias</div>
            {proximos.map((e, i) => <Ev key={i} e={e} when={relDias(e.data) === 'Amanhã' ? 'Amanhã' : fmtCurta(e.data)} />)}
          </div>
        </div>
      </div>

      <div className="g-main">
        <div className="card">
          <div className="card-h"><h3><span className="hi"><FolderOpen /></span>Projetos em andamento</h3><a className="btn ghost sm" href="#/projetos">Todos <ArrowRight size={14} /></a></div>
          <div className="plist">
            {ativos.map(p => {
              const r = calcular(p.cronograma);
              const atual = p.cronograma.filter(a => r[a.id].ini <= HOJE && r[a.id].fim >= HOJE && !a.marco)[0]
                || p.cronograma.filter(a => r[a.id].ini > HOJE).sort((a, b) => r[a.id].ini.localeCompare(r[b.id].ini))[0];
              const pr = progresso(p.cronograma);
              return (
                <a key={p.id} href={`#/projeto/${p.id}`}>
                  <img src={img(p.capa)} alt="" />
                  <div className="pi">
                    <b>{p.nome}</b>
                    <span>{p.cliente} · {atual ? (r[atual.id].ini > HOJE ? `Próximo: ${atual.nome}` : atual.nome) : 'Sem atividades'}</span>
                    <div className="progress mag"><i style={{ width: pr + '%' }} /></div>
                  </div>
                  <div className="pct">{pr}%</div>
                </a>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h3><span className="hi" style={{ background: 'var(--bad-s)', color: 'var(--bad)' }}><AlertTriangle /></span>Pagamentos em atraso</h3></div>
          {atrasadas.length ? atrasadas.map(x => (
            <div className="late-row" key={x.id}>
              <div className="li"><b>{x.p.cliente}</b><span>{x.nome.split(' — ')[0]} · venceu há {diffDias(x.venc, HOJE)} dias</span></div>
              <b className="v-out"><Money v={x.valor} /></b>
              <a className="icon-act" target="_blank" rel="noopener" title="Lembrar no WhatsApp"
                href={zap(`Oi! Tudo bem? Passando pra lembrar da ${x.nome.split(' — ')[0].toLowerCase()} do ${x.p.nome}, no valor de ${brl(x.valor)}, que venceu em ${fmtCurta(x.venc)}. Você acompanha tudo pelo portal: ${location.origin}${location.pathname}#/portal/${x.p.id}`)}>
                <WhatsIcon width={17} height={17} />
              </a>
            </div>
          )) : <div className="empty"><CheckCircle2 />Nenhum pagamento atrasado.</div>}
          <div className="card-b" style={{ borderTop: '1px solid var(--line)' }}>
            <div className="sub" style={{ marginTop: 0 }}>Financeiro dos projetos ativos</div>
            {ativos.map(p => {
              const f = financeiro(p);
              return (
                <div key={p.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span>{p.nome}</span><span className="mut"><Money v={f.pago} /> de <Money v={f.total} /></span></div>
                  <div className="progress" style={{ marginTop: 5, height: 6 }}><i style={{ width: f.pct + '%' }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
