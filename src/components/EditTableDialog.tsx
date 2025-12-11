// src/components/EditTableDialog.tsx

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Lock, Loader2, Save, X, Image as ImageIcon } from "lucide-react";
import { Table } from "@/types/app-types";
import { useQueryClient } from "@tanstack/react-query";

interface EditTableDialogProps {
  table: Table | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTableUpdated: () => void;
}

export const EditTableDialog = ({ table, open, onOpenChange, onTableUpdated }: EditTableDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (table && open) {
      setName(table.name);
      setDescription(table.description || "");
      setPassword(""); 
      setCurrentImageUrl(table.image_url || null);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [table, open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Erro", description: "A imagem deve ter no máximo 5MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleRemoveImage = () => {
      setSelectedFile(null);
      setPreviewUrl(null);
      setCurrentImageUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpdate = async () => {
    if (!table) return;
    if (!name.trim()) {
      toast({ title: "Erro", description: "O nome da mesa é obrigatório", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = currentImageUrl;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `covers/${table.id}-${Date.now()}.${fileExt}`;

        // BUCKET DE CAPAS (Original)
        const { error: uploadError } = await supabase.storage
          .from('campaign-images')
          .upload(fileName, selectedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('campaign-images')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrl;
      }

      const updates: any = {
        name: name.trim(),
        description: description.trim() || null,
        image_url: finalImageUrl // Atualiza a CAPA
      };

      if (password.trim()) {
          updates.password = password;
      }

      const { error } = await supabase
        .from("tables")
        .update(updates)
        .eq("id", table.id);

      if (error) throw error;

      toast({ title: "Mesa Atualizada!", description: "As alterações foram salvas." });
      
      // Força a atualização da lista de mesas
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      
      onTableUpdated();
      onOpenChange(false);

    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!table) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Mesa: {table.name}</DialogTitle>
          <DialogDescription>Altere as configurações da campanha.</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
           <div className="flex flex-col gap-2">
            <Label>Capa da Aventura</Label>
            
            {(previewUrl || currentImageUrl) ? (
                <div className="relative rounded-lg overflow-hidden h-40 border group bg-secondary/10">
                    <img src={previewUrl || currentImageUrl || ""} alt="Capa" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-4 h-4 mr-2" /> Trocar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleRemoveImage}>
                            <X className="w-4 h-4 mr-2" /> Remover
                        </Button>
                    </div>
                </div>
            ) : (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-secondary/5 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all h-32">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground font-medium">Carregar Imagem de Capa</span>
                  <span className="text-[10px] text-muted-foreground/60">Máx 5MB</span>
               </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
          </div>

          <div className="space-y-2"><Label htmlFor="edit-name">Nome da Mesa</Label><Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="edit-description">Descrição</Label><Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
          <div className="grid gap-2 p-3 bg-secondary/10 rounded-md border border-secondary/20">
            <Label className="text-sm flex items-center gap-2 text-yellow-500"><Lock className="w-3 h-3" /> Senha de Acesso (Opcional)</Label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite para definir uma nova senha" className="bg-background h-9 text-sm" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleUpdate} disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="mr-2 h-4 w-4" /> Salvar Alterações</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};