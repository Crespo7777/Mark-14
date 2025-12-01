import { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent, type Editor, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, 
  Image as ImageIcon, Undo, Redo, Check, 
  AlignJustify
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MediaLibrary } from "@/components/MediaLibrary";
import { cn } from "@/lib/utils";

// --- COMPONENTES DE IMAGEM (MANTIDOS DO TEU CÓDIGO) ---

const ResizableImage = ({ node, updateAttributes, selected }: any) => {
  const [isResizing, setIsResizing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const { width, align } = node.attrs;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsResizing(true);
    const startX = e.clientX;
    const startWidth = imageRef.current ? imageRef.current.clientWidth : (width || 200);
    
    const onMouseMove = (e: MouseEvent) => {
      const currentX = e.clientX;
      const newWidth = Math.max(50, startWidth + (currentX - startX));
      if (imageRef.current) imageRef.current.style.width = `${newWidth}px`;
    };
    
    const onMouseUp = (e: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (e.clientX - startX));
      updateAttributes({ width: newWidth });
      setIsResizing(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  let style: React.CSSProperties = { display: 'inline-block', position: 'relative', marginRight: '0.5rem', transition: 'all 0.2s' };
  if (align === 'center') style = { ...style, display: 'block', margin: '0.5rem auto', textAlign: 'center' };
  else if (align === 'right') style = { ...style, float: 'right', marginLeft: '1rem' };
  else if (align === 'left') style = { ...style, float: 'left', marginRight: '1rem' };

  return (
    <NodeViewWrapper style={style} className="image-component">
      <div className={cn("relative inline-block", (selected || isResizing) ? "ring-2 ring-primary rounded-sm" : "")}>
        <img ref={imageRef} src={node.attrs.src} alt={node.attrs.alt} style={{ width: width ? `${width}px` : 'auto', maxWidth: '100%', display: 'block' }} className={cn("rounded-md shadow-sm", selected ? "cursor-move" : "cursor-pointer")} draggable="true" data-drag-handle />
        {(selected || isResizing) && <div className="absolute bottom-1 right-1 w-3 h-3 bg-primary rounded-full cursor-nwse-resize" onMouseDown={handleMouseDown} />}
      </div>
    </NodeViewWrapper>
  );
};

const CustomImage = ImageExtension.extend({
  inline: true, group: 'inline',
  addAttributes() { return { ...this.parent?.(), width: { default: null, renderHTML: a => ({ width: a.width }), parseHTML: e => e.getAttribute('width') }, align: { default: 'center', renderHTML: a => ({ 'data-align': a.align }), parseHTML: e => e.getAttribute('data-align') } }; },
  addNodeView() { return ReactNodeViewRenderer(ResizableImage); },
});

// --- BARRA DE FERRAMENTAS (MANTIDA DO TEU CÓDIGO) ---

const EditorToolbar = ({ editor, onImageSelect }: { editor: Editor | null, onImageSelect: (url: string) => void }) => {
  if (!editor) return null;

  const LinkSelector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState("");
    useEffect(() => { if (isOpen) setUrl(editor.getAttributes('link').href || ""); }, [isOpen]);
    const saveLink = () => {
      if (url === '') editor.chain().focus().unsetLink().run();
      else editor.chain().focus().setLink({ href: url }).run();
      setIsOpen(false);
    };
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild><Button variant={editor.isActive('link') ? "secondary" : "ghost"} size="icon" className="h-8 w-8"><LinkIcon className="h-4 w-4" /></Button></PopoverTrigger>
        <PopoverContent className="w-80 p-2"><div className="flex gap-2"><Input value={url} onChange={e => setUrl(e.target.value)} className="h-8" /><Button size="icon" className="h-8 w-8" onClick={saveLink}><Check className="w-4 h-4"/></Button></div></PopoverContent>
      </Popover>
    );
  };

  const toggle = (cb: () => void) => { cb(); editor.view.focus(); };

  return (
    <div className="border-b border-border/40 bg-background/80 backdrop-blur-md p-1 flex flex-wrap items-center gap-0.5 sticky top-0 z-30 transition-all duration-200 shadow-sm">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo className="h-4 w-4" /></Button>
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("bold")} onPressedChange={() => toggle(() => editor.chain().focus().toggleBold().run())}><Bold className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("italic")} onPressedChange={() => toggle(() => editor.chain().focus().toggleItalic().run())}><Italic className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("underline")} onPressedChange={() => toggle(() => editor.chain().focus().toggleUnderline().run())}><UnderlineIcon className="h-4 w-4" /></Toggle>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("heading", { level: 1 })} onPressedChange={() => toggle(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}><Heading1 className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("heading", { level: 2 })} onPressedChange={() => toggle(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}><Heading2 className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("heading", { level: 3 })} onPressedChange={() => toggle(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}><Heading3 className="h-4 w-4" /></Toggle>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("bulletList")} onPressedChange={() => toggle(() => editor.chain().focus().toggleBulletList().run())}><List className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("orderedList")} onPressedChange={() => toggle(() => editor.chain().focus().toggleOrderedList().run())}><ListOrdered className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("blockquote")} onPressedChange={() => toggle(() => editor.chain().focus().toggleBlockquote().run())}><Quote className="h-4 w-4" /></Toggle>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => toggle(() => editor.chain().focus().setTextAlign('left').run())}><AlignLeft className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => toggle(() => editor.chain().focus().setTextAlign('center').run())}><AlignCenter className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => toggle(() => editor.chain().focus().setTextAlign('right').run())}><AlignRight className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive({ textAlign: 'justify' })} onPressedChange={() => toggle(() => editor.chain().focus().setTextAlign('justify').run())}><AlignJustify className="h-4 w-4" /></Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <LinkSelector />
      <MediaLibrary filter="image" onSelect={(url) => { onImageSelect(url); setTimeout(() => editor.view.focus(), 100); }} trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><ImageIcon className="h-4 w-4" /></Button>} />
    </div>
  );
};

