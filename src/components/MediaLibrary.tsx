// src/components/MediaLibrary.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Trash2, Image as ImageIcon, Music, File, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MediaLibraryProps {
  onSelect: (url: string, type: 'image' | 'video' | 'audio') => void; // Url única ou separada por |
  trigger?: React.ReactNode;
  filter?: 'all' | 'image' | 'audio';
  multiSelect?: boolean; // NOVA PROP
}

interface MediaFile {
  name: string;
  id: string;
  metadata: { mimetype: string };
  updated_at: string;
}

const BUCKET_NAME = "campaign-media";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const MediaLibrary = ({ onSelect, trigger, filter = 'all', multiSelect = false }: MediaLibraryProps) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(filter === 'audio' ? 'audio' : 'image');
  
  // Estado para multisseleção
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchFiles();
      setSelectedFiles([]); // Limpa seleção ao abrir
    }
  }, [open]);

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list();
    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else {
      // Ordena por mais recente
      const sorted = (data as any[]).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setFiles(sorted);
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

    if (multiSelect) {
      // Lógica de toggle para multisseleção
      setSelectedFiles(prev => {
        if (prev.includes(url)) return prev.filter(u => u !== url);
        return [...prev, url];
      });
    } else {
      // Comportamento padrão (seleciona e fecha)
      onSelect(url, type);
      setOpen(false);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedFiles.length === 0) return;
    // Junta todos os URLs com um separador "|"
    const joinedUrls = selectedFiles.join("|");
    // O tipo assume-se pelo filtro atual ou pelo primeiro ficheiro (simplificação)
    onSelect(joinedUrls, activeTab === 'audio' ? 'audio' : 'image');
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
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Biblioteca de Média</DialogTitle>
          <DialogDescription>
            {multiSelect ? "Selecione um ou mais arquivos." : "Selecione um arquivo."}
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
             <ScrollArea className="h-[350px] p-4">
                {loading && <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div>}
                
                {!loading && filteredFiles.length === 0 && (
                  <div className="text-center text-muted-foreground p-8">Nenhum ficheiro encontrado.</div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                   {filteredFiles.map(file => {
                     const isImage = file.metadata?.mimetype?.startsWith('image');
                     const url = getPublicUrl(file.name);
                     const isSelected = selectedFiles.includes(url);
                     
                     return (
                       <div 
                         key={file.id} 
                         className={cn(
                           "group relative border rounded-lg overflow-hidden cursor-pointer transition-all bg-card",
                           isSelected ? "ring-2 ring-primary border-primary" : "hover:ring-2 hover:ring-muted-foreground/50"
                         )}
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
                             
                             {/* Indicador de Seleção */}
                             {isSelected && (
                               <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                                 <CheckCircle2 className="w-4 h-4" />
                               </div>
                             )}
                          </div>
                          <div className="p-2 text-xs truncate bg-card/90 border-t">
                            {file.name}
                          </div>
                          
                          {!multiSelect && (
                             <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => handleDelete(file.name, e)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                          )}
                       </div>
                     )
                   })}
                </div>
             </ScrollArea>
          </div>
        </Tabs>

        {multiSelect && (
          <DialogFooter className="mt-4">
             <div className="flex-1 flex items-center text-sm text-muted-foreground">
                {selectedFiles.length} arquivo(s) selecionado(s)
             </div>
             <Button onClick={handleConfirmSelection} disabled={selectedFiles.length === 0}>
               Confirmar Playlist
             </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};