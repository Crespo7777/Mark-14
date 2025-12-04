import { useState, useRef } from "react";
import { useCardSystem } from "./useCardSystem";
import { PlayingCard } from "./PlayingCard";
import { OpponentZone } from "./OpponentZone";
import { DeckHolder } from "./DeckHolder"; 
import { CounterWidget } from "./CounterWidget"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X, Upload, Loader2, Image as ImageIcon, Hand, Users, LayoutTemplate, Layers, Search, Calculator, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CardTablePanel({ roomId }: { roomId: string }) {
  const system = useCardSystem(roomId);
  
  // Dados Seguros
  const handCards = system?.handCards || [];
  const tableCards = system?.tableCards || [];
  const opponents = system?.opponents || [];
  const counters = system?.counters || [];
  
  // Layout
  const DECK_X = 50; 
  const DECK_Y = 50;
  const DISCARD_X = 50;
  const DISCARD_Y = 250;
  const CENTER_OFFSET = 16;
  const SPAWN_X = DECK_X + CENTER_OFFSET;
  const SPAWN_Y = DECK_Y + CENTER_OFFSET;

  const [deckUrl, setDeckUrl] = useState("https://placehold.co/240x336/png?text=Monstro");
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [hoveredCardImg, setHoveredCardImg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handZoneRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cards/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error } = await supabase.storage.from('campaign-media').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('campaign-media').getPublicUrl(fileName);
      setDeckUrl(data.publicUrl);
      toast.success("Imagem pronta!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCardMove = (id: string, x: number, y: number) => {
    if (!system?.updateCardPosition || !tableRef.current) return;

    const tableRect = tableRef.current.getBoundingClientRect();
    const relativeX = x - tableRect.left;
    const relativeY = y - tableRect.top;
    
    const HAND_HEIGHT = 240; 
    const isInHand = y > (window.innerHeight - HAND_HEIGHT); 
    
    const distToDeck = Math.sqrt(Math.pow(relativeX - DECK_X, 2) + Math.pow(relativeY - DECK_Y, 2));
    const isInDeck = distToDeck < 80;

    const distToDiscard = Math.sqrt(Math.pow(relativeX - DISCARD_X, 2) + Math.pow(relativeY - DISCARD_Y, 2));
    const isInDiscard = distToDiscard < 80;

    if (isInHand) {
        system.updateCardPosition(id, 0, 0, 'hand');
    } else if (isInDeck) {
        system.updateCardPosition(id, SPAWN_X, SPAWN_Y, 'table'); 
    } else if (isInDiscard) {
        system.updateCardPosition(id, DISCARD_X + CENTER_OFFSET, DISCARD_Y + CENTER_OFFSET, 'table');
    } else {
        system.updateCardPosition(id, relativeX, relativeY, 'table');
    }
  };

  if (!isOpen) return null;
  
  // State Loading Screen
  if (system.isLoading) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white">
            <Loader2 className="w-8 h-8 animate-spin mr-3 text-indigo-500" />
            <span className="font-serif text-lg">A preparar a mesa...</span>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 pointer-events-auto font-sans select-none">
        
        {/* HEADER */}
        <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-4 shadow-xl shrink-0 z-40 relative">
           <div className="flex items-center gap-2 text-white/80">
              <LayoutTemplate className="w-5 h-5" />
              <span className="font-bold hidden md:block">Mesa</span>
           </div>
           <div className="h-6 w-px bg-white/10 mx-2" />

           <div className="flex-1 flex gap-2 items-center">
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
             <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 items-center">
                <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="h-8 w-8 text-slate-400 hover:text-white">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
                <div className="w-px bg-white/10 mx-1 h-4" />
                <Input value={deckUrl} onChange={(e) => setDeckUrl(e.target.value)} placeholder="URL..." className="h-8 w-32 border-none bg-transparent text-xs focus-visible:ring-0 text-white" />
             </div>
             <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white h-8" onClick={() => system.spawnDeck(deckUrl, SPAWN_X, SPAWN_Y, 1)}>
               <Plus className="w-3 h-3 mr-1" /> Carta
             </Button>
             
             {/* Novo Contador */}
             <Button size="sm" variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300 h-8" onClick={() => system.addCounter("Token", 400, 100)}>
               <Calculator className="w-3 h-3 mr-1" /> Token
             </Button>
           </div>

           <div className="flex items-center gap-2">
             <Button size="sm" variant="ghost" onClick={() => system.gatherAllToDeck(SPAWN_X, SPAWN_Y)} className="text-slate-400 hover:text-amber-400" title="Recolher Tudo">
               <Layers className="w-4 h-4" />
             </Button>
             <Button size="sm" variant="ghost" onClick={() => system.clearTable()} className="text-slate-400 hover:text-red-500" title="Limpar">
               <Trash2 className="w-4 h-4" />
             </Button>
             <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
               <X className="w-5 h-5"/>
             </Button>
           </div>
        </div>

        {/* INSPECTOR */}
        {hoveredCardImg && (
            <div className="absolute top-16 right-4 w-64 h-80 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                <div className="w-full h-full rounded-xl border-4 border-amber-500/50 shadow-2xl bg-black overflow-hidden relative">
                    <img src={hoveredCardImg} className="w-full h-full object-contain bg-slate-900" alt="Zoom" />
                </div>
            </div>
        )}

        {/* OPONENTES */}
        <div className="absolute top-16 left-0 right-0 z-30 flex justify-center gap-6 px-4 pointer-events-none">
            {opponents.map(player => (
                <div key={player.id} className="pointer-events-auto transform transition-transform hover:scale-105">
                    <OpponentZone name={player.name} avatarUrl={player.avatarUrl} cards={player.cards} />
                </div>
            ))}
        </div>

        {/* MESA (PLAY AREA) */}
        <div ref={tableRef} className="flex-1 relative overflow-hidden bg-[#24303c] perspective-1000 shadow-inner">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
          
          <DeckHolder 
            x={DECK_X} y={DECK_Y} 
            label="Baralho"
            onShuffle={() => system.shuffleStack(SPAWN_X, SPAWN_Y)}
            onGather={() => system.gatherAllToDeck(SPAWN_X, SPAWN_Y)}
            onDeal={(n) => system.dealCards(SPAWN_X, SPAWN_Y, n)}
          />

          <div 
            className="absolute w-32 h-44 border-2 border-dashed border-white/5 rounded-xl bg-black/10 flex items-center justify-center pointer-events-none"
            style={{ left: DISCARD_X, top: DISCARD_Y }}
          >
             <Ban className="w-8 h-8 text-white/10" />
             <span className="absolute bottom-2 text-[10px] uppercase text-white/20 font-bold">Descarte</span>
          </div>

          {counters.map((c, i) => (
              <CounterWidget 
                key={i}
                label={c.label}
                value={c.value}
                x={c.x}
                y={c.y}
                onChange={(delta) => system.updateCounter(c.id, delta)}
                onDelete={() => system.deleteCounter(c.id)}
              />
          ))}

          {tableCards.map((card) => (
            <PlayingCard 
              key={card.id} 
              card={card} 
              onMove={handleCardMove}
              onFlip={(c) => system.flipCard(c)}
              onRotate={(c) => system.rotateCard(c)}
              onHover={setHoveredCardImg}
            />
          ))}
        </div>

        {/* MÃO */}
        <div ref={handZoneRef} className="h-60 bg-gradient-to-t from-slate-950 via-slate-900/95 to-slate-900/0 relative z-20 flex flex-col justify-end pb-4 group">
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-30 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full border border-white/10">Sua Mão</span>
            </div>
            <div className="w-full h-48 relative flex items-center justify-center px-10 gap-[-20px] overflow-x-auto overflow-y-visible py-4">
                {handCards.map((card) => (
                    <PlayingCard 
                        key={card.id} 
                        card={card} 
                        onMove={handleCardMove}
                        onFlip={(c) => system.flipCard(c)}
                        onRotate={(c) => system.rotateCard(c)}
                        onHover={setHoveredCardImg}
                    />
                ))}
            </div>
        </div>
    </div>
  );
}