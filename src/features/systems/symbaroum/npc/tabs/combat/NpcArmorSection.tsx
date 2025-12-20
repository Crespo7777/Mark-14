import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Plus, Shield } from "lucide-react";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { NpcArmorCard } from "@/features/systems/symbaroum/combat/components/NpcArmorCard";
import { getDefaultNpcArmor } from "@/features/systems/symbaroum/npc/npc.schema"; // Import Corrigido
import { useSymbaroumNpcSheet } from "../../SymbaroumNpcSheetContext";

export const NpcArmorSection = () => {
  const { form, npc } = useSymbaroumNpcSheet();
  
  const { fields, append, remove } = useFieldArray({ 
    control: form.control, 
    name: "armors" 
  });

  return (
    <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-500" /> Armadura & Proteção
            </h3>
            <ItemSelectorDialog tableId={npc.table_id} categories={['armor']} onSelect={(template) => {
                if(template) append({ ...getDefaultNpcArmor(), name: template.name, protection: template.data.protection, obstructive: template.data.obstructive, quality: template.data.quality, quality_desc: template.description, weight: template.weight });
                else append(getDefaultNpcArmor());
            }}>
                <Button type="button" size="sm" variant="ghost" className="gap-1 text-slate-600 hover:text-slate-700 hover:bg-slate-50">
                    <Plus className="w-4 h-4" /> Adicionar Armadura
                </Button>
            </ItemSelectorDialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.length === 0 && (
                <div className="col-span-full border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                    Sem proteção definida.
                </div>
            )}
            {fields.map((field, index) => (
                <NpcArmorCard 
                    key={field.id} 
                    index={index} 
                    tableId={npc.table_id}
                    onRemove={() => remove(index)}
                    control={form.control}
                />
            ))}
        </div>
    </div>
  );
};