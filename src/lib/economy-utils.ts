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

// --- NOVA FUNÇÃO: Formatar Preço para Exibição ---
export const formatPrice = (priceInOrtegas: number): string => {
  if (priceInOrtegas === 0) return "Grátis";

  // Se for múltiplo exato de 100 (Ex: 500), mostra em Tálers (5 Tálers)
  if (priceInOrtegas % 100 === 0) return `${priceInOrtegas / 100} Tálers`;
  
  // Se for múltiplo exato de 10 (Ex: 50), mostra em Xelins (5 Xelins)
  if (priceInOrtegas % 10 === 0) return `${priceInOrtegas / 10} Xelins`;

  // Caso contrário, mostra em Ortegas
  return `${priceInOrtegas} Ortegas`;
};

// Helper para obter o ícone/cor baseado no valor (opcional para UI)
export const getPriceType = (priceInOrtegas: number): 'taler' | 'shekel' | 'ortega' => {
  if (priceInOrtegas >= 100 && priceInOrtegas % 100 === 0) return 'taler';
  if (priceInOrtegas >= 10 && priceInOrtegas % 10 === 0) return 'shekel';
  return 'ortega';
}