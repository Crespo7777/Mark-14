import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Lock, Globe, Image as ImageIcon, Sword, Shield, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatabaseItemCardProps {
    item: any;
    onEdit: (item: any) => void;
    onDuplicate: (item: any) => void;
    onDelete: (id: string) => void;
}

export const DatabaseItemCard = memo(({ item, onEdit, onDuplicate, onDelete }: DatabaseItemCardProps) => {
    const isGlobal = !item.table_id;
    const data = item.data || {};
    
    // --- CORREÇÃO: Ler weight e icon_url de data ---
    const weight = data.weight || 0;
    const iconUrl = data.icon_url || null;

    const typeConfig: Record<string, { color: string, icon: any }> = {
        weapon: { color: "text-orange-500 bg-orange-500/10 border-orange-500/20", icon: Sword },
        armor: { color: "text-blue-500 bg-blue-500/10 border-blue-500/20", icon: Shield },
        ability: { color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", icon: Zap },
        trait: { color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: Star },
        default: { color: "text-muted-foreground bg-muted border-border", icon: ImageIcon }
    };

    const config = typeConfig[item.type] || typeConfig.default;
    const TypeIcon = config.icon;

    return (
        <div 
            className="group relative flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-accent/40 transition-all cursor-pointer hover:shadow-sm overflow-hidden"
            onClick={() => onEdit(item)}
        >
            {isGlobal && (
                <div className="absolute top-0 right-0 p-1.5 bg-blue-500/10 text-blue-600 rounded-bl-lg z-10">
                    <Globe className="w-3 h-3" />
                </div>
            )}

            <div className={cn("w-12 h-12 rounded-md flex items-center justify-center shrink-0 border overflow-hidden", config.color)}>
                {iconUrl ? (
                    <img src={iconUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <TypeIcon className="w-6 h-6 opacity-70" />
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2 pr-6">
                    <span className="font-bold text-sm truncate leading-none">{item.name}</span>
                    {data.subcategory && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 font-normal text-muted-foreground bg-background/50">
                            {data.subcategory}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground h-4">
                    {data.damage && <span className="font-mono text-orange-600 font-bold">{data.damage}</span>}
                    {data.protection && <span className="font-mono text-blue-600 font-bold">Prot: {data.protection}</span>}
                    {data.level && <Badge variant="secondary" className="text-[9px] h-4 px-1">{data.level}</Badge>}
                    {data.type && item.type === 'trait' && <Badge variant="outline" className="text-[9px] h-4 px-1">{data.type}</Badge>}
                    
                    {weight > 0 && (
                        <>
                            <span className="w-px h-3 bg-border mx-1" />
                            <span>{weight} kg</span>
                        </>
                    )}
                </div>
                
                <p className="text-[10px] text-muted-foreground/70 line-clamp-1 mt-0.5">
                    {item.description?.replace(/<[^>]*>?/gm, '') || "Sem descrição."}
                </p>
            </div>

            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={(e) => { e.stopPropagation(); onDuplicate(item); }} title="Duplicar">
                    <Copy className="w-3.5 h-3.5" />
                </Button>
                
                {!isGlobal ? (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} title="Apagar">
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                ) : (
                    <div className="h-7 w-7 flex items-center justify-center text-muted-foreground/30"><Lock className="w-3.5 h-3.5" /></div>
                )}
            </div>
        </div>
    );
});
DatabaseItemCard.displayName = "DatabaseItemCard";