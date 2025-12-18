import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QualityInfoButtonProps {
  qualitiesString: string;
  tableId: string;
}

// Nota: A palavra 'export' antes de function é essencial para corrigir o erro
export function QualityInfoButton({ qualitiesString, tableId }: QualityInfoButtonProps) {
  const qualities = qualitiesString
    ? qualitiesString.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const { data: qualityData } = useQuery({
    queryKey: ["quality-descriptions", tableId, qualities],
    queryFn: async () => {
      if (qualities.length === 0) return [];
      
      // Buscar apenas as qualidades listadas
      const { data } = await supabase
        .from("item_templates")
        .select("name, description")
        .eq("table_id", tableId)
        .eq("category", "quality")
        .in("name", qualities); // Filtra pelos nomes
        
      return data || [];
    },
    enabled: qualities.length > 0, // Só busca se houver qualidades escritas
  });

  if (qualities.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 hover:bg-accent/20" title="Ver regras das qualidades">
          <Info className="h-3.5 w-3.5 text-blue-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 border-blue-500/30 bg-black/95 backdrop-blur shadow-xl">
        <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
            <Info className="h-4 w-4 text-blue-400" />
            <h4 className="font-semibold text-sm text-white">Regras das Qualidades</h4>
        </div>
        <ScrollArea className="max-h-[250px] pr-2">
            <div className="space-y-3">
            {qualities.map((q) => {
                // Tenta encontrar a descrição exata (case insensitive)
                const info = qualityData?.find(d => d.name.toLowerCase() === q.toLowerCase());
                
                return (
                    <div key={q} className="text-xs">
                        <span className="font-bold text-blue-300 block mb-0.5 capitalize">{q}</span>
                        <div className="text-muted-foreground leading-relaxed">
                            {info?.description 
                                ? info.description.replace(/<[^>]*>?/gm, '') // Remove HTML básico se houver
                                : "Sem descrição na base de dados."}
                        </div>
                    </div>
                );
            })}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}