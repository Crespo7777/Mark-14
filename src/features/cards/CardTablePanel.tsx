import { useState, useRef } from "react";
import { useCardSystem } from "./useCardSystem";
import { PlayingCard } from "./PlayingCard";
import { OpponentZone } from "./OpponentZone";
import { DeckHolder } from "./DeckHolder"; 
import { CounterWidget } from "./CounterWidget"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, X, Upload, Loader2, Image as ImageIcon, Hand, Users, LayoutTemplate, Layers, Calculator, Ban, Shuffle, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CardTablePanel({ roomId }: { roomId: string }) {
  const system = useCardSystem(roomId);
  
  const handCards = system?.handCards || [];
  const tableCards = system?.tableCards || [];
  const opponents = system?.opponents || [];
  const counters = system?.counters || [];
  
  const DECK_X = 50; 
  const DECK_Y = 50;
  const DISCARD_X = 50;
  const DISCARD_Y = 250;
  const CENTER_OFFSET = 16;
  const SPAWN_X = DECK_X + CENTER_OFFSET;
  const SPAWN_Y = DECK_Y + CENTER_OFFSET;

  const [deckUrl, setDeckUrl] = useState("https://placehold.co/240x336/png?text=Monstro");
  const [dealCount, setDealCount] = useState("5");
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  
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
  if (system.isLoading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-2"/> A carregar mesa...
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 pointer-events-auto font-sans select-none">
        
        {/* HEADER */}
        <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-4 shadow-xl shrink-0 z-40 relative">
           <div className="flex items-center gap-2 text-white/80 hidden lg:flex">
              <LayoutTemplate className="w-5 h-5" />
              <span className="font-bold">Mesa</span>
           </div>
           
           <div className="h-6 w-px bg-white/10 mx-2 hidden lg:block" />

           {/* Toolbar - Upload */}
           <div className="flex gap-2 items-center">
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
             <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 items-center">
                <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="h-8 w-8 text-slate-400 hover:text-white">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
                <div className="w-px bg-white/10 mx-1 h-4" />
                <Input value={deckUrl} onChange={(e) => setDeckUrl(e.target.value)} placeholder="URL..." className="h-8 w-24 lg:w-32 border-none bg-transparent text-xs focus-visible:ring-0 text-white" />
             </div>
             <Button size="sm" variant="secondary" className="h-8 border border-white/10" onClick={() => system.spawnDeck(deckUrl, SPAWN_X, SPAWN_Y, 1)}>
               <Plus className="w-3 h-3 mr-1" /> Carta
             </Button>
           </div>

           <div className="h-6 w-px bg-white/10 mx-2" />

           {/* Toolbar - Ações */}
           <div className="flex gap-2 items-center flex-1">
             <Button size="sm" variant="secondary" className="h-8 bg-slate-800 border-slate-600 text-slate-300 hover:text-white" onClick={() => system.shuffleStack(SPAWN_X, SPAWN_Y)} title="Embaralhar Cartas no Deck">
                <Shuffle className="w-3 h-3 mr-1" /> Mix
             </Button>

             <Popover>
                <PopoverTrigger asChild>
                    <Button size="sm" variant="secondary" className="h-8 bg-amber-900/40 border-amber-700/50 text-amber-200 hover:bg-amber-900/60 hover:text-white">
                        <ArrowRightLeft className="w-3 h-3 mr-1" /> Dar
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-slate-900 border-slate-700 p-2 z-[60]">
                    <div className="flex gap-2 items-center">
                        <Input 
                            type="number" 
                            value={dealCount} 
                            onChange={(e) => setDealCount(e.target.value)} 
                            className="h-8 w-16 bg-black text-white border-slate-600"
                        />
                        <span className="text-xs text-slate-400">cartas cada</span>
                    </div>
                    <Button className="w-full mt-2 h-8 text-xs bg-indigo-600 hover:bg-indigo-500" onClick={() => system.dealCards(SPAWN_X, SPAWN_Y, parseInt(dealCount) || 1)}>
                        Confirmar
                    </Button>
                </PopoverContent>
             </Popover>

             <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm" onClick={() => system.spawnDeck(deckUrl, SPAWN_X, SPAWN_Y, 54)}>
               <Layers className="w-3 h-3 mr-1" /> Baralho
             </Button>
           </div>

           {/* Toolbar - Utils */}
           <div className="flex items-center gap-2">
             <Button size="sm" variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300 h-8 hidden sm:flex" onClick={() => system.addCounter("Token", 400, 100)}>
               <Calculator className="w-3 h-3 mr-1" /> Token
             </Button>
             
             <div className="h-6 w-px bg-white/10 mx-2" />

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
          
          <DeckHolder x={DECK_X} y={DECK_Y} label="Baralho" />

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
            />
          ))}
        </div>

        {/* MÃO DO JOGADOR */}
        <div ref={handZoneRef} className="h-60 bg-gradient-to-t from-slate-950 via-slate-900/95 to-slate-900/0 relative z-20 flex flex-col justify-end pb-4 group">
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-30 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full border border-white/10">Sua Mão</span>
            </div>
            
            <div className="w-full h-48 flex items-center justify-center overflow-x-auto overflow-y-visible py-4 px-10">
                {handCards.length === 0 && (
                    <div className="text-white/20 text-sm italic flex flex-col items-center gap-2 select-none pointer-events-none">
                        <Hand className="w-10 h-10 opacity-30" />
                        Arraste cartas para aqui
                    </div>
                )}

                <div className="flex items-center pl-12 min-w-min"> 
                    {handCards.map((card) => (
                        <PlayingCard 
                            key={card.id} 
                            card={card} 
                            isInHand={true}
                            onMove={handleCardMove}
                            onFlip={(c) => system.flipCard(c)}
                            onPlay={(c) => system.playCardFromHand(c)}
                        />
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}