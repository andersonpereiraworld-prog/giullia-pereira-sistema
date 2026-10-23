import { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, X, Send, Sparkles } from 'lucide-react';
import { useStore, update } from '../store';
import { DIRECOES, kua } from '../fengshui';
import { HOJE, uid } from '../util';
import { toast } from '../ui';
import { Rosa, KuaCard } from './FengShui';

const OPC = {
  residencial: {
    tipos: ['Apartamento', 'Casa', 'Casa de praia', 'Cobertura'],
    objetivos: ['Casa mais organizada', 'Receber amigos', 'Mais harmonia na família', 'Prosperidade', 'Descanso e sono melhor', 'Home office', 'Mais contato com a natureza', 'Quarto de bebê ou criança'],
    pessoas: 'Quem mora no imóvel?', pessoasLead: 'Com a data de nascimento de cada morador eu calculo o número Kua: as direções que favorecem cada um.',
  },
  consultorio: {
    tipos: ['Consultório', 'Clínica', 'Sala comercial', 'Espaço de estética'],
    objetivos: ['Paciente se sentir acolhido', 'Passar confiança e sofisticação', 'Atender mais pacientes', 'Fluxo de atendimento melhor', 'Espaço bonito pra fotos', 'Equipe mais produtiva'],
    pessoas: 'Quem trabalha no espaço?', pessoasLead: 'Com a data de nascimento eu calculo o número Kua e posiciono a sua mesa na direção mais favorável.',
  },
};
const ESTILOS = ['Contemporâneo', 'Minimalista', 'Natural / orgânico', 'Clássico', 'Industrial', 'Boho', 'Escandinavo'];

