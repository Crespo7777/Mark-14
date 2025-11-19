// src/lib/economy-utils.ts

export const CURRENCY_RATES = {
  TALER: 100, // 1 Taler = 100 Ortegas
  SHEKEL: 10, // 1 Xelim = 10 Ortegas
  ORTEGA: 1   // 1 Ortega = 1 Ortega
};

export interface Money {
  taler: number;
  shekel: number;
  ortega: number;
}

// Converte tudo para Ortegas (unidade base)
export const convertToOrtegas = (money: Money): number => {
  return (
    (money.taler || 0) * CURRENCY_RATES.TALER +
    (money.shekel || 0) * CURRENCY_RATES.SHEKEL +
    (money.ortega || 0) * CURRENCY_RATES.ORTEGA
  );
};

// Converte Ortegas de volta para o formato Taler/Xelim/Ortega (otimizado)
export const convertFromOrtegas = (totalOrtegas: number): Money => {
  let remaining = totalOrtegas;
  
  const taler = Math.floor(remaining / CURRENCY_RATES.TALER);
  remaining %= CURRENCY_RATES.TALER;
  
  const shekel = Math.floor(remaining / CURRENCY_RATES.SHEKEL);
  remaining %= CURRENCY_RATES.SHEKEL;
  
  const ortega = remaining;

  return { taler, shekel, ortega };
};