// src/features/master/DatabaseRestorer.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Database, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const DatabaseRestorer = ({ tableId }: { tableId: string }) => {
  const [loading, setLoading] = useState(false);
  const [restoredCount, setRestoredCount] = useState(0);
  const { toast } = useToast();

  const handleRestore = async () => {
    if (!confirm("Isto vai ler os itens das fichas dos jogadores e recriá-los no Database. Continuar?")) return;
    
    setLoading(true);
    setRestoredCount(0);
    let count = 0;

    try {
      // 1. Buscar todas as fichas (Personagens) desta mesa
      const { data: characters, error: charError } = await supabase
        .from("characters")
        .select("data")
        .eq("table_id", tableId);

      if (charError) throw charError;

      // 2. Preparar lista de itens únicos encontrados
      const itemsToRestore: any[] = [];
      const seenNames = new Set(); // Para evitar duplicados

      // Primeiro, ver o que JÁ existe no banco para não duplicar
      const { data: existingItems } = await supabase
        .from("items")
        .select("name")
        .eq("table_id", tableId);
        
      existingItems?.forEach(i => seenNames.add(i.name));

      // 3. Varrer as mochilas
      characters?.forEach((char: any) => {
        const inventory = char.data?.inventory || [];
        
        inventory.forEach((item: any) => {
          // Se tem nome, categoria e ainda não está na lista
          if (item.name && item.category && !seenNames.has(item.name)) {
            seenNames.add(item.name);
            
            // Adicionar à lista de restauro
            itemsToRestore.push({
              table_id: tableId,
              name: item.name,
              type: item.category, // Mapeia 'category' da ficha para 'type' do banco
              weight: Number(item.weight) || 0,
              description: item.description || "",
              data: item.data || {},
              icon_url: item.icon_url || null
            });
          }
        });
      });

      // 4. Inserir no Database (em lotes de 10 para segurança)
      if (itemsToRestore.length > 0) {
        const chunkSize = 10;
        for (let i = 0; i < itemsToRestore.length; i += chunkSize) {
          const chunk = itemsToRestore.slice(i, i + chunkSize);
          const { error } = await supabase.from("items").insert(chunk);
          if (error) {
              console.error("Erro ao restaurar lote:", error);
          } else {
              count += chunk.length;
              setRestoredCount(count);
          }
        }
        
        toast({ 
          title: "Sucesso!", 
          description: `${count} itens foram recuperados das fichas dos jogadores.` 
        });
      } else {
        toast({ 
            title: "Nada a restaurar", 
            description: "Não encontrei itens novos nas fichas que já não existam no database." 
        });
      }

    } catch (error: any) {
      console.error("Erro fatal no restauro:", error);
      toast({ 
        title: "Erro", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-orange-500/50 bg-orange-500/10 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <AlertTriangle className="w-4 h-4" /> Ferramenta de Emergência
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">
            O Database parece vazio. Use este botão para escanear as fichas dos jogadores, 
            encontrar as armas, habilidades e itens que eles possuem, e 
            <strong> recriar o Database</strong> automaticamente.
        </p>
        <Button 
            onClick={handleRestore} 
            disabled={loading}
            variant="outline"
            className="w-full border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
            {loading ? `Recuperando... (${restoredCount})` : "Restaurar Itens das Fichas"}
        </Button>
      </CardContent>
    </Card>
  );
};