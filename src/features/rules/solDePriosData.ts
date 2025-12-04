export const SOL_DE_PRIOS_RULES = `
# Sol de Prios
O jogo simula a criação de um reino sob as bênçãos do Deus Sol (Prios) e os infortúnios da Lua.

## Objetivos
Acumular **24 proventos**, nem mais, nem menos. O jogador mais próximo de 24 sem ultrapassar vence.

## Como Jogar (3 Dias/Rodadas)
1. **Dia:** Saque 1 Carta do Sol e 1 Carta da Lua. Negocie cartas do Sol se desejar.
2. **Noite:** Jogue cartas da Lua (efeitos) ou guarde-as. Cartas usadas são descartadas.
3. **Fim do Dia:** O dia vira e o processo repete-se.

## Final da Partida
1. Antes de revelar, cada jogador pode descartar 1 carta do Sol.
2. Cada jogador entrega sua carta da Lua para outro jogador (escolha livre).
3. Todos revelam as cartas do Sol e somam.
4. As cartas da Lua entregues no passo 2 são reveladas e aplicadas a quem as recebeu.

## Desempate
1. Mais próximo de 24.
2. Menos cartas do Sol.
3. Nova rodada.
`;

export const SOL_DE_PRIOS_CARDS = [
  { title: "Magician", type: "moon", description: "Nem tudo é cordial. Escolha uma carta do sol de qualquer jogador e force a revelação dele para a mesa." },
  { title: "The Emperor", type: "moon", description: "Ordene a troca de 1 carta do sol entre dois jogadores. Eles escolhem qual entregar." },
  { title: "The Empress", type: "moon", description: "Roube a carta do sol de maior ou menor valor de um oponente. Pode devolver uma carta sua em troca se quiser." },
  { title: "The Sun", type: "moon", description: "Copia o efeito de qualquer carta da lua já usada neste jogo. Anuncie qual está copiando." },
  { title: "The Moon", type: "moon", description: "Descarte a sua maior carta do sol. Se tiver só uma, saque outra e descarte a maior." },
  { title: "Judgement", type: "moon", description: "O jogador que você acha estar ganhando deve revelar todas as suas cartas do sol." },
  { title: "Major Fortune", type: "moon", description: "+2 ou -2 na sua pontuação final. Você decide." },
  { title: "Justice", type: "moon", description: "Reverta qualquer efeito de Carta da Lua ocorrido na última rodada." },
  { title: "Temperance", type: "moon", description: "Escolha um jogador e 'Mínimo' ou 'Extremo'. Extremo = revela maior carta. Mínimo = revela menor carta." },
  { title: "Strength", type: "moon", description: "Protege todas as suas cartas do sol contra roubo/manipulação até o final da rodada." },
  { title: "The Hangedman", type: "moon", description: "Entregue sua maior carta do sol a um oponente. Em troca, saque duas do baralho." },
  { title: "The High Priestess", type: "moon", description: "Olhe a mão de cartas do sol de um oponente e troque uma carta sua por uma dele." },
  { title: "The Fool", type: "moon", description: "Mostre suas cartas escondidas a um oponente. Ele escolhe uma aleatória para você descartar." },
  { title: "The Chariot", type: "moon", description: "Roube uma carta da Lua de um oponente. Se não tiver, saque do baralho." },
  { title: "The Devil", type: "moon", description: "Oponente descarta a menor carta do sol. Se tiver só uma, saca mais uma e descarta a menor." },
  { title: "The Tower", type: "moon", description: "Uma nova rodada (dia e noite extra) é adicionada ao jogo." },
  { title: "The Hermit", type: "moon", description: "Olhe a mão de cartas do sol de todos os jogadores." },
  { title: "The Lovers", type: "moon", description: "Junte a uma carta do sol para protegê-la permanentemente. Impossível roubar." },
  { title: "The World", type: "moon", description: "Reação: Cancele o efeito de qualquer carta da lua usada nessa rodada." },
  { title: "The Star", type: "moon", description: "Impede o efeito de até duas cartas da lua usadas em você na última etapa." },
  { title: "The Hierophant", type: "moon", description: "Troque sua carta da Lua por uma de um oponente. Pode rodar a mesa. Sem valor na última rodada." },
  { title: "Death", type: "moon", description: "Oponente descarta TODAS as cartas do sol e saca a mesma quantidade do baralho." },
  { title: "Justiça de Prios", type: "general", description: "Regra Especial: Se alguém mentir ao entregar cartas, pode ser desafiado. Mentiroso descarta a maior carta. Acusador errado descarta a menor." }
];