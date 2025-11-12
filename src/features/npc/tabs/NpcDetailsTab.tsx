// src/features/npc/tabs/NpcDetailsTab.tsx

import { useNpcSheet } from "../NpcSheetContext"; // 1. MUDANÇA: Usa o hook do NPC
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// --- 1. IMPORTAR O TEXTAREA ---
import { Textarea } from "@/components/ui/textarea";
// --- FIM DA IMPORTAÇÃO ---


// 2. MUDANÇA: Nome do componente
export const NpcDetailsTab = () => { 
  const { form } = useNpcSheet(); // 3. MUDANÇA: Usa o hook do NPC

  return (
    // --- 2. ENVOLVER TUDO EM UM 'space-y-6' PARA SEPARAR OS CARDS ---
    <div className="space-y-6">
      <Card>
        <CardHeader>
          {/* 4. MUDANÇA: Título */}
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- 3. GRID ATUALIZADO PARA 2x2 --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ocupação</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Monstro"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* --- CAMPOS NOVOS ADICIONADOS AO GRID --- */}
            <FormField
              control={form.control}
              name="shadow"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sombra (Cor)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Negro-carvão"
                      {...field}
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
                    <Input
                      placeholder="Ex: Proteger o ninho..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* --- FIM DA ADIÇÃO DO GRID --- */}

          </div>
        </CardContent>
      </Card>

      {/* --- 4. NOVO CARD PARA 'PESSOAS E ALIADOS' --- */}
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
                    className="min-h-[150px]" // altura ligeiramente reduzida
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      {/* --- FIM DO NOVO CARD --- */}
      
      {/* --- 5. NOVO CARD PARA 'ANOTAÇÕES GERAIS' --- */}
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
                    className="min-h-[150px]" // altura ligeiramente reduzida
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      {/* --- FIM DO NOVO CARD --- */}

    </div> // --- FIM do 'space-y-6' ---
  );
};