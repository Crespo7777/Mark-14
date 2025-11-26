// src/features/master/MasterRulesTab.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const MasterRulesTab = ({ tableId }: { tableId: string }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tabelas & Regras</CardTitle>
          <CardDescription>Consulte tabelas rápidas e regras opcionais.</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground text-sm">Em construção...</p>
        </CardContent>
      </Card>
    </div>
  );
};