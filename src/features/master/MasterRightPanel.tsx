// src/features/master/MasterRightPanel.tsx

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, Settings, User, Search } from "lucide-react"; // Importar Search
import { useTableContext } from "@/features/table/TableContext";
import { DiscordSettingsDialog } from "@/components/DiscordSettingsDialog";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog"; // Importar GlobalSearchDialog
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MasterRightPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MasterRightPanel = ({ isOpen, onOpenChange }: MasterRightPanelProps) => {
  const { tableId } = useTableContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast({ title: "Sessão terminada" });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l border-white/10 bg-black/95 text-white">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" /> Painel do Mestre
          </SheetTitle>
        </SheetHeader>

        <div className="mt-8 flex flex-col gap-4">
          
          {/* SECÇÃO 1: FERRAMENTAS GERAIS */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
              Ferramentas
            </h3>
            
            {/* BUSCA GLOBAL */}
            <GlobalSearchDialog 
              tableId={tableId}
              trigger={
                <Button variant="ghost" className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10">
                  <Search className="w-4 h-4 mr-2" />
                  Pesquisar (Ctrl+K)
                </Button>
              }
            />

            {/* Configurar Discord */}
            <DiscordSettingsDialog tableId={tableId}>
                <Button variant="ghost" className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10">
                  <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 127.14 96.36">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22c.06-1.48.1-2.94.1-4.38C126.71,45.26,118.62,21.65,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                  </svg>
                  Integração Discord
                </Button>
            </DiscordSettingsDialog>
          </div>

          {/* SECÇÃO 2: CONTA */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
              Conta
            </h3>
            
            <Button variant="ghost" className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10" disabled>
              <User className="w-4 h-4 mr-2" />
              Perfil (Em breve)
            </Button>

            <Button 
                variant="ghost" 
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da Mesa
            </Button>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
};