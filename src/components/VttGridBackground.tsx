// src/components/VttGridBackground.tsx

import { cn } from "@/lib/utils";

interface VttGridBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export const VttGridBackground = ({ className, children }: VttGridBackgroundProps) => {
  return (
    <div className={cn("relative w-full h-full bg-[#1a1a1a] overflow-hidden", className)}>
      {/* Padrão de Grelha CSS puro */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(#4a4a4a 1px, transparent 1px),
            linear-gradient(90deg, #4a4a4a 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Conteúdo (O Mapa ou Tokens) fica aqui */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};