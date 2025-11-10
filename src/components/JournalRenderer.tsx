// src/components/JournalRenderer.tsx

import React from "react";
// Imports de 'html-react-parser' e 'DynamicIcon' removidos

interface JournalRendererProps {
  content: string | null | undefined;
  className?: string; // Mantido para o line-clamp
}

// Lógica de 'options' e 'parse' removida

export const JournalRenderer = ({ content, className }: JournalRendererProps) => {
  if (!content) {
    return <p className="text-muted-foreground italic">Nada escrito ainda.</p>;
  }

  // Usa a classe 'prose' para aplicar a estilização do Tailwind
  // e renderiza o HTML diretamente, sem analisar ícones.
  return (
    <div
      className={`prose prose-sm prose-invert max-w-none ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};