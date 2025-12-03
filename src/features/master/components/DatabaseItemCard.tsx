// src/features/master/components/DatabaseItemCard.tsx
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Lock, Globe, Image as ImageIcon } from "lucide-react";

interface DatabaseItemCardProps {
    item: any;
    onEdit: (item: any) => void;
    onDuplicate: (item: any) => void;
    onDelete: (id: string) => void;
}

export const DatabaseItemCard = memo(({ item, onEdit, onDuplicate, onDelete }: DatabaseItemCardProps) => {
    const isGlobal = !item.table_id;
    
    return (
        <div 
            className="flex gap-3 p-3 border rounded-md bg-card hover:bg-accent/50 group cursor-pointer transition-all items-start relative overflow-hidden shadow-sm" 
            onClick={() => onEdit(item)}
        >
            {isGlobal && (
                <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-500 p-1 rounded-bl-md z-10" title="Item do Sistema (Global)">
                    <Globe className="w-3 h-3" />
                </div>
            )}

            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0 border border-border/50 overflow-hidden">
                {item.icon_url ? (
                    <img src={item.icon_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="font-bold flex items-center gap-2 flex-wrap text-sm">
                    {item.name}
                    {item.data.subcategory && <span className="text-[10px] font-normal uppercase tracking-wider border px-1 rounded bg-primary/10 text-primary border-primary/20">{item.data.subcategory}</span>}
                    {item.data.reloadAction && <span className="text-[10px] font-normal uppercase tracking-wider border px-1 rounded bg-accent/10 text-accent border-accent/20">Recarga: {item.data.reloadAction}</span>}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {item.description?.replace(/<[^>]*>?/gm, '') || "Sem descrição."}
                </div>
            </div>

            <div className="flex items-center gap-2 self-center mr-2">
                {item.weight > 0 && (
                    <div className="text-xs text-muted-foreground border px-2 py-1 rounded bg-muted/30 whitespace-nowrap hidden sm:block">
                            {item.weight} peso
                    </div>
                )}
                
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="text-primary opacity-0 group-hover:opacity-100 transition-all h-8 w-8" onClick={(e) => { e.stopPropagation(); onDuplicate(item); }} title="Duplicar">
                        <Copy className="w-4 h-4" />
                    </Button>

                    {isGlobal ? (
                        <div className="p-2 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground/50 h-8 w-8 flex items-center justify-center">
                            <Lock className="w-4 h-4" />
                        </div>
                    ) : (
                        <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all h-8 w-8" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
});
DatabaseItemCard.displayName = "DatabaseItemCard";