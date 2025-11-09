// src/features/npc/tabs/NpcDetailsTab.tsx

import { useNpcSheet } from "../NpcSheetContext"; // 1. MUDANÇA: Usa o hook do NPC
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// 2. MUDANÇA: Nome do componente
export const NpcDetailsTab = () => { 
  const { form } = useNpcSheet(); // 3. MUDANÇA: Usa o hook do NPC

  return (
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
        <div className="grid grid-cols-2 gap-4">
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
        </div>
      </CardContent>
    </Card>
  );
};