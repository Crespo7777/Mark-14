// src/features/vtt/QuickCreateDialog.tsx

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTableContext } from "@/features/table/TableContext";
import { Plus, User, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const QuickCreateDialog = ({ children }: { children: React.ReactNode }) => {
    const { tableId } = useTableContext();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [activeTab, setActiveTab] = useState("npc");

    const handleCreate = async () => {
        if (!name) return;

        try {
            if (activeTab === 'npc') {
                const { error } = await supabase.from("npcs").insert({
                    table_id: tableId,
                    name: name,
                    data: {
                        attributes: { vigorous: { value: 10 }, quick: { value: 10 }, persuasive: { value: 10 } }, // Stats básicos
                        combat: { hp_current: 10, hp_max: 10 }
                    }
                });
                if (error) throw error;
                queryClient.invalidateQueries({ queryKey: ['npcs', tableId] });
            } else {
                // Criar Personagem (Simplificado)
                const { error } = await supabase.from("characters").insert({
                    table_id: tableId,
                    name: name,
                    data: { attributes: {}, combat: {} } // Vazio para preencher depois
                });
                if (error) throw error;
                queryClient.invalidateQueries({ queryKey: ['characters', tableId] });
            }

            toast({ title: `${activeTab === 'npc' ? 'NPC' : 'Personagem'} Criado!`, description: "Já aparece na lista de Tokens." });
            setName("");
            setOpen(false);
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-black/90 border-white/20 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle>Criação Rápida</DialogTitle>
                </DialogHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="npc"><Users className="w-4 h-4 mr-2"/> NPC / Monstro</TabsTrigger>
                        <TabsTrigger value="pc"><User className="w-4 h-4 mr-2"/> Personagem</TabsTrigger>
                    </TabsList>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                placeholder={activeTab === 'npc' ? "Ex: Goblin Arqueiro" : "Ex: Valeros"} 
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreate} disabled={!name}>Criar</Button>
                    </DialogFooter>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};