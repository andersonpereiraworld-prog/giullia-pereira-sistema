# Giu. Gestão de Projetos (prévia)

Protótipo clicável do sistema de gestão pra Giullia Pereira Arquitetura & Feng Shui,
feito em 23/10/2026 como material de prospecção (reativação de cliente antiga).
Inspirado no ARQPROJECT, com um módulo de Feng Shui que é diferencial dela.

**Só front-end:** dados fictícios em `src/data.js`, salvos no `localStorage` de quem abre.
Clientes e valores são inventados; as fotos são dos projetos reais da Giullia.
O menu do avatar tem "Restaurar dados da demonstração".

## Rodar

```
npm install
npm run dev      # desenvolvimento
npm run build    # gera dist/ (estático, sobe direto na Vercel)
```

## Telas

| Rota | Tela |
| --- | --- |
| `#/` | Início: números do mês, agenda (prazos + parcelas + reuniões), projetos e atrasados |
| `#/projetos` | Lista de projetos + novo projeto (já vem com cronograma padrão) |
| `#/projeto/:id` | Tudo do projeto numa tela: capa, progresso, financeiro, prazo, seções, linha do tempo, diário, fotos |
| `#/projeto/:id/cronograma` | Gantt com dependências: arrastar muda a data, puxar a ponta muda a duração, a cadeia se ajusta |
| `#/projeto/:id/pagamentos` | Parcelas (gerador entrada + N parcelas), pago/pendente/em atraso, lembrete no WhatsApp |
| `#/projeto/:id/fengshui` | Porta de entrada (bússola), número Kua de cada morador, mapa Bagua clicável sobre a planta |
| `#/financeiro` | Fluxo de caixa do mês: entradas, saídas, saldo previsto/realizado, vencidos, baixa |
| `#/briefings` | Formulários por link + respostas (com Kua) + vincular ao projeto |
| `#/b/:form` | Briefing que o cliente responde (público) |
| `#/portal/:id` | Portal do cliente (público): etapas, novidades da obra, parcelas, Feng Shui |

## Regras que estão no código

- Cronograma: `src/schedule.js`. Atividade com predecessora começa no dia seguinte ao fim
  dela + intervalo; arrastar uma atividade com predecessora muda o intervalo.
- Kua: `src/fengshui.js`. Escola das Oito Mansões, ano solar chinês virando em 4/fev.
  Bagua alinhado pela porta (Carreira sempre na parede de entrada).

## Se a Giullia fechar

O sistema de verdade sai no stack padrão (PHP 8 + MySQL + React/Vite), com login,
banco e upload de fotos/comprovantes. Estas telas servem de base pro front-end.
