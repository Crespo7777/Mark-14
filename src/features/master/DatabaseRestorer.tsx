import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Database, AlertTriangle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const DatabaseRestorer = ({ tableId }: { tableId: string }) => {
  const [loading, setLoading] = useState(false);
  const [restoredCount, setRestoredCount] = useState(0);
  const { toast } = useToast();

  const handleRestore = async () => {
    if (!confirm("Isto vai vasculhar Fichas, Habilidades e Traços dos jogadores para reconstruir o Database. Continuar?")) return;
    
    setLoading(true);
    setRestoredCount(0);
    let count = 0;

    try {
      // 1. Buscar todas as fichas (Personagens) desta mesa
      const { data: characters, error: charError } = await supabase
        .from("characters")
        .select("name, data")
        .eq("table_id", tableId);

      if (charError) throw charError;

      console.log(`[Restorer] Analisando ${characters?.length} fichas...`);

      // 2. Preparar listas
      const itemsToRestore: any[] = [];
      const seenNames = new Set(); 

      // Buscar o que JÁ existe para não duplicar
      const { data: existingItems } = await supabase
        .from("items")
        .select("name")
        .eq("table_id", tableId);
        
      existingItems?.forEach(i => seenNames.add(i.name));

      // 3. Função Auxiliar para Adicionar Item
      const addItemToRestore = (item: any, forceType?: string) => {
        if (!item || !item.name) return;
        if (seenNames.has(item.name)) return; // Já existe

        // Determinar Categoria (Type)
        // Se vier da mochila, tem 'category'. Se for habilidade, forçamos 'ability', etc.
        let finalType = forceType || item.category || 'general';
        
        // Correções comuns de mapeamento
        if (finalType === 'Qualidade') finalType = 'quality';
        if (finalType === 'Traço') finalType = 'trait';

        seenNames.add(item.name);
        
        itemsToRestore.push({
          table_id: tableId,
          name: item.name,
          type: finalType,
          weight: Number(item.weight) || 0,
          description: item.description || "",
          data: item.data || {}, // Importante: mantêm os dados extras (dano, efeitos, etc)
          icon_url: item.icon_url || null
        });
      };

      // 4. VARREDURA PROFUNDA (Deep Scan)
      characters?.forEach((char: any) => {
        const d = char.data || {};
        
        // A) Mochila (Inventory)
        if (Array.isArray(d.inventory)) {
            d.inventory.forEach((item: any) => addItemToRestore(item));
        }

        // B) Habilidades (Abilities)
        if (Array.isArray(d.abilities)) {
            d.abilities.forEach((item: any) => addItemToRestore(item, 'ability'));
        }

        // C) Traços (Traits)
        if (Array.isArray(d.traits)) {
            d.traits.forEach((item: any) => addItemToRestore(item, 'trait'));
        }
        
        // D) Rituais/Poderes (se existirem arrays separados)
        if (Array.isArray(d.rituals)) {
            d.rituals.forEach((item: any) => addItemToRestore(item, 'ability')); // Rituais geralmente são abilities no DB
        }

        // E) Qualidades (Qualities) - caso o sistema salve em array separado
        if (Array.isArray(d.qualities)) {
            d.qualities.forEach((item: any) => addItemToRestore(item, 'quality'));
        }
      });

      console.log(`[Restorer] Encontrados ${itemsToRestore.length} itens únicos para restaurar.`);

      // 5. Inserir no Database (Lotes de 20)
      if (itemsToRestore.length > 0) {
        const chunkSize = 20;
        for (let i = 0; i < itemsToRestore.length; i += chunkSize) {
          const chunk = itemsToRestore.slice(i, i + chunkSize);
          const { error } = await supabase.from("items").insert(chunk);
          if (error) {
              console.error("Erro ao restaurar lote:", error);
              toast({ title: "Erro num lote", description: error.message, variant: "destructive" });
          } else {
              count += chunk.length;
              setRestoredCount(count);
          }
        }
        
        toast({ 
          title: "Restauro Concluído!", 
          description: `${count} itens/habilidades foram recuperados das fichas.` 
        });
        
        // Força recarregamento da página após 2s para ver os itens
        setTimeout(() => window.location.reload(), 2000);

      } else {
        toast({ 
            title: "Nada novo encontrado", 
            description: "Vasculhei as fichas mas não achei itens que já não estejam no database." 
        });
      }

    } catch (error: any) {
      console.error("Erro fatal no restauro:", error);
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-blue-500/50 bg-blue-500/10 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Search className="w-4 h-4" /> Scanner Profundo de Fichas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">
            Esta ferramenta vai ler <strong>Mochilas, Habilidades, Traços e Rituais</strong> de todos os personagens e recriar o Database.
        </p>
        <Button 
            onClick={handleRestore} 
            disabled={loading}
            variant="outline"
            className="w-full border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
            {loading ? `Restaurando... (${restoredCount})` : "Executar Restauro Completo"}
        </Button>
      </CardContent>
    </Card>
  );
};