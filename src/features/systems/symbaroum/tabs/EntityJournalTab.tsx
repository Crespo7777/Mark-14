// src/features/systems/symbaroum/tabs/EntityJournalTab.tsx

import { useCharacterSheet } from "@/features/character/CharacterSheetContext"; // CORRIGIDO
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { BookOpen } from "lucide-react";

export const EntityJournalTab = () => { 
  const { form } = useCharacterSheet();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen /> Diário do Personagem
        </CardTitle>
        <CardDescription>
          Suas anotações privadas sobre a história, aliados, inimigos e segredos do seu personagem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="journal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anotações do Personagem</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Escreva aqui o background do seu personagem, suas motivações, anotações da campanha..."
                  className="min-h-[400px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};