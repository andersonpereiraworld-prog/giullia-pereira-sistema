// Dados de demonstração. Clientes e valores são fictícios; fotos são dos projetos reais da Giullia.
// Todas as datas são relativas a hoje, pra prévia sempre ter atraso, etapa em andamento etc.
import { HOJE, addDias, toISO, fromISO, uid } from './util';
import { calcular, pctPelaData } from './schedule';

export const CATS = [
  { id: 'proj', nome: 'Projeto', cor: '#A3004D' },
  { id: 'obra', nome: 'Obra civil', cor: '#C9822B' },
  { id: 'marc', nome: 'Marcenaria', cor: '#8A6A55' },
  { id: 'acab', nome: 'Acabamentos e Feng Shui', cor: '#00796B' },
];
export const STATUS = ['Projeto', 'Obra', 'Concluído'];
export const FORMAS = ['PIX', 'Boleto', 'Transferência', 'Cartão de crédito', 'Débito automático', 'Dinheiro'];
export const CAT_SAIDA = ['Pró-labore', 'Equipe', 'Escritório', 'Software', 'Serviços', 'Marketing', 'Impressões', 'Materiais', 'Taxas', 'Outros'];
export const CAT_ENTRADA = ['Projetos', 'Consultoria Feng Shui', 'Consultoria', 'Outros'];
export const CAPAS = [
  ['living-verde', 10], ['consultorio-rose', 10], ['cozinha-gourmet', 7],
  ['consultorio-onix', 7], ['clinica-dourada', 9], ['consultorio-urbano', 8],
];

export function cronogramaPadrao(ini, comPct = true) {
  const p = uid() + '-';
  const A = (id, cat, nome, dur, preds = [], extra = {}) => ({
    id: p + id, cat, nome, dur, inicio: ini, pct: 0, resp: 'Giullia Pereira', desc: '',
    preds: preds.map(x => Array.isArray(x) ? { id: p + x[0], gap: x[1] } : { id: p + x, gap: 0 }),
    ...extra,
  });
  const obra = { resp: 'Construtora Alves' }, marc = { resp: 'Marcenaria Bonfim' };
  const acts = [
    A('lev', 'proj', 'Levantamento e medição', 3),
    A('est', 'proj', 'Estudo preliminar e leitura de Feng Shui', 7, ['lev']),
    A('ant', 'proj', 'Anteprojeto e imagens 3D', 10, ['est']),
    A('exe', 'proj', 'Projeto executivo e detalhamento', 12, ['ant']),
    A('apr', 'proj', 'Aprovação final do cliente', 1, ['exe'], { marco: true }),
    A('dem', 'obra', 'Demolição e preparação', 5, [['apr', 3]], obra),
    A('ins', 'obra', 'Instalações elétricas e hidráulicas', 8, ['dem'], obra),
    A('ges', 'obra', 'Gesso, forro e iluminação embutida', 6, ['ins'], obra),
    A('rev', 'obra', 'Revestimentos e piso', 8, ['ges'], obra),
    A('med', 'marc', 'Medição fina da marcenaria', 2, ['ges'], marc),
    A('pro', 'marc', 'Produção da marcenaria', 20, ['med'], marc),
    A('mon', 'marc', 'Montagem da marcenaria', 5, ['pro', 'rev'], marc),
    A('pin', 'acab', 'Pintura', 5, ['rev'], obra),
    A('ilu', 'acab', 'Luminárias e metais', 3, ['pin']),
    A('dec', 'acab', 'Decoração e ajustes de Feng Shui', 4, ['mon', 'ilu']),
    A('ent', 'acab', 'Entrega e vistoria', 1, ['dec'], { marco: true }),
  ];
  if (comPct) {
    const r = calcular(acts);
    acts.forEach(a => { a.pct = pctPelaData(r[a.id].ini, r[a.id].fim, a.dur); });
  }
  return acts;
}

