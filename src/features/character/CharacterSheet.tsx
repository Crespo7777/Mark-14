import { useTableContext } from "@/features/table/TableContext";
import { SymbaroumCharacterSheet } from "@/features/systems/symbaroum/SymbaroumCharacterSheet";
// Removida a importação do Pathfinder pois o arquivo foi deletado
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
      // Placeholder para o sistema que estamos reestruturando
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-background text-foreground gap-4 p-4">
            <div className="p-8 border rounded-lg bg-card shadow-lg text-center max-w-md">
                <h1 className="text-2xl font-bold text-primary mb-2">🚧 Em Manutenção 🚧</h1>
                <p className="text-muted-foreground mb-6 text-sm">
                    A estrutura do Pathfinder foi limpa para reorganização. 
                    Nenhum código antigo foi mantido.
                </p>
                {props.onBack && (
                  <Button onClick={props.onBack} variant="outline" className="gap-2 w-full">
                      <ArrowLeft className="w-4 h-4"/> Voltar
                  </Button>
                )}
            </div>
        </div>
      );

    case 'symbaroum':
    default:
      // Carrega a ficha clássica do Symbaroum
      return (
        <SymbaroumCharacterSheet 
            characterId={props.characterId} 
            isReadOnly={props.isReadOnly} 
            onBack={props.onBack} 
        />
      );
  }
};