// src/features/character/tabs/ProjectilesTab.tsx

import { useCharacterSheet } from "../CharacterSheetContext";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Crosshair } from "lucide-react"; // Importa o ícone Crosshair
import { getDefaultProjectile } from "../character.schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export const ProjectilesTab = () => {
  const { form } = useCharacterSheet();

  const {
    fields: projectileFields,
    append: appendProjectile,
    remove: removeProjectile,
  } = useFieldArray({
    control: form.control,
    name: "projectiles",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crosshair /> Projéteis (Munição)
        </CardTitle>
        <Button
          type="button"
          size="sm"
          onClick={() => appendProjectile(getDefaultProjectile())}
        >
          <Plus className="w-4 h-4 mr-2" /> Adicionar Projétil
        </Button>
      </CardHeader>
      <CardContent>
        {projectileFields.length === 0 && (
          <p className="text-muted-foreground text-center py-12">
            Nenhum projétil adicionado.
          </p>
        )}

        <Accordion type="multiple" className="space-y-4">
          {projectileFields.map((field, index) => (
            <AccordionItem
              key={field.id}
              value={field.id}
              className="p-3 rounded-md border bg-muted/20"
            >
              <AccordionTrigger className="p-0 hover:no-underline">
                <div className="flex justify-between items-center w-full">
                  {/* Informações Principais */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left">
                    <h4 className="font-semibold text-base text-primary-foreground truncate">
                      {form.watch(`projectiles.${index}.name`) || "Novo Projétil"}
                    </h4>
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge variant="secondary" className="px-1.5 py-0.5">
                        Qtd: {form.watch(`projectiles.${index}.quantity`) || 0}
                      </Badge>
                    </div>
                  </div>

                  {/* Botão de Excluir */}
                  <div
                    className="flex pl-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeProjectile(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>

              {/* Conteúdo (Campos de Edição) */}
              <AccordionContent className="pt-4 mt-3 border-t border-border/50">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`projectiles.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Projétil</FormLabel>
                          <FormControl>
                            <Input placeholder="Flechas Comuns" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`projectiles.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};