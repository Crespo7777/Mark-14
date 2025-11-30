import { useState, useEffect, lazy, Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Save, Share2, MoreVertical, ImageIcon, 
    Maximize2, Minimize2, Trash2, X, Calendar, BookOpen
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ShareDialog } from "@/components/ShareDialog";
import { MediaLibrary } from "@/components/MediaLibrary";

const RichTextEditor = lazy(() =>
  import("./RichTextEditor").then(module => ({ default: module.RichTextEditor }))
);

interface JournalEntryDialogProps {
  children: React.ReactNode;
  tableId: string;
  onEntrySaved: () => void;
  entry?: any;
  isPlayerNote?: boolean;
  characterId?: string;
  npcId?: string;
}

export const JournalEntryDialog = ({
  children,
  tableId,
  onEntrySaved,
  entry,
  isPlayerNote = false,
  characterId,
  npcId,
}: JournalEntryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); 
  const [isShared, setIsShared] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const isEditing = !!entry;
  const canShare = !isPlayerNote && !characterId && !npcId;

  useEffect(() => {
    if (open) {
      if (isEditing && entry) {
        setTitle(entry.title || "");
        setContent(entry.content || "");
        setIsShared(entry.is_shared || false);
        setCoverImage(entry.data?.cover_image || null);
      } else {
        if (!isEditing) {
            setTitle("");
            setContent("");
            setIsShared(false);
            setCoverImage(null);
        }
      }
    }
  }, [open, entry?.id]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const contentToSave = (content && content.trim() !== "<p></p>") ? content.trim() : null;
    const extraData = entry?.data || {};
    extraData.cover_image = coverImage;

    const payload: any = {
        title: title.trim(),
        content: contentToSave,
        data: extraData,
        is_shared: canShare ? isShared : (entry?.is_shared || false)
    };

    try {
        if (isEditing) {
          const { error } = await supabase.from("journal_entries").update(payload).eq("id", entry.id);
          if (error) throw error;
          toast({ title: "Salvo", description: "Documento atualizado." });
        } else {
          payload.table_id = tableId;
          payload.player_id = isPlayerNote ? user.id : null;
          payload.character_id = characterId || null;
          payload.npc_id = npcId || null;

          const { error } = await supabase.from("journal_entries").insert(payload);
          if (error) throw error;
          toast({ title: "Criado", description: "Novo documento salvo." });
        }
        onEntrySaved();
        setOpen(false);
    } catch (error: any) {
        console.error("Erro ao salvar:", error);
        toast({ 
            title: "Erro ao salvar", 
            description: error.message || "Verifique sua conexão.", 
            variant: "destructive" 
        });
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async () => {
      if(!entry || !confirm("Excluir este documento permanentemente?")) return;
      const { error } = await supabase.from("journal_entries").delete().eq("id", entry.id);
      if(!error) {
          onEntrySaved();
          setOpen(false);
      }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      
      <DialogContent 
        className={`
            ${isFullscreen ? 'max-w-[100vw] h-[100vh] rounded-none border-0' : 'max-w-5xl h-[90vh] rounded-xl border border-border/50 shadow-2xl'} 
            p-0 gap-0 overflow-hidden bg-muted/95 flex flex-col transition-all duration-300
        `}
        aria-describedby={undefined}
      >
        <DialogHeader className="sr-only">
            <DialogTitle>{isEditing ? "Editar Entrada" : "Nova Entrada"}</DialogTitle>
            <DialogDescription>Editor de texto rico para diário.</DialogDescription>
        </DialogHeader>

        {/* --- TOOLBAR SUPERIOR (Estilo App) --- */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background/50 backdrop-blur-md z-50 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-foreground font-medium">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                        {isEditing ? "Editando Documento" : "Novo Documento"}
                    </span>
                </div>
                {loading && <span className="text-xs text-muted-foreground animate-pulse">Salvando...</span>}
            </div>

            <div className="flex items-center gap-2">
                {canShare && (
                    <div className="flex items-center gap-2 mr-4 border-r border-border/50 pr-4">
                        <Switch id="share-switch" checked={isShared} onCheckedChange={setIsShared} className="scale-75" />
                        <Label htmlFor="share-switch" className="text-xs text-muted-foreground cursor-pointer">Público</Label>
                    </div>
                )}

                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/80" onClick={() => setIsFullscreen(!isFullscreen)} title="Tela Cheia">
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/80"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <MediaLibrary 
                            filter="image" 
                            onSelect={(url) => setCoverImage(url)} 
                            trigger={
                                <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                                    <ImageIcon className="mr-2 h-4 w-4" /> <span>Alterar Capa</span>
                                </div>
                            }
                        />
                        {isEditing && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                
                <Button onClick={handleSave} disabled={loading} size="sm" className="ml-2 gap-2 font-medium shadow-md">
                    <Save className="w-4 h-4" /> Salvar
                </Button>
            </div>
        </div>

        {/* --- ÁREA DE SCROLL (Fundo da Mesa) --- */}
        <div className="flex-1 overflow-y-auto bg-muted/30 relative custom-scrollbar p-4 md:p-8 flex justify-center">
            
            {/* --- A PÁGINA (O Documento em Si) --- */}
            <div className="w-full max-w-3xl bg-card border border-border/40 shadow-xl rounded-lg overflow-hidden min-h-[800px] flex flex-col relative animate-in fade-in zoom-in-[0.99] duration-300">
                
                {/* IMAGEM DE CAPA (Dentro da página) */}
                <div className={`relative w-full transition-all duration-500 ease-in-out ${coverImage ? 'h-56 md:h-72' : 'h-24 hover:h-32 group'}`}>
                    {coverImage ? (
                        <>
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Button variant="secondary" size="xs" onClick={() => setCoverImage(null)} className="h-7 text-xs shadow-lg backdrop-blur-md bg-background/80 hover:bg-destructive hover:text-white border border-border/50">
                                    <X className="w-3 h-3 mr-1"/> Remover
                                 </Button>
                            </div>
                            {/* Gradiente para o texto não colar na imagem */}
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent opacity-80" />
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 border-b border-border/10 group-hover:bg-muted/40 transition-colors cursor-pointer">
                            <MediaLibrary 
                                filter="image" 
                                onSelect={(url) => setCoverImage(url)} 
                                trigger={
                                    <Button variant="ghost" size="sm" className="text-muted-foreground/50 group-hover:text-primary transition-colors text-xs gap-2">
                                        <ImageIcon className="w-4 h-4"/> Adicionar Capa
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </div>

                {/* CONTEÚDO DA PÁGINA */}
                <div className="px-8 md:px-12 py-8 flex-1 flex flex-col">
                    
                    {/* TÍTULO */}
                    <div className="relative mb-8">
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Sem Título"
                            className="
                                text-4xl md:text-5xl font-bold font-serif tracking-tight
                                border-none px-0 shadow-none focus-visible:ring-0 
                                placeholder:text-muted-foreground/20 
                                h-auto py-2 bg-transparent text-foreground
                            "
                        />
                        
                        {/* Metadados abaixo do título */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 border-b border-border/40 pb-4">
                            {entry?.created_at && (
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 opacity-70"/> {new Date(entry.created_at).toLocaleDateString()}</span>
                            )}
                            <span className="flex items-center gap-1">
                                {isShared ? <Badge variant="secondary" className="text-[10px] h-4 font-normal bg-primary/10 text-primary hover:bg-primary/20">Público</Badge> : <Badge variant="outline" className="text-[10px] h-4 font-normal">Privado</Badge>}
                            </span>
                        </div>
                    </div>

                    {/* EDITOR RICO */}
                    <Suspense fallback={<div className="space-y-4 pt-4"><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-[90%]"/><Skeleton className="h-4 w-[95%]"/></div>}>
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Escreva sua história, pistas ou regras aqui..."
                            // Removemos bordas e fundo do editor para ele se fundir à "página"
                            className="border-none shadow-none bg-transparent p-0 min-h-[400px] text-lg leading-relaxed text-foreground/90 font-serif"
                        />
                    </Suspense>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};