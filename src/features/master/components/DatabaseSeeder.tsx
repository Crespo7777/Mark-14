import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CATEGORIES } from "../database.constants";
import { Wand2 } from "lucide-react";

export const DatabaseSeeder = ({ tableId }: { tableId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSeed = async () => {
    if (!tableId) return;

    const itemsToCreate = CATEGORIES.map((cat) => {
      const specificData = getMockDataForCategory(cat.id);

      return {
        table_id: tableId,
        type: cat.id,
        name: `[Teste] ${cat.label}`,
        description: `<p>Item de teste gerado automaticamente para a categoria <strong>${cat.label}</strong>.</p>`,
        // CORREÇÃO: Removemos 'weight' e 'icon_url' da raiz
        data: {
            ...specificData,
            weight: Math.floor(Math.random() * 5) + 1, // Peso vai aqui
            icon_url: null // Ícone vai aqui
        }
      };
    });

    const { error } = await supabase.from("items").insert(itemsToCreate);

    if (error) {
      console.error(error);
      toast({ title: "Erro na Simulação", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: `${itemsToCreate.length} itens de teste criados.` });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  };

  return (
    <Button 
      onClick={handleSeed} 
      variant="secondary" 
      size="sm" 
      className="gap-2 border border-purple-500/30 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
    >
      <Wand2 className="w-4 h-4" /> Gerar Teste em Massa
    </Button>
  );
};

const getMockDataForCategory = (category: string) => {
  const basePrice = { price: "10 TO" };

  switch (category) {
    case "weapon":
      return { ...basePrice, damage: "1d8", attackAttribute: "strong", subcategory: "Arma de uma Mão", quality: "Comum" };
    case "armor":
      return { ...basePrice, protection: "1d4", obstructive: "2", subcategory: "Leve", quality: "Comum" };
    case "ability":
      return { type: "Habilidade", corruptionCost: "1", associatedAttribute: "resolute", tradition: "Nenhuma", novice: "Efeito Novato.", adept: "Efeito Adepto.", master: "Efeito Mestre." };
    case "trait":
      return { type: "Traço", level: "Nível I", cost: "10 Pontos", novice: "Descrição do traço." };
    case "ammunition":
      return { ...basePrice, damage: "+1", attack_modifier: "0" };
    case "consumable":
      return { ...basePrice, duration: "Cena" };
    case "artifact":
        return { ...basePrice, effect: "Brilha", corruption: "1d4" };
    default:
      return basePrice;
  }
};