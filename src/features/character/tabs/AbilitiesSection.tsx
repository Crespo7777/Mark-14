import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Plus, Zap, BookOpen } from "lucide-react";
import { getDefaultAbility } from "../character.schema";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { AbilityCard } from "../components/AbilityCard";
import { useTableContext } from "@/features/table/TableContext";

export const AbilitiesSection = ({ isReadOnly, handleRoll }: any) => {
    const { control } = useFormContext();
    const { tableId } = useTableContext();
    
    const { fields, append, remove } = useFieldArray({
        control,
        name: "abilities",
    });

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
                <h3 className="text-lg font-bold flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                    <Zap className="w-5 h-5" /> Habilidades & Poderes Místicos
                </h3>
                
                {!isReadOnly && (
                    <ItemSelectorDialog 
                        tableId={tableId} 
                        categories={['ability']} 
                        title="Aprender Habilidade"
                        onSelect={(template) => {
                            if (template) {
                                let desc = "";
                                if(template.description && template.description !== "<p></p>") desc += template.description;
                                desc += `<hr/><p><strong>EFEITOS:</strong></p><ul>`;
                                if (template.data.novice) desc += `<li><strong>Novato:</strong> ${template.data.novice}</li>`;
                                if (template.data.adept)  desc += `<li><strong>Adepto:</strong> ${template.data.adept}</li>`;
                                if (template.data.master) desc += `<li><strong>Mestre:</strong> ${template.data.master}</li>`;
                                desc += `</ul>`;
                                
                                append({
                                    ...getDefaultAbility(),
                                    name: template.name,
                                    level: template.data.level || "Novato", 
                                    type: template.data.type || "Habilidade",
                                    description: desc, 
                                    corruptionCost: template.data.corruptionCost || "0",
                                    associatedAttribute: template.data.associatedAttribute || "Nenhum",
                                    tradition: template.data.tradition || ""
                                });
                            } else {
                                append(getDefaultAbility());
                            }
                        }}
                    >
                        <Button size="sm" className="gap-2 shadow-sm bg-yellow-600 hover:bg-yellow-700 text-white border-none h-8">
                            <Plus className="w-4 h-4" /> Adicionar
                        </Button>
                    </ItemSelectorDialog>
                )}
            </div>

            {fields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-yellow-500/20 rounded-xl bg-yellow-500/5">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <BookOpen className="w-5 h-5 text-yellow-600" />
                    </div>
                    <p className="text-xs text-muted-foreground">O grimório está vazio.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fields.map((field, index) => (
                        <AbilityCard 
                            key={field.id} 
                            index={index} 
                            remove={remove} 
                            isReadOnly={isReadOnly} 
                            handleRoll={handleRoll}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};