// src/components/TiptapIconExtension.ts

import { Node, mergeAttributes } from "@tiptap/core";

export interface JournalIconOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    journalIcon: {
      /**
       * Insere o nosso ícone personalizado
       */
      insertJournalIcon: (options: { name: string }) => ReturnType;
    };
  }
}

export const JournalIconExtension = Node.create<JournalIconOptions>({
  name: "journalIcon",
  group: "inline",
  inline: true,
  atom: true, // Garante que não podemos escrever "dentro" do ícone

  addAttributes() {
    return {
      name: {
        default: "book",
        // Usamos 'data-name' para ser um atributo HTML válido
        parseHTML: (element) => element.getAttribute("data-name"),
        renderHTML: (attributes) => ({
          "data-name": attributes.name,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "journal-icon" }];
  },

  renderHTML({ HTMLAttributes }) {
    // Renderiza como uma tag personalizada que o nosso parser React vai apanhar
    return ["journal-icon", mergeAttributes(HTMLAttributes)];
  },

  addCommands() {
    return {
      insertJournalIcon: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});