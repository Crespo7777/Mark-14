import { useEffect, useState } from "react";
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator 
} from "@/components/ui/command";
import { 
  User, 
  Search,
  ScrollText,
  Book,
  ShoppingBag,
  FileText,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DialogTitle, DialogDescription } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// Tipo expandido
export type SearchEntityType = 'character' | 'npc' | 'journal' | 'rule' | 'item' | 'shop';

// NOVO EVENTO: Navegação em vez de abrir Sheet
export const triggerNavigation = (type: SearchEntityType, id: string) => {
  const event = new CustomEvent('navigate-to-content', { 
    detail: { type, id } 
  });
  document.dispatchEvent(event);
};

interface GlobalSearchDialogProps {
  tableId: string;
}

export function GlobalSearchDialog({ tableId }: GlobalSearchDialogProps) {
  const [open, setOpen] = useState(false);

  const { data: searchResults, refetch, isLoading } = useQuery({
    queryKey: ['global-search-content', tableId],
    queryFn: async () => {
      // Filtro Híbrido: Itens da Mesa OU Itens do Sistema (null)
      const tableFilter = `table_id.eq.${tableId},table_id.is.null`;

      const [chars, npcs, journal, rules, items, shops] = await Promise.all([
        supabase.from('characters').select('id, name').eq('table_id', tableId).limit(10),
        supabase.from('npcs').select('id, name').eq('table_id', tableId).limit(10),
        supabase.from('journal_entries').select('id, title').or(tableFilter).limit(10),
        supabase.from('rules').select('id, title').or(tableFilter).limit(10),
        supabase.from('items').select('id, name').or(tableFilter).limit(15),
        supabase.from('shops').select('id, name').eq('table_id', tableId).limit(5)
      ]);
      
      return {
        characters: chars.data || [],
        npcs: npcs.data || [],
        journal: journal.data || [],
        rules: rules.data || [],
        items: items.data || [],
        shops: shops.data || []
      };
    },
    enabled: open && !!tableId,
    staleTime: 1000 * 30, 
    refetchOnMount: true
  });

  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (type: SearchEntityType, id: string) => {
    setOpen(false);
    triggerNavigation(type, id);
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-full"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Pesquisar...</span>
        <span className="inline-flex lg:hidden">Buscar...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <VisuallyHidden>
            <DialogTitle>Pesquisa Global</DialogTitle>
            <DialogDescription>Navegue pelo conteúdo da mesa.</DialogDescription>
        </VisuallyHidden>

        <CommandInput placeholder={isLoading ? "Carregando..." : "Ir para..."} />
        
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          
          {/* GRUPOS DE RESULTADOS */}
          
          {searchResults?.characters?.length ? (
            <CommandGroup heading="Personagens">
              {searchResults.characters.map((char) => (
                <CommandItem key={char.id} onSelect={() => handleSelect('character', char.id)}>
                  <User className="mr-2 h-4 w-4 text-blue-400" /> <span>{char.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {searchResults?.npcs?.length ? (
            <CommandGroup heading="NPCs">
              {searchResults.npcs.map((npc) => (
                <CommandItem key={npc.id} onSelect={() => handleSelect('npc', npc.id)}>
                  <ScrollText className="mr-2 h-4 w-4 text-orange-400" /> <span>{npc.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

           {searchResults?.shops?.length ? (
            <CommandGroup heading="Lojas">
              {searchResults.shops.map((shop) => (
                <CommandItem key={shop.id} onSelect={() => handleSelect('shop', shop.id)}>
                  <Store className="mr-2 h-4 w-4 text-amber-500" /> <span>{shop.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {searchResults?.items?.length ? (
            <CommandGroup heading="Itens">
              {searchResults.items.map((item) => (
                <CommandItem key={item.id} onSelect={() => handleSelect('item', item.id)}>
                  <ShoppingBag className="mr-2 h-4 w-4 text-green-400" /> <span>{item.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          <CommandSeparator />

          {searchResults?.rules?.length ? (
            <CommandGroup heading="Regras">
              {searchResults.rules.map((rule) => (
                <CommandItem key={rule.id} onSelect={() => handleSelect('rule', rule.id)}>
                  <Book className="mr-2 h-4 w-4 text-purple-400" /> <span>{rule.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {searchResults?.journal?.length ? (
            <CommandGroup heading="Diário">
              {searchResults.journal.map((entry) => (
                <CommandItem key={entry.id} onSelect={() => handleSelect('journal', entry.id)}>
                  <FileText className="mr-2 h-4 w-4 text-yellow-400" /> <span>{entry.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          
        </CommandList>
      </CommandDialog>
    </>
  );
}