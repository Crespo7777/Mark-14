import { ReferenceCard } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, Save, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface Props {
  rulesText: string;
  cards: ReferenceCard[];
  isMaster: boolean;
  onSaveRules: (text: string) => void;
  onCreateCard: (card: Omit<ReferenceCard, 'id'>) => void;
  onDeleteCard: (id: string) => void;
}

export function ActiveRulesView({ rulesText, cards, isMaster, onSaveRules, onCreateCard, onDeleteCard }: Props) {
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [textBuffer, setTextBuffer] = useState(rulesText);
  const [newCard, setNewCard] = useState({ title: "", description: "", type: "general" as const });
  const [createOpen, setCreateOpen] = useState(false);

  const filteredCards = cards.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()));

  // Sincroniza o buffer quando o texto externo muda (ex: carregou preset)
  if (!isEditing && textBuffer !== rulesText) {
      setTextBuffer(rulesText);
  }

  return (
    <Tabs defaultValue="cards" className="flex-1 flex flex-col overflow-hidden z-10">
        {/* Barra de Pesquisa e Abas */}
        <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/20">
            <TabsList className="bg-white/5 p-1 border border-white/5">
                <TabsTrigger value="rules" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white px-6">Regras</TabsTrigger>
                <TabsTrigger value="cards" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-6">Cartas</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-white/30" />
                <Input placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)} className="bg-black/40 border-white/10 pl-9 text-xs" />
            </div>
        </div>

        {/* Conteúdo Regras */}
        <TabsContent value="rules" className="flex-1 overflow-hidden relative p-0 m-0">
            <div className="absolute top-4 right-8 z-20">
                {isMaster && (
                    <Button size="sm" variant="outline" className="border-white/10 backdrop-blur-md" 
                        onClick={() => {
                            if(isEditing) onSaveRules(textBuffer);
                            setIsEditing(!isEditing);
                        }}>
                        {isEditing ? <><Save className="w-4 h-4 mr-2"/> Salvar</> : <><Edit className="w-4 h-4 mr-2"/> Editar</>}
                    </Button>
                )}
            </div>
            <ScrollArea className="h-full px-8 py-6">
                <div className="max-w-3xl mx-auto pb-20">
                    {isEditing ? (
                        <Textarea value={textBuffer} onChange={e => setTextBuffer(e.target.value)} className="w-full h-[60vh] bg-slate-900/50 border-white/10 p-6 font-mono text-sm" />
                    ) : (
                        <div className="whitespace-pre-wrap text-slate-300 font-serif leading-8 text-lg">
                            {rulesText || <span className="text-white/20 italic">Sem regras definidas.</span>}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </TabsContent>

        {/* Conteúdo Cartas */}
        <TabsContent value="cards" className="flex-1 overflow-hidden relative p-0 m-0 bg-black/20">
            <ScrollArea className="h-full p-6">
                {isMaster && (
                    <div className="sticky top-0 z-30 flex justify-end mb-6 pointer-events-none">
                        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                            <DialogTrigger asChild><Button className="bg-amber-600 hover:bg-amber-500 pointer-events-auto rounded-full px-6 shadow-lg"><Plus className="w-4 h-4 mr-2"/> Nova Carta</Button></DialogTrigger>
                            <DialogContent className="bg-zinc-900 border-white/10 text-white">
                                <DialogHeader><DialogTitle>Nova Carta</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <Input placeholder="Título" value={newCard.title} onChange={e => setNewCard({...newCard, title: e.target.value})} className="bg-black/50" />
                                    <Select value={newCard.type} onValueChange={(v:any) => setNewCard({...newCard, type: v})}>
                                        <SelectTrigger className="bg-black/50"><SelectValue/></SelectTrigger>
                                        <SelectContent className="bg-zinc-900 text-white"><SelectItem value="general">Regra</SelectItem><SelectItem value="moon">Lua</SelectItem><SelectItem value="sun">Sol</SelectItem></SelectContent>
                                    </Select>
                                    <Textarea placeholder="Descrição" value={newCard.description} onChange={e => setNewCard({...newCard, description: e.target.value})} className="bg-black/50" />
                                </div>
                                <DialogFooter><Button onClick={() => { onCreateCard(newCard); setCreateOpen(false); setNewCard({title:"", description:"", type:"general"}); }}>Criar</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                    {filteredCards.map(c => (
                        <div key={c.id} className={`group relative p-5 rounded-xl border transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col gap-3 overflow-hidden backdrop-blur-sm ${c.type==='moon'?'bg-indigo-950/20 border-indigo-500/30':c.type==='sun'?'bg-amber-950/20 border-amber-500/30':'bg-slate-900/40 border-white/10'}`}>
                            <div className="flex justify-between items-start z-10">
                                <h3 className={`font-serif font-bold text-lg ${c.type==='moon'?'text-indigo-200':c.type==='sun'?'text-amber-200':'text-slate-200'}`}>{c.title}</h3>
                                {isMaster && <button onClick={() => onDeleteCard(c.id)} className="text-white/10 hover:text-red-400 p-1"><Trash2 className="w-4 h-4"/></button>}
                            </div>
                            <div className="h-px w-full bg-white/5"/>
                            <p className="text-sm text-slate-300 font-light z-10 whitespace-pre-wrap">{c.description}</p>
                            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none ${c.type==='moon'?'bg-indigo-500':c.type==='sun'?'bg-amber-500':'bg-slate-500'}`}/>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </TabsContent>
    </Tabs>
  );
}