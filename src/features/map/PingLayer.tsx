import { useEffect, useRef, useState } from "react";
import { Layer, Ring } from "react-konva";
import Konva from "konva";

export interface PingData {
  id: string;
  x: number;
  y: number;
  color: string;
  user: string;
}

interface PingLayerProps {
  pings: PingData[];
  onComplete: (id: string) => void;
}

// Componente individual de Ping que se auto-anima
const PingAnimation = ({ ping, onComplete }: { ping: PingData; onComplete: (id: string) => void }) => {
  const ringRef = useRef<Konva.Ring>(null);

  useEffect(() => {
    const node = ringRef.current;
    if (!node) return;

    // Animação estilo "Onda de Choque"
    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      
      // Duração de 1 segundo (1000ms)
      const duration = 1000;
      const progress = Math.min(frame.time / duration, 1);
      
      // Easing: Começa rápido, desacelera (EaseOut)
      const ease = 1 - Math.pow(1 - progress, 3);

      // Expande o raio de 10px até 100px
      const radius = 10 + (90 * ease);
      
      // Opacidade: Começa em 1, desvanece para 0 no final
      const opacity = 1 - progress;

      node.innerRadius(radius - 5); // Borda de 5px
      node.outerRadius(radius);
      node.opacity(opacity);

      if (progress >= 1) {
        anim.stop();
        onComplete(ping.id); // Avisa o pai para remover este ping da lista
      }
    }, node.getLayer());

    anim.start();

    return () => {
      anim.stop();
    };
  }, [ping.id, onComplete]);

  return (
    <Ring
      ref={ringRef}
      x={ping.x}
      y={ping.y}
      innerRadius={10}
      outerRadius={15}
      fill={ping.color}
      opacity={0.8}
      listening={false} // O ping não deve bloquear cliques
    />
  );
};

export const PingLayer = ({ pings, onComplete }: PingLayerProps) => {
  if (pings.length === 0) return null;

  return (
    <Layer>
      {pings.map((ping) => (
        <PingAnimation key={ping.id} ping={ping} onComplete={onComplete} />
      ))}
    </Layer>
  );
};