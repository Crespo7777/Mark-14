import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  User, 
  EyeOff, 
  Copy, 
  Archive, 
  ArchiveRestore, 
  FolderOpen, 
  Share2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { FolderType } from "@/types/app-types";

interface EntityCardProps {
  entity: any; 
  type: "character" | "npc";
  folders?: FolderType[];
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onDuplicate?: (item: any) => void;
  onArchive?: (id: string, currentVal: boolean) => void;
  onMove?: (id: string, folderId: string | null) => void;
  onShare?: (item: any) => void;
}

export const EntityCard = ({ 
  entity, 
  folders = [],
  onEdit, 
  onDelete, 
  onDuplicate,
  onArchive,
  onMove,
  onShare
}: EntityCardProps) => {
  // --- CORREÇÃO DO ENQUADRAMENTO ---
  const rawData = entity.data || {};
  
  // Procura configurações em todas as estruturas possíveis:
  // 1. entity.data.image_settings (Padrão)
  // 2. entity.data.data.image_settings (Se salvo aninhado pelo formulário)
  // 3. entity.image_settings (Fallback)
  const imageSettings = 
      rawData.image_settings || 
      rawData.data?.image_settings || 
      entity.image_settings || 
      { x: 50, y: 50, scale: 100 };

  const imageUrl = entity.image_url;

  // Dados de texto
  const race = entity.race || rawData.race || "";
  const occupation = entity.occupation || rawData.occupation || "";
  const isHidden = rawData.hidden; 
  const isArchived = entity.is_archived;

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:ring-2 hover:ring-primary/50 border-border/50 h-full flex flex-col rounded-md ${isArchived ? "opacity-60 bg-muted/20" : "bg-card"}`}>
      
      {/* --- ÁREA DA IMAGEM --- */}
      <div className="aspect-square w-full overflow-hidden bg-muted relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={entity.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            style={{
              // Aplica o enquadramento recuperado
              objectPosition: `${imageSettings.x}% ${imageSettings.y}%`,
              transform: `scale(${imageSettings.scale / 100})` 
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/30 bg-gradient-to-br from-muted to-muted/50 p-2 text-center">
            <User className="h-10 w-10 mb-1 opacity-50" />
            <span className="text-[10px] font-medium uppercase tracking-widest leading-tight">Sem Imagem</span>
          </div>
        )}

        {/* Overlay Escuro */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
        
        {/* Badges */}
        <div className="absolute top-1 left-1 flex flex-col gap-1">
            {isHidden && (
                <div className="bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[9px] text-white flex items-center gap-0.5 w-fit">
                    <EyeOff className="w-2.5 h-2.5" /> Oculto
                </div>
            )}
            {isArchived && (
                <div className="bg-amber-900/80 backdrop-blur px-1.5 py-0.5 rounded text-[9px] text-white flex items-center gap-0.5 w-fit">
                    <Archive className="w-2.5 h-2.5" /> Arq.
                </div>
            )}
        </div>
      </div>

      {/* --- CONTEÚDO DO CARD --- */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 pt-6 text-white z-10 pointer-events-none">
        <h3 className="font-bold text-sm leading-tight tracking-tight text-white drop-shadow-md truncate">
          {entity.name}
        </h3>
        
        <div className="flex flex-wrap gap-1 mt-0.5 opacity-90">
            {(race || occupation) ? (
                <div className="text-[10px] font-medium text-white/80 flex items-center gap-1 truncate leading-tight">
                   {race && <span>{race}</span>}
                   {race && occupation && <span className="opacity-50">•</span>}
                   {occupation && <span className="italic">{occupation}</span>}
                </div>
            ) : (
                <span className="text-[10px] text-white/50 italic leading-tight">Sem detalhes</span>
            )}
        </div>
      </div>

      {/* --- MENU DE AÇÕES (RESTAURADO) --- */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        
        {onShare && (
            <Button 
                variant="secondary" size="icon" 
                className="h-7 w-7 rounded-full shadow-sm bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white"
                onClick={(e) => { e.stopPropagation(); onShare(entity); }}
                title="Partilhar"
            >
                <Share2 className="h-3.5 w-3.5" />
            </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full shadow-sm bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(entity.id)} className="cursor-pointer text-xs font-medium">
              <Edit className="mr-2 h-3.5 w-3.5" /> Abrir Ficha
            </DropdownMenuItem>
            
            {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(entity)} className="cursor-pointer text-xs">
                    <Copy className="mr-2 h-3.5 w-3.5" /> Duplicar
                </DropdownMenuItem>
            )}

            {onArchive && (
                <DropdownMenuItem onClick={() => onArchive(entity.id, !!isArchived)} className="cursor-pointer text-xs">
                    {isArchived ? <ArchiveRestore className="mr-2 h-3.5 w-3.5" /> : <Archive className="mr-2 h-3.5 w-3.5" />}
                    {isArchived ? "Restaurar" : "Arquivar"}
                </DropdownMenuItem>
            )}

            {onMove && (
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-xs">
                        <FolderOpen className="mr-2 h-3.5 w-3.5" /> Mover para...
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup value={entity.folder_id || "none"} onValueChange={val => onMove(entity.id, val === "none" ? null : val)}>
                            <DropdownMenuRadioItem value="none" className="text-xs">Sem Pasta</DropdownMenuRadioItem>
                            {folders.map(f => (
                                <DropdownMenuRadioItem key={f.id} value={f.id} className="text-xs">{f.name}</DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
                onClick={() => onDelete(entity.id, entity.name)} 
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 text-xs"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Clique no card inteiro abre a ficha */}
      <div 
        className="absolute inset-0 z-0 cursor-pointer rounded-md" 
        onClick={() => onEdit(entity.id)}
        title={`Abrir ${entity.name}`}
      />

    </Card>
  );
};