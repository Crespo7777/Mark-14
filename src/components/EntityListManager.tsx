import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Ghost, Folder, ChevronDown, ChevronRight } from "lucide-react";
import { EntityCard } from "./EntityCard";
import { FolderType } from "@/types/app-types";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EntityListManagerProps {
  items: any[];
  folders?: FolderType[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
  onDuplicate?: (item: any) => void;
  onArchive?: (id: string, currentVal: boolean) => void;
  onMove?: (id: string, folderId: string | null) => void;
  onShare?: (item: any) => void;
  onCreate?: () => void;
  title?: string;
  type?: "character" | "npc";
  isLoading?: boolean;
  actions?: React.ReactNode;
  searchTerm?: string;
  onSearch?: (term: string) => void;
  renderItem?: (item: any) => React.ReactNode;
  showArchived?: boolean;
  onToggleArchived?: (val: boolean) => void;
  emptyMessage?: string;
  gridClassName?: string; // <--- NOVA PROPRIEDADE
}

export const EntityListManager = ({
  items,
  folders = [],
  onEdit,
  onDelete,
  onDuplicate,
  onArchive,
  onMove,
  onShare,
  onCreate,
  title = "Itens",
  type,
  isLoading = false,
  actions,
  searchTerm: externalSearchTerm,
  onSearch: externalOnSearch,
  renderItem,
  emptyMessage = "Nenhum encontrado.",
  gridClassName // <--- RECEBIDA AQUI
}: EntityListManagerProps) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  
  const [openFolders, setOpenFolders] = useState<string[]>(folders.map(f => f.id));

  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = externalOnSearch || setInternalSearchTerm;

  const filteredItems = items.filter((item) => {
    if (!item) return false;
    
    if (selectedFolder !== "all" && selectedFolder !== "no_folder" && item.folder_id !== selectedFolder) return false;
    if (selectedFolder === "no_folder" && item.folder_id !== null) return false;

    const term = (searchTerm || "").toLowerCase();
    if (!term) return true;

    const name = String(item.name || item.title || "").toLowerCase();
    const raceRaw = item.race || item.data?.race;
    const race = String(raceRaw || "").toLowerCase();
    const occupationRaw = item.occupation || item.data?.occupation;
    const occupation = String(occupationRaw || "").toLowerCase();

    return name.includes(term) || race.includes(term) || occupation.includes(term);
  });

  const safeTitle = String(title || "").toLowerCase();

  const toggleFolder = (folderId: string) => {
      setOpenFolders(prev => 
          prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
      );
  };

  const renderEntityOrCustom = (item: any) => {
      if (renderItem) {
          return renderItem(item);
      }
      if (!onEdit || !onDelete || !type) return null;
      
      return (
          <EntityCard 
            key={item.id} 
            entity={item} 
            folders={folders} 
            type={type} 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onDuplicate={onDuplicate} 
            onArchive={onArchive} 
            onMove={onMove} 
            onShare={onShare} 
          />
      );
  };

  const renderContent = () => {
      // Define o grid padrão (denso) ou usa o customizado (largo)
      const currentGridClass = gridClassName || "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10";

      if (isLoading) {
          return (
            <div className={cn("grid gap-2 md:gap-3", currentGridClass)}>
                {[1,2,3,4,5,6,7,8,9,10].map(i => <div key={i} className="aspect-square rounded-md bg-muted animate-pulse" />)}
            </div>
          );
      }

      // 1. MODO "VISTA AGRUPADA"
      if (selectedFolder === "all" && !searchTerm) {
          const folderGroups: Record<string, any[]> = {};
          const noFolderItems: any[] = [];

          items.forEach(item => {
              if (item.folder_id) {
                  if (!folderGroups[item.folder_id]) folderGroups[item.folder_id] = [];
                  folderGroups[item.folder_id].push(item);
              } else {
                  noFolderItems.push(item);
              }
          });

          return (
              <div className="space-y-4 pb-10">
                  {/* Itens Sem Pasta */}
                  {noFolderItems.length > 0 && (
                      <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Soltos</h4>
                          <div className={cn("grid gap-2 md:gap-3", currentGridClass)}>
                              {noFolderItems.map(item => (
                                  <div key={item.id}>{renderEntityOrCustom(item)}</div>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* Pastas */}
                  {folders.map(folder => {
                      const folderItems = folderGroups[folder.id] || [];
                      const isOpen = openFolders.includes(folder.id);
                      
                      return (
                          <Collapsible key={folder.id} open={isOpen} onOpenChange={() => toggleFolder(folder.id)} className="border rounded-md bg-card/50 overflow-hidden">
                              <CollapsibleTrigger className="flex items-center gap-2 p-2 w-full hover:bg-accent/50 transition-colors text-left">
                                  {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground"/> : <ChevronRight className="w-4 h-4 text-muted-foreground"/>}
                                  <Folder className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                                  <span className="font-semibold text-sm flex-1">{folder.name}</span>
                                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full border">{folderItems.length}</span>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent className="p-2 pt-0 border-t bg-muted/10">
                                  <div className={cn("grid gap-2 pt-2", currentGridClass)}>
                                      {folderItems.length > 0 ? (
                                          folderItems.map(item => (
                                              <div key={item.id}>{renderEntityOrCustom(item)}</div>
                                          ))
                                      ) : (
                                          <p className="text-xs text-muted-foreground col-span-full py-2 italic text-center">Pasta vazia. Arraste itens para cá.</p>
                                      )}
                                  </div>
                              </CollapsibleContent>
                          </Collapsible>
                      );
                  })}
              </div>
          );
      }

      // 2. MODO LISTA PLANA
      if (filteredItems.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-md bg-muted/30 m-2">
                <Ghost className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium opacity-50">{emptyMessage}</p>
            </div>
          );
      }

      return (
        <div className={cn("grid gap-2 md:gap-3 pb-10", currentGridClass)}>
            {filteredItems.map((item) => (
               <div key={item.id}>{renderEntityOrCustom(item)}</div>
            ))}
        </div>
      );
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between bg-card p-2 rounded-md border shadow-sm">
        <div className="flex gap-2 w-full sm:w-auto flex-1">
            <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={`Buscar ${safeTitle}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 bg-background/50 h-9 text-sm"
                />
            </div>
            
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="w-[140px] h-9 text-sm bg-background/50">
                    <SelectValue placeholder="Pastas" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Vista Agrupada</SelectItem>
                    <SelectItem value="no_folder">Sem Pasta</SelectItem>
                    {(folders || []).map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <div className="flex gap-2 w-full sm:w-auto items-center">
            {actions} 
            {onCreate && (
                <Button onClick={onCreate} size="sm" className="h-9 shadow-sm">
                   <Plus className="w-4 h-4 mr-1" /> Novo
                </Button>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-0.5 md:p-1 scrollbar-thin scrollbar-thumb-muted">
         {renderContent()}
      </div>
    </div>
  );
};