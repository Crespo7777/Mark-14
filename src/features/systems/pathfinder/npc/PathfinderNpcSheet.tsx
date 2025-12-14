import { PathfinderCharacterSheet } from "../PathfinderCharacterSheet";
import { Database } from "@/integrations/supabase/types";

type Npc = Database["public"]["Tables"]["npcs"]["Row"];

interface Props {
  initialNpc: Npc;
  onClose: () => void;
}

export const PathfinderNpcSheet = ({ initialNpc, onClose }: Props) => {
  // REUTILIZAÇÃO TOTAL:
  // Renderizamos a Ficha de Personagem, mas passamos o ID do NPC.
  // A lógica interna do PathfinderCharacterSheet deve ser capaz de lidar com 
  // carregar dados de 'npcs' se o ID vier de um NPC, ou então tratamos isso no Wrapper.
  
  // NOTA: O componente PathfinderCharacterSheet atual espera um `characterId` da tabela `characters`.
  // Para reutilizar 100% sem duplicar código, o ideal é que o componente aceite 
  // 'data' diretamente ou saiba buscar de ambas as tabelas.
  
  // Como solução rápida e eficaz: Vamos passar o ID e uma flag 'isNpc'.
  
  return (
    <PathfinderCharacterSheet 
        characterId={initialNpc.id} 
        isReadOnly={false} // Mestre pode sempre editar
        onBack={onClose}
        isNpc={true} // <--- Flag Importante
    />
  );
};