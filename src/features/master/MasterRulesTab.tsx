// src/features/master/MasterRulesTab.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, BookOpen, Search, Crown, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTableContext } from "@/features/table/TableContext"; // IMPORTANTE: Para saber quem é o utilizador
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Rule {
  id: string;
  title: string;
  content: string;
  is_gm_only: boolean;
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
  const { isMaster, isHelper } = useTableContext(); // Contexto de permissões

  // Lógica de Segurança: Se for Ajudante (mas não o Dono), é um "OnlyHelper"
  const isOnlyHelper = isHelper && !isMaster;
  
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [activeListTab, setActiveListTab] = useState("public"); // 'public' | 'gm'
  
  // Estados de Edição
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editIsGmOnly, setEditIsGmOnly] = useState(false);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['rules', tableId],
    queryFn: () => fetchRules(tableId),
  });

  // FILTRO INTELIGENTE
  const filteredRules = rules.filter(r => {
      // 1. Filtro de Texto
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Filtro de Aba (Público vs Mestre)
      let matchesTab = activeListTab === "gm" ? r.is_gm_only : !r.is_gm_only;

      // 3. SEGURANÇA: Se for Ajudante, NUNCA mostra regras de GM, mesmo que a aba esteja ativa
      if (isOnlyHelper && r.is_gm_only) {
          return false;
      }

      return matchesSearch && matchesTab;
  });

  const handleSelectRule = (rule: Rule) => {
      setSelectedRule(rule);
      setEditTitle(rule.title);
      setEditContent(rule.content || "");
      setEditIsGmOnly(rule.is_gm_only || false);
      setIsEditing(false);
  };

  const handleCreateNew = () => {
      const isGmTab = activeListTab === "gm";
      
      // Proteção: Ajudante não pode criar regra secreta
      if (isOnlyHelper && isGmTab) {
          toast({ title: "Acesso Negado", description: "Ajudantes não podem criar regras secretas de Mestre.", variant: "destructive" });
          return;
      }

      const newRule = { id: "new", title: "Nova Regra", content: "", is_gm_only: isGmTab, updated_at: new Date().toISOString() };
      
      setSelectedRule(newRule);
      setEditTitle("");
      setEditContent("");
      setEditIsGmOnly(isGmTab);
      setIsEditing(true);
  };

  const handleSave = async () => {
      if (!editTitle.trim()) return toast({ title: "Título obrigatório", variant: "destructive" });

      // Proteção no Save: Se for Ajudante a tentar salvar como GM Only
      if (isOnlyHelper && editIsGmOnly) {
          return toast({ title: "Erro de Permissão", description: "Você não pode criar regras privadas de Mestre.", variant: "destructive" });
      }

      let savedRule = null;
      const payload = {
          table_id: tableId,
          title: editTitle,
          content: editContent,
          is_gm_only: editIsGmOnly
      };

      if (selectedRule?.id === "new") {
          const { data, error } = await supabase.from("rules").insert(payload).select().single();
          if (error) return toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
          savedRule = data;
          toast({ title: "Regra criada!" });
      } else if (selectedRule) {
          const { data, error } = await supabase.from("rules").update({
              ...payload,
              updated_at: new Date().toISOString()
          }).eq("id", selectedRule.id).select().single();
          if (error) return toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
          savedRule = data;
          toast({ title: "Regra salva!" });
      }

      if (savedRule) {
          setSelectedRule(savedRule as Rule);
          setIsEditing(false);
          queryClient.invalidateQueries({ queryKey: ['rules', tableId] });
      }
  };

  const confirmDelete = async () => {
      if (!ruleToDelete) return;
      await supabase.from("rules").delete().eq("id", ruleToDelete);
      toast({ title: "Regra apagada" });
      queryClient.invalidateQueries({ queryKey: ['rules', tableId] });
      if (selectedRule?.id === ruleToDelete) setSelectedRule(null);
      setRuleToDelete(null);
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
       {/* LISTA LATERAL */}
       <Card className="w-1/3 flex flex-col min-w-[280px] border-border/50 bg-card">
          <div className="p-4 border-b border-border/50 bg-muted/10 space-y-3">
             <div className="flex justify-between items-center">
                 <CardTitle className="text-lg">Compêndio</CardTitle>
                 {/* Botão Nova só aparece se não for Helper na aba de Mestre */}
                 {!(isOnlyHelper && activeListTab === 'gm') && (
                     <Button size="sm" onClick={handleCreateNew} className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2"/> Nova</Button>
                 )}
             </div>

             {/* ABAS DE FILTRO */}
             <Tabs value={activeListTab} onValueChange={setActiveListTab} className="w-full">
                <TabsList className="w-full grid grid-cols-2 bg-background/50">
                    <TabsTrigger value="public" className="text-xs">
                        <Users className="w-3 h-3 mr-2" /> Públicas
                    </TabsTrigger>
                    
                    {/* Ajudante vê a aba "Mestre" desativada ou escondida? Vamos deixar desativada visualmente */}
                    <TabsTrigger 
                        value="gm" 
                        className="text-xs data-[state=active]:text-amber-500"
                        disabled={isOnlyHelper} // BLOQUEIA CLIQUE DO AJUDANTE
                        title={isOnlyHelper ? "Acesso Restrito ao Dono da Mesa" : "Apenas Mestre"}
                    >
                        {isOnlyHelper ? <Crown className="w-3 h-3 mr-2 opacity-50" /> : <Crown className="w-3 h-3 mr-2" />} 
                        Mestre
                    </TabsTrigger>
                </TabsList>
             </Tabs>

             <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                   placeholder="Pesquisar..." 
                   className="pl-8 h-9 bg-background" 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
          </div>
          
          <CardContent className="p-0 flex-1 overflow-hidden">
             <ScrollArea className="h-full">
                {isLoading && <div className="p-4 space-y-2"><Skeleton className="h-8"/><Skeleton className="h-8"/></div>}
                
                <div className="flex flex-col p-2 gap-1">
                    {filteredRules.map(rule => (
                        <div 
                           key={rule.id}
                           className={`flex justify-between items-center p-3 rounded-md cursor-pointer transition-all border border-transparent ${selectedRule?.id === rule.id ? "bg-accent/10 border-accent/30 text-accent" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                           onClick={() => handleSelectRule(rule)}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                {rule.is_gm_only ? <Crown className="w-4 h-4 shrink-0 text-amber-600/70" /> : <BookOpen className="w-4 h-4 shrink-0 opacity-70" />}
                                <span className="truncate text-sm font-medium">{rule.title}</span>
                            </div>
                        </div>
                    ))}
                    {filteredRules.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                            {(activeListTab === "gm" && !isOnlyHelper) ? <Crown className="w-8 h-8 mb-2" /> : <BookOpen className="w-8 h-8 mb-2" />}
                            <p className="text-xs">
                                {isOnlyHelper && activeListTab === 'gm' 
                                    ? "Acesso restrito." 
                                    : "Nenhuma regra encontrada."}
                            </p>
                        </div>
                    )}
                </div>
             </ScrollArea>
          </CardContent>
       </Card>

       {/* ÁREA DE CONTEÚDO */}
       <Card className="flex-1 flex flex-col overflow-hidden border-border/50 bg-card shadow-lg">
           {selectedRule ? (
               <>
                  <CardHeader className="p-4 border-b border-border/50 flex flex-row justify-between items-start bg-muted/10 gap-4">
                      <div className="flex-1 space-y-3">
                          {isEditing || selectedRule.id === 'new' ? (
                              <div className="space-y-3">
                                  <Input 
                                     value={editTitle} 
                                     onChange={e => setEditTitle(e.target.value)} 
                                     className="text-lg font-bold h-10 bg-background border-primary/30 focus-visible:ring-primary/50" 
                                     placeholder="Título da Regra"
                                  />
                                  
                                  {/* Switch de Visibilidade (Escondido para Ajudantes, forçado a Público) */}
                                  {!isOnlyHelper && (
                                      <div className="flex items-center gap-3 bg-background/50 p-2 rounded border border-border/50 w-fit">
                                          <div className="flex items-center gap-2">
                                              <Switch 
                                                id="gm-only-mode" 
                                                checked={editIsGmOnly} 
                                                onCheckedChange={setEditIsGmOnly}
                                              />
                                              <Label htmlFor="gm-only-mode" className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                                                  {editIsGmOnly ? (
                                                      <><Crown className="w-3 h-3 text-amber-500" /> Apenas Mestre</>
                                                  ) : (
                                                      <><Users className="w-3 h-3 text-muted-foreground" /> Público</>
                                                  )}
                                              </Label>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ) : (
                              <div className="space-y-1">
                                  <CardTitle className="text-2xl flex items-center gap-2 text-primary">
                                      {selectedRule.title}
                                  </CardTitle>
                                  <div className="flex items-center gap-2">
                                      {selectedRule.is_gm_only ? (
                                          <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 gap-1 text-[10px] px-2 h-5">
                                              <Crown className="w-3 h-3" /> Mestre
                                          </Badge>
                                      ) : (
                                          <Badge variant="outline" className="text-muted-foreground gap-1 text-[10px] px-2 h-5">
                                              <Users className="w-3 h-3" /> Público
                                          </Badge>
                                      )}
                                      <span className="text-[10px] text-muted-foreground">
                                          Atualizado: {new Date(selectedRule.updated_at).toLocaleDateString()}
                                      </span>
                                  </div>
                              </div>
                          )}
                      </div>
                      
                      <div className="flex gap-2 shrink-0">
                          {isEditing || selectedRule.id === 'new' ? (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => {
                                    if(selectedRule.id === 'new') setSelectedRule(null);
                                    else {
                                        setIsEditing(false);
                                        setEditTitle(selectedRule.title);
                                        setEditContent(selectedRule.content);
                                        setEditIsGmOnly(selectedRule.is_gm_only);
                                    }
                                }}>Cancelar</Button>
                                <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white"><Save className="w-4 h-4 mr-2"/> Salvar</Button>
                              </>
                          ) : (
                              <>
                                <Button variant="outline" size="sm" onClick={() => {
                                    setEditTitle(selectedRule.title);
                                    setEditContent(selectedRule.content || "");
                                    setEditIsGmOnly(selectedRule.is_gm_only);
                                    setIsEditing(true);
                                }}>Editar</Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setRuleToDelete(selectedRule.id)}><Trash2 className="w-4 h-4"/></Button>
                              </>
                          )}
                      </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 overflow-hidden p-0 bg-background/50 relative">
                      {isEditing || selectedRule.id === 'new' ? (
                          <div className="h-full p-4 overflow-y-auto">
                              <RichTextEditor 
                                 key={selectedRule.id} 
                                 value={editContent} 
                                 onChange={setEditContent} 
                                 placeholder="Escreva as regras..."
                              />
                          </div>
                      ) : (
                          <ScrollArea className="h-full p-8">
                              <div 
                                className="prose prose-invert max-w-none prose-img:rounded-lg prose-img:shadow-md prose-headings:text-primary prose-a:text-blue-400"
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
               </div>
           )}
       </Card>

       <AlertDialog open={!!ruleToDelete} onOpenChange={() => setRuleToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Apagar Regra?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Apagar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
       </AlertDialog>
    </div>
  );
};