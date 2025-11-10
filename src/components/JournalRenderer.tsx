// src/components/JournalRenderer.tsx

import React from "react";
import parse, { domToReact, Element, DOMNode } from "html-react-parser";
import { DynamicIcon } from "@/lib/icons";

interface JournalRendererProps {
  content: string | null | undefined;
}

const options = {
  replace: (domNode: DOMNode) => {
    // Verifica se o nó é um elemento (tag)
    if (domNode instanceof Element && domNode.attribs) {
      // Procura pela nossa tag personalizada
      if (domNode.name === "journal-icon") {
        const iconName = domNode.attribs["data-name"];
        return <DynamicIcon name={iconName} />;
      }
    }
    // Caso contrário, não faz nada (deixa o parser padrão lidar)
    return domToReact(domNode.children as DOMNode[], options);
  },
};

export const JournalRenderer = ({ content }: JournalRendererProps) => {
  if (!content) {
    return <p className="text-muted-foreground italic">Nada escrito ainda.</p>;
  }

  // Usa a classe 'prose' para aplicar a estilização do Tailwind
  return (
    <div className="prose prose-sm prose-invert max-w-none">
      {parse(content, options)}
    </div>
  );
};