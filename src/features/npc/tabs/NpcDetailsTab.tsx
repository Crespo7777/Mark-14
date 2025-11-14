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
  const { form } = useNpcSheet();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do NPC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campo Nome (sem alterações) */}
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo Raça (sem alterações) */}
            <FormField
              control={form.control}
              name="race"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raça</FormLabel>
                  <FormControl>
                    <Input placeholder="Criatura" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* --- INÍCIO DA MUDANÇA 1 --- */}
            <FormField
              control={form.control}
              name="occupation" // O 'name' (ID interno) permanece o mesmo
              render={({ field }) => (
                <FormItem>
                  {/* O Label foi alterado */}
                  <FormLabel>Resistência</FormLabel> 
                  <FormControl>
                    <Input
                      // O Placeholder foi alterado
                      placeholder="Ex: Normal, Forte, Fraco" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* --- FIM DA MUDANÇA 1 --- */}

            {/* --- INÍCIO DA MUDANÇA 2 --- */}
            <FormField
              control={form.control}
              name="shadow"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sombra (Aparência)</FormLabel>
                  <FormControl>
                    {/* Alterado de <Input> para <Textarea> */}
                    <Textarea
                      placeholder="Ex: Negro-carvão, com bordas puídas e um brilho avermelhado..."
                      className="min-h-[80px]" // Define uma altura mínima
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* --- FIM DA MUDANÇA 2 --- */}

            {/* --- INÍCIO DA MUDANÇA 3 --- */}
            <FormField
              control={form.control}
              name="personalGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo Pessoal / Motivação</FormLabel>
                  <FormControl>
                    {/* Alterado de <Input> para <Textarea> */}
                    <Textarea
                      placeholder="Ex: Proteger o ninho a todo custo, acumular ouro para seu mestre, encontrar a cura para sua aflição..."
                      className="min-h-[80px]" // Define uma altura mínima
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* --- FIM DA MUDANÇA 3 --- */}
            
          </div>
        </CardContent>
      </Card>

      {/* Card "Pessoas e Aliados" (sem alterações) */}
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
                    className="min-h-[150px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      
      {/* Card "Anotações Gerais" (sem alterações) */}
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
                    className="min-h-[150px]"
                    {...field}
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