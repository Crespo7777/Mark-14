import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Database, Book, Swords } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
import { MasterDatabaseTab } from "./MasterDatabaseTab";
import { MasterJournalTab } from "./MasterJournalTab";
import { CombatTracker } from "@/features/combat/CombatTracker"; 
import { useTableContext } from "@/features/table/TableContext";

export const MasterRightPanel = () => {
  const { tableId } = useTableContext();
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="h-full flex flex-col bg-card border-l border-border shadow-2xl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
        
        {/* CABEÇALHO DAS ABAS (Estilo Foundry: Ícones no topo) */}
        <div className="border-b border-border bg-muted/40 p-1">
            <TabsList className="w-full flex justify-between bg-transparent h-10">
                {/* 1. CHAT */}
                <TabsTrigger 
                    value="chat" 
                    className="flex-1 data-[state=active]:bg-background data-[state=active]:text-primary h-8 rounded-sm transition-all border border-transparent data-[state=active]:border-border/50"
                    title="Chat"
                >
                    <MessageSquare className="w-4 h-4" />
                </TabsTrigger>
                
                {/* 2. COMBATE (Iniciativa) */}
                <TabsTrigger 
                    value="combat" 
                    className="flex-1 data-[state=active]:bg-background data-[state=active]:text-red-500 h-8 rounded-sm transition-all border border-transparent data-[state=active]:border-border/50"
                    title="Rastreador de Combate"
                >
                    <Swords className="w-4 h-4" />
                </TabsTrigger>

                {/* 3. DIÁRIO */}
                <TabsTrigger 
                    value="journal" 
                    className="flex-1 data-[state=active]:bg-background data-[state=active]:text-amber-500 h-8 rounded-sm transition-all border border-transparent data-[state=active]:border-border/50"
                    title="Diário e Notas"
                >
                    <Book className="w-4 h-4" />
                </TabsTrigger>
                
                {/* 4. COMPÊNDIO (Itens/Regras) */}
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
            <CombatTracker />
        </TabsContent>

        <TabsContent value="journal" className="flex-1 m-0 p-0 overflow-hidden data-[state=inactive]:hidden flex flex-col">
            <MasterJournalTab />
        </TabsContent>

        <TabsContent value="database" className="flex-1 m-0 p-0 overflow-hidden data-[state=inactive]:hidden flex flex-col">
            <MasterDatabaseTab />
        </TabsContent>

      </Tabs>
    </div>
  );
};