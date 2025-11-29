import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Import necessário caso use o botão padrão
import { Search, Plus, Ghost } from "lucide-react";
import { EntityCard } from "./EntityCard";
import { FolderType } from "@/types/app-types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface EntityListManagerProps {
  items: any[];
  folders?: FolderType[];
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  // Actions do Card
  onDuplicate?: (item: any) => void;
  onArchive?: (id: string, currentVal: boolean) => void;
  onMove?: (id: string, folderId: string | null) => void;
  onShare?: (item: any) => void;
  
  onCreate?: () => void; // <--- AGORA OPCIONAL
  title?: string;
  type: "character" | "npc";
  isLoading?: boolean;
  actions?: React.ReactNode;
  searchTerm?: string;
  onSearch?: (term: string) => void;
}

export const EntityListManager = ({
  items,
  folders = [], // Blindagem contra undefined
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
  onSearch: externalOnSearch
}: EntityListManagerProps) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");

  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = externalOnSearch || setInternalSearchTerm;

  // Lógica de Filtragem Segura
  const filteredItems = items.filter((item) => {
    if (!item) return false;
    
    if (selectedFolder !== "all" && selectedFolder !== "no_folder" && item.folder_id !== selectedFolder) return false;
    if (selectedFolder === "no_folder" && item.folder_id !== null) return false;

    const term = (searchTerm || "").toLowerCase();
    if (!term) return true;

    const name = String(item.name || "").toLowerCase();
    const raceRaw = item.race || item.data?.race;
    const race = String(raceRaw || "").toLowerCase();
    const occupationRaw = item.occupation || item.data?.occupation;
    const occupation = String(occupationRaw || "").toLowerCase();

    return name.includes(term) || race.includes(term) || occupation.includes(term);
  });

  const safeTitle = String(title || "").toLowerCase();

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* BARRA DE FERRAMENTAS */}
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
                <SelectTrigger className="w-[130px] h-9 text-sm bg-background/50">
                    <SelectValue placeholder="Pastas" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="no_folder">Sem Pasta</SelectItem>
                    {(folders || []).map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <div className="flex gap-2 w-full sm:w-auto items-center">
            {actions} 
            {/* Só mostra este botão se onCreate for passado. Caso contrário, usamos o botão dentro de 'actions' */}
            {onCreate && (
                <Button onClick={onCreate} size="sm" className="h-9 shadow-sm">
                   <Plus className="h-4 w-4 mr-1" /> Novo
                </Button>
            )}
        </div>
      </div>

      {/* GRID DE CONTEÚDO */}
      <div className="flex-1 overflow-y-auto p-0.5 md:p-1 scrollbar-thin scrollbar-thumb-muted">
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-3">
             {[1,2,3,4,5,6,7,8,9,10].map(i => (
                 <div key={i} className="aspect-square rounded-md bg-muted animate-pulse" />
             ))}
          </div>
        ) : filteredItems.length > 0 ? (
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 md:gap-3 pb-10">
            {filteredItems.map((item) => (
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
            ))}
          </div>

        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-md bg-muted/30 m-2">
            <Ghost className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm font-medium opacity-50">Nenhum encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};