export default function BriefingPublico({ formId }) {
  const s = useStore();
  const form = s.forms.find(f => f.id === formId) || s.forms[0];
  const o = OPC[form.tipo];
  const [passo, setPasso] = useState(0);
  const [enviado, setEnviado] = useState(null);
  const [f, setF] = useState({ nome: '', whatsapp: '', email: '', tipo: o.tipos[0], area: '', bairro: '', porta: '', pessoas: [{ id: uid(), nome: '', nasc: '', genero: 'F' }], objetivos: [], estilo: [], cores: '', evitar: '', indispensavel: '' });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const toggle = (k, v) => set(k, f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v]);
  const setP = (i, k, v) => set('pessoas', f.pessoas.map((p, j) => j === i ? { ...p, [k]: v } : p));

  const validar = () => {
    if (passo === 0 && (!f.nome.trim() || !f.whatsapp.trim())) return 'Preencha seu nome e WhatsApp';
    if (passo === 2 && !f.pessoas.some(p => p.nome.trim() && p.nasc)) return 'Informe pelo menos uma pessoa com data de nascimento';
    return null;
  };
  const avancar = () => { const e = validar(); if (e) return toast(e); setPasso(passo + 1); window.scrollTo(0, 0); };
  const enviar = () => {
    const r = {
      id: uid(), formId: form.id, data: HOJE, lida: false, projetoId: null,
      nome: f.nome.trim(), whatsapp: f.whatsapp, email: f.email,
      imovel: { tipo: f.tipo, area: f.area, bairro: f.bairro, porta: f.porta },
      pessoas: f.pessoas.filter(p => p.nome.trim() && p.nasc), objetivos: f.objetivos, estilo: f.estilo,
      cores: f.cores, evitar: f.evitar, indispensavel: f.indispensavel,
    };
    update(d => { d.respostas.unshift(r); });
    setEnviado(r); window.scrollTo(0, 0);
  };

  const passos = [
    <>
      <h2>Vamos começar o seu <em>projeto</em></h2>
      <p className="lead">Leva uns 5 minutos. Com essas respostas eu já chego na nossa primeira conversa sabendo o que você precisa.</p>
      <div className="f"><label>Seu nome</label><input value={f.nome} onChange={e => set('nome', e.target.value)} autoComplete="name" /></div>
      <div className="row2">
        <div className="f"><label>WhatsApp</label><input value={f.whatsapp} onChange={e => set('whatsapp', e.target.value)} inputMode="tel" autoComplete="tel" placeholder="(85) 9 0000-0000" /></div>
        <div className="f"><label>E-mail</label><input value={f.email} onChange={e => set('email', e.target.value)} inputMode="email" autoComplete="email" /></div>
      </div>
    </>,
    <>
      <h2>Sobre o <em>espaço</em></h2>
      <p className="lead">Se não souber a direção da porta, tudo bem: confiro na visita com a bússola.</p>
      <div className="f"><label>Tipo de imóvel</label><div className="chips">{o.tipos.map(t => <button key={t} className={`chip ${f.tipo === t ? 'on' : ''}`} onClick={() => set('tipo', t)}>{t}</button>)}</div></div>
      <div className="row2">
        <div className="f"><label>Área aproximada (m²)</label><input inputMode="numeric" value={f.area} onChange={e => set('area', e.target.value)} /></div>
        <div className="f"><label>Bairro</label><input value={f.bairro} onChange={e => set('bairro', e.target.value)} /></div>
      </div>
      <div className="f"><label>Pra que direção fica a porta de entrada?</label>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Rosa valor={f.porta} onChange={d => set('porta', d)} />
          <div><b>{f.porta ? DIRECOES[f.porta] : 'Não sei ainda'}</b><br /><button className="btn ghost sm" onClick={() => set('porta', '')} style={{ paddingLeft: 0 }}>Não sei</button></div>
        </div>
      </div>
    </>,
    <>
      <h2>{o.pessoas}</h2>
      <p className="lead">{o.pessoasLead}</p>
      {f.pessoas.map((p, i) => (
        <div className="pessoa" key={p.id}>
          <div><label>Nome</label><input value={p.nome} onChange={e => setP(i, 'nome', e.target.value)} /></div>
          <div><label>Nascimento</label><input type="date" value={p.nasc} onChange={e => setP(i, 'nasc', e.target.value)} /></div>
          <div><label>Gênero</label><select value={p.genero} onChange={e => setP(i, 'genero', e.target.value)}><option value="F">Fem.</option><option value="M">Masc.</option></select></div>
          <button className="icon-act" style={{ height: 42 }} disabled={f.pessoas.length === 1} onClick={() => set('pessoas', f.pessoas.filter((_, j) => j !== i))} aria-label="Remover"><X /></button>
        </div>
      ))}
      <button className="btn sm" onClick={() => set('pessoas', [...f.pessoas, { id: uid(), nome: '', nasc: '', genero: 'F' }])}><Plus />Adicionar pessoa</button>
    </>,
    <>
      <h2>O que você quer <em>sentir</em> nesse espaço?</h2>
      <p className="lead">Marque quantas quiser.</p>
      <div className="f"><label>Objetivos</label><div className="chips">{o.objetivos.map(t => <button key={t} className={`chip ${f.objetivos.includes(t) ? 'on' : ''}`} onClick={() => toggle('objetivos', t)}>{t}</button>)}</div></div>
      <div className="f" style={{ marginTop: 8 }}><label>Estilos que você gosta</label><div className="chips">{ESTILOS.map(t => <button key={t} className={`chip ${f.estilo.includes(t) ? 'on' : ''}`} onClick={() => toggle('estilo', t)}>{t}</button>)}</div></div>
    </>,
    <>
      <h2>Pra fechar, o <em>essencial</em></h2>
      <p className="lead">Quanto mais detalhe, melhor.</p>
      <div className="row2">
        <div className="f"><label>Cores que você gosta</label><input value={f.cores} onChange={e => set('cores', e.target.value)} /></div>
        <div className="f"><label>Cores que você evita</label><input value={f.evitar} onChange={e => set('evitar', e.target.value)} /></div>
      </div>
      <div className="f"><label>O que não pode faltar no projeto?</label><textarea value={f.indispensavel} onChange={e => set('indispensavel', e.target.value)} placeholder="Ex.: um home office pra trabalhar 3x por semana e um cantinho de leitura." /></div>
    </>,
  ];

  return (
    <div className="pub">
      <header className="pub-top"><img src="./img/logo-magenta.png" alt="Giullia Pereira Arquitetura & Feng Shui" /><span className="mut" style={{ fontSize: 12.5 }}>{form.nome}</span></header>
      <main className="pub-main bf">
        {enviado ? (
          <div className="bf-card">
            <span className="badge b-ok"><Sparkles />Briefing enviado</span>
            <h2 style={{ marginTop: 14 }}>Obrigada, <em>{enviado.nome.split(' ')[0]}</em>!</h2>
            <p className="lead">Recebi suas respostas e te chamo no WhatsApp pra marcarmos a primeira conversa. Enquanto isso, olha o que o Feng Shui já diz sobre {enviado.pessoas.length > 1 ? 'vocês' : 'você'}:</p>
            <div className="stack">{enviado.pessoas.map(p => <KuaCard key={p.id} pessoa={p} />)}</div>
            {enviado.pessoas.some(p => kua(p.nasc, p.genero)) && <p className="hint" style={{ marginTop: 12 }}>Essas são as direções que favorecem cada pessoa. No projeto, uso isso pra posicionar cama, mesa de trabalho e sofá.</p>}
          </div>
        ) : (
          <div className="bf-card">
            <div className="bf-steps">{passos.map((_, i) => <i key={i} className={i <= passo ? 'on' : ''} />)}</div>
            {passos[passo]}
            <div className="bf-nav">
              {passo > 0 ? <button className="btn" onClick={() => setPasso(passo - 1)}><ArrowLeft />Voltar</button> : <span />}
              {passo < passos.length - 1 ? <button className="btn pri" onClick={avancar}>Continuar<ArrowRight /></button> : <button className="btn pri" onClick={enviar}><Send />Enviar respostas</button>}
            </div>
          </div>
        )}
      </main>
      <a className="back-demo" href="#/briefings"><ArrowLeft />Voltar ao sistema (demo)</a>
    </div>
  );
}
