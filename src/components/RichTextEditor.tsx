// src/components/RichTextEditor.tsx

import { useEditor, EditorContent, Editor, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
// REMOVIDO: ExtensionBubbleMenu (já é injetado pelo componente <BubbleMenu>)

import { useEffect } from "react";
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3, Quote,
  ImageIcon, Table as TableIcon, Trash2, ArrowDown, ArrowUp, ArrowLeft, ArrowRight,
  Merge, Split, Columns, Rows, Code, MoreHorizontal
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- BARRA DE FERRAMENTAS PRINCIPAL ---
const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('URL da imagem:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 rounded-t-md border border-b-0 border-input bg-muted/50 sticky top-0 z-20">
      <Toggle size="sm" pressed={editor.isActive("heading", { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive("heading", { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive("heading", { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-4 h-4" /></Toggle>
      <Separator orientation="vertical" className="h-6 w-[1px] mx-1" />
      <Toggle size="sm" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive("code")} onPressedChange={() => editor.chain().focus().toggleCode().run()}><Code className="w-4 h-4" /></Toggle>
      <Separator orientation="vertical" className="h-6 w-[1px] mx-1" />
      <Toggle size="sm" pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive("orderedList")} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="w-4 h-4" /></Toggle>
      <Separator orientation="vertical" className="h-6 w-[1px] mx-1" />
      <Button variant="ghost" size="sm" className="h-9 px-2.5" onClick={addTable} title="Inserir Tabela"><TableIcon className="w-4 h-4" /></Button>
      <Button variant="ghost" size="sm" className="h-9 px-2.5" onClick={addImage} title="Inserir Imagem"><ImageIcon className="w-4 h-4" /></Button>
    </div>
  );
};

// --- MENU FLUTUANTE DE TABELA (CORRIGIDO) ---
const TableBubbleMenu = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  return (
    <BubbleMenu 
      editor={editor} 
      tippyOptions={{ 
        duration: 100,
        placement: 'top',
        appendTo: document.body, // Essencial para não cortar o menu
        zIndex: 50, // Z-Index base do menu
        maxWidth: 'none',
        popperOptions: {
            strategy: 'fixed',
            modifiers: [
                { name: 'flip', options: { fallbackPlacements: ['bottom', 'right'] } },
                { name: 'preventOverflow', options: { altAxis: true, tether: false } },
            ],
        }
      }}
      shouldShow={({ editor }) => editor.isActive('table')}
      className="flex items-center gap-1 p-1.5 rounded-lg border bg-popover text-popover-foreground shadow-xl animate-in fade-in zoom-in-95"
    >
      {/* MENU DE COLUNAS */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          {/* onPointerDown preventDefault ajuda a manter o foco no editor enquanto clica */}
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs font-normal hover:bg-muted focus:ring-0">
            <Columns className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
            Colunas
          </Button>
        </DropdownMenuTrigger>
        {/* Z-INDEX 100 para garantir que fica ACIMA do BubbleMenu (50) */}
        <DropdownMenuContent align="start" className="z-[100]" sideOffset={5}>
          <DropdownMenuLabel>Gerir Colunas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Adicionar à Esquerda
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <ArrowRight className="w-4 h-4 mr-2" /> Adicionar à Direita
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()} className="text-destructive focus:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" /> Apagar Coluna
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* MENU DE LINHAS */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs font-normal hover:bg-muted focus:ring-0">
            <Rows className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
            Linhas
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-[100]" sideOffset={5}>
          <DropdownMenuLabel>Gerir Linhas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
            <ArrowUp className="w-4 h-4 mr-2" /> Adicionar Acima
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
            <ArrowDown className="w-4 h-4 mr-2" /> Adicionar Abaixo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()} className="text-destructive focus:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" /> Apagar Linha
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* MENU DE CÉLULAS */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs font-normal hover:bg-muted focus:ring-0">
            <MoreHorizontal className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
            Células
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-[100]" sideOffset={5}>
          <DropdownMenuItem onClick={() => editor.chain().focus().mergeCells().run()}>
            <Merge className="w-4 h-4 mr-2" /> Fundir Células
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().splitCell().run()}>
            <Split className="w-4 h-4 mr-2" /> Separar Células
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* AÇÃO DE APAGAR TABELA */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => editor.chain().focus().deleteTable().run()}
        title="Apagar Tabela Inteira"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

    </BubbleMenu>
  );
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, horizontalRule: false }),
      Placeholder.configure({ placeholder: placeholder || "Comece a escrever..." }),
      Image.configure({ inline: true, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      // ExtensionBubbleMenu removido daqui para não duplicar com o componente <BubbleMenu>
    ],
    content: value,
    onUpdate: ({ editor }) => { onChange(editor.getHTML()); },
    editorProps: {
      attributes: {
        class: "prose prose-sm prose-invert max-w-none min-h-[300px] w-full rounded-b-md border border-t-0 border-input bg-background px-4 py-4 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-x-auto",
      },
    },
  });

  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      if (!editor.isFocused) editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="flex flex-col border rounded-md relative group">
      <Toolbar editor={editor} />
      {editor && <TableBubbleMenu editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
};