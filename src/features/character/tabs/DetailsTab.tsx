// src/features/character/tabs/DetailsTab.tsx

import { useCharacterSheet } from "../CharacterSheetContext";
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

export const DetailsTab = () => {
  const { form } = useCharacterSheet();

  return (
    // --- 2. ENVOLVER TUDO EM UM 'space-y-6' PARA SEPARAR OS CARDS ---
    <div className="space-y-6"> 
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Personagem</CardTitle>
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
                    placeholder="Nome do Personagem"
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
                    <Input 
                      placeholder="Humano" 
                      {...field} 
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
                  <FormLabel>Ocupação</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Aventureiro"
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
                      placeholder="Ex: Verde-tinta"
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
                  <FormLabel>Objetivo Pessoal</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Encontrar a cura..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* --- FIM DA ADIÇÃO DO GRID --- */}
          </div>
          {/* --- FIM DA ATUALIZAÇÃO DO GRID --- */}

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
                    placeholder="Ex: Kaelar (Anão Ferreiro), Lysandra (Bruxa)..."
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
          <CardTitle>Anotações Gerais</CardTitle>
          <CardDescription>
            Anotações rápidas. Para notas longas, use a aba "Diário".
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
                    placeholder="Lembretes, pistas, itens a comprar..."
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