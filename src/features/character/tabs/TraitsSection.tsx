import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Plus, Fingerprint, Tag } from "lucide-react";
import { ItemSelectorDialog } from "@/components/ItemSelectorDialog";
import { TraitCard } from "../components/TraitCard";
import { useTableContext } from "@/features/table/TableContext";

export const TraitsSection = ({ isReadOnly }: any) => {
    const { control } = useFormContext();
    const { tableId } = useTableContext();
    
    const { fields, append, remove } = useFieldArray({
        control,
        name: "traits",
    });

    return (
        <div className="space-y-3 mt-8">
            <div className="flex items-center justify-between pb-2 border-b">
                <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                    <Fingerprint className="w-5 h-5" /> Traços, Dádivas & Fardos
                </h3>
                
                {!isReadOnly && (
                    <ItemSelectorDialog 
                        tableId={tableId} 
                        categories={['trait']} 
                        title="Adicionar Traço"
                        onSelect={(template) => {
                            if (template) {
                                // Verifica se o template já tem nível definido
                                const defaultLevel = template.data.level || "Sem Nível";
                                
                                // Constrói descrição rica se houver dados de níveis
                                let desc = template.description || "";
                                if (template.data.novice || template.data.adept || template.data.master) {
                                    desc += `<hr/><p><strong>EFEITOS:</strong></p><ul>`;
                                    if (template.data.novice) desc += `<li><strong>Novato:</strong> ${template.data.novice}</li>`;
                                    if (template.data.adept)  desc += `<li><strong>Adepto:</strong> ${template.data.adept}</li>`;
                                    if (template.data.master) desc += `<li><strong>Mestre:</strong> ${template.data.master}</li>`;
                                    desc += `</ul>`;
                                }

                                append({
                                    name: template.name,
                                    description: desc,
                                    type: template.data.type || "Traço",
                                    level: defaultLevel
                                });
                            } else {
                                append({ 
                                    name: "Novo Traço", 
                                    description: "", 
                                    type: "Traço",
                                    level: "Sem Nível"
                                });
                            }
                        }}
                    >
                        <Button size="sm" className="gap-2 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none h-8">
                            <Plus className="w-4 h-4" /> Adicionar
                        </Button>
                    </ItemSelectorDialog>
                )}
            </div>

            {fields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-emerald-500/20 rounded-xl bg-emerald-500/5">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Tag className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-xs text-muted-foreground">Nenhum traço definido.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fields.map((field, index) => (
                        <TraitCard 
                            key={field.id} 
                            index={index} 
                            remove={remove} 
                            isReadOnly={isReadOnly} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};