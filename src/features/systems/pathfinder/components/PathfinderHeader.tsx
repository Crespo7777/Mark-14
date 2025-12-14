import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  onBack?: () => void;
  onSave: () => void;
  isDirty: boolean;
  characterName?: string;
  isReadOnly?: boolean;
  sharedWith?: string[];
  isNpc?: boolean;
}

export const PathfinderHeader = ({ onBack, onSave, isDirty, characterName, isReadOnly, sharedWith, isNpc }: Props) => {
  const { register } = useFormContext();

  return (
    <div className="flex flex-col gap-4 border-b p-4 bg-card">
      {/* Top Bar: Navegação e Ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h2 className="text-xl font-bold truncate max-w-[200px] md:max-w-md">
            {characterName || "Sem Nome"}
          </h2>
          {isNpc && <Badge variant="destructive">NPC</Badge>}
          {isReadOnly && <Badge variant="secondary">Leitura</Badge>}
        </div>
        
        <div className="flex items-center gap-2">
            {!isReadOnly && (
                <Button 
                    size="sm" 
                    onClick={onSave} 
                    disabled={!isDirty} 
                    className={isDirty ? "animate-pulse" : ""}
                >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                </Button>
            )}
        </div>
      </div>

      {/* Inputs de Identidade */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <Input {...register("name")} className="h-8 font-bold" readOnly={isReadOnly} />
        </div>
        <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ancestralidade</Label>
            <Input {...register("ancestry")} className="h-8" placeholder="Ex: Human" readOnly={isReadOnly} />
        </div>
        <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Classe</Label>
            <Input {...register("class")} className="h-8" placeholder="Ex: Fighter" readOnly={isReadOnly} />
        </div>
        <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nível</Label>
            <Input type="number" {...register("level")} className="h-8 font-mono" readOnly={isReadOnly} />
        </div>
      </div>
    </div>
  );
};