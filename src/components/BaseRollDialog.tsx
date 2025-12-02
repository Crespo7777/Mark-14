import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dices, Eye, EyeOff } from "lucide-react";
import { useTableContext } from "@/features/table/TableContext";

interface BaseRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  onRoll: (isHidden: boolean) => void;
  loading: boolean;
  buttonLabel?: React.ReactNode;
  actionColorClass?: string;
}

export const BaseRollDialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onRoll,
  loading,
  buttonLabel = "Rolar",
  actionColorClass,
}: BaseRollDialogProps) => {
  const { isMaster } = useTableContext();
  
  // Se for mestre, começa escondido (true). Se jogador, começa público (false).
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (open) {
        setIsHidden(isMaster);
    }
  }, [open, isMaster]);

  const handleSwitchChange = (checked: boolean) => {
      // Mestre: Switch ativa o modo "Público" (inverte o isHidden)
      if (isMaster) {
          setIsHidden(!checked);
      }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {children}

          {/* CORREÇÃO: Visível APENAS para o Mestre */}
          {isMaster && (
            <div className="flex items-center justify-between border p-3 rounded-md bg-muted/20">
                <div className="space-y-0.5">
                    <Label htmlFor="roll-mode" className="flex items-center gap-2 cursor-pointer">
                        {isHidden ? <EyeOff className="w-4 h-4 text-muted-foreground"/> : <Eye className="w-4 h-4 text-primary"/>}
                        Rolar Publicamente?
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                        {isHidden 
                            ? "Atualmente: Invisível para jogadores." 
                            : "Atualmente: Visível para todos."}
                    </p>
                </div>
                <Switch
                id="roll-mode"
                checked={!isHidden} // Switch ON = Público
                onCheckedChange={handleSwitchChange}
                />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            className={`w-full ${actionColorClass || ""}`}
            onClick={() => onRoll(isHidden)}
            disabled={loading}
          >
            {loading ? "Rolando..." : (
              <>
                <Dices className="w-4 h-4 mr-2" />
                {buttonLabel}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};