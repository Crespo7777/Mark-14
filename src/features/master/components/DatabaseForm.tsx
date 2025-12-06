import { Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, Plus, X } from "lucide-react";
import { ItemIconUploader } from "@/components/ItemIconUploader";
import { QualitySelector } from "@/components/QualitySelector";
import { 
    RPG_ATTRIBUTES, 
    WEAPON_SUBCATEGORIES, 
    ARMOR_SUBCATEGORIES, 
    FOOD_SUBCATEGORIES 
} from "../database.constants";

const RichTextEditor = lazy(() => 
  import("@/components/RichTextEditor").then(module => ({ default: module.RichTextEditor }))
);

interface DatabaseFormProps {
    tableId: string;
    category: string;
    data: any;
    onChange: (newData: any) => void;
    onSave: () => void;
    onCancel: () => void;
    isSaving: boolean;
    isEditing: boolean;
    editorKey: number;
}

export const DatabaseForm = ({ 
    tableId, category, data, onChange, onSave, onCancel, isSaving, isEditing, editorKey 
}: DatabaseFormProps) => {

    const updateData = (key: string, value: any) => {
        onChange({ ...data, data: { ...data.data, [key]: value } });
    };

    const renderSpecificFields = () => {
        switch (category) {
          case 'quality': return (
            <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Alvo (Arma/Armadura...)" value={data.data.targetType || ""} onChange={e => updateData('targetType', e.target.value)} className="bg-background col-span-2"/>
                <Input placeholder="Efeito Resumido" value={data.data.effect || ""} onChange={e => updateData('effect', e.target.value)} className="bg-background col-span-2"/>
            </div>
          );
          
          case 'trait': return (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Select value={data.data.type || "Traço"} onValueChange={v => updateData('type', v)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Traço">Traço</SelectItem>
                            <SelectItem value="Dádiva">Dádiva</SelectItem>
                            <SelectItem value="Fardo">Fardo</SelectItem>
                            <SelectItem value="Monstruoso">Traço de Criatura</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={data.data.level || "Sem Nível"} onValueChange={v => updateData('level', v)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Nível Padrão" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Sem Nível">Sem Nível</SelectItem>
                            <SelectItem value="Novato">Novato</SelectItem>
                            <SelectItem value="Adepto">Adepto</SelectItem>
                            <SelectItem value="Mestre">Mestre</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input placeholder="Custo / Pontos" value={data.data.cost || ""} onChange={e => updateData('cost', e.target.value)} className="bg-background"/>
                </div>
                <div className="space-y-2 border-t pt-2">
                    <Label className="text-xs uppercase text-muted-foreground">Efeitos por Nível (Opcional)</Label>
                    <Textarea placeholder="Novato..." className="h-14 bg-background" value={data.data.novice || ""} onChange={e => updateData('novice', e.target.value)} />
                    <Textarea placeholder="Adepto..." className="h-14 bg-background" value={data.data.adept || ""} onChange={e => updateData('adept', e.target.value)} />
                    <Textarea placeholder="Mestre..." className="h-14 bg-background" value={data.data.master || ""} onChange={e => updateData('master', e.target.value)} />
                </div>
            </div>
          );

          case 'weapon': { 
              const isReloadable = data.data.subcategory === "Arma de Projétil" || data.data.subcategory === "Arma de Arremesso"; 
              return (
                  <div className="grid grid-cols-2 gap-3">
                      <Select value={data.data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}>
                          <SelectTrigger className="col-span-2 md:col-span-1 bg-background"><SelectValue placeholder="Categoria" /></SelectTrigger>
                          <SelectContent>{WEAPON_SUBCATEGORIES.map(sub => (<SelectItem key={sub} value={sub}>{sub}</SelectItem>))}</SelectContent>
                      </Select>
                      <Input placeholder="Dano (ex: 1d8)" value={data.data.damage || ""} onChange={e => updateData('damage', e.target.value)} className="bg-background"/>
                      
                      {/* SELECT CORRIGIDO: Usa attr.key no value */}
                      <Select value={data.data.attackAttribute || ""} onValueChange={v => updateData('attackAttribute', v)}>
                         <SelectTrigger className="bg-background"><SelectValue placeholder="Atributo de Ataque" /></SelectTrigger>
                         <SelectContent>
                             {RPG_ATTRIBUTES.map(attr => <SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>)}
                         </SelectContent>
                      </Select>

                      <div className="col-span-2"><Label className="text-xs">Qualidades</Label><QualitySelector tableId={tableId} value={data.data.quality || ""} onChange={(val) => updateData('quality', val)} targetType="weapon" /></div>
                      {isReloadable && (<Input placeholder="Recarga (ex: Ação Livre)" value={data.data.reloadAction || ""} onChange={e => updateData('reloadAction', e.target.value)} className="bg-background col-span-2 md:col-span-1 border-accent/50"/>)}
                      <Input placeholder="Preço" value={data.data.price || ""} onChange={e => updateData('price', e.target.value)} className={`${isReloadable ? "col-span-2 md:col-span-1" : "col-span-2"} bg-background`}/>
                  </div>
              ); 
          }

          case 'ammunition': return (
             <div className="grid grid-cols-2 gap-3">
                 <Input placeholder="Dano Extra (ex: +1d4)" value={data.data.damage || ""} onChange={e => updateData('damage', e.target.value)} className="bg-background"/>
                 <Input placeholder="Bônus de Ataque (ex: +1)" value={data.data.attack_modifier || ""} onChange={e => updateData('attack_modifier', e.target.value)} className="bg-background"/>
                 <div className="col-span-2"><Label className="text-xs">Qualidades</Label><QualitySelector tableId={tableId} value={data.data.quality || ""} onChange={(val) => updateData('quality', val)} targetType="weapon" /></div>
                 <Input placeholder="Preço (Pack)" value={data.data.price || ""} onChange={e => updateData('price', e.target.value)} className="bg-background col-span-2"/>
             </div>
          );

          case 'armor': return (
              <div className="grid grid-cols-2 gap-3">
                  <Select value={data.data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}>
                      <SelectTrigger className="col-span-2 bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger>
                      <SelectContent>{ARMOR_SUBCATEGORIES.map(sub => (<SelectItem key={sub} value={sub}>{sub}</SelectItem>))}</SelectContent>
                  </Select>
                  <Input placeholder="Proteção (ex: 1d4 ou 2)" value={data.data.protection || ""} onChange={e => updateData('protection', e.target.value)} className="bg-background"/>
                  <Input placeholder="Penalidade (ex: 2)" value={data.data.obstructive || ""} onChange={e => updateData('obstructive', e.target.value)} className="bg-background"/>
                  <div className="col-span-2"><Label className="text-xs">Qualidades</Label><QualitySelector tableId={tableId} value={data.data.quality || ""} onChange={(val) => updateData('quality', val)} targetType="armor" /></div>
                  <Input placeholder="Preço" className="col-span-2 bg-background" value={data.data.price || ""} onChange={e => updateData('price', e.target.value)} />
              </div>
          );

          case 'ability': return (
              <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                      <Select value={data.data.type || "Habilidade"} onValueChange={v => updateData('type', v)}>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger>
                          <SelectContent><SelectItem value="Habilidade">Habilidade</SelectItem><SelectItem value="Poder">Poder</SelectItem><SelectItem value="Ritual">Ritual</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Custo Corr." value={data.data.corruptionCost || ""} onChange={e => updateData('corruptionCost', e.target.value)} className="bg-background"/>
                      
                      {/* SELECT CORRIGIDO: Usa attr.key */}
                      <Select value={data.data.associatedAttribute || ""} onValueChange={v => updateData('associatedAttribute', v)}>
                         <SelectTrigger className="bg-background"><SelectValue placeholder="Atributo Base" /></SelectTrigger>
                         <SelectContent>
                            <SelectItem value="Nenhum">Nenhum</SelectItem>
                            {RPG_ATTRIBUTES.map(attr => <SelectItem key={attr.key} value={attr.key}>{attr.label}</SelectItem>)}
                         </SelectContent>
                      </Select>

                      <Input placeholder="Tradição" value={data.data.tradition || ""} onChange={e => updateData('tradition', e.target.value)} className="bg-background"/>
                  </div>
                  <div className="space-y-2 border-t pt-2">
                      <Label className="text-xs uppercase text-muted-foreground">Efeitos por Nível</Label>
                      <Textarea placeholder="Novato..." className="h-14 bg-background" value={data.data.novice || ""} onChange={e => updateData('novice', e.target.value)} />
                      <Textarea placeholder="Adepto..." className="h-14 bg-background" value={data.data.adept || ""} onChange={e => updateData('adept', e.target.value)} />
                      <Textarea placeholder="Mestre..." className="h-14 bg-background" value={data.data.master || ""} onChange={e => updateData('master', e.target.value)} />
                  </div>
              </div>
          );
          
          case 'consumable': return (<div className="grid grid-cols-2 gap-3"><Input placeholder="Duração" value={data.data.duration || ""} onChange={e => updateData('duration', e.target.value)} className="bg-background"/><Input placeholder="Preço" value={data.data.price || ""} onChange={e => updateData('price', e.target.value)} className="bg-background"/></div>);
          case 'food': return (<div className="grid grid-cols-2 gap-3"><Select value={data.data.subcategory || ""} onValueChange={v => updateData('subcategory', v)}><SelectTrigger className="col-span-2 md:col-span-1 bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent>{FOOD_SUBCATEGORIES.map(sub => (<SelectItem key={sub} value={sub}>{sub}</SelectItem>))}</SelectContent></Select><Input placeholder="Preço" value={data.data.price || ""} onChange={e => updateData('price', e.target.value)} className="bg-background"/></div>);
          case 'artifact': return (<div className="grid grid-cols-2 gap-3"><Input placeholder="Efeito Mágico" className="col-span-2 bg-background" value={data.data.effect || ""} onChange={e => updateData('effect', e.target.value)} /><Input placeholder="Corrupção" value={data.data.corruption || ""} onChange={e => updateData('corruption', e.target.value)} className="bg-background"/><Input placeholder="Preço" value={data.data.price || ""} onChange={e => updateData('price', e.target.value)} className="bg-background"/></div>);
          default: return (<div className="grid grid-cols-2 gap-3"><Input placeholder="Preço" value={data.data.price || ""} onChange={e => updateData('price', e.target.value)} className="col-span-2 bg-background"/></div>);
        }
    };

    return (
        <Card className={`border-dashed border-2 transition-colors ${isEditing ? "bg-accent/5 border-accent" : "bg-muted/20"}`}>
           <CardContent className="p-4 space-y-4">
               <div className="flex justify-between items-center">
                   <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                       {isEditing ? "Editando Item" : "Novo Item"}
                   </h3>
                   {isEditing && <Button variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4 mr-1"/> Cancelar</Button>}
               </div>
               
               <div className="flex flex-col md:flex-row gap-6">
                   <div className="shrink-0 flex justify-center md:justify-start">
                      <ItemIconUploader 
                         currentUrl={data.icon_url}
                         onUpload={(url) => onChange({ ...data, icon_url: url })}
                         onRemove={() => onChange({ ...data, icon_url: null })}
                      />
                   </div>

                   <div className="flex-1 space-y-4">
                       <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-8 space-y-2">
                             <Label>Nome</Label>
                             <Input value={data.name} onChange={e => onChange({ ...data, name: e.target.value })} placeholder="Nome do item..." className="bg-background" />
                          </div>
                          {category !== 'ability' && category !== 'quality' && category !== 'trait' && (
                             <div className="col-span-4 space-y-2">
                                 <Label>Peso</Label>
                                 <Input type="number" value={data.weight} onChange={e => onChange({ ...data, weight: e.target.value })} className="bg-background" />
                             </div>
                          )}
                       </div>
                       {renderSpecificFields()}
                   </div>
               </div>

               <div className="space-y-2">
                   <Label>Descrição Completa</Label>
                   <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                      <RichTextEditor 
                         key={`${isEditing ? 'edit' : 'new'}-${category}-${editorKey}`}
                         value={data.description} 
                         onChange={val => onChange({ ...data, description: val })} 
                         placeholder="Regras e detalhes..." 
                      />
                   </Suspense>
               </div>

               <div className="flex justify-end pt-2">
                   <Button onClick={onSave} className="w-full sm:w-auto" disabled={isSaving}>
                       {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : (isEditing ? <Save className="w-4 h-4 mr-2"/> : <Plus className="w-4 h-4 mr-2"/>)} 
                       {isEditing ? "Salvar Alterações" : "Adicionar ao Database"}
                   </Button>
               </div>
           </CardContent>
        </Card>
    );
};