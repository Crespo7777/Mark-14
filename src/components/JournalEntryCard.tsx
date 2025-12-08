import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Book, Calendar, MoreVertical, Eye, Edit, Trash2, Share2, Image as ImageIcon
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface JournalEntry {
  id: string;
  title: string;
  created_at: string;
  is_shared?: boolean;
  category?: string;
  data?: {
    cover_image?: string | null;
  };
}

interface JournalEntryCardProps {
  entry: JournalEntry;
  onRead: (entry: JournalEntry) => void;
  onEdit?: (entry: JournalEntry) => void;
  onDelete?: (entry: JournalEntry) => void;
  isGM?: boolean; 
}

export function JournalEntryCard({
  entry,
  onRead,
  onEdit,
  onDelete,
  isGM = false,
}: JournalEntryCardProps) {
  const coverUrl = entry.data?.cover_image;
  // Fallback seguro para data inválida
  let dateLabel = "Data desconhecida";
  try {
    if (entry.created_at) {
        dateLabel = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ptBR });
    }
  } catch (e) {
    console.error("Erro ao formatar data:", e);
  }

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden flex flex-col transition-all duration-200",
        "hover:shadow-md hover:border-primary/50 cursor-pointer bg-card/50 backdrop-blur-sm",
        "h-[180px]" 
      )}
      onClick={() => onRead(entry)}
    >
      {/* --- ÁREA DA IMAGEM (TOPO) --- */}
      <div className="relative h-24 w-full shrink-0 overflow-hidden bg-muted">
        {coverUrl ? (
          <>
            <img 
              src={coverUrl} 
              alt={entry.title} 
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Book className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Badges Flutuantes */}
        <div className="absolute top-2 left-2 flex gap-1">
            {entry.is_shared && (
                <Badge variant="secondary" className="bg-background/80 text-[10px] h-5 px-1.5 backdrop-blur-md text-primary border-primary/20 shadow-sm">
                    Público
                </Badge>
            )}
        </div>

        {/* Menu de Ações - CORRIGIDO */}
        {(isGM || onEdit) && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/50 hover:bg-background/90 backdrop-blur-md rounded-full text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button> 
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRead(entry)}>
                  <Eye className="w-4 h-4 mr-2" /> Ler
                </DropdownMenuItem>
                {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(entry)}>
                    <Edit className="w-4 h-4 mr-2" /> Editar
                    </DropdownMenuItem>
                )}
                {isGM && onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(entry)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* --- ÁREA DO CONTEÚDO (BASE) --- */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-1 border-t border-border/10 bg-background/40 group-hover:bg-background/60 transition-colors">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors">
          {entry.title || "Sem Título"}
        </h3>
        
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
          <Calendar className="h-3 w-3" />
          <span>{dateLabel}</span>
        </div>
      </div>
    </Card>
  );
}