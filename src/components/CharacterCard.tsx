import { CharacterWithRelations } from "@/types/app-types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Archive, Share2, MoreVertical, Trash2, Edit } from "lucide-react";
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
      className="group relative overflow-hidden border-border/40 bg-muted/20 hover:ring-2 hover:ring-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer h-32"
      onClick={() => onEdit(character.id)}
    >
      {/* Imagem de Fundo Completa */}
      <div className="absolute inset-0 z-0">
        {character.image_url ? (
          <img 
            src={character.image_url} 
            alt={character.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
            style={{ 
              objectPosition: `${imageSettings.x}% ${imageSettings.y}%`, 
              transform: `scale(${imageSettings.scale / 100})` 
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/50 to-muted">
            <span className="text-4xl font-bold text-muted-foreground/30 select-none">
              {character.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Gradiente Escuro para Leitura de Texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      {/* Badges Flutuantes (Topo) */}
      <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {character.is_archived && <Badge variant="secondary" className="h-4 px-1.5 text-[9px] bg-black/60 text-white border-none">Arq.</Badge>}
          {character.is_shared && <Badge variant="outline" className="h-4 px-1.5 text-[9px] bg-blue-600/80 text-white border-none"><Share2 className="w-2 h-2 mr-1"/> Pub</Badge>}
      </div>

      {/* Informações (Fundo) */}
      <div className="absolute bottom-0 left-0 w-full p-3 z-20">
          <div className="flex justify-between items-end">
              <div className="min-w-0 flex-1 mr-2">
                  <h3 className="font-bold truncate text-sm text-white leading-tight drop-shadow-md group-hover:text-primary transition-colors">
                      {character.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-white/70 font-medium truncate">
                      <span className="truncate max-w-[80px]">{data.race || "Raça?"}</span>
                      <span className="mx-0.5">•</span>
                      <span className="truncate max-w-[80px]">{data.occupation || "Classe?"}</span>
                  </div>
              </div>

              {/* Botão de Menu (Só aparece no Hover ou em mobile) */}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/20 rounded-full">
                            <MoreVertical className="w-3.5 h-3.5" />
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