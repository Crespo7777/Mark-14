import { NpcWithRelations } from "@/types/app-types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Archive, Share2, MoreVertical, Trash2, Edit, Skull } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface NpcCardProps {
  npc: NpcWithRelations;
  isMaster: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (npc: NpcWithRelations) => void;
  onArchive: (id: string, current: boolean) => void;
  onShare?: (npc: NpcWithRelations) => void;
}

export const NpcCard = ({ 
  npc, 
  isMaster, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onArchive,
  onShare 
}: NpcCardProps) => {
  const data = npc.data as any;
  const imageSettings = data.image_settings || { x: 50, y: 50, scale: 100 };

  return (
    <Card 
      className="group relative overflow-hidden border-border/60 hover:border-destructive/50 transition-all duration-300 hover:shadow-lg bg-card flex flex-col h-full"
    >
      {/* 1. IMAGEM (Quadrada 1:1) */}
      <div 
        className="w-full aspect-square bg-muted relative overflow-hidden cursor-pointer border-b border-border/50"
        onClick={() => onEdit(npc.id)}
      >
        {npc.image_url ? (
          <img 
            src={npc.image_url} 
            alt={npc.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ 
              objectPosition: `${imageSettings.x}% ${imageSettings.y}%`, 
              transform: `scale(${imageSettings.scale / 100})` 
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/20 text-muted-foreground/30">
            <Skull className="w-12 h-12" />
          </div>
        )}

        {/* Badges Flutuantes */}
        <div className="absolute top-2 right-2 z-20 flex gap-1">
            {npc.is_archived && <Badge variant="secondary" className="h-5 px-2 text-[10px] bg-black/70 text-white backdrop-blur border-none">Arq.</Badge>}
            {npc.is_shared && <Badge variant="outline" className="h-5 px-2 text-[10px] bg-blue-600/90 text-white border-none backdrop-blur shadow-sm"><Share2 className="w-3 h-3 mr-1"/> Pub</Badge>}
        </div>
        
        {/* Gradiente para texto */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent opacity-40 pointer-events-none" />
      </div>

      {/* 2. INFORMAÇÕES */}
      <div className="p-2 flex flex-col gap-1.5 flex-1">
         <div className="min-w-0">
            <h3 
                className="font-bold text-sm leading-tight truncate group-hover:text-destructive transition-colors cursor-pointer" 
                title={npc.name}
                onClick={() => onEdit(npc.id)}
            >
                {npc.name}
            </h3>
         </div>
         
         {/* Tags (Raça/Tipo) */}
         <div className="flex flex-wrap gap-1 mt-auto">
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-normal truncate max-w-[100px]">
                {data.race || "Criatura"}
            </Badge>
            {data.occupation && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-normal truncate max-w-[100px] text-muted-foreground">
                    {data.occupation}
                </Badge>
            )}
         </div>

         {/* Botões de Ação */}
         <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/30">
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] px-2 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onEdit(npc.id)}
            >
                Ficha
            </Button>

            <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                            <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onDuplicate(npc)}>
                            <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onArchive(npc.id, npc.is_archived || false)}>
                            <Archive className="w-3.5 h-3.5 mr-2" /> {npc.is_archived ? "Restaurar" : "Arquivar"}
                        </DropdownMenuItem>
                        {isMaster && onShare && (
                            <DropdownMenuItem onClick={() => onShare(npc)}>
                                <Share2 className="w-3.5 h-3.5 mr-2" /> Partilhar
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            onClick={() => onDelete(npc.id)} 
                            className="text-destructive focus:text-destructive"
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