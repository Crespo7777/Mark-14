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
  // Usa exatamente as mesmas definições da ficha
  const imageSettings = data.image_settings || { x: 50, y: 50, scale: 100 };

  return (
    <Card 
      className="group relative overflow-hidden border-border/40 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer flex flex-row h-32"
      onClick={() => onEdit(character.id)}
    >
      {/* 1. Secção de Imagem (Quadrada à esquerda - Igual à ficha) */}
      <div className="w-32 h-full shrink-0 bg-muted relative overflow-hidden border-r border-border/50">
        {character.image_url ? (
          <img 
            src={character.image_url} 
            alt={character.name}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ 
              // APLICAÇÃO EXATA DO ENQUADRAMENTO DA FICHA
              objectPosition: `${imageSettings.x}% ${imageSettings.y}%`, 
              transform: `scale(${imageSettings.scale / 100})` 
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/20 text-muted-foreground/30">
            <User className="w-10 h-10" />
          </div>
        )}
      </div>

      {/* 2. Secção de Informações (Direita) */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        
        {/* Cabeçalho: Nome e Badges */}
        <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
                <h3 className="font-bold truncate text-base leading-tight group-hover:text-primary transition-colors" title={character.name}>
                    {character.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {character.player?.display_name || "Sem Jogador"}
                </p>
            </div>

            <div className="flex flex-col gap-1 items-end shrink-0">
                {character.is_archived && <Badge variant="secondary" className="h-4 px-1 text-[9px]">Arq.</Badge>}
                {character.is_shared && <Badge variant="outline" className="h-4 px-1 text-[9px] border-blue-500/50 text-blue-500">Pub</Badge>}
            </div>
        </div>

        {/* Rodapé: Tags e Menu */}
        <div className="flex justify-between items-end mt-1">
            <div className="flex flex-wrap gap-1 content-end overflow-hidden">
                 <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal max-w-[80px] truncate bg-muted">
                    {data.race || "?"}
                </Badge>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal max-w-[80px] truncate bg-muted">
                    {data.occupation || "?"}
                </Badge>
            </div>

            {/* Botão de Menu */}
            <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onEdit(character.id)}>
                            <Edit className="w-3.5 h-3.5 mr-2" /> Abrir Ficha
                        </DropdownMenuItem>
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
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </div>
    </Card>
  );
};