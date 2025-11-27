// src/components/RichTextEditor.tsx

import { useEffect, useCallback } from "react";
import { useEditor, EditorContent, Editor, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";

import {
  Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Quote,
  ImageIcon, Table as TableIcon, Trash2, 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Merge, Split, Columns, Rows, 
  Underline as UnderlineIcon, Link as LinkIcon, Unlink,
  AlignLeft, AlignCenter, AlignRight, AlignJustify
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// --- BOTÃO ROBUSTO (Sem componentes UI complexos para evitar conflitos) ---
const MenuButton = ({ onClick, icon: Icon, title, isActive = false, variant = "default" }: any) => {
  const baseClass = "h-7 w-7 flex items-center justify-center rounded transition-colors cursor-pointer";
  const activeClass = isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground";
  const destructiveClass = "text-destructive hover:bg-destructive/10";
  
  return (
    <button
      type="button"
      className={cn(baseClass, variant === "destructive" ? destructiveClass : activeClass)}
      title={title}
      // ESTA É A CORREÇÃO: Previne perda de foco e executa imediatamente
      onMouseDown={(e) => {
        e.preventDefault(); // Impede que o botão roube o foco do editor
        e.stopPropagation();
        onClick();
      }}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
};

// --- BARRA DE FERRAMENTAS FIXA (TOPO) ---
const TopToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('URL da imagem:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL do link:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-card/50 sticky top-0 z-20 backdrop-blur-sm">
      <MenuButton icon={Bold} title="Negrito" onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} />
      <MenuButton icon={Italic} title="Itálico" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} />
      <MenuButton icon={UnderlineIcon} title="Sublinhado" onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} />
      <MenuButton icon={Strikethrough} title="Rasurado" onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} />
      
      <div className="w-px h-5 bg-border mx-1" />
      
      <MenuButton icon={AlignLeft} title="Esquerda" onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} />
      <MenuButton icon={AlignCenter} title="Centro" onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} />
      <MenuButton icon={AlignRight} title="Direita" onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} />
      <MenuButton icon={AlignJustify} title="Justificado" onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} />

      <div className="w-px h-5 bg-border mx-1" />

      <MenuButton icon={Heading1} title="Título 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} />
      <MenuButton icon={Heading2} title="Título 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} />
      <MenuButton icon={List} title="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} />
      <MenuButton icon={ListOrdered} title="Lista Numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} />
      <MenuButton icon={Quote} title="Citação" onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} />

      <div className="w-px h-5 bg-border mx-1" />

      <MenuButton icon={TableIcon} title="Inserir Tabela" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
      <MenuButton icon={ImageIcon} title="Imagem" onClick={addImage} />
      <MenuButton icon={editor.isActive('link') ? Unlink : LinkIcon} title="Link" onClick={setLink} isActive={editor.isActive('link')} />
    </div>
  );
};

// --- MENU FLUTUANTE DE TABELA (LAYOUT HORIZONTAL) ---
const TableFloatingMenu = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ 
        duration: 100,
        placement: 'top', // Volta a aparecer em cima, como pedido
        interactive: true,
        zIndex: 50,
        appendTo: document.body 
      }}
      shouldShow={({ editor }) => editor.isActive('table')}
      // Layout Horizontal limpo
      className="flex items-center gap-1 p-1 rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in zoom-in-95"
    >
      {/* Grupo Colunas */}
      <div className="flex items-center px-1 gap-0.5 border-r border-border/50 pr-2">
          <Columns className="w-3 h-3 text-muted-foreground mr-1 opacity-50" />
          <MenuButton onClick={() => editor.chain().focus().addColumnBefore().run()} icon={ArrowLeft} title="Add Coluna Esq." />
          <MenuButton onClick={() => editor.chain().focus().addColumnAfter().run()} icon={ArrowRight} title="Add Coluna Dir." />
          <MenuButton onClick={() => editor.chain().focus().deleteColumn().run()} icon={Trash2} title="Apagar Coluna" variant="destructive" />
      </div>

      {/* Grupo Linhas */}
      <div className="flex items-center px-1 gap-0.5 border-r border-border/50 pr-2">
          <Rows className="w-3 h-3 text-muted-foreground mr-1 opacity-50" />
          <MenuButton onClick={() => editor.chain().focus().addRowBefore().run()} icon={ArrowUp} title="Add Linha Cima" />
          <MenuButton onClick={() => editor.chain().focus().addRowAfter().run()} icon={ArrowDown} title="Add Linha Baixo" />
          <MenuButton onClick={() => editor.chain().focus().deleteRow().run()} icon={Trash2} title="Apagar Linha" variant="destructive" />
      </div>

      {/* Grupo Células */}
      <div className="flex items-center px-1 gap-0.5 border-r border-border/50 pr-2">
          <MenuButton onClick={() => editor.chain().focus().mergeCells().run()} icon={Merge} title="Fundir" />
          <MenuButton onClick={() => editor.chain().focus().splitCell().run()} icon={Split} title="Separar" />
      </div>

      {/* Apagar Tabela */}
      <div className="pl-1">
          <button 
            className="flex items-center gap-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded h-7 transition-colors"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }}
          >
             <Trash2 className="w-3 h-3" /> Tabela
          </button>
      </div>
    </BubbleMenu>
  );
};

// --- COMPONENTE PRINCIPAL ---
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: true,
        codeBlock: false,
        horizontalRule: false,
        dropcursor: { class: "bg-primary w-0.5" }
      }),
      Placeholder.configure({
        placeholder: placeholder || "Comece a escrever...",
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'my-custom-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
        // Atualiza o pai a cada keystroke
        onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm prose-invert max-w-none min-h-[200px] p-4 focus:outline-none",
      },
    },
  });

  // Sincronia inteligente para evitar loops e lentidão
  useEffect(() => {
    if (editor && value) {
       const current = editor.getHTML();
       if (current !== value && !editor.isFocused) {
           // Usar queueMicrotask ou setTimeout(0) ajuda a evitar bloqueios na UI
           setTimeout(() => editor.commands.setContent(value), 0);
       }
    }
  }, [value, editor]);

  return (
    <div className="flex flex-col w-full border rounded-md bg-card shadow-sm overflow-hidden relative group">
      <TopToolbar editor={editor} />
      {editor && <TableFloatingMenu editor={editor} />}
      <div className="flex-1 overflow-y-auto max-h-[600px] bg-background/50">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};