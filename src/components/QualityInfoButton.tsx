import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QualityInfoButtonProps {
  qualitiesString: string;
  tableId: string;
}

export const QualityInfoButton = ({ qualitiesString, tableId }: QualityInfoButtonProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foundQualities, setFoundQualities] = useState<any[]>([]);

  const handleOpen = async () => {
    if (!qualitiesString.trim()) return;
    setOpen(true);
    setLoading(true);

    // Separa a string por vírgulas ou espaços (ex: "Longa, Pesada")
    const terms = qualitiesString.split(/[;,]+/).map(t => t.trim().toLowerCase()).filter(Boolean);

    if (terms.length === 0) {
        setLoading(false);
        return;
    }

    // Busca no banco de dados
    const { data } = await supabase
      .from("item_templates")
      .select("name, description, data")
      .eq("table_id", tableId)
      .eq("category", "quality");

    if (data) {
      // Filtra no cliente para encontrar matches (case insensitive)
      const matches = data.filter(q => terms.includes(q.name.toLowerCase()));
      setFoundQualities(matches);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-accent"
            onClick={handleOpen}
            title="Ver regras das qualidades"
            type="button"
        >
          <Info className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regras das Qualidades</DialogTitle>
          <DialogDescription>Detalhes baseados no Database da mesa.</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[300px] mt-2 pr-4">
            {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin w-6 h-6" /></div>
            ) : foundQualities.length > 0 ? (
                <div className="space-y-4">
                    {foundQualities.map((q, idx) => (
                        <div key={idx} className="border-b pb-2 last:border-0">
                            <h4 className="font-bold text-primary flex justify-between">
                                {q.name}
                                <span className="text-xs font-normal text-muted-foreground uppercase border px-1 rounded">
                                    {q.data?.targetType || "Geral"}
                                </span>
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">{q.description}</p>
                            {q.data?.effect && (
                                <p className="text-xs bg-muted/50 p-1 rounded mt-1 font-mono text-accent">
                                    Efeito: {q.data.effect}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma qualidade encontrada com esses nomes no Database.
                </p>
            )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};