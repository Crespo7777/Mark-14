import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Função auxiliar para limpar texto colado (ex: de PDFs).
 * Remove hífens de quebra de linha e formata parágrafos.
 */
export const cleanPastedText = (text: string): string => {
  let cleanedText = text;

  // 1. Remove hifens no final da linha (ex: "per-\nsonagem" -> "personagem")
  cleanedText = cleanedText.replace(/-\n/g, "");

  // 2. Substitui quebras de parágrafo (2+ quebras) por um placeholder
  const placeholder = "%%PARAGRAPH_BREAK%%";
  cleanedText = cleanedText.replace(/\n\n+/g, placeholder);

  // 3. Substitui quebras de linha únicas (texto corrido) por um espaço
  cleanedText = cleanedText.replace(/\n/g, " ");

  // 4. Restaura as quebras de parágrafo
  cleanedText = cleanedText.replace(new RegExp(placeholder, "g"), "\n\n");
  
  // 5. Limpa múltiplos espaços
  cleanedText = cleanedText.replace(/ +/g, " ").trim();

  return cleanedText;
};