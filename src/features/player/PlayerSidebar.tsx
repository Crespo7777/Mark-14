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
  User,
  Users,
  BookOpen,
  Store,
  Book,
  Settings
} from "lucide-react";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";
import { Separator } from "@/components/ui/separator";

interface PlayerSidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  tableId: string; // <--- NOVO PROP OBRIGATÓRIO
}

export function PlayerSidebar({ currentTab, onTabChange, tableId }: PlayerSidebarProps) {
  
  const mainItems = [
    { title: "Meus Personagens", id: "characters", icon: User },
    { title: "NPCs & Aliados", id: "npcs", icon: Users },
    { title: "Diário de Aventuras", id: "journal", icon: BookOpen },
  ];

  const worldItems = [
    { title: "Lojas & Mercado", id: "shops", icon: Store },
    { title: "Regras do Sistema", id: "rules", icon: Book },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 pb-2">
        {/* Passamos o tableId aqui também */}
        <GlobalSearchDialog tableId={tableId} />
      </SidebarHeader>

      <Separator className="my-2 opacity-50" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Aventura</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
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
              <SidebarMenuButton onClick={() => console.log("Abrir Preferências")}>
                <Settings />
                <span>Preferências</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}