import { z } from "zod";

// --- HELPERS (Funções Auxiliares) ---

/**
 * Regra de Symbaroum: Todas as divisões são arredondadas PARA CIMA.
 * @param value O valor a ser dividido
 * @param divisor O divisor
 * @returns O resultado arredondado para cima.
 */
export const roundUpDiv = (value: number, divisor: number) => {
  return Math.ceil(value / divisor);
};


// --- SCHEMAS BÁSICOS (Sub-partes da Ficha) ---

/**
 * 1. ATRIBUTOS
 * Os 8 atributos principais. Atualizamos os nomes conforme sua lista.
 * Valores padrão 10.
 */
const attributesSchema = z.object({
  // Astuto
  cunning: z.number().min(5).max(15).default(10),
  // Discreto
  discreet: z.number().min(5).max(15).default(10),
  // Persuasivo
  persuasive: z.number().min(5).max(15).default(10),
  // Preciso
  precise: z.number().min(5).max(15).default(10),
  // Rápido
  quick: z.number().min(5).max(15).default(10),
  // Resoluto
  resolute: z.number().min(5).max(15).default(10),
  // Vigilante
  vigilant: z.number().min(5).max(15).default(10),
  // Vigoroso
  vigorous: z.number().min(5).max(15).default(10),
});

/**
 * 2. VITALIDADE
 * Armazena o máximo e o atual.
 * O 'Limiar de Dor' (Vigoroso / 2) será um valor calculado (automático).
 * A 'Vitalidade Max' (Math.max(10, Vigoroso)) também será calculada.
 */
const toughnessSchema = z.object({
  // O 'max' aqui é o bônus de fontes (ex: Habilidades), não o valor final.
  // O valor final será (Math.max(10, attributes.vigorous) + bonus)
  bonus: z.number().default(0), 
  current: z.number().default(10),
  // O valor 'max' será calculado e passado para o 'current' no .refine
});

/**
 * 3. CORRUPÇÃO
 * Armazena temporária e permanente.
 * O 'Limiar de Corrupção' (Resoluto / 2) será um valor calculado (automático).
 */
const corruptionSchema = z.object({
  temporary: z.number().default(0),
  permanent: z.number().default(0),
});

/**
 * 4. DINHEIRO
 * Armazena as três moedas. A lógica de conversão
 * ficará nos hooks de automação.
 */
const moneySchema = z.object({
  taler: z.number().default(0),
  shekel: z.number().default(0), // Xelim
  orteg: z.number().default(0),
});

/**
 * 5. EXPERIÊNCIA
 * Total ganho e total gasto. O "Atual" será calculado (ganho - gasto).
 */
const experienceSchema = z.object({
  total: z.number().default(0),
  spent: z.number().default(0),
});

/**
 * 6. ARMAS
 * Uma lista de armas.
 */
const weaponSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()), // ID único para o .map()
  name: z.string().default("Nova Arma"),
  quality: z.string().default(""), // Qualidades (ex: "Flexível, Duas Mãos")
  damage: z.string().default("1d6"), // Dano (ex: "1d8", "1d10+2")
  attribute: z.string().default("Vigoroso"), // Atributo-chave
});

/**
 * 7. ARMADURAS
 * Uma lista de armaduras.
 * 'Defesa Total' (Rápido - Obstrutivo) será calculado.
 */
const armorSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  name: z.string().default("Nova Armadura"),
  quality: z.string().default(""), // Qualidades (ex: "Reforçada")
  protection: z.number().default(0), // Proteção
  obstructive: z.number().default(0), // Obstrutivo
  equipped: z.boolean().default(true), // Se está equipada
});


// --- O SCHEMA PRINCIPAL (A Ficha Completa) ---

export const characterSheetSchema = z.object({
  // 1. Detalhes Básicos
  name: z.string().min(1, "Nome é obrigatório").default("Novo Personagem"),
  race: z.string().default("Humano"),
  occupation: z.string().default("Aventureiro"),
  
  // 2. Atributos
  attributes: attributesSchema.default({}),

  // 3. Vitalidade
  toughness: toughnessSchema.default({}),

  // 4. Corrupção
  corruption: corruptionSchema.default({}),

  // 5. Dinheiro
  money: moneySchema.default({}),

  // 7. Experiência
  experience: experienceSchema.default({}),

  // 8. Armas
  weapons: z.array(weaponSchema).default([]),
  
  // 9. Armaduras
  armors: z.array(armorSchema).default([]),

  // TODO:
  // skills: z.array(...).default([]),
  // abilities: z.array(...).default([]),
  // inventory: z.array(...).default([]),
})
// Validação Nível Ficha: Vitalidade Atual não pode ser maior que a Máxima
// (Vamos adicionar a lógica de 'max' aqui quando criarmos o hook de cálculo)
// .refine((data) => data.toughness.current <= data.toughness.max, {
//   message: "Vitalidade atual não pode ser maior que a máxima.",
//   path: ["toughness", "current"],
// });

// Este é o tipo TypeScript que usaremos em toda a aplicação
export type CharacterSheetData = z.infer<typeof characterSheetSchema>;

// Função para criar uma ficha padrão
export const getDefaultCharacterSheetData = (name: string): CharacterSheetData => {
  // O .parse({}) aplica todos os .default() que definimos
  const defaultData = characterSheetSchema.parse({});
  defaultData.name = name;
  return defaultData;
};