// src/features/npc/tabs/NpcDetailsTab.tsx

import { useNpcSheet } from "../NpcSheetContext"; 
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea"; 

export const NpcDetailsTab = () => { 
  const { form, isReadOnly } = useNpcSheet(); 

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do NPC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nome do NPC"
                    {...field}
                    readOnly={isReadOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="race"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raça</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Criatura" 
                      {...field} 
                      readOnly={isReadOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resistência</FormLabel> 
                  <FormControl>
                    <Input
                      placeholder="Ex: Normal, Forte, Fraco" 
                      {...field}
                      readOnly={isReadOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* --- ATUALIZADO: Sombra e Objetivo Pessoal com Textarea --- */}
            <FormField
              control={form.control}
              name="shadow"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sombra (Aparência)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Negro-carvão, com bordas puídas..."
                      className="min-h-[80px] resize-none"
                      {...field}
                      readOnly={isReadOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo Pessoal / Motivação</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Proteger o ninho a todo custo..."
                      className="min-h-[80px] resize-none"
                      {...field}
                      readOnly={isReadOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* --- FIM DA ATUALIZAÇÃO --- */}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pessoas e Aliados Importantes</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="importantAllies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Liste aliados, contatos ou inimigos</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: O líder da tribo, a bruxa que o controla..."
                    className="min-h-[150px] resize-none"
                    {...field}
                    readOnly={isReadOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Anotações Gerais (Mestre)</CardTitle>
          <CardDescription>
            Anotações rápidas sobre o NPC. Para a história, use a aba "Diário".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Lembretes, táticas, etc..."
                    className="min-h-[150px] resize-none"
                    {...field}
                    readOnly={isReadOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};