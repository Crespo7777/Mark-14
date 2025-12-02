import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ImagePlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ItemIconUploaderProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export const ItemIconUploader = ({ currentUrl, onUpload, onRemove, disabled }: ItemIconUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validação simples (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "Máximo 2MB.", variant: "destructive" });
        return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `items/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('campaign-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-images')
        .getPublicUrl(fileName);

      onUpload(publicUrl);
      toast({ title: "Ícone atualizado!" });

    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
            disabled={disabled}
        />
        
        <div className="relative group">
            <Avatar className="h-20 w-20 rounded-md border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary transition-colors">
                <AvatarImage src={currentUrl || ""} className="object-cover" />
                <AvatarFallback className="bg-muted/50 rounded-md" onClick={() => !disabled && fileInputRef.current?.click()}>
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <ImagePlus className="w-6 h-6 text-muted-foreground" />}
                </AvatarFallback>
            </Avatar>

            {/* Botão de Remover (X) se existir imagem */}
            {currentUrl && !disabled && (
                <div 
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-md cursor-pointer hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <X className="w-3 h-3" />
                </div>
            )}
            
            {/* Overlay para clicar e trocar imagem existente */}
            {currentUrl && !disabled && (
                <div 
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <ImagePlus className="w-6 h-6 text-white" />
                </div>
            )}
        </div>
        <span className="text-[10px] text-muted-foreground">Ícone (Max 2MB)</span>
    </div>
  );
};