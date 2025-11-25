// src/features/master/MasterRightPanel.tsx

import { ChatPanel } from "@/components/ChatPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, MessageSquare } from "lucide-react";

interface MasterRightPanelProps {
    tableId: string;
    onClose: () => void;
}

export const MasterRightPanel = ({ tableId, onClose }: MasterRightPanelProps) => {
    return (
        <Card className="h-full shadow-2xl border-border/50 bg-black/90 backdrop-blur-md flex flex-col overflow-hidden border border-white/10 rounded-xl pointer-events-auto z-[60] relative">
            <div className="flex items-center justify-between px-4 border-b border-white/10 bg-muted/20 h-14 shrink-0 relative z-10">
                <span className="font-bold text-sm text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Chat da Mesa
                </span>
                <Button 
                    variant="ghost" size="icon" 
                    className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive transition-colors"
                    onClick={onClose}
                    title="Minimizar Chat"
                >
                    <X className="w-5 h-5" />
                </Button>
            </div>
            <div className="flex-1 overflow-hidden relative z-0">
                <ChatPanel tableId={tableId} />
            </div>
        </Card>
    );
};