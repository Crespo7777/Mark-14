import { useState } from "react";
import { useTableContext } from "@/features/table/TableContext";
import { Button } from "@/components/ui/button";
import { Book, X, Library } from "lucide-react";
import { useRulesSystem } from "./hooks/useRulesSystem";
import { RulesLibraryView } from "./components/RulesLibraryView";
import { ActiveRulesView } from "./components/ActiveRulesView";

export function RulesBookPanel({ roomId }: { roomId: string }) {
  const { isMaster } = useTableContext();
  const [isOpen, setIsOpen] = useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Hook que contém toda a lógica
  const system = useRulesSystem(roomId, isMaster);

  if (!isOpen) return null;

  // Lógica de fechamento automático da biblioteca ao criar novo sistema
  const handleCreateBlank = async (name: string) => {
    await system.createBlankSystem(name);
    setIsLibraryOpen(false); // Fecha a biblioteca e vai para a edição
  };

  const handleLoad = async (preset: any) => {
    await system.loadPreset(preset);
    setIsLibraryOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[90vh] bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl flex flex-col relative overflow-hidden ring-1 ring-white/5">
        
        {/* Background Decorativo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950/0 to-slate-950 pointer-events-none" />

        {/* HEADER */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <Book className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                    <h2 className="text-white font-serif font-bold text-xl tracking-wide">Grimório</h2>
                    <p className="text-white/40 text-xs uppercase tracking-widest font-medium">
                        {isLibraryOpen ? "Biblioteca" : "Mesa"}
                    </p>
                </div>
            </div>
            
            <div className="flex gap-2">
                {isMaster && (
                    <Button 
                        variant={isLibraryOpen ? "default" : "secondary"}
                        className={isLibraryOpen ? "bg-amber-600 hover:bg-amber-700" : "bg-white/5 text-slate-300 hover:text-white"}
                        onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                    >
                        <Library className="w-4 h-4 mr-2" />
                        {isLibraryOpen ? "Voltar" : "Biblioteca"}
                    </Button>
                )}
                <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/10 rounded-full" onClick={() => setIsOpen(false)}>
                    <X className="w-5 h-5" />
                </Button>
            </div>
        </div>

        {/* CORPO: Alterna entre Biblioteca e Visão Ativa */}
        {isLibraryOpen ? (
            <RulesLibraryView 
                presets={system.presets}
                onLoad={handleLoad}
                onUpdate={system.updatePreset}
                onDelete={system.deletePreset}
                onImport={system.importJson}
                onSaveCopy={system.saveCurrentAsPreset}
                onCreateBlank={handleCreateBlank}
                onRestoreDefault={system.restoreSolDePrios}
            />
        ) : (
            <ActiveRulesView 
                rulesText={system.rulesText}
                cards={system.refCards}
                isMaster={isMaster}
                onSaveRules={system.saveRulesText}
                onCreateCard={system.createCard}
                onDeleteCard={system.deleteCard}
            />
        )}

      </div>
    </div>
  );
}