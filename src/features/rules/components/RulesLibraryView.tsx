import { RulePreset } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { FilePlus, Save, Upload, Download, Trash2, RefreshCw, Sparkles, FileJson } from "lucide-react";
import { useState, useRef } from "react";

interface Props {
  presets: RulePreset[];
  onLoad: (p: RulePreset) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onImport: (json: any) => void;
  onSaveCopy: (name: string) => void;
  onCreateBlank: (name: string) => void;
  onRestoreDefault: () => void;
}

export function RulesLibraryView({ presets, onLoad, onUpdate, onDelete, onImport, onSaveCopy, onCreateBlank, onRestoreDefault }: Props) {
  const [newName, setNewName] = useState("");
  const [dialogOpen, setDialogOpen] = useState<"blank" | "copy" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try { onImport(JSON.parse(ev.target?.result as string)); } catch (err) { console.error(err); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportJSON = (preset: RulePreset) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(preset));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", preset.name + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex-1 overflow-hidden p-8 z-10 flex flex-col gap-6">
        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-end pb-6 border-b border-white/10">
            <div>
                <h3 className="text-2xl text-white font-serif font-bold">Biblioteca de Sistemas</h3>
                <p className="text-slate-400 text-sm">Gerencie os jogos salvos.</p>
            </div>
            <div className="flex flex-wrap gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" accept=".json" />
                <Button variant="outline" className="border-white/10 text-slate-300" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2"/> Importar</Button>
                
                <Dialog open={dialogOpen === 'copy'} onOpenChange={(o) => setDialogOpen(o ? 'copy' : null)}>
                    <DialogTrigger asChild><Button className="bg-green-800 hover:bg-green-700 text-green-100"><Save className="w-4 h-4 mr-2"/> Salvar Cópia</Button></DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-white/10 text-white"><DialogHeader><DialogTitle>Nome da Cópia</DialogTitle></DialogHeader>
                        <Input value={newName} onChange={e => setNewName(e.target.value)} className="bg-black/50" placeholder="Nome..." />
                        <DialogFooter><Button onClick={() => { onSaveCopy(newName); setDialogOpen(null); setNewName(""); }}>Salvar</Button></DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={dialogOpen === 'blank'} onOpenChange={(o) => setDialogOpen(o ? 'blank' : null)}>
                    <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700"><FilePlus className="w-4 h-4 mr-2"/> Novo (Vazio)</Button></DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-white/10 text-white"><DialogHeader><DialogTitle>Criar Novo Sistema</DialogTitle></DialogHeader>
                        <Input value={newName} onChange={e => setNewName(e.target.value)} className="bg-black/50" placeholder="Nome do Jogo..." />
                        <DialogFooter><Button onClick={() => { onCreateBlank(newName); setDialogOpen(null); setNewName(""); }}>Criar</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>

        {/* Grid */}
        <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-950/20 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-amber-500"><Sparkles className="w-5 h-5" /><h4 className="font-bold">Sol de Prios</h4></div>
                    <Button variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-950/50" onClick={onRestoreDefault}>Restaurar</Button>
                </div>
                {presets.map(p => (
                    <div key={p.id} className="p-6 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-4 group hover:border-white/20">
                        <div className="flex justify-between"><h4 className="font-bold text-white">{p.name}</h4>
                            <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => exportJSON(p)}><Download className="w-4 h-4 text-slate-400"/></Button>
                                <Button size="icon" variant="ghost" onClick={() => onDelete(p.id)}><Trash2 className="w-4 h-4 text-red-400"/></Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500"><FileJson className="w-3 h-3"/> {Array.isArray(p.cards_data) ? p.cards_data.length : 0} cartas</div>
                        <div className="mt-auto grid grid-cols-2 gap-2">
                            <Button variant="secondary" className="bg-white/5 text-xs" onClick={() => onUpdate(p.id, p.name)}><RefreshCw className="w-3 h-3 mr-2"/> Atualizar</Button>
                            <Button className="bg-white/10 text-xs" onClick={() => onLoad(p)}>Carregar</Button>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    </div>
  );
}