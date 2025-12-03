import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, Microscope, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const DatabaseRestorer = ({ tableId }: { tableId: string }) => {
  const [loading, setLoading] = useState(false);
  const [restoredCount, setRestoredCount] = useState(0);
  const { toast } = useToast();

  const extractField = (html: string, keywords: string[]): string => {
    if (!html) return "";
    const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    for (const key of keywords) {
        const regex = new RegExp(`${key}\\s*[:\\-]?\\s*([^:]+)`, "i");
        const match = plainText.match(regex);
        if (match && match[1]) {
            let value = match[1].trim();
            const stopWords = ["Adepto", "Mestre", "Custo", "Duração", "Tradição", "Ação"];
            for (const stop of stopWords) {
                if (stop !== key && value.includes(stop)) {
                    value = value.split(stop)[0].trim();
                }
            }
            return value;
        }
    }
    return "";
  };

  const handleRestore = async () => {
    if (!confirm("Vou extrair Qualidades de dentro das Armas/Armaduras e reconstruir o Database. Continuar?")) return;
    
    setLoading(true);
    setRestoredCount(0);
    let count = 0;

    try {
      const { data: characters, error: charError } = await supabase
        .from("characters")
        .select("name, data")
        .eq("table_id", tableId);

      if (charError) throw charError;

      const itemsToRestore: any[] = [];
      const seenNames = new Set(); 

      const { data: existingItems } = await supabase
        .from("items")
        .select("name")
        .eq("table_id", tableId);
        
      existingItems?.forEach(i => seenNames.add(i.name));

      // 1. PROCESSADOR DE ITENS NORMAIS
      const processItem = (item: any, sourceList: string) => {
        if (!item || !item.name) return;
        if (seenNames.has(item.name)) return;

        let type = item.category || 'general';
        if (sourceList === 'qualities') type = 'quality';
        if (sourceList === 'abilities' || sourceList === 'rituals') type = 'ability';
        if (sourceList === 'traits') type = 'trait';

        if (type === 'Qualidade') type = 'quality';
        if (type === 'Traço') type = 'trait';
        if (type === 'Habilidade') type = 'ability';

        const restoredData = { ...(item.data || {}) };
        const desc = item.description || "";

        if (!restoredData.novice) restoredData.novice = extractField(desc, ["Novato", "Novice"]);
        if (!restoredData.adept) restoredData.adept = extractField(desc, ["Adepto", "Adept"]);
        if (!restoredData.master) restoredData.master = extractField(desc, ["Mestre", "Master"]);
        if (!restoredData.cost) restoredData.cost = extractField(desc, ["Custo", "Cost", "Corruption"]);
        if (!restoredData.tradition) restoredData.tradition = extractField(desc, ["Tradição", "Tradition"]);

        if (type === 'quality') {
            if (!restoredData.effect) restoredData.effect = extractField(desc, ["Efeito", "Effect"]);
            if (!restoredData.targetType) restoredData.targetType = "Geral";
        }

        seenNames.add(item.name);
        itemsToRestore.push({
          table_id: tableId,
          name: item.name,
          type: type,
          weight: Number(item.weight) || 0,
          description: desc,
          data: restoredData,
          icon_url: item.icon_url || null
        });
      };

      // 2. NOVO: PROCESSADOR DE STRINGS DE QUALIDADE (Ex: "Afiada, Pesada")
      const processQualitiesFromString = (qualityString: string, fullDesc: string) => {
        if (!qualityString) return;
        
        // Separa por vírgula: "Afiada, Pesada" -> ["Afiada", "Pesada"]
        const names = qualityString.split(",").map(s => s.trim()).filter(Boolean);
        
        names.forEach(qName => {
            if (seenNames.has(qName)) return; // Já existe no DB
            
            // Tenta achar a descrição específica desta qualidade no texto gigante
            let qDesc = "";
            if (fullDesc) {
                const regex = new RegExp(`(?:\\*\\*)?${qName}(?:\\*\\*)?\\s*:\\s*([^\\n]+)`, "i");
                const match = fullDesc.match(regex);
                if (match) qDesc = match[1];
            }

            seenNames.add(qName);
            itemsToRestore.push({
                table_id: tableId,
                name: qName,
                type: 'quality', // Força ser uma Qualidade
                weight: 0,
                description: qDesc || "Restaurada automaticamente da ficha.",
                data: { targetType: 'Geral', effect: qDesc },
                icon_url: null
            });
        });
      };

      // --- EXECUÇÃO DA VARREDURA ---
      characters?.forEach((char: any) => {
        const d = char.data || {};
        
        if (Array.isArray(d.inventory)) d.inventory.forEach((i: any) => processItem(i, 'inventory'));
        if (Array.isArray(d.abilities)) d.abilities.forEach((i: any) => processItem(i, 'abilities'));
        if (Array.isArray(d.traits)) d.traits.forEach((i: any) => processItem(i, 'traits'));
        if (Array.isArray(d.qualities)) d.qualities.forEach((i: any) => processItem(i, 'qualities'));
        
        // PROCURA DENTRO DAS ARMAS E ARMADURAS
        if (Array.isArray(d.weapons)) {
            d.weapons.forEach((w: any) => {
                processItem(w, 'weapon'); // Restaura a arma em si
                processQualitiesFromString(w.quality, w.quality_desc); // Restaura as qualidades dela
            });
        }
        if (Array.isArray(d.armors)) {
            d.armors.forEach((a: any) => {
                processItem(a, 'armor'); // Restaura a armadura
                processQualitiesFromString(a.quality, a.quality_desc); // Restaura as qualidades dela
            });
        }
      });

      console.log(`[Restorer Final] ${itemsToRestore.length} itens prontos para resgate.`);

      if (itemsToRestore.length > 0) {
        const chunkSize = 20;
        for (let i = 0; i < itemsToRestore.length; i += chunkSize) {
          const chunk = itemsToRestore.slice(i, i + chunkSize);
          const { error } = await supabase.from("items").insert(chunk);
          if (error) {
              console.error("Erro lote:", error);
              toast({ title: "Erro Parcial", description: "Alguns itens falharam.", variant: "destructive" });
          } else {
              count += chunk.length;
              setRestoredCount(count);
          }
        }
        
        toast({ 
          title: "Restauro Completo!", 
          description: `${count} Itens e Qualidades recuperados com sucesso.` 
        });
        
        setTimeout(() => window.location.reload(), 1500);

      } else {
        toast({ 
            title: "Tudo em dia", 
            description: "O Database já contém todos os itens encontrados nas fichas." 
        });
      }

    } catch (error: any) {
      console.error("Erro Fatal:", error);
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-emerald-500/50 bg-emerald-500/10 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Tag className="w-4 h-4" /> Restaurador de Qualidades (V3)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">
            Este modo lê os textos das Armas ("Afiada, Longa") e cria as Qualidades individuais no Database. 
            Também atualiza o Seletor para funcionar com a nova tabela.
        </p>
        <Button 
            onClick={handleRestore} 
            disabled={loading}
            variant="outline"
            className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Microscope className="w-4 h-4 mr-2" />}
            {loading ? `Processando... (${restoredCount})` : "Resgatar Qualidades das Armas"}
        </Button>
      </CardContent>
    </Card>
  );
};