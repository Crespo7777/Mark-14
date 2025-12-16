import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2, BookOpen, Flame, Sparkles, Scroll, Wand2, Dices, Skull } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePathfinderContext } from "../PathfinderContext";
import { useRollContext } from "../context/RollContext"; // <--- NOVO

export const SpellcastingSection = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { register, control, setValue, watch } = useFormContext();
  
  // Contextos
  const { magic } = usePathfinderContext(); // Pega o Ataque Mágico Calculado
  const { makeRoll, makeDamageRoll } = useRollContext(); // Pega o Rolador

  // Arrays de Magias
  const cantripsField = useFieldArray({ control, name: "spellcasting.cantrips" });
  const spellsField = useFieldArray({ control, name: "spellcasting.spells" });
  const focusField = useFieldArray({ control, name: "spellcasting.focusSpells" });
  const innateField = useFieldArray({ control, name: "spellcasting.innateSpells" });

  const keyAttribute = watch("spellcasting.key_attribute") || "int";
  const proficiency = watch("spellcasting.proficiency") || "U";

  // Função para tentar extrair dano da descrição (básico) ou rolar genérico
  const handleCastDamage = (spellName: string, description: string) => {
      // Tenta achar padrão "XdY" ou "XdY+Z"
      const diceRegex = /(\d+d\d+(\+\d+)?)/;
      const match = description.match(diceRegex);
      
      if (match) {
          makeDamageRoll(match[0], spellName);
      } else {
          // Se não achar, lança um alerta visual ou rola 0 (aqui vamos assumir um prompt ou log)
          makeDamageRoll("0", `${spellName} (Sem fórmula de dano encontrada na descrição)`);
      }
  };

  // --- COMPONENTES AUXILIARES ---
  
  const SpellRow = ({ field, index, arrayHelpers, showLevel = false }: any) => {
    const spellName = watch(`${field}.${index}.name`) || "Magia";
    const spellDesc = watch(`${field}.${index}.description`) || "";

    return (
      <div className="flex flex-col gap-2 p-3 bg-card border border-border/50 rounded-lg mb-2 shadow-sm group hover:border-primary/30 transition-colors">
        <div className="flex items-center gap-2">
          {showLevel && (
            <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded border border-primary/20 text-primary font-bold text-xs shrink-0">
              {watch(`${field}.${index}.level`) || 1}
            </div>
          )}
          
          <Input 
            {...register(`${field}.${index}.name`)}
            placeholder="Nome da Magia"
            className="h-8 font-bold border-transparent bg-transparent hover:bg-accent/10 focus:bg-accent/10 transition-colors flex-1 text-primary"
            readOnly={isReadOnly}
          />

          {/* BOTÕES DE ROLAGEM DE MAGIA */}
          <div className="flex items-center gap-1">
             <Button 
                type="button"
                size="icon" 
                variant="outline" 
                className="h-7 w-7 text-blue-600 border-blue-200 hover:bg-blue-50"
                title={`Ataque Mágico (+${magic.attack})`}
                onClick={() => makeRoll(magic.attack, `${spellName} (Ataque Mágico)`, "attack")}
             >
                 <Dices className="w-3.5 h-3.5" />
             </Button>

             <Button 
                type="button"
                size="icon" 
                variant="outline" 
                className="h-7 w-7 text-red-600 border-red-200 hover:bg-red-50"
                title="Rolar Dano (Baseado na Descrição)"
                onClick={() => handleCastDamage(spellName, spellDesc)}
             >
                 <Skull className="w-3.5 h-3.5" />
             </Button>
          </div>

          {!isReadOnly && (
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => arrayHelpers.remove(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <div className="flex gap-2 px-1">
           <Input {...register(`${field}.${index}.actions`)} className="h-6 text-[10px] w-12 text-center bg-muted/20 border-none" placeholder="Act" title="Ações" readOnly={isReadOnly}/>
           <Input {...register(`${field}.${index}.range`)} className="h-6 text-[10px] w-16 text-center bg-muted/20 border-none" placeholder="Alcance" readOnly={isReadOnly}/>
           <Input {...register(`${field}.${index}.duration`)} className="h-6 text-[10px] flex-1 bg-muted/20 border-none" placeholder="Duração" readOnly={isReadOnly}/>
        </div>
        
        <Textarea 
          {...register(`${field}.${index}.description`)}
          placeholder="Descrição e dados de dano (ex: Bola de Fogo causa 6d6 de fogo)..."
          className="min-h-[60px] text-xs resize-y bg-transparent border-dashed border-border/50 p-2 text-muted-foreground focus-visible:ring-0 placeholder:text-muted-foreground/30"
          readOnly={isReadOnly}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* 1. ESTATÍSTICAS E FOCO */}
      <Card className="p-6 bg-card border-2 border-primary/30 shadow-lg relative overflow-hidden">
        {/* Background Decorativo */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <BookOpen className="w-32 h-32"/>
        </div>

        <h2 className="text-xl font-bold text-primary mb-4 border-b-2 border-primary/30 pb-2 flex items-center gap-2 relative z-10">
          <BookOpen className="w-5 h-5"/> Grimório & Estatísticas
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end relative z-10">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-primary">Atributo Chave</Label>
            {isReadOnly ? <div className="h-9 flex items-center px-3 border rounded text-sm bg-muted/20 uppercase font-bold">{keyAttribute}</div> : 
            <Select onValueChange={(v) => setValue("spellcasting.key_attribute", v)} defaultValue={keyAttribute}>
              <SelectTrigger className="h-9 bg-accent/5 border-primary/20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="int">Inteligência</SelectItem>
                <SelectItem value="wis">Sabedoria</SelectItem>
                <SelectItem value="cha">Carisma</SelectItem>
              </SelectContent>
            </Select>}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-primary">Proficiência</Label>
            {isReadOnly ? <div className="h-9 flex items-center px-3 border rounded text-sm bg-muted/20 font-bold">{proficiency}</div> :
            <Select onValueChange={(v) => setValue("spellcasting.proficiency", v)} defaultValue={proficiency}>
              <SelectTrigger className="h-9 bg-accent/5 border-primary/20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="U">Destreinado</SelectItem>
                <SelectItem value="T">Treinado</SelectItem>
                <SelectItem value="E">Especialista</SelectItem>
                <SelectItem value="M">Mestre</SelectItem>
                <SelectItem value="L">Lendário</SelectItem>
              </SelectContent>
            </Select>}
          </div>

          {/* Ataque Mágico (Calculado) */}
          <div className="space-y-1 text-center bg-blue-500/10 p-2 rounded border border-blue-500/20">
            <Label className="text-[10px] uppercase font-bold text-blue-600/70">Ataque</Label>
            <div className="text-2xl font-black text-blue-600">
                {magic.attack >= 0 ? "+" : ""}{magic.attack}
            </div>
          </div>

          {/* CD de Magia (Calculado) */}
          <div className="space-y-1 text-center bg-purple-500/10 p-2 rounded border border-purple-500/20">
            <Label className="text-[10px] uppercase font-bold text-purple-600/70">CD (DC)</Label>
            <div className="text-2xl font-black text-purple-600">{magic.dc}</div>
          </div>

          <div className="col-span-2 md:col-span-1 space-y-1">
            <Label className="text-xs font-bold text-primary flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-500" /> Foco
            </Label>
            <div className="flex items-center gap-1 bg-accent/5 p-1 rounded border border-primary/20">
              <Input 
                type="number" 
                {...register("spellcasting.focusPoints.current")}
                className="text-center font-bold text-orange-600 bg-transparent border-none p-0 h-8 text-lg"
                placeholder="0"
                readOnly={isReadOnly}
              />
              <span className="text-muted-foreground">/</span>
              <Input 
                type="number" 
                {...register("spellcasting.focusPoints.max")}
                className="text-center bg-transparent border-none p-0 h-8"
                placeholder="1"
                readOnly={isReadOnly}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 2. ESPAÇOS DE MAGIA (SLOTS) */}
      <Card className="p-6 bg-card border-2 border-primary/30 shadow-lg">
        <h2 className="text-xl font-bold text-primary mb-4 border-b-2 border-primary/30 pb-2">
          Espaços de Magia por Dia
        </h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => (
            <div key={lvl} className="text-center space-y-1">
              <Label className="text-[10px] font-bold text-primary">Nvl {lvl}</Label>
              <div className="flex flex-col gap-1">
                <Input 
                  type="number" 
                  {...register(`spellcasting.slotsRemaining.${lvl}`)}
                  className="h-8 text-center text-sm font-bold bg-primary/10 border-primary/20 px-0 text-primary" 
                  placeholder="Rest"
                  title={`Espaços Restantes Nível ${lvl}`}
                  readOnly={isReadOnly}
                />
                <Input 
                  type="number" 
                  {...register(`spellcasting.slotsPerDay.${lvl}`)}
                  className="h-6 text-center text-[10px] bg-muted/20 px-0 border-transparent text-muted-foreground" 
                  placeholder="Max"
                  title={`Espaços Totais Nível ${lvl}`}
                  readOnly={isReadOnly}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 3. TRUQUES MÁGICOS */}
        <Card className="p-4 bg-card border-2 border-primary/30 shadow-md h-fit">
          <div className="flex items-center justify-between mb-4 border-b border-primary/20 pb-2">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4"/> Truques Mágicos
            </h3>
            {!isReadOnly && <Button size="sm" variant="ghost" onClick={() => cantripsField.append({ name: "Novo Truque", level: 0 })}><Plus className="w-4 h-4"/></Button>}
          </div>
          <div className="space-y-2">
            {cantripsField.fields.length === 0 && <div className="text-sm text-muted-foreground text-center py-4 italic">Nenhum truque aprendido.</div>}
            {cantripsField.fields.map((field, i) => (
              <SpellRow key={field.id} field="spellcasting.cantrips" index={i} arrayHelpers={cantripsField} />
            ))}
          </div>
        </Card>

        {/* 4. MAGIAS DE FOCO */}
        <Card className="p-4 bg-card border-2 border-primary/30 shadow-md h-fit">
          <div className="flex items-center justify-between mb-4 border-b border-primary/20 pb-2">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500"/> Magias de Foco
            </h3>
            {!isReadOnly && <Button size="sm" variant="ghost" onClick={() => focusField.append({ name: "Magia de Foco", level: 1 })}><Plus className="w-4 h-4"/></Button>}
          </div>
          <div className="space-y-2">
            {focusField.fields.length === 0 && <div className="text-sm text-muted-foreground text-center py-4 italic">Nenhuma magia de foco.</div>}
            {focusField.fields.map((field, i) => (
              <SpellRow key={field.id} field="spellcasting.focusSpells" index={i} arrayHelpers={focusField} showLevel />
            ))}
          </div>
        </Card>

        {/* 5. MAGIAS INATAS */}
        <Card className="p-4 bg-card border-2 border-primary/30 shadow-md lg:col-span-2">
          <div className="flex items-center justify-between mb-4 border-b border-primary/20 pb-2">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <Wand2 className="w-4 h-4"/> Magias Inatas
            </h3>
            {!isReadOnly && <Button size="sm" variant="ghost" onClick={() => innateField.append({ name: "Magia Inata", level: 1 })}><Plus className="w-4 h-4"/></Button>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {innateField.fields.length === 0 && <div className="col-span-full text-sm text-muted-foreground text-center py-4 italic">Nenhuma magia inata.</div>}
            {innateField.fields.map((field, i) => (
              <SpellRow key={field.id} field="spellcasting.innateSpells" index={i} arrayHelpers={innateField} showLevel />
            ))}
          </div>
        </Card>

      </div>

      {/* 6. MAGIAS POR NÍVEL (Lista Principal) */}
      <Card className="p-6 bg-card border-2 border-primary/30 shadow-lg">
        <h3 className="text-xl font-bold text-primary mb-4 border-b-2 border-primary/30 pb-2 flex items-center gap-2">
          <Scroll className="w-5 h-5"/> Grimório (Preparadas/Conhecidas)
        </h3>
        
        <Accordion type="multiple" className="space-y-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => {
            // Filtramos apenas para exibição no accordion
            const spellsOfLevel = spellsField.fields
                .map((field, index) => ({ ...field, index }))
                .filter((f: any) => (watch(`spellcasting.spells.${f.index}.level`) || 1) === lvl);
            
            return (
              <AccordionItem key={lvl} value={`lvl-${lvl}`} className="border border-primary/20 rounded-lg bg-accent/5 px-2">
                <AccordionTrigger className="px-2 py-2 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-bold text-primary">Nível {lvl}</span>
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                         {spellsOfLevel.length} magias
                       </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-2 pt-0">
                  <div className="space-y-2 mt-2">
                    {spellsOfLevel.length === 0 && <div className="text-xs text-muted-foreground text-center py-2 italic">Vazio.</div>}
                    
                    {spellsOfLevel.map((spellObj) => (
                      <SpellRow 
                        key={spellObj.id} 
                        field="spellcasting.spells" 
                        index={spellObj.index} 
                        arrayHelpers={spellsField} 
                      />
                    ))}
                    
                    {!isReadOnly && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-dashed border-primary/40 text-primary/70 hover:bg-primary/5 mt-2"
                        onClick={() => spellsField.append({ name: "Nova Magia", level: lvl })}
                      >
                        <Plus className="w-4 h-4 mr-2"/> Adicionar Magia Nível {lvl}
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </Card>

    </div>
  );
};