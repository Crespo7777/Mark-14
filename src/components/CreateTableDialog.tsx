import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // <--- NOVO
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Lock, Loader2, X, BookOpen } from "lucide-react";

interface CreateTableDialogProps {
  children: React.ReactNode;
  onTableCreated: () => void;
}

export const CreateTableDialog = ({ children, onTableCreated }: CreateTableDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [systemType, setSystemType] = useState<string>("symbaroum"); // <--- NOVO STATE
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const clearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Erro", description: "O nome da mesa é obrigatório", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");

      let finalImageUrl = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('campaign-images')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('campaign-images')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrl;
      }

      const { error } = await supabase.from("tables").insert({
        name: name.trim(),
        description: description.trim() || null,
        master_id: user.id,
        password: password || null,
        image_url: finalImageUrl,
        system_type: systemType // <--- ENVIANDO O SISTEMA ESCOLHIDO
      });

      if (error) throw error;

      toast({ title: "Mesa criada!", description: `Aventura de ${systemType === 'symbaroum' ? 'Symbaroum' : 'Pathfinder'} iniciada.` });
      
      setName("");
      setDescription("");
      setPassword("");
      clearImage();
      setSystemType("symbaroum");
      setOpen(false);
      onTableCreated();

    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Mesa</DialogTitle>
          <DialogDescription>Configure sua nova aventura.</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          
          {/* --- SELETOR DE SISTEMA (NOVO) --- */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><BookOpen className="w-4 h-4"/> Sistema de Regras</Label>
            <Select value={systemType} onValueChange={setSystemType}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="symbaroum">Symbaroum (Core)</SelectItem>
                    <SelectItem value="pathfinder">Pathfinder (Experimental)</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="table-name">Nome da Mesa</Label>
            <Input
              id="table-name"
              placeholder="Ex: A Floresta de Davokar"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          {/* ... Upload de Imagem e Descrição (Mantido igual) ... */}
          <div className="flex flex-col gap-2">
            <Label>Capa da Aventura</Label>
            {!previewUrl ? (
               <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-secondary/5 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all h-24 group">
                  <Upload className="w-6 h-6 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                  <span className="text-xs text-muted-foreground">Clique para enviar capa</span>
               </div>
            ) : (
               <div className="relative rounded-lg overflow-hidden h-32 border group">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); clearImage(); }}>
                    <X className="w-4 h-4" />
                  </Button>
               </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="table-description">Descrição</Label>
            <Textarea id="table-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="grid gap-4 border rounded-lg p-3 bg-secondary/10">
            <div className="space-y-1">
                <Label className="text-sm flex items-center gap-2"><Lock className="w-3 h-3" /> Senha (Opcional)</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background h-8 text-sm" />
            </div>
          </div>

          <Button onClick={handleCreate} disabled={loading} className="w-full mt-2">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</> : "Criar Mesa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};