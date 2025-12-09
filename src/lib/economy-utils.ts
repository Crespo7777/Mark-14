// src/lib/economy-utils.ts

export const CURRENCY_RATES = {
  TALER: 100,
  SHEKEL: 10,
  ORTEGA: 1
};

export interface Money {
  taler: number;
  shekel: number;
  ortega: number;
}

export const convertToOrtegas = (money: Money): number => {
  return (
    (money.taler || 0) * CURRENCY_RATES.TALER +
    (money.shekel || 0) * CURRENCY_RATES.SHEKEL +
    (money.ortega || 0) * CURRENCY_RATES.ORTEGA
  );
};

export const convertFromOrtegas = (totalOrtegas: number): Money => {
  let remaining = totalOrtegas;
  const taler = Math.floor(remaining / CURRENCY_RATES.TALER);
  remaining %= CURRENCY_RATES.TALER;
  const shekel = Math.floor(remaining / CURRENCY_RATES.SHEKEL);
  remaining %= CURRENCY_RATES.SHEKEL;
  const ortega = remaining;
  return { taler, shekel, ortega };
};

// --- FUNÇÃO MELHORADA: Formatar Preço Misto ---
// Exemplo: 105 vira "1 Táler, 5 Ortegas" em vez de "105 Ortegas"
export const formatPrice = (priceInOrtegas: number): string => {
  if (priceInOrtegas === 0) return "Grátis";

  const { taler, shekel, ortega } = convertFromOrtegas(priceInOrtegas);
  const parts: string[] = [];

  // Constrói a string apenas com as moedas que existem
  if (taler > 0) parts.push(`${taler} Tálers`);
  if (shekel > 0) parts.push(`${shekel} Xelins`);
  if (ortega > 0) parts.push(`${ortega} Ortegas`);

  return parts.join(", ");
};

// Helper para obter o ícone/cor baseado no valor (opcional para UI)
export const getPriceType = (priceInOrtegas: number): 'taler' | 'shekel' | 'ortega' => {
  if (priceInOrtegas >= 100) return 'taler';
  if (priceInOrtegas >= 10) return 'shekel';
  return 'ortega';
};