// src/features/character/hooks/useCharacterCalculations.ts

import { useMemo } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { roundUpDiv, Armor, InventoryItem } from "../character.schema";

/**
 * Este Hook isola toda a lógica de cálculos derivados da ficha.
 * Ele "assiste" os campos do formulário (como atributos) e retorna
 * os valores calculados (como Limiar de Dor, Vitalidade Máxima).
 */
export const useCharacterCalculations = () => {
  // 1. CORREÇÃO: Ler o 'form' diretamente do contexto
  const { form } = useCharacterSheet();

  // 2. "Assistir" (watch) os valores DIRETAMENTE DO FORMULÁRIO
  // Isso garante que é reativo e funciona tanto para Personagem quanto para NPC
  const vigorous = form.watch("attributes.vigorous");
  const resolute = form.watch("attributes.resolute");
  const quick = form.watch("attributes.quick");
  const toughnessBonus = form.watch("toughness.bonus");
  const armors = form.watch("armors");
  const inventory = form.watch("inventory");
  const experience = form.watch("experience");

  /**
   * REGRA: Vitalidade Máx = Math.max(10, Vigoroso) + Bônus
   */
  const toughnessMax = useMemo(() => {
    const base = Math.max(10, vigorous || 10); // || 10 para evitar NaN
    return base + (toughnessBonus || 0);
  }, [vigorous, toughnessBonus]);

  /**
   * REGRA: Limiar de Dor = Vigoroso / 2 (arredondado para cima)
   */
  const painThreshold = useMemo(() => {
    return roundUpDiv(vigorous || 10, 2);
  }, [vigorous]);

  /**
   * REGRA: Limiar de Corrupção = Resoluto / 2 (arredondado para cima)
   */
  const corruptionThreshold = useMemo(() => {
    return roundUpDiv(resolute || 10, 2);
  }, [resolute]);

  /**
   * CÁLCULO DE PESO (CARGA)
   */
  const currentWeight = useMemo(() => {
    if (!Array.isArray(inventory)) return 0;
    return inventory.reduce(
      (acc: number, item: InventoryItem) =>
        acc + (item.weight || 0) * (item.quantity || 0), // (Peso x Quantidade)
      0,
    );
  }, [inventory]);

  // Limiar de Carga = Vigoroso
  const encumbranceThreshold = useMemo(() => vigorous || 10, [vigorous]);
  // Carga Máxima = Vigoroso * 2
  const maxEncumbrance = useMemo(() => (vigorous || 10) * 2, [vigorous]);

  // Penalidade de Carga = Peso Atual - Limiar (mínimo 0)
  const encumbrancePenalty = useMemo(() => {
    return Math.max(0, currentWeight - encumbranceThreshold);
  }, [currentWeight, encumbranceThreshold]);

  /**
   * ATUALIZADO: Defesa Total = Rápido - Total Obstrutivo - Penalidade de Carga
   */
  const totalDefense = useMemo(() => {
    let totalObstrutiva = 0;
    if (Array.isArray(armors)) {
      totalObstrutiva = armors
        .filter((a: Armor) => a.equipped) // Filtra apenas equipadas
        .reduce((acc: number, a: Armor) => acc + (a.obstructive || 0), 0); // Soma a Obstrutiva
    }

    return (quick || 10) - totalObstrutiva - encumbrancePenalty;
  }, [quick, armors, encumbrancePenalty]);

  /**
   * CÁLCULO DE EXPERIÊNCIA
   */
  const currentExperience = useMemo(() => {
    return (experience?.total || 0) - (experience?.spent || 0);
  }, [experience]);

  return {
    toughnessMax,
    painThreshold,
    corruptionThreshold,
    totalDefense,
    quick: quick || 10,
    vigorous: vigorous || 10,
    currentWeight,
    encumbranceThreshold,
    maxEncumbrance,
    encumbrancePenalty,
    currentExperience,
  };
};