// src/components/ui/textarea.tsx

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Função auxiliar para limpar o texto colado.
 * 1. Remove hifens de quebra de linha (ex: "per-\nsonagem" -> "personagem").
 * 2. Preserva quebras de parágrafo (linhas em branco).
 * 3. Remove quebras de linha únicas (texto corrido) e as substitui por espaço.
 */
const cleanPastedText = (text: string): string => {
  let cleanedText = text;

  // 1. Remove hifens no final da linha
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

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onChange, ...props }, ref) => {
    
    /**
     * Intercepta o evento de colar (onPaste).
     */
    const handlePaste = (
      event: React.ClipboardEvent<HTMLTextAreaElement>,
    ) => {
      // 1. Pega o texto da área de transferência
      const pastedText = event.clipboardData.getData("text/plain");

      // 2. Limpa o texto
      const cleanedText = cleanPastedText(pastedText);

      // 3. Se o onChange existir (vindo do react-hook-form), usamos ele
      if (onChange) {
        event.preventDefault(); // Impede a colagem padrão
        
        const target = event.target as HTMLTextAreaElement;
        const start = target.selectionStart || 0;
        const end = target.selectionEnd || 0;
        const currentValue = target.value || "";

        // Constrói o novo valor com o texto limpo inserido na posição do cursor
        const newValue =
          currentValue.substring(0, start) +
          cleanedText +
          currentValue.substring(end);

        // 4. Cria um evento sintético para o 'onChange' do react-hook-form
        const syntheticEvent = {
          ...event,
          target: { ...target, value: newValue },
        } as React.ChangeEvent<HTMLTextAreaElement>;

        onChange(syntheticEvent);
        
        // 5. Atualiza a posição do cursor para o final do texto colado
        // Usamos requestAnimationFrame para garantir que isso rode
        // após o React atualizar o valor do input.
        requestAnimationFrame(() => {
          target.selectionStart = start + cleanedText.length;
          target.selectionEnd = start + cleanedText.length;
        });

      } else {
        // Se não houver onChange, permite a colagem padrão (fallback)
        // (Isso não deve acontecer se usado com FormField)
      }
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        onChange={onChange} // Passa o onChange original
        onPaste={handlePaste} // Adiciona nosso interceptador de 'colar'
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };