import { useState, useRef } from "react";
import { useCardSystem } from "./useCardSystem";
import { PlayingCard } from "./PlayingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CardTablePanel({ roomId }: { roomId: string }) {
  const { cards, moveCard, flipCard, spawnDeck, clearTable } = useCardSystem(roomId);
  
  // URL da imagem (pode ser link externo ou do upload)
  const [deckUrl, setDeckUrl] = useState("https://placehold.co/240x336/png?text=Monstro");
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  
  // Referência para o input de arquivo invisível
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função que faz o Upload para o Supabase
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Cria um nome único para o arquivo (evita substituir outros)
      const fileExt = file.name.split('.').pop();
      const fileName = `cards/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // 2. Sobe para o bucket 'campaign-media'
      const { error: uploadError } = await supabase.storage
        .from('campaign-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 3. Pega o link público
      const { data: publicUrlData } = supabase.storage
        .from('campaign-media')
        .getPublicUrl(fileName);

      // 4. Coloca o link no campo de texto automaticamente
      setDeckUrl(publicUrlData.publicUrl);
      toast.success("Imagem carregada! Clica em 'Add' para criar a carta.");

    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao fazer upload: " + error.message);
    } finally {
      setIsUploading(false);
      // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Mesa semi-transparente */}
      <div className="w-[90vw] h-[85vh] bg-slate-950/95 backdrop-blur-md rounded-xl border border-white/10 relative overflow-hidden pointer-events-auto shadow-2xl flex flex-col">
        
        {/* Barra de Ferramentas Superior */}
        <div className="w-full bg-slate-900 p-3 border-b border-slate-800 flex flex-wrap items-center gap-4">
           <h2 className="text-white font-bold px-2 hidden md:block">Mesa de Cartas</h2>
           
           <div className="flex-1 flex gap-2 items-center min-w-[300px]">
             
             {/* Input Invisível de Arquivo */}
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
             />

             {/* Botão de Upload */}
             <Button 
                size="icon" 
                variant="secondary" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Carregar imagem do computador"
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
             >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
             </Button>

             {/* Campo de Texto (mostra a URL carregada) */}
             <div className="relative flex-1">
                <ImageIcon className="absolute left-2 top-2 w-4 h-4 text-slate-400" />
                <Input 
                    value={deckUrl}
                    onChange={(e) => setDeckUrl(e.target.value)}
                    placeholder="URL ou Upload..."
                    className="h-9 pl-8 bg-black/50 border-slate-700 text-white text-xs w-full"
                />
             </div>
             
             {/* Ações de Criar */}
             <Button size="sm" variant="outline" className="border-slate-600 hover:bg-slate-800 text-white" onClick={() => spawnDeck(deckUrl, 1)}>
               <Plus className="w-4 h-4 mr-2" /> 1
             </Button>
             
             <Button size="sm" variant="default" onClick={() => spawnDeck(deckUrl, 54)}>
               <Plus className="w-4 h-4 mr-2" /> Baralho
             </Button>

             <div className="w-px h-6 bg-slate-700 mx-2"/>

             <Button size="sm" variant="destructive" onClick={clearTable}>
               <Trash2 className="w-4 h-4 mr-2" /> Limpar
             </Button>
           </div>

           <Button variant="ghost" size="icon" className="text-white/50 hover:text-white" onClick={() => setIsOpen(false)}>
             <X className="w-5 h-5"/>
           </Button>
        </div>

        {/* Área de Jogo */}
        <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 overflow-hidden">
          {/* Fundo decorativo tipo feltro verde ou escuro */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>

          {cards.map((card) => (
            <PlayingCard 
              key={card.id} 
              card={card} 
              onMove={moveCard}
              onFlip={flipCard}
            />
          ))}
          
          {cards.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 pointer-events-none">
                <p className="text-lg font-medium">Mesa Vazia</p>
                <p className="text-sm">Faz upload de uma imagem e clica em "+ 1" para começar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}