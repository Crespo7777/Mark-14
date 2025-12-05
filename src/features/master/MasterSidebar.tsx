import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Users,
  UserCog,
  Database,
  BookOpen,
  Store,
  ScrollText,
  UserCheck,
  Settings
} from "lucide-react";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";
import { Separator } from "@/components/ui/separator";

interface MasterSidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  tableId: string;
}

export function MasterSidebar({ currentTab, onTabChange, tableId }: MasterSidebarProps) {
  
  const manageItems = [
    { title: "Personagens (PCs)", id: "characters", icon: Users },
    { title: "NPCs & Bestiário", id: "npcs", icon: UserCog },
    { title: "Jogadores", id: "players", icon: UserCheck },
  ];

  const worldItems = [
    { title: "Base de Dados", id: "database", icon: Database },
    { title: "Lojas", id: "shops", icon: Store },
    { title: "Diário & Lore", id: "journal", icon: ScrollText },
    { title: "Regras", id: "rules", icon: BookOpen },
    // Item "Multimédia" removido aqui
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 pb-2">
        <GlobalSearchDialog tableId={tableId} />
      </SidebarHeader>

      <Separator className="my-2 opacity-50" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Campanha</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {manageItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={currentTab === item.id}
                    onClick={() => onTabChange(item.id)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Mundo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {worldItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={currentTab === item.id}
                    onClick={() => onTabChange(item.id)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => console.log("Configurações")}>
                <Settings />
                <span>Configurações</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}