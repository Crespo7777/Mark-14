import { CharacterWithRelations } from "@/types/app-types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Archive, Share2, MoreVertical, Trash2, Edit, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface CharacterCardProps {
  character: CharacterWithRelations;
  isMaster: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (char: CharacterWithRelations) => void;
  onArchive: (id: string, current: boolean) => void;
  onShare?: (char: CharacterWithRelations) => void;
}

export const CharacterCard = ({ 
  character, 
  isMaster, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onArchive,
  onShare 
}: CharacterCardProps) => {
  const data = character.data as any;
  const imageSettings = data.image_settings || { x: 50, y: 50, scale: 100 };

  return (
    <Card 
      className="group relative overflow-hidden border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card flex flex-col"
    >
      {/* 1. IMAGEM (Topo - Aspecto Quadrado 1:1) */}
      <div 
        className="w-full aspect-square bg-muted relative overflow-hidden cursor-pointer border-b border-border/50"
        onClick={() => onEdit(character.id)}
      >
        {character.image_url ? (
          <img 
            src={character.image_url} 
            alt={character.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ 
              objectPosition: `${imageSettings.x}% ${imageSettings.y}%`, 
              transform: `scale(${imageSettings.scale / 100})` 
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/20 text-muted-foreground/30">
            <User className="w-12 h-12" />
          </div>
        )}

        {/* Badges Flutuantes sobre a imagem */}
        <div className="absolute top-1.5 right-1.5 z-20 flex gap-1">
            {character.is_archived && <Badge variant="secondary" className="h-4 px-1.5 text-[9px] bg-black/70 text-white backdrop-blur border-none">Arq.</Badge>}
            {character.is_shared && <Badge variant="outline" className="h-4 px-1.5 text-[9px] bg-blue-600/90 text-white border-none backdrop-blur shadow-sm"><Share2 className="w-2 h-2 mr-1"/> Pub</Badge>}
        </div>
      </div>

      {/* 2. INFORMAÇÕES (Baixo - Flexível para não cortar texto) */}
      <div className="p-2 flex flex-col gap-1.5">
         <div className="min-w-0">
            <h3 
                className="font-bold text-sm leading-tight truncate group-hover:text-primary transition-colors cursor-pointer" 
                title={character.name}
                onClick={() => onEdit(character.id)}
            >
                {character.name}
            </h3>
            <p className="text-[10px] text-muted-foreground truncate">
                {character.player?.display_name || "Sem Jogador"}
            </p>
         </div>
         
         {/* Tags (Raça/Classe) */}
         <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[9px] h-4 px-1 font-normal bg-secondary/30 truncate max-w-full">
                {data.race || "?"}
            </Badge>
            <Badge variant="outline" className="text-[9px] h-4 px-1 font-normal bg-secondary/30 truncate max-w-full">
                {data.occupation || "?"}
            </Badge>
         </div>

         {/* Botões de Ação (Compactos) */}
         <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/30">
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] px-2 hover:bg-primary/10 hover:text-primary"
                onClick={() => onEdit(character.id)}
            >
                Abrir
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onDuplicate(character)}>
                        <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onArchive(character.id, character.is_archived || false)}>
                        <Archive className="w-3.5 h-3.5 mr-2" /> {character.is_archived ? "Restaurar" : "Arquivar"}
                    </DropdownMenuItem>
                    {isMaster && onShare && (
                        <DropdownMenuItem onClick={() => onShare(character)}>
                            <Share2 className="w-3.5 h-3.5 mr-2" /> Partilhar
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => onDelete(character.id)} 
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
         </div>
      </div>
    </Card>
  );
};