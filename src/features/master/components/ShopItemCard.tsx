// src/features/master/components/ShopItemCard.tsx

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Send, Infinity as InfinityIcon, Image as ImageIcon } from "lucide-react";
import { formatPrice } from "@/lib/economy-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { CharacterWithRelations, ShopItem } from "@/types/app-types";
import { PackagePlus } from "lucide-react";

interface ExtendedShopItem extends ShopItem {
  data?: any;
  icon_url?: string | null;
}

interface ShopItemCardProps {
    item: ExtendedShopItem;
    characters: CharacterWithRelations[];
    onDelete: (id: string) => void;
    onSendLoot: (item: ExtendedShopItem, charId: string) => void;
}

export const ShopItemCard = ({ item, characters, onDelete, onSendLoot }: ShopItemCardProps) => {
    const isInfinite = item.quantity === -1;
    const cleanDescription = item.description?.replace(/<[^>]*>?/gm, '') || "";

    return (
        <div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/10 text-sm bg-card mb-2 shadow-sm">
            {/* ÍCONE REAL */}
            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0 border border-border/50 overflow-hidden mr-3">
                {item.icon_url ? (
                    <img src={item.icon_url} className="w-full h-full object-cover" />
                ) : (
                    <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="font-bold flex items-center gap-2 flex-wrap">
                    {item.name}
                    {item.data?.category === 'service' && <Badge variant="outline" className="text-[9px] h-4 px-1 border-primary/30 text-primary">Serviço</Badge>}
                    
                    {!isInfinite ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${item.quantity === 0 ? "bg-red-500/20 text-red-500 border-red-500/30" : "bg-muted text-muted-foreground"}`}>
                            Estoque: {item.quantity}
                        </span>
                    ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border font-mono bg-muted text-accent border-accent/20">
                            <InfinityIcon className="w-3 h-3 inline mr-1"/>Infinito
                        </span>
                    )}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{cleanDescription}</div>
            </div>

            <div className="flex items-center gap-3 text-right pl-2">
                <div className="hidden sm:block">
                    <div className="font-bold text-accent flex items-center justify-end gap-1">
                        {formatPrice(item.price)}
                    </div>
                    {item.weight > 0 && <div className="text-[10px] text-muted-foreground">{item.weight} peso</div>}
                </div>

                <div className="flex gap-1">
                    {/* Botão Enviar Loot */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8" title="Enviar para Jogador">
                                <Send className="w-3 h-3" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Enviar {item.name}</DialogTitle>
                                <DialogDescription>Escolha quem recebe este item gratuitamente.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-2 py-4">
                                {characters.length === 0 && <p className="text-center text-muted-foreground">Sem jogadores na mesa.</p>}
                                {characters.map(char => (
                                    <Button key={char.id} variant="ghost" className="justify-start border" onClick={() => onSendLoot(item, char.id)}>
                                        <PackagePlus className="w-4 h-4 mr-2 text-primary" />
                                        {char.name}
                                    </Button>
                                ))}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};