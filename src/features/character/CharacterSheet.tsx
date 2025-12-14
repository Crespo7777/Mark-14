import { useTableContext } from "@/features/table/TableContext";
// Importamos a Ficha de Symbaroum
import { SymbaroumCharacterSheet } from "@/features/systems/symbaroum/SymbaroumCharacterSheet";
// Importamos a Ficha de Pathfinder (Certifique-se que criou este arquivo no passo anterior)
import { PathfinderCharacterSheet } from "@/features/systems/pathfinder/PathfinderCharacterSheet"; 

interface CharacterSheetProps {
  characterId: string | null;
  isReadOnly?: boolean;
  onBack?: () => void;
}

export const CharacterSheet = (props: CharacterSheetProps) => {
  const { tableData } = useTableContext();

  // Se não houver ID (ex: drawer a fechar), não mostra nada
  if (!props.characterId) return null;

  // Lógica de Decisão: Lê o sistema da tabela
  const system = tableData?.system_type || 'symbaroum';

  switch (system) {
    case 'pathfinder':
      // AGORA CARREGA A FICHA REAL DO PATHFINDER
      return (
        <PathfinderCharacterSheet 
            characterId={props.characterId}
            isReadOnly={props.isReadOnly}
            onBack={props.onBack}
        />
      );

    case 'symbaroum':
    default:
      // Carrega a ficha clássica
      return (
        <SymbaroumCharacterSheet 
            characterId={props.characterId} 
            isReadOnly={props.isReadOnly} 
            onBack={props.onBack} 
        />
      );
  }
};