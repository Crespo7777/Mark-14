// src/components/JournalRenderer.tsx

import React from "react";
import DOMPurify from "dompurify";

interface JournalRendererProps {
  content: string | null | undefined;
  className?: string; 
}

export const JournalRenderer = ({ content, className }: JournalRendererProps) => {
  if (!content) {
    return <p className="text-muted-foreground italic">Nada escrito ainda.</p>;
  }

  // Sanitiza o conteúdo HTML para prevenir ataques XSS
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <div
      className={`prose prose-sm prose-invert max-w-none ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};