export function gerarParcelas({ total, entrada, entradaForma, entradaVenc, n, forma, intervalo, primeira, rotulos = [] }) {
  const lista = [];
  if (entrada > 0) lista.push({ id: uid(), nome: 'Entrada (sinal do contrato)', venc: entradaVenc, forma: entradaForma, valor: entrada, pago: false, pagoEm: null });
  const resto = Math.round((total - entrada) * 100) / 100;
  if (n > 0 && resto > 0) {
    const v = Math.floor((resto / n) * 100) / 100;
    for (let i = 1; i <= n; i++) {
      lista.push({
        id: uid(),
        nome: `Parcela ${i}/${n}${rotulos[i - 1] ? ' — ' + rotulos[i - 1] : ''}`,
        venc: addDias(primeira, intervalo * (i - 1)),
        forma, valor: i === n ? Math.round((resto - v * (n - 1)) * 100) / 100 : v, pago: false, pagoEm: null,
      });
    }
  }
  return lista;
}

const ROT5 = ['Estudo preliminar', 'Anteprojeto', 'Projeto executivo', 'Acompanhamento de obra', 'Entrega'];
const ROT4 = ['Anteprojeto', 'Projeto executivo', 'Acompanhamento de obra', 'Entrega'];
const ROT3 = ['Anteprojeto', 'Projeto executivo', 'Entrega'];

function parcelasDemo(total, n, iniOff, rot, naoPagas = []) {
  const ent = Math.round(total * 0.3);
  const l = gerarParcelas({ total, entrada: ent, entradaForma: 'PIX', entradaVenc: addDias(HOJE, iniOff), n, forma: 'PIX', intervalo: 30, primeira: addDias(HOJE, iniOff + 30), rotulos: rot });
  l.forEach((x, i) => { if (x.venc <= HOJE && !naoPagas.includes(i)) { x.pago = true; x.pagoEm = addDias(x.venc, i % 2); } });
  return l;
}

const fotos = (pasta, n) => Array.from({ length: n }, (_, i) => `${pasta}/${String(i + 1).padStart(2, '0')}`);

function lancamentos() {
  const out = [];
  const base = fromISO(HOJE);
  const dia = (off, d) => { const x = new Date(base.getFullYear(), base.getMonth() + off, 1); const fim = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); x.setDate(Math.min(d, fim)); return toISO(x); };
  const fixos = [
    [5, 'Pró-labore', 'Pró-labore', 'PIX', 6000],
    [5, 'Estagiária de arquitetura', 'Equipe', 'PIX', 1500],
    [8, 'Software (AutoCAD + SketchUp)', 'Software', 'Cartão de crédito', 520],
    [10, 'Aluguel da sala', 'Escritório', 'Boleto', 2200],
    [12, 'Contabilidade', 'Serviços', 'Boleto', 650],
    [15, 'Internet e telefone', 'Escritório', 'Débito automático', 189],
    [20, 'Anúncios no Instagram', 'Marketing', 'Cartão de crédito', 400],
  ];
  for (const off of [-1, 0, 1]) {
    fixos.forEach(([d, desc, cat, forma, valor]) => {
      const data = dia(off, d);
      out.push({ id: uid(), tipo: 'saida', data, desc, cat, forma, valor, pago: data < HOJE, projetoId: null });
    });
  }
  const av = [
    [-9, 'saida', 'Plotagem do anteprojeto (6 pranchas A1)', 'Impressões', 'PIX', 180, 'cozinha', true],
    [-3, 'saida', 'Anuidade CAU (2ª parcela)', 'Taxas', 'Boleto', 340, null, false],
    [2, 'saida', 'Amostras de revestimento', 'Materiais', 'PIX', 230, 'jardim', false],
    [-6, 'entrada', 'Consultoria de Feng Shui avulsa — Ap. Aldeota', 'Consultoria Feng Shui', 'PIX', 900, null, true],
    [6, 'entrada', 'Consultoria de layout — sala comercial', 'Consultoria', 'PIX', 1200, null, false],
    [-24, 'entrada', 'Consultoria de Feng Shui avulsa — Casa no Eusébio', 'Consultoria Feng Shui', 'PIX', 1100, null, true],
  ];
  av.forEach(([off, tipo, desc, cat, forma, valor, projetoId, pago]) => out.push({ id: uid(), tipo, data: addDias(HOJE, off), desc, cat, forma, valor, pago, projetoId }));
  return out;
}

