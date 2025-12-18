// src/components/StigmaSelector.tsx

import React from "react";
import { Control, useController } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { STIGMAS_LIST } from "@/features/systems/symbaroum/utils/stigmas.constants";
import { Slot } from "@radix-ui/react-slot";

interface StigmaSelectorProps {
  control: Control<any>;
  name: string;
  isReadOnly?: boolean;
}

// Wrapper para evitar erros de ref no FormControl do Radix UI
const FormControl = ({ children }: { children: React.ReactNode }) => {
  return <Slot>{children}</Slot>;
};

export const StigmaSelector = ({ control, name, isReadOnly }: StigmaSelectorProps) => {
  const { field } = useController({ control, name });
  
  const currentValue = field.value || "";

  const handleSelectChange = (value: string) => {
    if (value === "custom") {
      return; // Apenas foca ou deixa o utilizador escrever
    }

    // Lógica de Adicionar: Concatena com quebra de linha
    const newStigma = value;
    const newValue = currentValue 
      ? `${currentValue}\n- ${newStigma}` 
      : `- ${newStigma}`;
      
    field.onChange(newValue);
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex justify-between items-baseline">
        <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Estigmas Físicos
        </Label>
        {!isReadOnly && <span className="text-[10px] text-muted-foreground opacity-70">Selecione para adicionar</span>}
      </div>
      
      {!isReadOnly && (
        <Select 
            onValueChange={handleSelectChange} 
            value="" // Valor vazio para funcionar como botão de ação
        >
            <FormControl>
            <SelectTrigger className="w-full text-sm h-9 bg-background">
                <SelectValue placeholder="Adicionar Estigma da Lista..." />
            </SelectTrigger>
            </FormControl>
            <SelectContent>
                {STIGMAS_LIST.map((stigma) => (
                    <SelectItem key={stigma} value={stigma} className="text-sm">
                        {stigma}
                    </SelectItem>
                ))}
                <SelectItem value="custom" className="font-bold text-accent">
                    Escrever Outro Abaixo...
                </SelectItem>
            </SelectContent>
        </Select>
      )}

      <Textarea
        placeholder="- Olhos brilhantes..."
        value={currentValue}
        onChange={field.onChange}
        readOnly={isReadOnly}
        className="min-h-[80px] text-sm bg-muted/30 resize-y"
      />
    </div>
  );
};