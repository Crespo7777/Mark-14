// src/components/MediaLibrary.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"; // <-- Importar Description
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Trash2, Image as ImageIcon, Music, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaLibraryProps {
  onSelect: (url: string, type: 'image' | 'video' | 'audio') => void;
  trigger?: React.ReactNode;
  filter?: 'all' | 'image' | 'audio';
}

interface MediaFile {
  name: string;
  id: string;
  metadata: { mimetype: string };
  updated_at: string;
}

const BUCKET_NAME = "campaign-media";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const MediaLibrary = ({ onSelect, trigger, filter = 'all' }: MediaLibraryProps) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(filter === 'audio' ? 'audio' : 'image');

  useEffect(() => {
    if (open) fetchFiles();
  }, [open]);

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list();
    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else {
      setFiles(data as any[]);
    }
    setLoading(false);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    setUploading(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);

    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Upload concluído!" });
      fetchFiles();
    }
    setUploading(false);
  };

  const handleDelete = async (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);
    if (error) {
      toast({ title: "Erro ao apagar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ficheiro apagado" });
      fetchFiles();
    }
  };

  const getPublicUrl = (fileName: string) => {
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
  };

  const handleFileClick = (file: MediaFile) => {
    const url = getPublicUrl(file.name);
    const mime = file.metadata?.mimetype || "";
    
    let type: 'image' | 'video' | 'audio' = 'image';
    if (mime.startsWith('audio')) type = 'audio';
    else if (mime.startsWith('video')) type = 'video';
    
    onSelect(url, type);
    setOpen(false);
  };

  const filteredFiles = files.filter(f => {
    const mime = f.metadata?.mimetype || "";
    if (activeTab === 'image') return mime.startsWith('image') || mime.startsWith('video');
    if (activeTab === 'audio') return mime.startsWith('audio');
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Abrir Biblioteca</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Biblioteca de Média</DialogTitle>
          {/* --- CORREÇÃO: Descrição adicionada para acessibilidade --- */}
          <DialogDescription>
            Faça upload e selecione imagens ou sons para a sua campanha.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center gap-4 py-2">
           <div className="flex-1">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className={`flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-md p-2 hover:bg-accent/10 transition-colors ${uploading ? 'opacity-50' : ''}`}>
                   {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Upload className="w-4 h-4 mr-2" />}
                   <span className="text-sm">{uploading ? "A enviar..." : "Clique para fazer Upload"}</span>
                   <Input id="file-upload" type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                </div>
              </Label>
           </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image">Imagens & Vídeo</TabsTrigger>
            <TabsTrigger value="audio">Áudio & Música</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden mt-2 border rounded-md bg-muted/10">
             <ScrollArea className="h-[400px] p-4">
                {loading && <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div>}
                
                {!loading && filteredFiles.length === 0 && (
                  <div className="text-center text-muted-foreground p-8">Nenhum ficheiro encontrado.</div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                   {filteredFiles.map(file => {
                     const isImage = file.metadata?.mimetype?.startsWith('image');
                     const url = getPublicUrl(file.name);
                     
                     return (
                       <div 
                         key={file.id} 
                         className="group relative border rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all bg-card"
                         onClick={() => handleFileClick(file)}
                       >
                          <div className="aspect-square w-full flex items-center justify-center bg-black/20">
                             {isImage ? (
                               <img src={url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                             ) : (
                               <div className="flex flex-col items-center text-muted-foreground">
                                  {activeTab === 'audio' ? <Music className="w-8 h-8 mb-2"/> : <File className="w-8 h-8"/>}
                               </div>
                             )}
                          </div>
                          <div className="p-2 text-xs truncate bg-card/90 border-t">
                            {file.name}
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDelete(file.name, e)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                       </div>
                     )
                   })}
                </div>
             </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};