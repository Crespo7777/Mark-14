import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Plus, Sword, AlertCircle } from "lucide-react";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { WeaponCard } from "@/features/systems/symbaroum/combat/components/WeaponCard";
import { getDefaultNpcWeapon } from "@/features/npc/npc.schema";
import { useNpcSheet } from "../../NpcSheetContext";

interface NpcArsenalSectionProps {
  tableId: string;
  projectiles: any[];
  combatLogic: any;
}

export const NpcArsenalSection = ({ tableId, projectiles, combatLogic }: NpcArsenalSectionProps) => {
  const { form } = useNpcSheet();
  
  const { fields, append, remove } = useFieldArray({ 
    control: form.control, 
    name: "weapons" 
  });

  return (
    <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <Sword className="w-5 h-5 text-orange-500" /> Ataques & Poderes
            </h3>
            <ItemSelectorDialog tableId={tableId} categories={['weapon']} onSelect={(template) => {
                if (template) {
                    const quality = template.data.quality || "";
                    const desc = template.description || template.data.quality_desc || "";
                    append({ ...getDefaultNpcWeapon(), name: template.name, damage: template.data.damage || "", attackAttribute: template.data.attackAttribute || "", quality: quality, quality_desc: desc, weight: template.weight || 1 });
                } else {
                    append(getDefaultNpcWeapon());
                }
            }}>
                <Button type="button" size="sm" variant="ghost" className="gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                    <Plus className="w-4 h-4" /> Adicionar Ataque
                </Button>
            </ItemSelectorDialog>
        </div>

        {fields.length === 0 ? (
            <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 opacity-50" />
                <p>Sem ataques definidos.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {fields.map((field, index) => (
                    <WeaponCard 
                        key={field.id} 
                        index={index} 
                        tableId={tableId}
                        projectiles={projectiles}
                        onAttack={() => combatLogic.prepareNpcAttack(index)}
                        onDamage={() => combatLogic.prepareDamage(index)}
                        onRemove={() => remove(index)}
                        control={form.control} // <--- PASSA O CONTROL
                    />
                ))}
            </div>
        )}
    </div>
  );
};