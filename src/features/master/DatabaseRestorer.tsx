import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Database, AlertTriangle, Search, FlaskConical, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const DatabaseRestorer = ({ tableId }: { tableId: string }) => {
  const [loading, setLoading] = useState(false);
  const [restoredCount, setRestoredCount] = useState(0);
  const { toast } = useToast();

  // Função mágica para extrair dados de dentro do HTML da descrição
  const extractFromHtml = (html: string, tag: string): string => {
    if (!html) return "";
    // Tenta encontrar padrões como: <li><strong>Novato:</strong> Texto...</li>
    const regex = new RegExp(`<li><strong>${tag}:</strong>\\s*(.*?)</li>`, "i");
    const match = html.match(regex);
    if (match && match[1]) {
        return match[1].replace(/<[^>]*>?/gm, ''); // Remove tags HTML extras se sobrarem
    }
    return "";
  };

  const handleRestore = async () => {
    if (!confirm("Isto vai analisar profundamente as fichas para reconstruir Habilidades, Custos e Níveis perdidos. Continuar?")) return;
    
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

      // Verificar o que já existe no DB
      const { data: existingItems } = await supabase
        .from("items")
        .select("name")
        .eq("table_id", tableId);
        
      existingItems?.forEach(i => seenNames.add(i.name));

      const addItemToRestore = (item: any, forceType?: string) => {
        if (!item || !item.name) return;
        if (seenNames.has(item.name)) return;

        let finalType = forceType || item.category || 'general';
        if (finalType === 'Qualidade') finalType = 'quality';
        if (finalType === 'Traço') finalType = 'trait';

        // --- RECONSTRUÇÃO INTELIGENTE DE DADOS ---
        const restoredData = { ...(item.data || {}) };

        // 1. Resgatar Habilidades (Que foram achatadas na ficha)
        if (finalType === 'ability' || finalType === 'trait') {
            // Resgata campos raiz que não estão em 'data'
            if (item.corruptionCost) restoredData.corruptionCost = item.corruptionCost;
            if (item.associatedAttribute) restoredData.associatedAttribute = item.associatedAttribute;
            if (item.tradition) restoredData.tradition = item.tradition;
            if (item.cost) restoredData.cost = item.cost; // Para traços

            // Tenta extrair Novato/Adepto/Mestre do HTML da descrição
            if (item.description) {
                const nov = extractFromHtml(item.description, "Novato");
                const ade = extractFromHtml(item.description, "Adepto");
                const mas = extractFromHtml(item.description, "Mestre");

                if (nov) restoredData.novice = nov;
                if (ade) restoredData.adept = ade;
                if (mas) restoredData.master = mas;
            }
        }

        // 2. Resgatar Inventário (Geralmente já vem certo, mas reforçamos)
        if (item.quality && !restoredData.quality) restoredData.quality = item.quality;
        if (item.damage && !restoredData.damage) restoredData.damage = item.damage;

        seenNames.add(item.name);
        
        itemsToRestore.push({
          table_id: tableId,
          name: item.name,
          type: finalType,
          weight: Number(item.weight) || 0,
          description: item.description || "",
          data: restoredData, // Usa o nosso objeto reconstruído
          icon_url: item.icon_url || null
        });
      };

      // VARREDURA COMPLETA
      characters?.forEach((char: any) => {
        const d = char.data || {};
        
        // Mochila
        if (Array.isArray(d.inventory)) d.inventory.forEach((item: any) => addItemToRestore(item));
        
        // Habilidades (Forçando tipo 'ability' para ativar a lógica de extração HTML)
        if (Array.isArray(d.abilities)) d.abilities.forEach((item: any) => addItemToRestore(item, 'ability'));
        
        // Traços
        if (Array.isArray(d.traits)) d.traits.forEach((item: any) => addItemToRestore(item, 'trait'));
        
        // Rituais (Muitas vezes guardados em 'abilities', mas se tiver lista própria...)
        if (Array.isArray(d.rituals)) d.rituals.forEach((item: any) => addItemToRestore(item, 'ability'));
      });

      console.log(`[Restorer] Preparado para restaurar ${itemsToRestore.length} itens com dados reconstruídos.`);

      // INSERÇÃO SEGURA (Lotes de 20)
      if (itemsToRestore.length > 0) {
        const chunkSize = 20;
        for (let i = 0; i < itemsToRestore.length; i += chunkSize) {
          const chunk = itemsToRestore.slice(i, i + chunkSize);
          const { error } = await supabase.from("items").insert(chunk);
          if (error) {
              console.error("Erro no lote:", error);
              toast({ title: "Erro Parcial", description: "Alguns itens falharam ao salvar.", variant: "destructive" });
          } else {
              count += chunk.length;
              setRestoredCount(count);
          }
        }
        
        toast({ 
          title: "Reconstrução Completa!", 
          description: `${count} itens recuperados com sucesso.` 
        });
        
        setTimeout(() => window.location.reload(), 1500);

      } else {
        toast({ 
            title: "Database Atualizado", 
            description: "Nenhum item novo encontrado nas fichas." 
        });
      }

    } catch (error: any) {
      console.error("Erro fatal:", error);
      toast({ title: "Erro Crítico", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-purple-500/50 bg-purple-500/10 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <FlaskConical className="w-4 h-4" /> Reconstrutor de Database (V2)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">
            Este algoritmo varre as fichas e usa <strong>Engenharia Reversa</strong> para extrair 
            detalhes perdidos (Níveis de Habilidade, Custos, Tradições) de dentro das descrições HTML.
        </p>
        <Button 
            onClick={handleRestore} 
            disabled={loading}
            variant="outline"
            className="w-full border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            {loading ? `Reconstruindo... (${restoredCount})` : "Executar Restauro Profundo"}
        </Button>
      </CardContent>
    </Card>
  );
};