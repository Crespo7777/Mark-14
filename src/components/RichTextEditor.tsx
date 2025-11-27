// src/components/RichTextEditor.tsx

import { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent, type Editor, NodeViewWrapper, ReactNodeViewRenderer, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  List, ListOrdered, Quote, Heading1, Heading2, 
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, 
  Image as ImageIcon, Undo, Redo, Eraser, Check, Unlink, Trash2,
  AlignJustify
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MediaLibrary } from "@/components/MediaLibrary";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// --- COMPONENTE DE IMAGEM PRO (Redimensionável + Alinhamento Avançado) ---
const ResizableImage = ({ node, updateAttributes, selected }: any) => {
  const [isResizing, setIsResizing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const { width, align } = node.attrs;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = imageRef.current ? imageRef.current.clientWidth : (width || 200);

    const onMouseMove = (e: MouseEvent) => {
      const currentX = e.clientX;
      const diffX = currentX - startX;
      const newWidth = Math.max(50, startWidth + diffX); 
      
      if (imageRef.current) {
         imageRef.current.style.width = `${newWidth}px`;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      const currentX = e.clientX;
      const diffX = currentX - startX;
      const newWidth = Math.max(50, startWidth + diffX);
      
      updateAttributes({ width: newWidth });
      setIsResizing(false);
      
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Lógica de Estilo para o Alinhamento (Float vs Block)
  let containerStyle: React.CSSProperties = {
      display: 'inline-block',
      position: 'relative',
      lineHeight: '0',
      marginRight: '0.5rem',
      transition: 'all 0.2s ease-in-out'
  };
  
  if (align === 'center') {
      containerStyle = { ...containerStyle, display: 'block', margin: '0.5rem auto', textAlign: 'center' };
  } else if (align === 'right') {
      containerStyle = { ...containerStyle, float: 'right', marginLeft: '1rem', marginRight: '0' };
  } else if (align === 'left') {
      containerStyle = { ...containerStyle, float: 'left', marginRight: '1rem' };
  }

  return (
    <NodeViewWrapper style={containerStyle} className="image-component">
      <div 
        className={cn(
          "relative inline-block transition-all group",
          (selected || isResizing) ? "ring-2 ring-primary ring-offset-1 rounded-sm z-10" : ""
        )}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          style={{ 
            width: width ? `${width}px` : 'auto',
            maxWidth: '100%',
            display: 'block',
          }}
          className={cn(
            "rounded-md shadow-sm transition-shadow bg-background",
            selected ? "cursor-move" : "cursor-pointer hover:brightness-95"
          )}
          draggable="true" 
          data-drag-handle
        />
        {(selected || isResizing) && (
            <div 
              className="absolute bottom-1 right-1 w-3 h-3 bg-primary border border-white rounded-full cursor-nwse-resize z-20 shadow-md" 
              onMouseDown={handleMouseDown} 
            />
        )}
      </div>
    </NodeViewWrapper>
  );
};

const CustomImage = ImageExtension.extend({
  inline: true, 
  group: 'inline',
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: attributes => ({ width: attributes.width }),
        parseHTML: element => element.getAttribute('width'),
      },
      align: {
        default: 'center', // Padrão: Centrado
        renderHTML: attributes => ({ 'data-align': attributes.align }),
        parseHTML: element => element.getAttribute('data-align'),
      }
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImage);
  },
});

// --- MENU FLUTUANTE DE IMAGEM ---
const ImageBubbleMenu = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;

  const setAlign = (align: 'left' | 'center' | 'right') => {
    editor.chain().focus().updateAttributes('image', { align }).run();
  };

  return (
    <BubbleMenu 
        editor={editor} 
        tippyOptions={{ duration: 100, zIndex: 50 }} 
        shouldShow={({ editor }) => editor.isActive('image')}
        className="flex items-center gap-1 p-1 rounded-lg border border-border bg-popover shadow-xl"
    >
        <Toggle size="sm" className="h-8 w-8" onPressedChange={() => setAlign('left')} pressed={editor.getAttributes('image').align === 'left'} title="Esquerda (Texto Flui)">
            <AlignLeft className="w-4 h-4" />
        </Toggle>
        <Toggle size="sm" className="h-8 w-8" onPressedChange={() => setAlign('center')} pressed={editor.getAttributes('image').align === 'center'} title="Centro (Bloco)">
            <AlignCenter className="w-4 h-4" />
        </Toggle>
        <Toggle size="sm" className="h-8 w-8" onPressedChange={() => setAlign('right')} pressed={editor.getAttributes('image').align === 'right'} title="Direita (Texto Flui)">
            <AlignRight className="w-4 h-4" />
        </Toggle>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().deleteSelection().run()} title="Remover">
            <Trash2 className="w-4 h-4" />
        </Button>
    </BubbleMenu>
  );
};

