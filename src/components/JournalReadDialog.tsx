// src/components/JournalReadDialog.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { JournalRenderer } from "./JournalRenderer";
import { JournalEntryWithRelations } from "@/types/app-types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface JournalReadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: JournalEntryWithRelations | null;
}

export const JournalReadDialog = ({ open, onOpenChange, entry }: JournalReadDialogProps) => {
  if (!entry) return null;

  let authorName = "Mestre";
  if (entry.player) authorName = entry.player.display_name;
  else if (entry.character) authorName = entry.character.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
             <DialogTitle className="text-2xl">{entry.title}</DialogTitle>
             {entry.is_shared && <Badge variant="secondary">Público</Badge>}
          </div>
          <DialogDescription className="flex gap-2 text-xs">
            <span>Por: {authorName}</span>
            <span>•</span>
            <span>{format(new Date(entry.created_at), "Pc", { locale: ptBR })}</span>
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 mt-4">
            <div className="pb-8">
                <JournalRenderer content={entry.content} />
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};