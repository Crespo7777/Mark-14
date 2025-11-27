// src/features/player/PlayerRulesTab.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export const PlayerRulesTab = ({ tableId }: { tableId: string }) => {
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['rules', tableId],
    queryFn: () => fetchRules(tableId),
  });

  const filteredRules = rules.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
       {/* LISTA LATERAL */}
       <Card className="w-1/3 flex flex-col min-w-[200px] border-border/50">
          <CardHeader className="p-4 border-b border-border/50 bg-muted/10">
             <CardTitle className="text-lg flex items-center gap-2">
                 <BookOpen className="w-5 h-5 text-primary"/> Compêndio
             </CardTitle>
             <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                   placeholder="Pesquisar..." 
                   className="pl-8 h-9 bg-background" 
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
                           className={`flex justify-between items-center p-3 rounded-md cursor-pointer transition-colors ${selectedRule?.id === rule.id ? "bg-primary/20 text-primary font-medium border border-primary/20" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                           onClick={() => setSelectedRule(rule)}
                        >
                            <span className="truncate text-sm">{rule.title}</span>
                        </div>
                    ))}
                    {filteredRules.length === 0 && !isLoading && (
                        <p className="text-center text-muted-foreground text-xs py-8">Nenhuma regra encontrada.</p>
                    )}
                </div>
             </ScrollArea>
          </CardContent>
       </Card>

       {/* ÁREA DE LEITURA */}
       <Card className="flex-1 flex flex-col overflow-hidden border-border/50 bg-card">
           {selectedRule ? (
               <>
                  <CardHeader className="p-4 border-b border-border/50 bg-muted/10">
                      <CardTitle className="text-xl text-primary">{selectedRule.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-1 overflow-hidden p-0 bg-background/50">
                      <ScrollArea className="h-full p-8">
                          {/* AQUI APLICAMOS OS ESTILOS PARA AS IMAGENS E TABELAS FICAREM BONITAS */}
                          <div 
                            className="prose prose-invert max-w-none prose-img:rounded-lg prose-img:shadow-md prose-img:max-w-full prose-headings:text-primary prose-a:text-blue-400 prose-p:leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: selectedRule.content }} 
                          />
                      </ScrollArea>
                  </CardContent>
               </>
           ) : (
               <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                   <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                   <p>Selecione um tópico ao lado para ler.</p>
               </div>
           )}
       </Card>
    </div>
  );
};