// --- TOOLBAR COMPONENT ---
const EditorToolbar = ({ editor, onImageSelect }: { editor: Editor | null, onImageSelect: (url: string) => void }) => {
  if (!editor) return null;

  // Link Selector interno
  const LinkSelector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState("");

    useEffect(() => {
      if (isOpen) setUrl(editor.getAttributes('link').href || "");
    }, [isOpen]);

    const saveLink = () => {
      if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
      else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      setIsOpen(false);
    };

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant={editor.isActive('link') ? "secondary" : "ghost"} size="icon" className="h-8 w-8" title="Link"><LinkIcon className="h-4 w-4" /></Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2 bg-card border-border" align="start">
           <div className="flex gap-2 items-center">
               <Input placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} className="h-8 text-xs" onKeyDown={(e) => e.key === 'Enter' && saveLink()} />
               <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={saveLink}><Check className="w-4 h-4" /></Button>
               {editor.isActive('link') && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { editor.chain().focus().unsetLink().run(); setIsOpen(false); }}><Unlink className="w-4 h-4" /></Button>}
           </div>
        </PopoverContent>
      </Popover>
    );
  };

  const toggle = (cb: () => void) => { cb(); editor.view.focus(); };

  return (
    <div className="border-b border-border bg-muted/30 p-2 flex flex-wrap items-center gap-1 sticky top-0 z-20 backdrop-blur-sm">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo className="h-4 w-4" /></Button>
      <Separator orientation="vertical" className="h-6 mx-1 bg-border" />
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("bold")} onPressedChange={() => toggle(() => editor.chain().focus().toggleBold().run())}><Bold className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("italic")} onPressedChange={() => toggle(() => editor.chain().focus().toggleItalic().run())}><Italic className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("underline")} onPressedChange={() => toggle(() => editor.chain().focus().toggleUnderline().run())}><UnderlineIcon className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("strike")} onPressedChange={() => toggle(() => editor.chain().focus().toggleStrike().run())}><Strikethrough className="h-4 w-4" /></Toggle>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => editor.chain().focus().unsetAllMarks().run()}><Eraser className="h-4 w-4" /></Button>
      <Separator orientation="vertical" className="h-6 mx-1 bg-border" />
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => toggle(() => editor.chain().focus().setTextAlign('left').run())}><AlignLeft className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => toggle(() => editor.chain().focus().setTextAlign('center').run())}><AlignCenter className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => toggle(() => editor.chain().focus().setTextAlign('right').run())}><AlignRight className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive({ textAlign: 'justify' })} onPressedChange={() => toggle(() => editor.chain().focus().setTextAlign('justify').run())}><AlignJustify className="h-4 w-4" /></Toggle>
      <Separator orientation="vertical" className="h-6 mx-1 bg-border" />
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("heading", { level: 1 })} onPressedChange={() => toggle(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}><Heading1 className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("heading", { level: 2 })} onPressedChange={() => toggle(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}><Heading2 className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("bulletList")} onPressedChange={() => toggle(() => editor.chain().focus().toggleBulletList().run())}><List className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("orderedList")} onPressedChange={() => toggle(() => editor.chain().focus().toggleOrderedList().run())}><ListOrdered className="h-4 w-4" /></Toggle>
      <Toggle size="sm" className="h-8 w-8" pressed={editor.isActive("blockquote")} onPressedChange={() => toggle(() => editor.chain().focus().toggleBlockquote().run())}><Quote className="h-4 w-4" /></Toggle>
      <Separator orientation="vertical" className="h-6 mx-1 bg-border" />
      <LinkSelector />
      <MediaLibrary filter="image" onSelect={(url) => { onImageSelect(url); setTimeout(() => editor.view.focus(), 100); }} trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><ImageIcon className="h-4 w-4" /></Button>} />
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DO EDITOR ---
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
  const { toast } = useToast();
  // Removed local content state to avoid sync issues. Rely on Editor's internal state.

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      LinkExtension.configure({ openOnClick: false, autolink: true }),
      CustomImage, // Usar a nossa extensão Custom
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value, // Inicia com o valor
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[150px] p-4 focus:outline-none text-sm [&_img]:max-w-full",
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.indexOf('image') === 0);
        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
             const reader = new FileReader();
             reader.onload = (readerEvent) => {
                 const base64 = readerEvent.target?.result;
                 if (base64) {
                    const node = view.state.schema.nodes.image.create({ src: base64 });
                    const transaction = view.state.tr.replaceSelectionWith(node);
                    view.dispatch(transaction);
                    toast({ title: "Imagem colada!", description: "Convertida para Base64." });
                 }
             };
             reader.readAsDataURL(file);
             return true;
          }
        }
        return false;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
           event.preventDefault();
           const file = event.dataTransfer.files[0];
           if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = (readerEvent) => {
                 const base64 = readerEvent.target?.result;
                 if (base64) {
                    const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                    if (coordinates) {
                       const node = view.state.schema.nodes.image.create({ src: base64 });
                       const transaction = view.state.tr.insert(coordinates.pos, node);
                       view.dispatch(transaction);
                       toast({ title: "Imagem adicionada!" });
                    }
                 }
              };
              reader.readAsDataURL(file);
              return true;
           }
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sincronia One-Way: Apenas se o editor estiver "virgem" ou o valor mudar radicalmente (ex: troca de página)
  // mas não a cada keystroke para evitar bugs de cursor.
  useEffect(() => {
    if (editor && value) {
        const currentHTML = editor.getHTML();
        // Verifica se está vazio ou se é radicalmente diferente (troca de contexto)
        // A comparação simples de string pode falhar se o Tiptap reordenar atributos, mas serve para o carregamento inicial
        if (editor.isEmpty && value !== '<p></p>') {
            editor.commands.setContent(value);
        }
    }
  }, [value, editor]);

  return (
    <div className={cn("flex flex-col w-full border border-border rounded-md bg-card shadow-sm overflow-hidden", className)}>
      <EditorToolbar editor={editor} onImageSelect={(url) => editor?.chain().focus().setImage({ src: url }).run()} />
      
      {/* Menu Flutuante da Imagem */}
      {editor && <ImageBubbleMenu editor={editor} />}

      <div className="flex-1 bg-muted/5 cursor-text" onClick={() => editor?.view.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};