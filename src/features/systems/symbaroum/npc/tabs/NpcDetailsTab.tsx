import { useSymbaroumNpcSheet } from "../SymbaroumNpcSheetContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Swords, User } from "lucide-react";

export const NpcDetailsTab = () => {
  const { form } = useSymbaroumNpcSheet(); 

  return (
    <div className="space-y-6 pb-10"> 
      
      {/* 1. DADOS BÁSICOS (Nome, Raça, Resistência) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" /> Identidade Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input {...field}/></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Raça */}
            <FormField 
                control={form.control} 
                name="race" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Raça</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} 
            />

            {/* Resistência */}
            <FormField 
                control={form.control} 
                name="resistance" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Resistência</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} 
            />
          </div>

          {/* Sombra */}
          <FormField 
            control={form.control} 
            name="shadow" 
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Sombra</FormLabel>
                    <FormControl><Input {...field}/></FormControl>
                    <FormMessage />
                </FormItem>
            )} 
          />
        </CardContent>
      </Card>

      {/* 2. TÁTICAS */}
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
             <Swords className="w-5 h-5 text-destructive" /> Táticas de Combate
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <FormField
            control={form.control}
            name="tactics"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col">
                <FormControl>
                    <Textarea 
                        className="min-h-[200px] flex-1 resize-y font-normal" 
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