import { useTableContext } from "@/features/table/TableContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { User, Grab } from "lucide-react";

export const MapSidebar = () => {
  const { characters } = useTableContext();

  // Função chamada quando começamos a arrastar um card
  const handleDragStart = (e: React.DragEvent, charId: string, charName: string) => {
    // Passamos os dados do personagem no evento de arrasto
    e.dataTransfer.setData("characterId", charId);
    e.dataTransfer.setData("type", "character");
    e.dataTransfer.setData("label", charName);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="w-64 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg shadow-xl flex flex-col max-h-[80vh]">
      <div className="p-3 border-b border-white/10 bg-white/5 rounded-t-lg">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Atores
        </h3>
      </div>
      
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {characters.map((char) => (
            <Card 
              key={char.id}
              className="p-2 bg-zinc-900/80 border-white/10 hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors flex items-center gap-3 group"
              draggable
              onDragStart={(e) => handleDragStart(e, char.id, char.name)}
            >
              {/* Ícone ou Imagem do Personagem */}
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden border border-white/10">
                 {/* Se tiver imagem no futuro, colocamos aqui. Por enquanto, ícone. */}
                 <User className="w-5 h-5 text-muted-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{char.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">Nível {char.level || 1}</p>
              </div>

              <Grab className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
            </Card>
          ))}
          
          {characters.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum personagem encontrado.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};