import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JournalRenderer } from "./JournalRenderer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Tag, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Interface atualizada para bater certo com a tua estrutura de dados
interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  // AQUI ESTAVA O ERRO: A imagem está dentro de 'data', não solta na raiz
  data?: {
    cover_image?: string | null;
    [key: string]: any;
  };
  is_shared?: boolean;
  // Adiciona outros campos se existirem na tabela
}

interface JournalReadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: JournalEntry | null;
}

export function JournalReadDialog({
  open,
  onOpenChange,
  entry,
}: JournalReadDialogProps) {
  
  if (!entry) return null;

  // 1. Extração correta da imagem (do campo 'data')
  // Como o teu editor já salva a URL completa (http...), usamos direto.
  const coverUrl = entry.data?.cover_image;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-sm border-border flex flex-col shadow-2xl">
        
        {/* Header oculto para acessibilidade */}
        <DialogHeader className="sr-only">
          <DialogTitle>{entry.title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 w-full h-full">
          <div className="flex flex-col min-h-full pb-20">
            
            {/* 2. ÁREA DA CAPA */}
            <div className="relative w-full h-64 md:h-80 group shrink-0 bg-muted">
              {coverUrl ? (
                <>
                  <img
                    src={coverUrl}
                    alt={`Capa de ${entry.title}`}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.classList.add('fallback-active');
                    }}
                  />
                  {/* Overlay para profundidade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-black/10" />
                </>
              ) : (
                // Fallback: Gradiente se não tiver capa
                <div className="w-full h-full bg-gradient-to-br from-primary/10 via-background to-muted flex items-center justify-center">
                   <div className="text-muted-foreground/20 flex flex-col items-center gap-2">
                      <ImageOff className="w-16 h-16" />
                      <span className="text-sm font-medium">Sem capa definida</span>
                   </div>
                </div>
              )}
              
              {/* Degradê inferior para fusão perfeita com o texto */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </div>

            {/* 3. CONTEÚDO */}
            <div className="px-6 md:px-20 lg:px-24 -mt-16 relative z-10 flex-1">
              
              {/* Metadados */}
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50 shadow-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="capitalize font-medium">
                    {format(new Date(entry.created_at), "d 'de' MMMM, yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                
                {/* Se quiseres mostrar a tag de 'Público/Privado' aqui também */}
                {entry.is_shared && (
                   <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1">
                     <Tag className="w-3 h-3 mr-1.5" />
                     Público
                   </Badge>
                )}
              </div>

              {/* Título */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-8 break-words drop-shadow-sm leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                {entry.title}
              </h1>

              {/* Linha Divisória */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-10 opacity-50" />

              {/* Corpo do Texto */}
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 min-h-[200px]">
                <JournalRenderer content={entry.content} />
              </div>
              
            </div>
            
            {/* Espaço extra no final */}
            <div className="h-24" />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}