import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, Shield, Skull, RefreshCw } from "lucide-react";
import { useTableRealtime } from "@/hooks/useTableRealtime"; // Hook Genérico, fica na raiz
import { ScrollArea } from "@/components/ui/scroll-area";

// Imports Locais (Sistema Symbaroum)
import { ArmorCard } from "./components/ArmorCard";
import { WeaponCard } from "./components/WeaponCard";
import { VitalityCard } from "./components/VitalityCard";
import { CorruptionCard } from "./components/CorruptionCard";
import { useCombatLogic } from "./hooks/useCombatLogic";

interface Props {
  tableId: string;
  isMaster?: boolean;
}

export const SymbaroumCombatTracker = ({ tableId, isMaster = false }: Props) => {
  // Hook genérico de realtime (pode ser usado por qualquer sistema)
  const { combatants } = useTableRealtime(tableId); 
  const { handleUpdateCombatant } = useCombatLogic(tableId);

  if (!combatants || combatants.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4">
              <Sword className="w-12 h-12 opacity-20" />
              <p>Nenhum combate iniciado.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
              <Sword className="w-5 h-5 text-primary"/> Rastreador de Combate (Symbaroum)
          </h2>
          {isMaster && (
              <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2"/> Resetar Turno
              </Button>
          )}
      </div>

      <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
              {combatants.map((combatant: any) => (
                  <Card key={combatant.id} className="p-4 relative overflow-hidden group">
                      {/* HEADER DO COMBATENTE */}
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <h3 className="font-bold text-lg">{combatant.name}</h3>
                              <span className="text-xs text-muted-foreground uppercase">{combatant.type}</span>
                          </div>
                          <div className="text-2xl font-black text-muted-foreground/20">
                              {combatant.initiative}
                          </div>
                      </div>

                      {/* STATS ESPECÍFICOS DO SYMBAROUM */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <VitalityCard 
                              current={combatant.data?.toughness?.current} 
                              max={combatant.data?.toughness?.max} 
                              painThreshold={combatant.data?.painThreshold}
                              onChange={(val) => handleUpdateCombatant(combatant.id, { data: { ...combatant.data, toughness: { ...combatant.data.toughness, current: val } } })}
                              readOnly={!isMaster}
                          />
                          
                          <ArmorCard 
                              value={combatant.data?.armor?.value}
                              reduction={combatant.data?.armor?.reduction} // Redução de dano (Symbaroum)
                          />

                          <CorruptionCard 
                              temp={combatant.data?.corruption?.temporary}
                              perm={combatant.data?.corruption?.permanent}
                              thresh={combatant.data?.corruption?.threshold}
                          />
                          
                          <div className="flex flex-col gap-2">
                              {(combatant.data?.weapons || []).map((w: any, i: number) => (
                                  <WeaponCard key={i} weapon={w} />
                              ))}
                          </div>
                      </div>
                  </Card>
              ))}
          </div>
      </ScrollArea>
    </div>
  );
};