import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Lock, Loader2, Save, X } from "lucide-react";
import { Table } from "@/types/app-types";

interface EditTableDialogProps {
  table: Table | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTableUpdated: () => void;
}

export const EditTableDialog = ({ table, open, onOpenChange, onTableUpdated }: EditTableDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (table) {
      setName(table.name);
      setDescription(table.description || "");
      setPassword(table.password || "");
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
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}_updated.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from('campaign-images')
              .upload(fileName, selectedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('campaign-images')
              .getPublicUrl(fileName);

            finalImageUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from("tables")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          password: password || null,
          image_url: finalImageUrl
        })
        .eq("id", table.id);

      if (error) throw error;

      toast({ title: "Mesa Atualizada!", description: "As alterações foram salvas." });
      onOpenChange(false);
      onTableUpdated();

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
          <DialogDescription>Altere as configurações e o visual.</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
           <div className="flex flex-col gap-2">
            <Label>Capa da Aventura</Label>
            
            {(previewUrl || currentImageUrl) ? (
                <div className="relative rounded-lg overflow-hidden h-32 border group bg-secondary/10">
                    <img 
                       src={previewUrl || currentImageUrl || ""} 
                       alt="Preview" 
                       className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                        <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                            title="Remover Imagem"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                     <div className="absolute bottom-2 right-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-4 h-4 mr-2" /> Trocar Imagem
                        </Button>
                     </div>
                </div>
            ) : (
                <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-secondary/5 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all h-32"
               >
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Adicionar Capa</span>
               </div>
            )}

            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome da Mesa</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="grid gap-4 border rounded-lg p-3 bg-secondary/10">
            <div className="space-y-1">
                <Label className="text-sm flex items-center gap-2">
                    <Lock className="w-3 h-3" /> Senha de Acesso
                </Label>
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Deixe vazio para remover a senha"
                    className="bg-background h-8 text-sm"
                />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="mr-2 h-4 w-4" /> Salvar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};