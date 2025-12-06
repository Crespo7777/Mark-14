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
  is_gm_only: boolean;
  updated_at: string;
}

const fetchPlayerRules = async (tableId: string) => {
  const { data, error } = await supabase
    .from("rules")
    .select("*")
    .eq("table_id", tableId)
    .eq("is_gm_only", false) 
    .order("title");
    
  if (error) throw error;
  return data as Rule[];
};

export const PlayerRulesTab = ({ tableId }: { tableId: string }) => {
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['player_rules', tableId],
    queryFn: () => fetchPlayerRules(tableId),
  });

  const filteredRules = rules.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6 animate-in fade-in duration-500">
       {/* 1. ÍNDICE */}
       <Card className="w-1/3 min-w-[250px] max-w-sm flex flex-col border-border/40 bg-card/50">
          <div className="p-4 border-b border-border/50 space-y-4 bg-muted/10">
              <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg font-serif">Compêndio</h3>
              </div>
              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                      placeholder="Pesquisar regras..." 
                      className="pl-9 h-9 bg-background/50 border-white/10" 
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
                                flex items-center p-3 rounded-lg cursor-pointer transition-all border
                                ${selectedRule?.id === rule.id 
                                    ? "bg-primary/10 border-primary/30 text-primary font-medium" 
                                    : "border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"}
                            `}
                            onClick={() => setSelectedRule(rule)}
                         >
                             <span className="truncate text-sm font-serif">{rule.title}</span>
                         </div>
                     ))}
                     {filteredRules.length === 0 && !isLoading && (
                         <div className="text-center py-10 text-muted-foreground opacity-50">
                             <p className="text-xs">Nenhuma regra pública.</p>
                         </div>
                     )}
                 </div>
              </ScrollArea>
          </CardContent>
       </Card>

       {/* 2. LEITURA */}
       <Card className="flex-1 flex flex-col overflow-hidden border-border/40 bg-card shadow-lg">
           {selectedRule ? (
               <>
                  <CardHeader className="p-6 border-b border-border/50 bg-muted/5">
                      <CardTitle className="text-3xl text-primary font-serif tracking-wide">{selectedRule.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-1 overflow-hidden p-0 bg-background/50">
                      <ScrollArea className="h-full p-8">
                          <div 
                            className="prose prose-invert max-w-none prose-lg prose-headings:text-primary prose-a:text-blue-400 prose-p:leading-relaxed prose-li:marker:text-primary/50 font-serif text-slate-300"
                            dangerouslySetInnerHTML={{ __html: selectedRule.content }} 
                          />
                      </ScrollArea>
                  </CardContent>
               </>
           ) : (
               <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                   <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                       <BookOpen className="w-8 h-8 opacity-20" />
                   </div>
                   <h3 className="text-lg font-medium">Selecione um tópico</h3>
                   <p className="text-sm">Escolha uma regra à esquerda para ler.</p>
               </div>
           )}
       </Card>
    </div>
  );
};