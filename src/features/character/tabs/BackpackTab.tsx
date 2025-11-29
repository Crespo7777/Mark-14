import { useCharacterSheet } from "../CharacterSheetContext";
import { Skeleton } from "@/components/ui/skeleton";

// Importação dos Sub-Componentes Refatorados
import { MoneyCard } from "./backpack/MoneyCard";
import { ExperienceCard } from "./backpack/ExperienceCard";
import { EncumbranceCard } from "./backpack/EncumbranceCard";
import { InventoryList } from "./backpack/InventoryList";
import { ProjectileList } from "./backpack/ProjectileList"; // <--- Novo componente

export const BackpackTab = () => {
  const { form, character } = useCharacterSheet();

  // Proteção contra carregamento
  if (!character) {
      return (
        <div className="space-y-4 p-1">
            <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      
      {/* 1. Status Cards (Dinheiro, XP, Peso) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MoneyCard />
        <ExperienceCard />
        <EncumbranceCard />
      </div>

      {/* 2. Listas de Itens */}
      <div className="space-y-6">
        
        {/* Lista de Munição (Agora com dano +3 ou 1d4) */}
        <ProjectileList 
            control={form.control} 
            tableId={character.table_id} 
        />
        
        {/* Lista de Inventário Geral */}
        <InventoryList />
      </div>

    </div>
  );
};