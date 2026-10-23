// Número Kua (Escola das Oito Mansões) e mapa Bagua (alinhado pela porta de entrada)
import { fromISO } from './util';

export const DIRECOES = { N: 'Norte', NE: 'Nordeste', E: 'Leste', SE: 'Sudeste', S: 'Sul', SO: 'Sudoeste', O: 'Oeste', NO: 'Noroeste' };

const reduz = n => { while (n > 9) n = String(n).split('').reduce((s, d) => s + +d, 0); return n; };

export function kua(nascISO, genero) {
  if (!nascISO) return null;
  const d = fromISO(nascISO);
  let ano = d.getFullYear();
  // o ano solar chinês vira por volta de 4 de fevereiro
  if (d.getMonth() === 0 || (d.getMonth() === 1 && d.getDate() < 4)) ano--;
  const n = reduz(ano % 100);
  let k;
  if (genero === 'M') k = ano < 2000 ? 10 - n : 9 - n;
  else k = reduz(ano < 2000 ? 5 + n : 6 + n);
  if (k === 0) k = 9;
  if (k === 5) k = genero === 'M' ? 2 : 8;
  return k;
}

// [prosperidade, saúde, relacionamentos, crescimento pessoal] e [desfavoráveis]
const TAB = {
  1: [['SE', 'E', 'S', 'N'], ['O', 'NE', 'NO', 'SO']],
  2: [['NE', 'O', 'NO', 'SO'], ['E', 'SE', 'S', 'N']],
  3: [['S', 'N', 'SE', 'E'], ['SO', 'NO', 'NE', 'O']],
  4: [['N', 'S', 'E', 'SE'], ['NO', 'SO', 'O', 'NE']],
  6: [['O', 'NE', 'SO', 'NO'], ['SE', 'E', 'N', 'S']],
  7: [['NO', 'SO', 'NE', 'O'], ['N', 'S', 'SE', 'E']],
  8: [['SO', 'NO', 'O', 'NE'], ['S', 'N', 'E', 'SE']],
  9: [['E', 'SE', 'N', 'S'], ['NE', 'O', 'SO', 'NO']],
};
export const FAVORAVEIS = [
  { nome: 'Sheng Chi', sentido: 'Prosperidade e sucesso', uso: 'mesa de trabalho e porta de entrada' },
  { nome: 'Tien Yi', sentido: 'Saúde', uso: 'cabeceira da cama e área de descanso' },
  { nome: 'Nien Yen', sentido: 'Amor e relacionamentos', uso: 'sala de estar e quarto do casal' },
  { nome: 'Fu Wei', sentido: 'Crescimento pessoal', uso: 'estudo, leitura e meditação' },
];

export function perfilKua(k) {
  if (!k) return null;
  const [fav, desf] = TAB[k];
  return {
    k,
    grupo: [1, 3, 4, 9].includes(k) ? 'Grupo Leste' : 'Grupo Oeste',
    favoraveis: fav.map((d, i) => ({ dir: d, ...FAVORAVEIS[i] })),
    desfavoraveis: desf,
  };
}

// grade 3x3: linha de cima = fundo do imóvel, linha de baixo = parede da porta
export const BAGUA = [
  { id: 'prosperidade', nome: 'Prosperidade', tri: 'Xun', el: 'Madeira', cor: '#7B4FA0', cores: 'roxo, verde, dourado', formas: 'retangulares, verticais', usar: 'plantas vivas, fonte de água, objetos de valor', evitar: 'lixeira, objetos quebrados, bagunça acumulada' },
  { id: 'sucesso', nome: 'Sucesso e reconhecimento', tri: 'Li', el: 'Fogo', cor: '#C62828', cores: 'vermelho, laranja, rosa forte', formas: 'triangulares, pontiagudas', usar: 'boa iluminação, velas, certificados e prêmios', evitar: 'excesso de água, espelhos grandes, azul-escuro' },
  { id: 'relacionamentos', nome: 'Relacionamentos', tri: 'Kun', el: 'Terra', cor: '#D4588A', cores: 'rosa, vermelho, terrosos', formas: 'quadradas, pares', usar: 'objetos em pares, fotos felizes do casal', evitar: 'imagens solitárias, objetos de uso individual' },
  { id: 'familia', nome: 'Família', tri: 'Zhen', el: 'Madeira', cor: '#2E7D32', cores: 'verde, azul-claro', formas: 'colunas, retângulos', usar: 'fotos de família, plantas, madeira natural', evitar: 'metal em excesso, plantas secas' },
  { id: 'saude', nome: 'Centro e saúde', tri: 'Tai Chi', el: 'Terra', cor: '#C9A227', cores: 'amarelo, terracota, bege', formas: 'quadradas, planas', usar: 'espaço livre, cerâmica, cristal no centro', evitar: 'móveis pesados, depósito, bagunça' },
  { id: 'criatividade', nome: 'Criatividade e filhos', tri: 'Dui', el: 'Metal', cor: '#8E8E93', cores: 'branco, cinza, metálicos', formas: 'redondas, ovais', usar: 'objetos de metal, arte, trabalhos manuais', evitar: 'vermelho em excesso, fogo' },
  { id: 'conhecimento', nome: 'Conhecimento e espiritualidade', tri: 'Gen', el: 'Terra', cor: '#1E5AA8', cores: 'azul, verde, terrosos', formas: 'quadradas', usar: 'livros, cantinho de leitura, meditação', evitar: 'TV, aparelhos barulhentos' },
  { id: 'carreira', nome: 'Carreira', tri: 'Kan', el: 'Água', cor: '#0D2A27', cores: 'preto, azul-escuro', formas: 'onduladas, irregulares', usar: 'porta livre e iluminada, espelho, água', evitar: 'obstáculos na entrada, sapatos acumulados' },
  { id: 'amigos', nome: 'Amigos e viagens', tri: 'Qian', el: 'Metal', cor: '#5F6B73', cores: 'cinza, branco, prata', formas: 'redondas', usar: 'mapas, fotos de viagens, objetos de metal', evitar: 'cantos escuros e entulhados' },
];
