import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Database, Search, Zap, Microscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const DatabaseRestorer = ({ tableId }: { tableId: string }) => {
  const [loading, setLoading] = useState(false);
  const [restoredCount, setRestoredCount] = useState(0);
  const { toast } = useToast();

  // --- PARSER AVANÇADO DE HTML (A Mágica) ---
  // Tenta extrair valores de campos específicos perdidos dentro do texto HTML
  const extractField = (html: string, keywords: string[]): string => {
    if (!html) return "";
    
    // Remove tags HTML para facilitar a busca de texto puro
    const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    
    for (const key of keywords) {
        // Procura por "PalavraChave:" ou "PalavraChave"
        const regex = new RegExp(`${key}\\s*[:\\-]?\\s*([^:]+)`, "i");
        const match = plainText.match(regex);
        
        if (match && match[1]) {
            // Pega o texto até encontrar outra palavra-chave comum ou terminar
            let value = match[1].trim();
            // Corta se encontrar outra palavra chave logo a seguir (heurística)
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
    if (!confirm("Vou vasculhar todas as listas possíveis (Qualidades, Habilidades, Itens) e tentar extrair detalhes profundos dos textos. Continuar?")) return;
    
    setLoading(true);
    setRestoredCount(0);
    let count = 0;

    try {
      // 1. Buscar TUDO das fichas
      const { data: characters, error: charError } = await supabase
        .from("characters")
        .select("name, data")
        .eq("table_id", tableId);

      if (charError) throw charError;

      const itemsToRestore: any[] = [];
      const seenNames = new Set(); 

      // 2. Carregar o que já existe para não duplicar (baseado no nome)
      const { data: existingItems } = await supabase
        .from("items")
        .select("name")
        .eq("table_id", tableId);
        
      existingItems?.forEach(i => seenNames.add(i.name));

      // 3. Função de Processamento de Item
      const processItem = (item: any, sourceList: string) => {
        if (!item || !item.name) return;
        if (seenNames.has(item.name)) return; // Já existe

        // --- A. Determinar Categoria (Type) ---
        let type = item.category || 'general';
        
        // Se veio de uma lista específica, forçamos o tipo se o item não tiver
        if (sourceList === 'qualities') type = 'quality';
        if (sourceList === 'abilities') type = 'ability';
        if (sourceList === 'traits') type = 'trait';
        if (sourceList === 'rituals') type = 'ability'; // Rituais são abilities

        // Normalização de nomes antigos
        if (type === 'Qualidade') type = 'quality';
        if (type === 'Traço') type = 'trait';
        if (type === 'Habilidade') type = 'ability';

        // --- B. Reconstrução de Dados (Data) ---
        const restoredData = { ...(item.data || {}) };
        const desc = item.description || "";

        // Tenta recuperar campos que podem ter sido achatados na descrição
        if (!restoredData.novice) restoredData.novice = extractField(desc, ["Novato", "Novice"]);
        if (!restoredData.adept) restoredData.adept = extractField(desc, ["Adepto", "Adept"]);
        if (!restoredData.master) restoredData.master = extractField(desc, ["Mestre", "Master"]);
        
        if (!restoredData.cost) restoredData.cost = extractField(desc, ["Custo", "Cost", "Corruption"]);
        if (!restoredData.tradition) restoredData.tradition = extractField(desc, ["Tradição", "Tradition"]);
        if (!restoredData.duration) restoredData.duration = extractField(desc, ["Duração", "Duration"]);
        
        // Para Qualidades
        if (type === 'quality') {
            if (!restoredData.effect) restoredData.effect = extractField(desc, ["Efeito", "Effect"]);
            // Se não tiver targetType, tentamos adivinhar ou deixar genérico
            if (!restoredData.targetType) restoredData.targetType = "Geral";
        }

        // --- C. Adicionar à Lista ---
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

      // 4. VARREDURA EXTENSIVA (Olha em todas as gavetas possíveis)
      characters?.forEach((char: any) => {
        const d = char.data || {};
        
        // Listas Padrão
        if (Array.isArray(d.inventory)) d.inventory.forEach((i: any) => processItem(i, 'inventory'));
        if (Array.isArray(d.abilities)) d.abilities.forEach((i: any) => processItem(i, 'abilities'));
        if (Array.isArray(d.traits)) d.traits.forEach((i: any) => processItem(i, 'traits'));
        
        // Listas Específicas / Raras
        if (Array.isArray(d.qualities)) d.qualities.forEach((i: any) => processItem(i, 'qualities'));
        if (Array.isArray(d.rituals)) d.rituals.forEach((i: any) => processItem(i, 'rituals'));
        if (Array.isArray(d.powers)) d.powers.forEach((i: any) => processItem(i, 'abilities'));
        if (Array.isArray(d.features)) d.features.forEach((i: any) => processItem(i, 'trait'));
      });

      console.log(`[Restorer V3] Encontrados ${itemsToRestore.length} itens novos.`);

      // 5. Salvar em Lotes
      if (itemsToRestore.length > 0) {
        const chunkSize = 20;
        for (let i = 0; i < itemsToRestore.length; i += chunkSize) {
          const chunk = itemsToRestore.slice(i, i + chunkSize);
          const { error } = await supabase.from("items").insert(chunk);
          if (error) {
              console.error("Erro no lote:", error);
              toast({ title: "Erro Parcial", description: "Alguns itens falharam.", variant: "destructive" });
          } else {
              count += chunk.length;
              setRestoredCount(count);
          }
        }
        
        toast({ 
          title: "Sucesso Absoluto!", 
          description: `${count} itens recuperados (Qualidades, Habilidades e Detalhes).` 
        });
        
        setTimeout(() => window.location.reload(), 2000);

      } else {
        toast({ 
            title: "Nada Novo", 
            description: "Não encontrei itens que já não existam no database." 
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
    <Card className="border-green-500/50 bg-green-500/10 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-green-600 dark:text-green-400">
            <Microscope className="w-4 h-4" /> Restaurador V3 (Profundo)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">
            Este modo varre listas escondidas (Qualidades, Rituais) e tenta 
            <strong> ler o texto HTML</strong> para preencher campos perdidos como 
            "Novato", "Custo" e "Tradição".
        </p>
        <Button 
            onClick={handleRestore} 
            disabled={loading}
            variant="outline"
            className="w-full border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            {loading ? `Extraindo dados... (${restoredCount})` : "Iniciar Restauro Profundo"}
        </Button>
      </CardContent>
    </Card>
  );
};