// --- EDITOR PRINCIPAL COM CORREÇÕES E OTIMIZAÇÃO ---

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
  // Ref para controlar o atraso na gravação (Debounce)
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Melhoria: mantém marcas (negrito) ao dar enter em listas
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      LinkExtension.configure({ openOnClick: false, autolink: true }),
      CustomImage,
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      Placeholder.configure({
        placeholder: placeholder || 'Escreva aqui...',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        // Classes Tailwind otimizadas para leitura (estilo Notion/Livro)
        class: cn(
          "prose prose-zinc dark:prose-invert max-w-none min-h-[300px] p-4",
          "focus:outline-none text-foreground/90 font-serif leading-relaxed",
          "[&_img]:max-w-full [&_p]:mb-4 [&_h1]:mt-8 [&_h2]:mt-6",
          "selection:bg-primary/20" // Cor de seleção bonita
        ),
      },
      // --- A MÁGICA DA COLAGEM DE PDF ---
      handlePaste: (view, event, slice) => {
        const text = event.clipboardData?.getData('text/plain');
        if (text) {
          const lines = text.split('\n');
          // Se tiver muitas quebras de linha curtas, provavelmente é PDF/Livro
          if (lines.length > 2) {
             const fixedText = text
                .replace(/([^\n])\n(?!\n)/g, '$1 ') // Junta linhas quebradas
                .replace(/\n\n/g, '<br><br>');     // Mantém parágrafos reais
             
             // Injeta o texto limpo
             view.props.onPaste?.(view, event, slice);
             editor?.commands.insertContent(fixedText);
             return true; // Impede a colagem duplicada
          }
        }
        return false;
      }
    },
    // --- OTIMIZAÇÃO DE PERFORMANCE (DEBOUNCE) ---
    onUpdate: ({ editor }) => {
      // Limpa o timer anterior se o usuário digitar rápido
      if (debounceRef.current) clearTimeout(debounceRef.current);

      // Só envia para o pai (save) depois de 500ms sem digitar
      debounceRef.current = setTimeout(() => {
        onChange(editor.getHTML());
      }, 500);
    },
  });

  // Sincronia inicial apenas quando o editor monta ou muda drasticamente externamente
  useEffect(() => {
    if (editor && value && editor.isEmpty && value !== '<p></p>') {
        editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className={cn("flex flex-col w-full relative bg-background/50 rounded-lg border border-border/40", className)}>
      <EditorToolbar editor={editor} onImageSelect={(url) => editor?.chain().focus().setImage({ src: url }).run()} />
      <div className="flex-1 cursor-text" onClick={() => editor?.view.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};