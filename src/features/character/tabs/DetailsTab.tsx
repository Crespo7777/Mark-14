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
import { StigmaSelector } from "@/components/StigmaSelector";
import { Brain, Scroll, Gem, Users } from "lucide-react"; // Adicionei 'Users'

export const DetailsTab = () => {
  const { form } = useCharacterSheet();

  return (
    <div className="space-y-6 pb-10"> 
      
      {/* 1. DADOS BÁSICOS */}
      <Card>
        <CardHeader>
          <CardTitle>Identidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Verdadeiro / Alcunha</FormLabel>
                <FormControl><Input placeholder="Nome do Personagem" {...field}/></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Raça e Ocupação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="race"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raça / Cultura</FormLabel>
                  <FormControl><Input placeholder="Ex: Humano (Ambriano)" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ocupação / Arquétipo</FormLabel>
                  <FormControl><Input placeholder="Ex: Caçador de Tesouros" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Idade, Altura, Peso */}
          <div className="grid grid-cols-3 gap-4">
            <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel>Idade</FormLabel><FormControl><Input placeholder="25 anos" {...field} /></FormControl></FormItem>)}/>
            <FormField control={form.control} name="height" render={({ field }) => (<FormItem><FormLabel>Altura</FormLabel><FormControl><Input placeholder="1.80m" {...field} /></FormControl></FormItem>)}/>
            <FormField control={form.control} name="weight" render={({ field }) => (<FormItem><FormLabel>Peso</FormLabel><FormControl><Input placeholder="80kg" {...field} /></FormControl></FormItem>)}/>
          </div>
        </CardContent>
      </Card>

      {/* 2. PSIQUÊ E CORRUPÇÃO */}
      <Card className="border-l-4 border-l-purple-500/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
             <Brain className="w-5 h-5 text-purple-500" /> Psiquê & Sombra
          </CardTitle>
          <CardDescription>A natureza interior, corrupção e personalidade.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            
            {/* Personalidade e Qualidades/Defeitos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="personality"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Personalidade</FormLabel>
                        <FormControl>
                            <Textarea 
                                placeholder="Ex: Calmo, calculista, mas perde a paciência com tolos..." 
                                className="min-h-[100px] resize-none bg-background/50" 
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="qualities_flaws"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Qualidades & Defeitos</FormLabel>
                        <FormControl>
                            <Textarea 
                                placeholder="Ex: Corajoso, Leal / Teimoso, Viciado em jogo..." 
                                className="min-h-[100px] resize-none bg-background/50" 
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

            {/* Sombra e Objetivo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="shadow"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Sombra (Cor & Aparência)</FormLabel>
                    <FormControl><Input placeholder="Ex: Verde-tinta com manchas de ferrugem..." {...field}/></FormControl>
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
                    <FormControl><Input placeholder="Ex: Recuperar a honra da família..." {...field}/></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
          
            {/* Seletor de Estigmas */}
            <div className="pt-2">
                <StigmaSelector control={form.control} name="corruption.stigma" />
            </div>

        </CardContent>
      </Card>

      {/* 3. LORE E ITENS DE TRAMA */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
             <Scroll className="w-5 h-5 text-amber-600" /> Lore & Pertenças
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Aliados (Agora com Ícone para alinhar) */}
              <FormField
                control={form.control}
                name="importantAllies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-primary" /> Pessoas & Aliados
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Lista de contatos, amigos e inimigos..."
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Itens Importantes */}
              <FormField
                control={form.control}
                name="important_items"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                        <Gem className="w-3 h-3 text-blue-500" /> Objetos Importantes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Itens de trama, relíquias de família, cartas..."
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>

          {/* Notas Gerais */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Outras Anotações</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Qualquer outro detalhe relevante..."
                    className="min-h-[80px]"
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