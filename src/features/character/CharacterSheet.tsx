import { useTableContext } from "@/features/table/TableContext";
// Importamos a nova ficha corrigida
import { SymbaroumCharacterSheet } from "@/features/systems/symbaroum/SymbaroumCharacterSheet";
import { Loader2 } from "lucide-react";

interface CharacterSheetProps {
  characterId: string | null; // Aceita null para o drawer
  isReadOnly?: boolean;
  onBack?: () => void;
}

export const CharacterSheet = (props: CharacterSheetProps) => {
  const { tableData } = useTableContext();

  // Se não houver ID (ex: drawer a fechar), não mostra nada
  if (!props.characterId) return null;

  // Lógica de Decisão
  const system = tableData?.system_type || 'symbaroum';

  switch (system) {
    case 'pathfinder':
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <div className="text-center p-8 border border-dashed rounded-lg bg-muted/20">
                <h2 className="text-2xl font-bold mb-2 text-primary">Sistema Pathfinder</h2>
                <p>Módulo em desenvolvimento...</p>
            </div>
            {props.onBack && <button onClick={props.onBack}>Voltar</button>}
        </div>
      );

    case 'symbaroum':
    default:
      // Passa os props (agora seguros) para a ficha real
      return (
        <SymbaroumCharacterSheet 
            characterId={props.characterId} 
            isReadOnly={props.isReadOnly} 
            onBack={props.onBack} 
        />
      );
  }
};