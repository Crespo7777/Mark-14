// src/components/RichTextEditor.tsx

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  // Smile (ícone) foi removido
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";

// --- TODAS AS IMPORTAÇÕES DE ÍCONE FORAM REMOVIDAS ---

// --- COMPONENTE IconPicker FOI REMOVIDO ---

// --- Barra de Ferramentas (Simplificada) ---
const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 rounded-t-md border border-b-0 border-input bg-muted/50">
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        <Heading1 className="w-4 h-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className="w-4 h-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 3 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        <Heading3 className="w-4 h-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 w-[1px] mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-4 h-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-4 h-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="w-4 h-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 w-[1px] mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="w-4 h-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="w-4 h-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="w-4 h-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("code")}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="w-4 h-4" />
      </Toggle>

      {/* --- O SELETOR DE ÍCONE FOI REMOVIDO DAQUI --- */}
    </div>
  );
};

// --- O Editor Principal (Atualizado) ---
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "Comece a escrever...",
      }),
      // --- A EXTENSÃO DE ÍCONE FOI REMOVIDA DAQUI ---
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm prose-invert max-w-none min-h-[300px] w-full rounded-b-md border border-t-0 border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      },
    },
  });

  // Corrigir o problema de o conteúdo não atualizar quando o 'value' muda por fora
  if (editor && editor.getHTML() !== value && value.trim() === '') {
    editor.commands.setContent(value, false);
  }

  return (
    <div className="flex flex-col">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};