import { useState, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, BookOpen, Search, Crown, Users, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTableContext } from "@/features/table/TableContext";
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

const RichTextEditor = lazy(() => 
  import("@/components/RichTextEditor").then(module => ({ default: module.RichTextEditor }))
);

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
  const { isHelper, isMaster } = useTableContext();
  
  const isOnlyHelper = isHelper && !isMaster;

  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState("public"); // 'public' | 'gm'
  
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editIsGmOnly, setEditIsGmOnly] = useState(false);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['rules', tableId],
    queryFn: () => fetchRules(tableId),
  });

  const filteredRules = rules.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = false;
      if (activeCategory === "public") matchesCategory = !r.is_gm_only;
      if (activeCategory === "gm") matchesCategory = r.is_gm_only;

      // Segurança extra: Ajudante nunca vê regras de GM na lista, mesmo se forçar a aba
      if (isOnlyHelper && r.is_gm_only) return false;

      return matchesSearch && matchesCategory;
  });

  const handleSelectRule = (rule: Rule) => {
      if (isEditing && rule.id !== selectedRule?.id) {
          if (!confirm("Tem alterações não salvas. Deseja sair?")) return;
      }
      setSelectedRule(rule);
      setEditTitle(rule.title);
      setEditContent(rule.content || "");
      setEditIsGmOnly(rule.is_gm_only);
      setIsEditing(false);
  };

  const handleCreateNew = () => {
      if (isOnlyHelper && activeCategory === "gm") {
          toast({ title: "Acesso Negado", description: "Ajudantes não podem criar regras secretas.", variant: "destructive" });
          return;
      }

      const isGm = activeCategory === "gm";
      const newRule = { id: "new", title: "", content: "", is_gm_only: isGm, updated_at: new Date().toISOString() };
      
      setSelectedRule(newRule);
      setEditTitle("");
      setEditContent("");
      setEditIsGmOnly(isGm);
      setIsEditing(true);
  };

  const handleSave = async () => {
      if (!editTitle.trim()) return toast({ title: "Título obrigatório", variant: "destructive" });
      
      if (isOnlyHelper && editIsGmOnly) {
          return toast({ title: "Erro de Permissão", description: "Você não pode criar regras privadas.", variant: "destructive" });
      }

      setIsSaving(true);
      const payload = {
          table_id: tableId,
          title: editTitle,
          content: editContent,
          is_gm_only: editIsGmOnly
      };

      try {
          let savedData;
          if (selectedRule?.id === "new") {
              const { data, error } = await supabase.from("rules").insert(payload).select().single();
              if (error) throw error;
              savedData = data;
              toast({ title: "Regra Criada!" });
          } else if (selectedRule) {
              const { data, error } = await supabase.from("rules").update({
                  ...payload,
                  updated_at: new Date().toISOString()
              }).eq("id", selectedRule.id).select().single();
              if (error) throw error;
              savedData = data;
              toast({ title: "Regra Atualizada!" });
          }

          if (savedData) {
              setSelectedRule(savedData as Rule);
              setIsEditing(false);
              queryClient.invalidateQueries({ queryKey: ['rules', tableId] });
              if (savedData.is_gm_only) setActiveCategory("gm");
              else setActiveCategory("public");
          }
      } catch (error: any) {
          toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      } finally {
          setIsSaving(false);
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
    <div className="flex h-[calc(100vh-200px)] gap-6 animate-in fade-in duration-500">
       
       {/* 1. LISTA LATERAL (Índice com Abas) */}
       <Card className="w-1/3 min-w-[300px] max-w-sm flex flex-col border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="p-4 border-b border-border/50 space-y-4">
              <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" /> Grimório
                  </h3>
                  {!(isOnlyHelper && activeCategory === 'gm') && (
                      <Button size="sm" onClick={handleCreateNew} className="h-8 gap-2 shadow-sm bg-primary/90 hover:bg-primary text-primary-foreground">
                          <Plus className="w-4 h-4" /> Nova Regra
                      </Button>
                  )}
              </div>

              {/* SELETOR DE CATEGORIA (ABAS) */}
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                  <TabsList className="w-full grid grid-cols-2 bg-muted/50 border border-border/30">
                      <TabsTrigger value="public" className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                          <Users className="w-3 h-3 mr-2" /> Públicas
                      </TabsTrigger>
                      <TabsTrigger 
                          value="gm" 
                          className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-amber-500 data-[state=active]:shadow-sm disabled:opacity-50"
                          disabled={isOnlyHelper}
                      >
                          <Crown className="w-3 h-3 mr-2" /> Mestre
                      </TabsTrigger>
                  </TabsList>
              </Tabs>

              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                      placeholder="Pesquisar..." 
                      className="pl-9 h-9 bg-background/50 border-white/10 focus:bg-background transition-colors" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                  />
              </div>
          </div>
          
          <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full px-2 py-2">
                 {isLoading && <div className="p-4 space-y-2"><Skeleton className="h-8"/><Skeleton className="h-8"/></div>}
                 
                 <div className="flex flex-col gap-1">
                     {filteredRules.map(rule => (
                         <div 
                            key={rule.id}
                            className={`
                                group flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all border
                                ${selectedRule?.id === rule.id 
                                    ? "bg-primary/10 border-primary/30 text-primary font-medium shadow-sm" 
                                    : "border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground hover:border-border/30"}
                            `}
                            onClick={() => handleSelectRule(rule)}
                         >
                             <div className="flex items-center gap-3 overflow-hidden">
                                 {rule.is_gm_only ? (
                                     <EyeOff className="w-4 h-4 shrink-0 text-amber-500/70" />
                                 ) : (
                                     <Eye className="w-4 h-4 shrink-0 text-green-500/70" />
                                 )}
                                 <span className="truncate text-sm">{rule.title}</span>
                             </div>
                             
                             <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedRule?.id === rule.id ? "opacity-100" : ""}`}>
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive" 
                                    onClick={(e) => { e.stopPropagation(); setRuleToDelete(rule.id); }}
                                 >
                                    <Trash2 className="w-3 h-3" />
                                 </Button>
                             </div>
                         </div>
                     ))}
                     {filteredRules.length === 0 && !isLoading && (
                         <div className="text-center py-10 text-muted-foreground opacity-50 flex flex-col items-center">
                             {activeCategory === "gm" ? <Crown className="w-8 h-8 mb-2 opacity-20"/> : <BookOpen className="w-8 h-8 mb-2 opacity-20"/>}
                             <p className="text-xs">
                                 {activeCategory === "gm" ? "Sem regras de Mestre." : "Sem regras públicas."}
                             </p>
                         </div>
                     )}
                 </div>
              </ScrollArea>
          </CardContent>
       </Card>

       {/* 2. ÁREA DE LEITURA / EDIÇÃO */}
       <Card className="flex-1 flex flex-col overflow-hidden border-border/40 bg-card shadow-lg">
           {selectedRule ? (
               <>
                  <CardHeader className="p-4 border-b border-border/50 bg-muted/5 flex flex-row justify-between items-center">
                      <div className="flex-1 mr-4">
                          {isEditing ? (
                              <Input 
                                  value={editTitle} 
                                  onChange={e => setEditTitle(e.target.value)} 
                                  className="text-xl font-bold h-10 bg-background border-primary/30" 
                                  placeholder="Título do Capítulo" 
                              />
                          ) : (
                              <div className="flex items-center gap-3">
                                  <CardTitle className="text-2xl text-primary font-serif tracking-wide">{selectedRule.title}</CardTitle>
                                  {selectedRule.is_gm_only && <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 gap-1"><Crown className="w-3 h-3"/> Mestre</Badge>}
                              </div>
                          )}
                      </div>

                      <div className="flex items-center gap-2">
                          {isEditing ? (
                              <>
                                  {!isOnlyHelper && (
                                      <div className="flex items-center gap-2 mr-2 bg-background p-1.5 rounded-md border border-border/50">
                                          <Switch id="gm-only" checked={editIsGmOnly} onCheckedChange={setEditIsGmOnly} />
                                          <Label htmlFor="gm-only" className="text-xs cursor-pointer text-muted-foreground w-20 flex items-center justify-end gap-1">
                                              {editIsGmOnly ? <><Crown className="w-3 h-3"/> Secreto</> : "Público"}
                                          </Label>
                                      </div>
                                  )}
                                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancelar</Button>
                                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>} Salvar
                                  </Button>
                              </>
                          ) : (
                              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Editar</Button>
                          )}
                      </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 overflow-hidden p-0 relative bg-background/50">
                      {isEditing ? (
                          <div className="h-full p-4 overflow-y-auto custom-scrollbar">
                              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                                  <RichTextEditor 
                                      value={editContent} 
                                      onChange={setEditContent} 
                                      placeholder="Escreva as regras aqui..."
                                      className="min-h-[400px] font-serif text-lg leading-relaxed"
                                  />
                              </Suspense>
                          </div>
                      ) : (
                          <ScrollArea className="h-full p-8">
                              {selectedRule.content ? (
                                  <div 
                                    className="prose prose-invert max-w-none prose-headings:text-primary prose-a:text-blue-400 prose-p:leading-relaxed prose-li:marker:text-primary/50 font-serif text-slate-300 text-lg"
                                    dangerouslySetInnerHTML={{ __html: selectedRule.content }} 
                                  />
                              ) : (
                                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30">
                                     <p className="italic">Sem conteúdo.</p>
                                  </div>
                              )}
                          </ScrollArea>
                      )}
                  </CardContent>
               </>
           ) : (
               <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                   <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-4 border border-white/5">
                       <BookOpen className="w-8 h-8 opacity-20" />
                   </div>
                   <h3 className="text-lg font-medium">Nenhuma regra selecionada</h3>
                   <p className="text-sm text-muted-foreground/60">Selecione um capítulo à esquerda ou crie uma nova regra.</p>
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
                   <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Apagar</AlertDialogAction>
               </AlertDialogFooter>
           </AlertDialogContent>
       </AlertDialog>
    </div>
  );
};