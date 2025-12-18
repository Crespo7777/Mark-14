import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Quality {
  name: string;
  description: string;
  data?: any;
}

interface QualitySelectorProps {
  tableId: string;
  value: string;
  onChange: (newValue: string, combinedDescription?: string) => void;
  targetType?: "weapon" | "armor" | "all";
  disabled?: boolean;
}

export function QualitySelector({ 
  tableId, 
  value, 
  onChange, 
  targetType = "all", 
  disabled = false 
}: QualitySelectorProps) {
  const [open, setOpen] = useState(false);
  
  const selectedValues = value 
    ? value.split(",").map((v) => v.trim()).filter(Boolean) 
    : [];

  const { data: qualities = [] } = useQuery({
    queryKey: ["qualities", tableId],
    queryFn: async () => {
      // CORREÇÃO: Aponta para a tabela 'items' e usa o tipo 'quality'
      const { data, error } = await supabase
        .from("items")
        .select("name, description, data")
        .eq("type", "quality")
        .or(`table_id.eq.${tableId},table_id.is.null`) // Traz da mesa E do sistema
        .order("name");

      if (error) throw error;
      return data as Quality[];
    },
    enabled: !disabled,
  });

  const filteredQualities = qualities.filter(q => {
    if (targetType === "all") return true;
    const target = q.data?.targetType?.toLowerCase();
    if (!target || target === "geral") return true;
    
    if (targetType === "weapon") return target.includes("arma") || target.includes("weapon");
    if (targetType === "armor") return target.includes("armadura") || target.includes("armor");
    return true;
  });

  const handleSelect = (qualityName: string) => {
    const isSelected = selectedValues.some(v => v.toLowerCase() === qualityName.toLowerCase());
    let newValues: string[];

    if (isSelected) {
      newValues = selectedValues.filter((v) => v.toLowerCase() !== qualityName.toLowerCase());
    } else {
      newValues = [...selectedValues, qualityName];
    }

    const newString = newValues.join(", ");

    const descriptions = newValues.map(val => {
      const qual = qualities.find(q => q.name.toLowerCase() === val.toLowerCase());
      if (!qual) return null;
      
      const cleanDesc = qual.description?.replace(/<[^>]*>?/gm, '') || "";
      return `**${qual.name}:** ${cleanDesc}`;
    }).filter(Boolean);

    const combinedDesc = descriptions.join("\n\n");

    onChange(newString, combinedDesc);
  };

  const handleRemove = (e: React.MouseEvent, valToRemove: string) => {
    e.stopPropagation();
    handleSelect(valToRemove);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[40px] h-auto bg-background hover:bg-accent/10"
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 items-center text-left">
            {selectedValues.length > 0 ? (
              selectedValues.map((val) => (
                <Badge variant="secondary" key={val} className="mr-1 mb-1 bg-primary/20 text-primary-foreground border-primary/30">
                  {val}
                  <span
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer opacity-70 hover:opacity-100"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => handleRemove(e, val)}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground font-normal italic">Selecionar qualidades...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar qualidade..." />
          <CommandList>
            <CommandEmpty>Nenhuma qualidade encontrada.</CommandEmpty>
            <CommandGroup>
              {filteredQualities.map((quality) => {
                const isSelected = selectedValues.some(
                  (val) => val.toLowerCase() === quality.name.toLowerCase()
                );
                return (
                  <CommandItem
                    key={quality.name}
                    value={quality.name}
                    onSelect={() => handleSelect(quality.name)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-primary",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                        <span className="font-medium">{quality.name}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                            {quality.description?.replace(/<[^>]*>?/gm, '')}
                        </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}