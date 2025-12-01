import { useCharacterSheet } from "../CharacterSheetContext";
import { Skeleton } from "@/components/ui/skeleton";

// Importação dos Sub-Componentes (Agora com visuais melhorados mas lógica original)
import { MoneyCard } from "./backpack/MoneyCard";
import { ExperienceCard } from "./backpack/ExperienceCard";
import { EncumbranceCard } from "./backpack/EncumbranceCard";
import { InventoryList } from "./backpack/InventoryList";
import { ProjectileList } from "./backpack/ProjectileList"; 

export const BackpackTab = () => {
  const { character } = useCharacterSheet();

  if (!character) return <div className="p-4"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10 h-full flex flex-col">
      
      {/* 1. DASHBOARD DE STATUS (Grid 3 Colunas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <EncumbranceCard />
        <MoneyCard /> 
        <ExperienceCard />
      </div>

      {/* 2. LISTAS DE ITENS (Ocupam o resto do espaço) */}
      <div className="flex-1 flex flex-col gap-6 min-h-0">
        
        {/* Munição (Compacta) */}
        <ProjectileList tableId={character.table_id} control={null} />
        
        {/* Inventário Geral (Expandível e com scroll próprio) */}
        <InventoryList />
      </div>

    </div>
  );
};