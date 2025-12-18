import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Database, Book, Swords } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
import { MasterDatabaseTab } from "./MasterDatabaseTab";
import { MasterJournalTab } from "./MasterJournalTab";
// CORREÇÃO: Importa o Roteador de Combate (que decide entre Symbaroum/Pathfinder)
import { CombatTracker } from "@/features/combat/CombatTracker"; 
import { useTableContext } from "@/features/table/TableContext";

export const MasterRightPanel = () => {
  const { tableId } = useTableContext();
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="h-full flex flex-col bg-card border-l border-border shadow-2xl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
        
        {/* CABEÇALHO DAS ABAS */}
        <div className="border-b border-border bg-muted/40 p-1">
            <TabsList className="w-full flex justify-between bg-transparent h-10">
                <TabsTrigger 
                    value="chat" 
                    className="flex-1 data-[state=active]:bg-background data-[state=active]:text-primary h-8 rounded-sm transition-all border border-transparent data-[state=active]:border-border/50"
                    title="Chat"
                >
                    <MessageSquare className="w-4 h-4" />
                </TabsTrigger>
                
                <TabsTrigger 
                    value="combat" 
                    className="flex-1 data-[state=active]:bg-background data-[state=active]:text-red-500 h-8 rounded-sm transition-all border border-transparent data-[state=active]:border-border/50"
                    title="Rastreador de Combate"
                >
                    <Swords className="w-4 h-4" />
                </TabsTrigger>

                <TabsTrigger 
                    value="journal" 
                    className="flex-1 data-[state=active]:bg-background data-[state=active]:text-amber-500 h-8 rounded-sm transition-all border border-transparent data-[state=active]:border-border/50"
                    title="Diário e Notas"
                >
                    <Book className="w-4 h-4" />
                </TabsTrigger>
                
                <TabsTrigger 
                    value="database" 
                    className="flex-1 data-[state=active]:bg-background data-[state=active]:text-blue-500 h-8 rounded-sm transition-all border border-transparent data-[state=active]:border-border/50"
                    title="Compêndio"
                >
                    <Database className="w-4 h-4" />
                </TabsTrigger>
            </TabsList>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        
        <TabsContent value="chat" className="flex-1 m-0 p-0 overflow-hidden data-[state=inactive]:hidden flex flex-col">
            <ChatPanel tableId={tableId} />
        </TabsContent>

        <TabsContent value="combat" className="flex-1 m-0 p-0 overflow-hidden data-[state=inactive]:hidden flex flex-col">
            <CombatTracker isMaster={true} />
        </TabsContent>

        <TabsContent value="journal" className="flex-1 m-0 p-0 overflow-hidden data-[state=inactive]:hidden flex flex-col">
            <MasterJournalTab tableId={tableId} />
        </TabsContent>

        <TabsContent value="database" className="flex-1 m-0 p-0 overflow-hidden data-[state=inactive]:hidden flex flex-col">
            <MasterDatabaseTab tableId={tableId} />
        </TabsContent>

      </Tabs>
    </div>
  );
};