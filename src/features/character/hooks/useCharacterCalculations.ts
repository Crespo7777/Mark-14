import { useMemo } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { roundUpDiv } from "../character.schema";

/**
 * Este Hook isola toda a lógica de cálculos derivados da ficha.
 * Ele "assiste" os campos do formulário (como atributos) e retorna
 * os valores calculados (como Limiar de Dor, Vitalidade Máxima).
 */
export const useCharacterCalculations = () => {
  const { form } = useCharacterSheet();

  // "Assiste" (watch) os atributos relevantes do formulário.
  // Isso faz com que nossos cálculos sejam reativos.
  const vigorous = form.watch("attributes.vigorous");
  const resolute = form.watch("attributes.resolute");
  const toughnessBonus = form.watch("toughness.bonus");

  // Calcula os valores derivados usando useMemo para otimização.
  // Eles só serão recalculados se os atributos assistidos mudarem.

  /**
   * REGRA: Vitalidade Máx = Math.max(10, Vigoroso) + Bônus
   */
  const toughnessMax = useMemo(() => {
    const base = Math.max(10, vigorous);
    return base + toughnessBonus;
  }, [vigorous, toughnessBonus]);

  /**
   * REGRA: Limiar de Dor = Vigoroso / 2 (arredondado para cima)
   */
  const painThreshold = useMemo(() => {
    return roundUpDiv(vigorous, 2);
  }, [vigorous]);

  /**
   * REGRA: Limiar de Corrupção = Resoluto / 2 (arredondado para cima)
   */
  const corruptionThreshold = useMemo(() => {
    return roundUpDiv(resolute, 2);
  }, [resolute]);

  return {
    toughnessMax,
    painThreshold,
    corruptionThreshold,
  };
};