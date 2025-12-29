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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Save, MoreVertical, ImageIcon, 
    Maximize2, Minimize2, Trash2, X, BookOpen,
    Eye, EyeOff, Users
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MediaLibrary } from "@/components/MediaLibrary";
import { JournalShareDialog } from "@/components/JournalShareDialog"; 
import { useTableContext } from "@/features/table/TableContext"; 

const RichTextEditor = lazy(() =>
  import("./RichTextEditor").then(module => ({ default: module.RichTextEditor }))
);

interface JournalEntryDialogProps {
  children?: React.ReactNode; 
  tableId: string;
  onEntrySaved: () => void;
  entry?: any;
  isPlayerNote?: boolean;
  characterId?: string;
  npcId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const JournalEntryDialog = ({
  children,
  tableId,
  onEntrySaved,
  entry,
  isPlayerNote = false,
  characterId,
  npcId,
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: JournalEntryDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen || setInternalOpen;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); 
  const [isShared, setIsShared] = useState(false);
  const [isHiddenOnSheet, setIsHiddenOnSheet] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const { toast } = useToast();
  const { isMaster } = useTableContext(); 
  
  useEffect(() => {
      supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  const isEditing = !!entry;
  const isCharacterNote = !!(characterId || entry?.character_id || npcId || entry?.npc_id);

  const canEdit = !entry || 
                  entry.player_id === currentUserId || 
                  entry.creator_id === currentUserId || 
                  (entry.shared_with_players || []).includes(currentUserId);

  const canDelete = !entry || entry.player_id === currentUserId || entry.creator_id === currentUserId;

  // LÓGICA DE OURO: Apenas o mestre compartilha
  const canShare = !!entry?.id && isMaster;

  useEffect(() => {
    if (open) {
      if (isEditing && entry) {
        if (entry.title !== undefined) setTitle(entry.title || "");
        setContent(entry.content || "");
        setIsShared(entry.is_shared_with_players || entry.is_shared || false);
        setIsHiddenOnSheet(entry.is_hidden_on_sheet || false);
        setCoverImage(entry.data?.cover_image || null);
      } else if (!isEditing) {
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
        is_shared_with_players: isShared,
        is_hidden_on_sheet: isHiddenOnSheet,
        folder_id: entry?.folder_id ?? null
    };

    try {
        if (isEditing && entry?.id) {
          const { error } = await supabase.from("journal_entries").update(payload).eq("id", entry.id);
          if (error) throw error;
          toast({ title: "Salvo" });
        } else {
          payload.table_id = tableId;
          payload.player_id = isPlayerNote ? user.id : null;
          payload.creator_id = user.id;
          payload.character_id = characterId || null;
          payload.npc_id = npcId || null;

          const { error } = await supabase.from("journal_entries").insert(payload);
          if (error) throw error;
          toast({ title: "Criado" });
        }
        onEntrySaved();
        if(!isEditing) setOpen(false);
    } catch (error: any) {
        console.error("Erro ao salvar:", error);
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async () => {
      if(!entry?.id || !confirm("Excluir permanentemente?")) return;
      const { error } = await supabase.from("journal_entries").delete().eq("id", entry.id);
      if(!error) {
          onEntrySaved();
          setOpen(false);
      }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      
      <DialogContent 
        className={`${isFullscreen ? 'max-w-[100vw] h-[100vh] rounded-none border-0' : 'max-w-5xl h-[90vh] rounded-xl border border-border/50 shadow-2xl'} p-0 gap-0 overflow-hidden bg-background flex flex-col transition-all duration-300`}
        aria-describedby={undefined}
      >
        <DialogHeader className="sr-only">
            <DialogTitle>{isEditing ? "Editar Entrada" : "Nova Entrada"}</DialogTitle>
            <DialogDescription>Editor de conteúdo do diário.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 shrink-0 h-14">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-foreground font-medium">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-sm hidden sm:inline-block">
                        {isEditing ? (canEdit ? "Editando" : "Leitura") : "Novo Documento"}
                    </span>
                </div>
                {loading && <span className="text-xs text-muted-foreground animate-pulse">Processando...</span>}
            </div>

            <div className="flex items-center gap-1 md:gap-2">
                {isCharacterNote && (
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => canEdit && setIsHiddenOnSheet(!isHiddenOnSheet)}
                        disabled={!canEdit}
                        className={isHiddenOnSheet ? "text-muted-foreground" : "text-primary"}
                        title="Visibilidade na ficha"
                    >
                        {isHiddenOnSheet ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        <span className="text-xs hidden sm:inline">Na Ficha</span>
                    </Button>
                )}

                {canShare && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowShareDialog(true)}
                        className="text-muted-foreground hover:text-primary"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Partilhar</span>
                    </Button>
                )}

                <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} title="Ecrã cheio">
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>

                {canEdit && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <MediaLibrary filter="image" onSelect={(url) => setCoverImage(url)} trigger={<div className="relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"><ImageIcon className="mr-2 h-4 w-4" /> Capa</div>} />
                            {isEditing && canDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                
                {canEdit && (
                    <Button onClick={handleSave} disabled={loading} size="sm" className="ml-2 gap-2 shadow-sm">
                        <Save className="w-4 h-4" /> <span className="hidden sm:inline">Salvar</span>
                    </Button>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-muted/10 relative custom-scrollbar flex justify-center">
            <div className="w-full max-w-3xl bg-background border-x border-border/20 shadow-sm min-h-full flex flex-col relative animate-in fade-in duration-300">
                <div className={`relative w-full transition-all duration-300 group ${coverImage ? 'h-52 md:h-72' : 'h-auto py-8'}`}>
                    {coverImage ? (
                        <>
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                            {canEdit && (
                                <Button variant="secondary" size="xs" onClick={() => setCoverImage(null)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 h-7 bg-background/90"><X className="w-3 h-3 mr-1"/> Remover</Button>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
                        </>
                    ) : (
                        <div className="flex justify-center px-4">
                            {canEdit && (
                                <MediaLibrary filter="image" onSelect={(url) => setCoverImage(url)} trigger={<Button variant="outline" size="sm" className="text-muted-foreground border-dashed gap-2 hover:text-primary"><ImageIcon className="w-4 h-4"/> Adicionar Capa</Button>} />
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 md:px-16 py-4 flex-1 flex flex-col relative z-10">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Sem Título"
                        readOnly={!canEdit}
                        className="text-3xl md:text-5xl font-bold font-serif tracking-tight border-none px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/30 h-auto py-2 bg-transparent text-foreground mb-4"
                    />

                    <div className="flex-1 min-h-[400px]">
                        <Suspense fallback={<div className="space-y-4 pt-4"><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-[90%]"/><Skeleton className="h-4 w-[95%]"/></div>}>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                readOnly={!canEdit}
                                placeholder={canEdit ? "Escreva aqui..." : ""}
                                className="text-lg leading-relaxed font-serif text-foreground/90"
                            />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
      </DialogContent>

      {entry && showShareDialog && (
        <JournalShareDialog 
            entry={entry}
            open={showShareDialog}
            onOpenChange={setShowShareDialog}
            onSaved={onEntrySaved}
        />
      )}
    </Dialog>
  );
};