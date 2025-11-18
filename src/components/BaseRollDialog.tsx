// src/components/BaseRollDialog.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";

interface BaseRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode; // Conteúdo específico (modifier, advantage, etc.)
  onRoll: () => void;
  loading: boolean;
  buttonLabel?: React.ReactNode;
  actionColorClass?: string; // Para mudar a cor do botão se necessário
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {children}
        </div>

        <DialogFooter>
          <Button
            type="button"
            className={`w-full ${actionColorClass || ""}`}
            onClick={onRoll}
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