export function seed() {
  const P = o => ({ portal: true, diario: [], briefingId: null, fengshui: { porta: 'S', pessoas: [], notas: {}, faltantes: [] }, ...o });
  return {
    v: 1,
    ui: { ocultar: false },
    projetos: [
      P({
        id: 'jardim', nome: 'Apartamento Jardim', cliente: 'Marina Albuquerque', tipo: 'Residencial', bairro: 'Meireles', area: 182,
        status: 'Obra', capa: 'living-verde/01', fotos: fotos('living-verde', 10), valor: 38000,
        cronograma: cronogramaPadrao(addDias(HOJE, -50)), parcelas: parcelasDemo(38000, 5, -50, ROT5),
        briefingId: 'r-marina',
        fengshui: {
          porta: 'S', faltantes: [],
          pessoas: [{ id: uid(), nome: 'Marina', nasc: '1988-06-14', genero: 'F' }, { id: uid(), nome: 'Rafael', nasc: '1985-11-02', genero: 'M' }],
          notas: { prosperidade: 'O jardim vertical já ativa a Madeira nessa área. Manter as plantas vivas e com boa iluminação.', saude: 'Centro do living livre: tapete redondo em tom terroso, sem móvel pesado no meio.' },
        },
        diario: [
          { id: uid(), data: addDias(HOJE, -16), texto: 'Demolição finalizada e caçambas retiradas. Início das instalações na segunda.', foto: 'living-verde/04' },
          { id: uid(), data: addDias(HOJE, -6), texto: 'Instalações elétricas e hidráulicas concluídas e testadas. Pontos da cozinha conferidos com o projeto.', foto: 'living-verde/07' },
          { id: uid(), data: addDias(HOJE, -1), texto: 'Começou o forro de gesso do living. Sancas com fita de LED conforme o projeto luminotécnico.', foto: 'living-verde/02' },
        ],
      }),
      P({
        id: 'onix', nome: 'Consultório Ônix', cliente: 'Dr. Henrique Sales', tipo: 'Comercial · Saúde', bairro: 'Aldeota', area: 92,
        status: 'Obra', capa: 'consultorio-onix/01', fotos: fotos('consultorio-onix', 7), valor: 31000,
        cronograma: cronogramaPadrao(addDias(HOJE, -40)), parcelas: parcelasDemo(31000, 4, -40, ROT4, [1]),
        fengshui: { porta: 'E', pessoas: [{ id: uid(), nome: 'Henrique', nasc: '1979-03-22', genero: 'M' }], notas: {}, faltantes: ['relacionamentos'] },
        diario: [{ id: uid(), data: addDias(HOJE, -2), texto: 'Início da demolição das paredes da antiga sala de espera.', foto: 'consultorio-onix/02' }],
      }),
      P({
        id: 'cozinha', nome: 'Cozinha Gourmet', cliente: 'Família Teixeira', tipo: 'Residencial', bairro: 'Cocó', area: 38,
        status: 'Projeto', capa: 'cozinha-gourmet/01', fotos: fotos('cozinha-gourmet', 7), valor: 12000,
        cronograma: cronogramaPadrao(addDias(HOJE, -12)), parcelas: parcelasDemo(12000, 3, -12, ROT3),
        fengshui: { porta: 'N', pessoas: [{ id: uid(), nome: 'Patrícia', nasc: '1990-09-30', genero: 'F' }, { id: uid(), nome: 'André', nasc: '1987-01-20', genero: 'M' }], notas: {}, faltantes: [] },
      }),
      P({
        id: 'dourada', nome: 'Clínica Dourada', cliente: 'Dra. Beatriz Lins', tipo: 'Comercial · Saúde', bairro: 'Dionísio Torres', area: 120,
        status: 'Projeto', capa: 'clinica-dourada/02', fotos: fotos('clinica-dourada', 9), valor: 26000, portal: false,
        cronograma: cronogramaPadrao(addDias(HOJE, 2)), parcelas: parcelasDemo(26000, 5, 3, ROT5),
      }),
      P({
        id: 'rose', nome: 'Consultório Rosé', cliente: 'Dra. Camila Fontes', tipo: 'Comercial · Saúde', bairro: 'Meireles', area: 64,
        status: 'Concluído', capa: 'consultorio-rose/01', fotos: fotos('consultorio-rose', 10), valor: 24000,
        cronograma: cronogramaPadrao(addDias(HOJE, -170)), parcelas: parcelasDemo(24000, 4, -170, ROT4),
      }),
      P({
        id: 'urbano', nome: 'Consultório Urbano', cliente: 'Dr. Paulo Viana', tipo: 'Comercial · Saúde', bairro: 'Varjota', area: 70,
        status: 'Concluído', capa: 'consultorio-urbano/01', fotos: fotos('consultorio-urbano', 8), valor: 22000,
        cronograma: cronogramaPadrao(addDias(HOJE, -130)), parcelas: parcelasDemo(22000, 4, -130, ROT4),
      }),
    ],
    lancamentos: lancamentos(),
    reunioes: [
      { id: uid(), data: HOJE, hora: '14:00', titulo: 'Reunião com o marceneiro', local: 'Apartamento Jardim' },
      { id: uid(), data: addDias(HOJE, 1), hora: '09:00', titulo: 'Visita técnica', local: 'Consultório Ônix' },
      { id: uid(), data: addDias(HOJE, 2), hora: '15:00', titulo: 'Apresentação do anteprojeto', local: 'Cozinha Gourmet' },
      { id: uid(), data: addDias(HOJE, 4), hora: '10:00', titulo: 'Leitura de Feng Shui do espaço', local: 'Clínica Dourada' },
      { id: uid(), data: addDias(HOJE, 6), hora: '18:30', titulo: 'Primeira conversa — indicação', local: 'Online' },
    ],
    forms: [
      { id: 'residencial', nome: 'Briefing Residencial + Feng Shui', tipo: 'residencial', status: 'Publicado' },
      { id: 'consultorio', nome: 'Briefing Consultório e Clínica', tipo: 'consultorio', status: 'Publicado' },
    ],
    respostas: [
      {
        id: 'r-juliana', formId: 'residencial', data: addDias(HOJE, -1), lida: false, projetoId: null,
        nome: 'Juliana Rocha', whatsapp: '(85) 9 0000-0000', email: 'juliana@exemplo.com',
        imovel: { tipo: 'Apartamento', area: '95', bairro: 'Fátima', porta: 'NE' },
        pessoas: [{ id: uid(), nome: 'Juliana', nasc: '1993-04-18', genero: 'F' }, { id: uid(), nome: 'Lucas', nasc: '1991-12-05', genero: 'M' }, { id: uid(), nome: 'Helena', nasc: '2021-08-09', genero: 'F' }],
        objetivos: ['Casa mais organizada', 'Mais harmonia na família', 'Quarto da bebê'],
        estilo: ['Contemporâneo', 'Natural / orgânico'],
        cores: 'Tons de areia, verde-oliva e madeira clara', evitar: 'Muito branco e cinza frio',
        indispensavel: 'Home office pra mim (trabalho de casa 3x por semana) e um cantinho de brincar pra Helena.',
      },
      {
        id: 'r-marina', formId: 'residencial', data: addDias(HOJE, -70), lida: true, projetoId: 'jardim',
        nome: 'Marina Albuquerque', whatsapp: '(85) 9 0000-0000', email: 'marina@exemplo.com',
        imovel: { tipo: 'Apartamento', area: '182', bairro: 'Meireles', porta: 'S' },
        pessoas: [{ id: uid(), nome: 'Marina', nasc: '1988-06-14', genero: 'F' }, { id: uid(), nome: 'Rafael', nasc: '1985-11-02', genero: 'M' }],
        objetivos: ['Receber amigos', 'Prosperidade', 'Mais contato com a natureza'],
        estilo: ['Contemporâneo', 'Natural / orgânico'],
        cores: 'Verde, madeira, amarelo-mostarda', evitar: 'Preto em excesso',
        indispensavel: 'Living integrado com a varanda e um jardim vertical grande.',
      },
    ],
  };
}
