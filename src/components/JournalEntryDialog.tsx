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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Save, Share2, MoreVertical, ImageIcon, 
    Maximize2, Minimize2, Trash2, X, BookOpen,
    Eye, EyeOff // <--- Novos ícones
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MediaLibrary } from "@/components/MediaLibrary";

// Lazy loading continua, excelente para performance inicial
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
  const [isHiddenOnSheet, setIsHiddenOnSheet] = useState(false); // <--- Novo Estado
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const isEditing = !!entry;
  const canShare = !isPlayerNote && !characterId && !npcId;
  
  // Verifica se é uma nota vinculada a personagem (para mostrar o botão de ocultar)
  const isCharacterNote = !!(characterId || entry?.character_id || npcId || entry?.npc_id);

  // Carrega dados iniciais
  useEffect(() => {
    if (open) {
      if (isEditing && entry) {
        setTitle(entry.title || "");
        setContent(entry.content || "");
        setIsShared(entry.is_shared || false);
        setIsHiddenOnSheet(entry.is_hidden_on_sheet || false); // <--- Carrega estado
        setCoverImage(entry.data?.cover_image || null);
      } else if (!isEditing) {
        // Reset limpo para criar novo
        setTitle("");
        setContent("");
        setIsShared(false);
        setIsHiddenOnSheet(false);
        setCoverImage(null);
      }
    }
  }, [open, entry, isEditing]);

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
        is_shared: canShare ? isShared : (entry?.is_shared || false),
        is_hidden_on_sheet: isHiddenOnSheet, // <--- Salva o estado
        folder_id: entry?.folder_id ?? null // Mantém a pasta se existir
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
            p-0 gap-0 overflow-hidden bg-background flex flex-col transition-all duration-300
        `}
        aria-describedby={undefined}
      >
        <DialogHeader className="sr-only">
            <DialogTitle>{isEditing ? "Editar Entrada" : "Nova Entrada"}</DialogTitle>
            <DialogDescription>Editor de texto rico para diário.</DialogDescription>
        </DialogHeader>

        {/* --- TOOLBAR SUPERIOR (Otimizada para não lagar) --- */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur-none z-50 shrink-0 shadow-sm h-14">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-foreground font-medium">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-sm hidden sm:inline-block">
                        {isEditing ? "Editando" : "Novo Documento"}
                    </span>
                </div>
                {loading && <span className="text-xs text-muted-foreground animate-pulse">Salvando...</span>}
            </div>

            <div className="flex items-center gap-1 md:gap-2">
                {/* Switch de Partilha (Só para notas soltas) */}
                {canShare && (
                    <div className="flex items-center gap-2 mr-2 border-r border-border/50 pr-4">
                        <Switch id="share-switch" checked={isShared} onCheckedChange={setIsShared} className="scale-75" />
                        <Label htmlFor="share-switch" className="text-xs text-muted-foreground cursor-pointer hidden sm:inline-block">Público</Label>
                    </div>
                )}

                {/* Switch de Visibilidade na Ficha (Só para notas de Personagem/NPC) */}
                {isCharacterNote && (
                    <div className="flex items-center gap-2 mr-2 border-r border-border/50 pr-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsHiddenOnSheet(!isHiddenOnSheet)}
                            className={isHiddenOnSheet ? "text-muted-foreground" : "text-primary"}
                            title={isHiddenOnSheet ? "Oculto na Ficha" : "Visível na Ficha"}
                        >
                            {isHiddenOnSheet ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                            <span className="text-xs hidden sm:inline">
                                {isHiddenOnSheet ? "Oculto na Ficha" : "Visível na Ficha"}
                            </span>
                        </Button>
                    </div>
                )}

                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFullscreen(!isFullscreen)} title="Tela Cheia">
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
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
                
                <Button onClick={handleSave} disabled={loading} size="sm" className="ml-2 gap-2 font-medium shadow-sm">
                    <Save className="w-4 h-4" /> <span className="hidden sm:inline">Salvar</span>
                </Button>
            </div>
        </div>

        {/* --- ÁREA DE EDIÇÃO (Fundo Otimizado) --- */}
        <div className="flex-1 overflow-y-auto bg-muted/10 relative custom-scrollbar flex justify-center">
            
            {/* DOCUMENTO CENTRAL */}
            <div className="w-full max-w-3xl bg-background border-x border-border/20 shadow-sm min-h-full flex flex-col relative animate-in fade-in duration-300">
                
                {/* CAPA */}
                <div className={`relative w-full transition-all duration-300 ease-in-out group ${coverImage ? 'h-52 md:h-72' : 'h-auto py-8 hover:bg-muted/30'}`}>
                    {coverImage ? (
                        <>
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Button variant="secondary" size="xs" onClick={() => setCoverImage(null)} className="h-7 text-xs shadow-md bg-background/90 hover:bg-destructive hover:text-white">
                                    <X className="w-3 h-3 mr-1"/> Remover
                                 </Button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
                        </>
                    ) : (
                        <div className="flex justify-center px-4">
                            <MediaLibrary 
                                filter="image" 
                                onSelect={(url) => setCoverImage(url)} 
                                trigger={
                                    <Button variant="outline" size="sm" className="text-muted-foreground border-dashed gap-2 hover:border-primary hover:text-primary transition-all">
                                        <ImageIcon className="w-4 h-4"/> Adicionar Capa
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </div>

                {/* INPUTS DE TEXTO */}
                <div className="px-6 md:px-16 py-4 flex-1 flex flex-col relative z-10">
                    
                    {/* TÍTULO */}
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Sem Título"
                        className="
                            text-3xl md:text-5xl font-bold font-serif tracking-tight
                            border-none px-0 shadow-none focus-visible:ring-0 
                            placeholder:text-muted-foreground/30 
                            h-auto py-2 bg-transparent text-foreground mb-4
                        "
                    />

                    {/* EDITOR RICO */}
                    <div className="flex-1 min-h-[400px]">
                        <Suspense fallback={<div className="space-y-4 pt-4"><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-[90%]"/><Skeleton className="h-4 w-[95%]"/></div>}>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                placeholder="Escreva aqui..."
                                className="text-lg leading-relaxed font-serif text-foreground/90"
                            />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};