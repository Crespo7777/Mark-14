import { GameCard } from "./types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OpponentZoneProps {
  name: string;
  avatarUrl: string;
  cards: GameCard[];
}

export function OpponentZone({ name, avatarUrl, cards }: OpponentZoneProps) {
  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/5 backdrop-blur-sm min-w-[120px]">
      
      {/* Avatar do Jogador */}
      <div className="relative">
        <Avatar className="w-10 h-10 border-2 border-white/20 shadow-lg">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{name.substring(0,2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 bg-slate-800 text-[10px] text-white px-1.5 rounded-full border border-white/10">
            {cards.length}
        </div>
      </div>
      
      <span className="text-[10px] text-white/70 font-medium truncate max-w-[100px]">{name}</span>

      {/* Mão Fantasma (Cartas sobrepostas) */}
      <div className="flex -space-x-3 h-12 items-center justify-center">
        {cards.length === 0 && <div className="w-8 h-10 border border-white/10 rounded opacity-20 bg-white/5" />}
        
        {cards.map((card, i) => (
            <div 
                key={card.id}
                className="w-8 h-11 bg-red-900 rounded border border-white/30 shadow-sm relative transition-transform hover:-translate-y-2"
                style={{ 
                    backgroundImage: `url(${card.back_image})`, 
                    backgroundSize: 'cover',
                    zIndex: i 
                }}
            >
                {/* Opcional: Se quisermos mostrar que a carta está virada para cima mas sem revelar (ex: ícone de olho) */}
                {card.is_face_up && <div className="absolute inset-0 bg-white/30" />} 
            </div>
        ))}
      </div>
    </div>
  );
}