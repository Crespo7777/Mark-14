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
import { Textarea } from "@/components/ui/textarea";

export const DetailsTab = () => {
  const { form } = useCharacterSheet();

  return (
    <div className="space-y-6"> 
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Personagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome (Linha Completa) */}
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
          
          {/* Raça e Ocupação (2 Colunas) */}
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
          </div>

          {/* --- NOVO: Idade, Altura e Peso (3 Colunas) --- */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Idade</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="25 anos" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Altura</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="1.80m" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="80kg" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* --- FIM DOS NOVOS CAMPOS --- */}
            
          {/* Sombra e Objetivo (2 Colunas com Textarea) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="shadow"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sombra (Cor)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Verde-tinta..."
                      className="min-h-[80px] resize-none" 
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
                    <Textarea
                      placeholder="Ex: Encontrar a cura..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    placeholder="Ex: Kaelar (Anão Ferreiro), Lysandra (Bruxa)..."
                    className="min-h-[150px] resize-none"
                    {...field}
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
                    className="min-h-[150px] resize-none"
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