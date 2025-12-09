import { Group, Circle, Text } from "react-konva";
import useImage from "use-image";
import { MapToken as MapTokenType } from "@/types/map-types";
import { useEffect, useState } from "react";

interface MapTokenProps {
  token: MapTokenType;
  gridSize: number;
  isDraggable: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export const MapToken = ({ token, gridSize, isDraggable, onDragEnd }: MapTokenProps) => {
  // Carregar imagem se existir (hook do use-image)
  const [image] = useImage(token.imageUrl || "", "anonymous");
  
  // Cálculo do raio (metade do tamanho da célula * escala do token)
  const radius = (gridSize * token.size) / 2;

  // Handler para quando largamos o token (Snap to Grid)
  const handleDragEnd = (e: any) => {
    const x = e.target.x();
    const y = e.target.y();
    
    // Matemática de "Snap": Arredondar para o quadrado mais próximo
    const snapX = Math.round(x / gridSize) * gridSize;
    const snapY = Math.round(y / gridSize) * gridSize;

    // Atualiza a posição visual imediatamente para "encaixar"
    e.target.x(snapX);
    e.target.y(snapY);

    // Avisa o pai que mudou
    onDragEnd(token.id, snapX, snapY);
  };

  return (
    <Group
      x={token.x}
      y={token.y}
      draggable={isDraggable}
      onDragEnd={handleDragEnd}
      // Muda o cursor ao passar o rato
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = "grab";
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = "default";
      }}
    >
      {/* 1. Base/Fundo (Se não houver imagem) */}
      <Circle
        radius={radius - 2} // -2 para dar espaço à borda
        fill={image ? "white" : token.color}
        stroke={token.color}
        strokeWidth={2}
        offsetX={-gridSize / 2} // Centrar no quadrado
        offsetY={-gridSize / 2}
        shadowColor="black"
        shadowBlur={5}
        shadowOpacity={0.3}
      />

      {/* 2. Imagem do Personagem (Preenchimento) */}
      {image && (
        <Circle
          radius={radius - 4}
          fillPatternImage={image}
          fillPatternScale={{
            x: (radius * 2) / image.width,
            y: (radius * 2) / image.height
          }}
          // Ajuste fino para centrar a textura
          fillPatternOffset={{ x: image.width / 2, y: image.height / 2 }} 
          offsetX={-gridSize / 2}
          offsetY={-gridSize / 2}
        />
      )}

      {/* 3. Rótulo (Nome) - Flutuando em cima */}
      <Group offsetX={-gridSize / 2} offsetY={-gridSize / 2}>
         {/* Fundo escuro para ler o texto */}
         <Text
            text={token.label}
            y={radius + 5}
            align="center"
            width={gridSize * 2}
            offsetX={gridSize / 2} // Tentar centrar texto
            fontSize={12}
            fill="white"
            stroke="black"
            strokeWidth={0.5}
            listening={false} // Texto não interfere no clique
         />
      </Group>
    </Group>
  );
};