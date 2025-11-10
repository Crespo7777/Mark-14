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
  Smile, // 1. Importar o ícone para o botão
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";

// --- 2. IMPORTAR AS NOVAS DEPENDÊNCIAS ---
import { iconList } from "@/lib/icons";
import { JournalIconExtension } from "./TiptapIconExtension";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "./ui/button";
import { useState } from "react";
// --- FIM DAS IMPORTAÇÕES ---

// --- 3. NOVO COMPONENTE: SELETOR DE ÍCONES ---
const IconPicker = ({ editor }: { editor: Editor }) => {
  const [open, setOpen] = useState(false);

  const handleIconSelect = (iconName: string) => {
    // Insere um espaço antes e depois do ícone para fluir melhor
    editor.chain().focus().insertContent(" ").insertJournalIcon({ name: iconName }).insertContent(" ").run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost">
          <Smile className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Procurar ícone..." />
          <CommandList>
            <CommandEmpty>Nenhum ícone encontrado.</CommandEmpty>
            <CommandGroup>
              {iconList.map((icon) => (
                <CommandItem
                  key={icon.name}
                  onSelect={() => handleIconSelect(icon.name)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {icon.icon}
                  <span>{icon.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
// --- FIM DO NOVO COMPONENTE ---

// --- Barra de Ferramentas (Atualizada) ---
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

      {/* --- 4. ADICIONAR O SELETOR DE ÍCONES À BARRA --- */}
      <Separator orientation="vertical" className="h-8 w-[1px] mx-1" />
      <IconPicker editor={editor} />
      {/* --- FIM DA ADIÇÃO --- */}
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
      // --- 5. ADICIONAR A NOSSA EXTENSÃO DE ÍCONE ---
      JournalIconExtension,
      // --- FIM DA ADIÇÃO ---
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
  // (ex: ao trocar de 'Editar' para 'Novo')
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