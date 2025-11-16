// src/components/DiscordSettingsDialog.tsx

import { useState, useEffect, Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bot, Link, Trash2 } from "lucide-react";
import { useTableContext } from "@/features/table/TableContext";
import { Skeleton } from "@/components/ui/skeleton";

export const DiscordSettingsDialog = () => {
  const { tableId } = useTableContext();
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [initialUrl, setInitialUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      // O Mestre tem permissão de RLS para ler esta coluna
      supabase
        .from("tables")
        .select("discord_webhook_url")
        .eq("id", tableId)
        .single()
        .then(({ data, error }) => {
          if (data) {
            const url = data.discord_webhook_url || "";
            setWebhookUrl(url);
            setInitialUrl(url);
          }
          if (error) {
            // Isso pode falhar se a RLS/CLS não estiver correta
            console.error("Erro ao buscar Webhook:", error);
            toast({
              title: "Erro ao buscar Webhook",
              description: "Você tem permissão para ver esta configuração? " + error.message,
              variant: "destructive",
            });
          }
          setLoading(false);
        });
    }
  }, [open, tableId, toast]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("tables")
      .update({ discord_webhook_url: webhookUrl.trim() || null })
      .eq("id", tableId);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Webhook salvo!" });
      setInitialUrl(webhookUrl.trim() || "");
      setOpen(false);
    }
    setLoading(false);
  };

  const handleRemove = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("tables")
      .update({ discord_webhook_url: null })
      .eq("id", tableId);
      
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Webhook removido" });
      setWebhookUrl("");
      setInitialUrl("");
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bot className="w-4 h-4 mr-2" />
          Integração Discord
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Integração com Discord</DialogTitle>
          <DialogDescription>
            Envie rolagens de dados automaticamente para um canal do Discord
            usando um Webhook.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
              <p className="font-semibold text-foreground mb-2">Como configurar:</p>
              1. No seu servidor Discord, vá em: Config. do Servidor {">"} Integrações {">"} Webhooks.
              <br />
              2. Crie um "Novo Webhook".
              <br />
              3. Escolha o canal e copie o "URL do Webhook".
              <br />
              4. Cole o URL abaixo.
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL do Webhook</Label>
              <Input
                id="webhook-url"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        )}
        
        <DialogFooter className="justify-between sm:justify-between">
          {initialUrl ? (
             <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={loading}
             >
              <Trash2 className="w-4 h-4 mr-2" />
              Remover
            </Button>
          ) : (
            <div /> // Espaçador
          )}
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={loading}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={loading}>
              <Link className="w-4 h-4 mr-2" />
              Salvar Conexão
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};