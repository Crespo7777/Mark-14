// src/features/master/MasterRulesTab.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, BookOpen, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Skeleton } from "@/components/ui/skeleton";

interface Rule {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

const fetchRules = async (tableId: string) => {
  const { data, error } = await supabase.from("rules").select("*").eq("table_id", tableId).order("title");
  if (error) throw error;
  return data as Rule[];
};

export const MasterRulesTab = ({ tableId }: { tableId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estado temporário para edição
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['rules', tableId],
    queryFn: () => fetchRules(tableId),
  });

  const filteredRules = rules.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSelectRule = (rule: Rule) => {
      setSelectedRule(rule);
      setEditTitle(rule.title);
      setEditContent(rule.content || "");
      setIsEditing(false);
  };

  const handleCreateNew = () => {
      const newRule = { id: "new", title: "Nova Regra", content: "", updated_at: new Date().toISOString() };
      setSelectedRule(newRule);
      setEditTitle("");
      setEditContent("");
      setIsEditing(true);
  };

  const handleSave = async () => {
      if (!editTitle.trim()) return toast({ title: "Título obrigatório", variant: "destructive" });

      if (selectedRule?.id === "new") {
          const { error } = await supabase.from("rules").insert({
              table_id: tableId,
              title: editTitle,
              content: editContent
          });
          if (error) toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
          else {
              toast({ title: "Regra criada!" });
              setIsEditing(false);
              queryClient.invalidateQueries({ queryKey: ['rules', tableId] });
              setSelectedRule(null); // Reset para forçar reload ou selecionar o novo se quisermos complexidade
          }
      } else if (selectedRule) {
          const { error } = await supabase.from("rules").update({
              title: editTitle,
              content: editContent,
              updated_at: new Date().toISOString()
          }).eq("id", selectedRule.id);
          
          if (error) toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
          else {
              toast({ title: "Regra salva!" });
              setIsEditing(false);
              queryClient.invalidateQueries({ queryKey: ['rules', tableId] });
          }
      }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Apagar esta regra permanentemente?")) return;
      await supabase.from("rules").delete().eq("id", id);
      toast({ title: "Regra apagada" });
      queryClient.invalidateQueries({ queryKey: ['rules', tableId] });
      if (selectedRule?.id === id) setSelectedRule(null);
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
       {/* LISTA LATERAL */}
       <Card className="w-1/3 flex flex-col min-w-[250px]">
          <CardHeader className="p-4 border-b">
             <div className="flex justify-between items-center mb-2">
                 <CardTitle className="text-lg">Compêndio</CardTitle>
                 <Button size="sm" onClick={handleCreateNew}><Plus className="w-4 h-4 mr-2"/> Nova</Button>
             </div>
             <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                   placeholder="Pesquisar regras..." 
                   className="pl-8 h-9" 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
             <ScrollArea className="h-full">
                {isLoading && <div className="p-4 space-y-2"><Skeleton className="h-8"/><Skeleton className="h-8"/></div>}
                
                <div className="flex flex-col p-2 gap-1">
                    {filteredRules.map(rule => (
                        <div 
                           key={rule.id}
                           className={`flex justify-between items-center p-2 rounded-md cursor-pointer transition-colors ${selectedRule?.id === rule.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
                           onClick={() => handleSelectRule(rule)}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <BookOpen className="w-4 h-4 shrink-0 opacity-70" />
                                <span className="truncate font-medium text-sm">{rule.title}</span>
                            </div>
                        </div>
                    ))}
                    {filteredRules.length === 0 && !isLoading && (
                        <p className="text-center text-muted-foreground text-xs py-8">Nenhuma regra encontrada.</p>
                    )}
                </div>
             </ScrollArea>
          </CardContent>
       </Card>

       {/* ÁREA DE CONTEÚDO / EDIÇÃO */}
       <Card className="flex-1 flex flex-col overflow-hidden">
           {selectedRule ? (
               <>
                  <CardHeader className="p-4 border-b flex flex-row justify-between items-center bg-muted/10">
                      {isEditing || selectedRule.id === 'new' ? (
                          <Input 
                             value={editTitle} 
                             onChange={e => setEditTitle(e.target.value)} 
                             className="text-lg font-bold h-10" 
                             placeholder="Título da Regra"
                          />
                      ) : (
                          <CardTitle className="text-xl flex items-center gap-2">
                              {selectedRule.title}
                          </CardTitle>
                      )}
                      
                      <div className="flex gap-2">
                          {isEditing || selectedRule.id === 'new' ? (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => {
                                    if(selectedRule.id === 'new') setSelectedRule(null);
                                    else {
                                        setIsEditing(false);
                                        setEditTitle(selectedRule.title);
                                        setEditContent(selectedRule.content);
                                    }
                                }}>Cancelar</Button>
                                <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-2"/> Salvar</Button>
                              </>
                          ) : (
                              <>
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Editar</Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(selectedRule.id)}><Trash2 className="w-4 h-4"/></Button>
                              </>
                          )}
                      </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 overflow-hidden p-0">
                      {isEditing || selectedRule.id === 'new' ? (
                          <div className="h-full p-4 overflow-y-auto">
                              <RichTextEditor 
                                 value={editContent} 
                                 onChange={setEditContent} 
                                 placeholder="Escreva as regras, cole tabelas (imagens) ou crie listas..."
                              />
                          </div>
                      ) : (
                          <ScrollArea className="h-full p-6">
                              <div 
                                className="prose prose-invert max-w-none prose-img:rounded-lg prose-img:shadow-md prose-headings:text-primary"
                                dangerouslySetInnerHTML={{ __html: selectedRule.content }} 
                              />
                          </ScrollArea>
                      )}
                  </CardContent>
               </>
           ) : (
               <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                   <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                   <p>Selecione uma regra para ver os detalhes.</p>
                   <p className="text-xs opacity-50">Ou crie uma nova para adicionar tabelas e homebrew.</p>
               </div>
           )}
       </Card>
    </div>
  );
};