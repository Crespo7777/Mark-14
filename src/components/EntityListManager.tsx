// src/components/EntityListManager.tsx

import { useState, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Search, Folder } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FolderType } from "@/types/app-types"; // Certifica-te que criaste este ficheiro na Fase 1

interface EntityListManagerProps<T> {
  items: T[];
  folders: FolderType[];
  
  // Funções de filtro
  onSearch: (query: string) => void;
  searchTerm: string;
  
  // Controlo de Arquivos
  showArchived: boolean;
  onToggleArchived: (show: boolean) => void;

  // Renderizadores
  renderItem: (item: T) => ReactNode;
  renderFolderActions?: (folderId: string) => ReactNode; // Opcional: para futuros menus de pasta
  
  // Slots para botões extras na barra de topo
  actions?: ReactNode;

  // Propriedades para filtrar os itens (nomes das chaves)
  folderIdKey?: keyof T;
  
  // Texto para quando não há itens
  emptyMessage?: string;
}

export function EntityListManager<T extends { id: string }>({
  items,
  folders,
  onSearch,
  searchTerm,
  showArchived,
  onToggleArchived,
  renderItem,
  actions,
  folderIdKey = "folder_id" as keyof T,
  emptyMessage = "Nenhum item encontrado.",
}: EntityListManagerProps<T>) {
  
  // Agrupamento de itens por pasta
  const itemsInFolders = folders.map((f) => ({
    ...f,
    items: items.filter((item: any) => item[folderIdKey] === f.id),
  }));

  const itemsNoFolder = items.filter((item: any) => !item[folderIdKey]);

  return (
    <div className="space-y-6">
      {/* Barra de Ferramentas Unificada */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-end gap-4 bg-muted/30 p-4 rounded-lg border">
          <div className="flex flex-1 items-center gap-2 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-archived"
                checked={showArchived}
                onCheckedChange={onToggleArchived}
              />
              <Label htmlFor="show-archived" className="text-sm cursor-pointer">
                Arquivados
              </Label>
            </div>
            {/* Botões de Ação (Nova Ficha, Pastas, etc.) */}
            {actions}
          </div>
        </div>

        {/* Lista de Conteúdo */}
        <div className="space-y-6">
          {itemsInFolders.length > 0 && (
            <Accordion type="multiple" className="w-full space-y-2">
              {itemsInFolders.map((folder) => (
                <div key={folder.id}>
                  {/* Só mostra a pasta se tiver itens OU se não estivermos a filtrar (opcional) */}
                  <AccordionItem
                    value={folder.id}
                    className="border rounded-lg bg-card px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{folder.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          ({folder.items.length})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {folder.items.map((item) => (
                          <div key={item.id}>{renderItem(item)}</div>
                        ))}
                        {folder.items.length === 0 && (
                           <p className="col-span-full text-muted-foreground text-sm italic py-2">Pasta vazia.</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </div>
              ))}
            </Accordion>
          )}

          {itemsNoFolder.length > 0 && (
            <div>
              {folders.length > 0 && (
                <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Outros
                </h4>
              )}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {itemsNoFolder.map((item) => (
                  <div key={item.id}>{renderItem(item)}</div>
                ))}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <p className="text-muted-foreground text-center py-12 border rounded-lg border-dashed">
              {emptyMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}