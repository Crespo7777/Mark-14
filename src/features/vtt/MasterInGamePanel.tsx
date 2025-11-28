// src/features/vtt/MasterInGamePanel.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserSquare, Users, BookOpen, Store, Database, Book, Clapperboard } from "lucide-react";

// Importamos as abas que já criaste para o Dashboard
import { MasterCharactersTab } from "@/features/master/MasterCharactersTab";
import { MasterNpcsTab } from "@/features/master/MasterNpcsTab";
import { MasterJournalTab } from "@/features/master/MasterJournalTab";
import { MasterShopsTab } from "@/features/master/MasterShopsTab";
import { MasterDatabaseTab } from "@/features/master/MasterDatabaseTab";
import { MasterRulesTab } from "@/features/master/MasterRulesTab";
import { MasterMediaTab } from "@/features/master/MasterMediaTab";

interface MasterInGamePanelProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
}

export const MasterInGamePanel = ({ isOpen, onClose, tableId }: MasterInGamePanelProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] bg-background/95 backdrop-blur-xl border-white/10 flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-3 border-b border-border bg-muted/30">
            <DialogTitle>Gestão da Campanha</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="characters" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 border-b border-border bg-muted/10">
                <TabsList className="bg-transparent justify-start gap-4">
                    <TabsTrigger value="characters" className="data-[state=active]:bg-background"><UserSquare className="w-4 h-4 mr-2"/> Personagens</TabsTrigger>
                    <TabsTrigger value="npcs" className="data-[state=active]:bg-background"><Users className="w-4 h-4 mr-2"/> NPCs & Monstros</TabsTrigger>
                    <TabsTrigger value="journal" className="data-[state=active]:bg-background"><BookOpen className="w-4 h-4 mr-2"/> Diário</TabsTrigger>
                    <TabsTrigger value="shops" className="data-[state=active]:bg-background"><Store className="w-4 h-4 mr-2"/> Lojas</TabsTrigger>
                    <TabsTrigger value="database" className="data-[state=active]:bg-background"><Database className="w-4 h-4 mr-2"/> Database</TabsTrigger>
                    <TabsTrigger value="media" className="data-[state=active]:bg-background"><Clapperboard className="w-4 h-4 mr-2"/> Media</TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-hidden bg-background">
                <TabsContent value="characters" className="h-full m-0 p-4 overflow-y-auto"><MasterCharactersTab tableId={tableId} /></TabsContent>
                <TabsContent value="npcs" className="h-full m-0 p-4 overflow-y-auto"><MasterNpcsTab tableId={tableId} /></TabsContent>
                <TabsContent value="journal" className="h-full m-0 p-4 overflow-y-auto"><MasterJournalTab tableId={tableId} /></TabsContent>
                <TabsContent value="shops" className="h-full m-0 p-4 overflow-y-auto"><MasterShopsTab tableId={tableId} /></TabsContent>
                <TabsContent value="database" className="h-full m-0 p-4 overflow-y-auto"><MasterDatabaseTab tableId={tableId} /></TabsContent>
                <TabsContent value="media" className="h-full m-0 p-4 overflow-y-auto"><MasterMediaTab tableId={tableId} /></TabsContent>
            </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};