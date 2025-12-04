import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTableContext } from "@/features/table/TableContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book, X, Save, Plus, Trash2, Edit, Search, Sparkles, Library, Download, Upload, FileJson } from "lucide-react";
import { toast } from "sonner";
import { SOL_DE_PRIOS_RULES, SOL_DE_PRIOS_CARDS } from "./solDePriosData";

interface ReferenceCard {
  id: string;
  title: string;
  description: string;
  type: 'moon' | 'sun' | 'general';
}

interface RulePreset {
  id: string;
  name: string;
  description: string;
  rules_content: string;
  cards_data: any[];
}

export function RulesBookPanel({ roomId }: { roomId: string }) {
  const { isMaster } = useTableContext();
  const [isOpen, setIsOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dados Ativos (Na Mesa)
  const [rulesText, setRulesText] = useState("");
  const [refCards, setRefCards] = useState<ReferenceCard[]>([]);
  const [searchCard, setSearchCard] = useState("");
  
  // Estados de UI
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false); // Nova aba de Biblioteca
  
  // Formulários
  const [newCard, setNewCard] = useState({ title: "", description: "", type: "general" });
  const [newPresetName, setNewPresetName] = useState("");
  const [presets, setPresets] = useState<RulePreset[]>([]);

  // 1. Inicialização e Realtime
  useEffect(() => {
    fetchActiveData();
    fetchPresets(); // Carregar a biblioteca

    const channel = supabase.channel('rules-system')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rules' }, () => fetchActiveData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reference_cards' }, () => fetchActiveData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rule_presets' }, () => fetchPresets())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const fetchActiveData = async () => {
    const { data: rules } = await supabase.from('game_rules').select('content').eq('room_id', roomId).maybeSingle();
    if (rules) setRulesText(rules.content || "");
    const { data: cards } = await supabase.from('reference_cards').select('*').eq('room_id', roomId).order('title');
    if (cards) setRefCards(cards as any[]);
  };

  const fetchPresets = async () => {
    const { data } = await supabase.from('rule_presets').select('*').eq('room_id', roomId).order('created_at', { ascending: false });
    if (data) setPresets(data as any[]);
  };

  // --- Lógica Principal de Regras (Ativa) ---

  const saveActiveRules = async () => {
    const { data } = await supabase.from('game_rules').select('id').eq('room_id', roomId).maybeSingle();
    if (data) await supabase.from('game_rules').update({ content: rulesText }).eq('id', data.id);
    else await supabase.from('game_rules').insert({ room_id: roomId, content: rulesText });
    setIsEditingRules(false);
    toast.success("Texto atualizado na mesa!");
  };

  const handleCreateCard = async () => {
    if (!newCard.title) return toast.error("Título obrigatório");
    await supabase.from('reference_cards').insert({ room_id: roomId, title: newCard.title, description: newCard.description, type: newCard.type });
    toast.success("Carta criada!");
    setIsCreateDialogOpen(false);
    setNewCard({ title: "", description: "", type: "general" });
  };

  const handleDeleteCard = async (id: string) => {
    if(!confirm("Apagar carta?")) return;
    await supabase.from('reference_cards').delete().eq('id', id);
  };

  // --- GESTÃO DE BIBLIOTECA (PRESETS) ---

  // 1. Salvar o estado atual como um Preset
  const handleSaveAsPreset = async () => {
    if (!newPresetName) return toast.error("Dê um nome ao sistema (ex: Uno)");
    
    const presetData = {
        room_id: roomId,
        name: newPresetName,
        rules_content: rulesText,
        cards_data: refCards // Salva as cartas atuais como JSON
    };

    const { error } = await supabase.from('rule_presets').insert(presetData);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else {
        toast.success(`Sistema "${newPresetName}" salvo na biblioteca!`);
        setNewPresetName("");
    }
  };

  // 2. Carregar um Preset da biblioteca para a Mesa
  const handleLoadPreset = async (preset: RulePreset) => {
    if(!confirm(`Isto vai substituir as regras atuais pelo sistema "${preset.name}". Continuar?`)) return;

    // Atualiza Texto
    const { data: ruleRow } = await supabase.from('game_rules').select('id').eq('room_id', roomId).maybeSingle();
    if (ruleRow) await supabase.from('game_rules').update({ content: preset.rules_content }).eq('id', ruleRow.id);
    else await supabase.from('game_rules').insert({ room_id: roomId, content: preset.rules_content });

    // Atualiza Cartas (Apaga antigas, insere novas do JSON)
    await supabase.from('reference_cards').delete().eq('room_id', roomId);
    
    if (preset.cards_data && Array.isArray(preset.cards_data)) {
        const cardsToInsert = preset.cards_data.map((c: any) => ({
            room_id: roomId,
            title: c.title,
            description: c.description,
            type: c.type
        }));
        if(cardsToInsert.length > 0) await supabase.from('reference_cards').insert(cardsToInsert);
    }

    toast.success(`Sistema "${preset.name}" carregado!`);
    setIsLibraryOpen(false); // Fecha a biblioteca
  };

  // 3. Exportar Preset para Arquivo JSON (Para partilhar com amigos)
  const handleExportJSON = (preset: RulePreset) => {
    const dataStr = JSON.stringify(preset, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${preset.name.replace(/\s+/g, '_').toLowerCase()}_rules.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 4. Importar Arquivo JSON
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const json = JSON.parse(e.target?.result as string);
            
            // Validação básica
            if (!json.name || !json.cards_data) throw new Error("Formato inválido");

            await supabase.from('rule_presets').insert({
                room_id: roomId,
                name: json.name + " (Importado)",
                description: json.description,
                rules_content: json.rules_content,
                cards_data: json.cards_data
            });
            toast.success("Sistema importado com sucesso!");
        } catch (err) {
            toast.error("Erro ao ler arquivo JSON");
        }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 5. Apagar Preset
  const handleDeletePreset = async (id: string) => {
    if(!confirm("Apagar este sistema da biblioteca?")) return;
    await supabase.from('rule_presets').delete().eq('id', id);
    toast.success("Sistema removido.");
  };

  // Carregar preset hardcoded (Sol de Prios) para a DB se não existir
  const saveSolDePriosToLibrary = async () => {
    await supabase.from('rule_presets').insert({
        room_id: roomId,
        name: "Sol de Prios (Oficial)",
        description: "Regras originais do sistema Sol de Prios.",
        rules_content: SOL_DE_PRIOS_RULES,
        cards_data: SOL_DE_PRIOS_CARDS
    });
    toast.success("Adicionado à biblioteca!");
  };


  const filteredCards = refCards.filter(c => c.title.toLowerCase().includes(searchCard.toLowerCase()) || c.description.toLowerCase().includes(searchCard.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[90vh] bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl flex flex-col relative overflow-hidden ring-1 ring-white/5">
        
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950/0 to-slate-950 pointer-events-none" />

        {/* --- HEADER --- */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <Book className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                    <h2 className="text-white font-serif font-bold text-xl tracking-wide">Grimório de Regras</h2>
                    <p className="text-white/40 text-xs uppercase tracking-widest font-medium">
                        {isLibraryOpen ? "Biblioteca de Sistemas" : "Sistema Ativo na Mesa"}
                    </p>
                </div>
            </div>
            
            <div className="flex gap-2">
                {isMaster && (
                    <Button 
                        variant={isLibraryOpen ? "default" : "secondary"}
                        className={isLibraryOpen ? "bg-amber-600 hover:bg-amber-700" : "bg-white/5 text-slate-300 hover:text-white"}
                        onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                    >
                        <Library className="w-4 h-4 mr-2" />
                        {isLibraryOpen ? "Voltar à Leitura" : "Biblioteca & Presets"}
                    </Button>
                )}
                <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/10 rounded-full" onClick={() => setIsOpen(false)}>
                    <X className="w-5 h-5" />
                </Button>
            </div>
        </div>

        {/* --- CONTEÚDO PRINCIPAL --- */}
        
        {isLibraryOpen ? (
            // --- UI DA BIBLIOTECA (PRESETS) ---
            <div className="flex-1 overflow-hidden p-8 z-10 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-end pb-6 border-b border-white/10">
                    <div>
                        <h3 className="text-2xl text-white font-serif font-bold">Gerir Sistemas</h3>
                        <p className="text-slate-400 text-sm">Carregue, salve ou importe regras completas para a sua mesa.</p>
                    </div>
                    
                    <div className="flex gap-2 items-end">
                        {/* Importar Arquivo */}
                        <div className="relative">
                            <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
                            <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-4 h-4 mr-2" /> Importar JSON
                            </Button>
                        </div>
                        
                        {/* Salvar Atual */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-green-600 hover:bg-green-700 text-white">
                                    <Save className="w-4 h-4 mr-2" /> Salvar Jogo Atual
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-900 border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle>Salvar Preset</DialogTitle>
                                    <DialogDescription>Salva as regras e cartas que estão atualmente na mesa como um novo item na biblioteca.</DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <label className="text-xs text-slate-400">Nome do Sistema</label>
                                    <Input value={newPresetName} onChange={e => setNewPresetName(e.target.value)} placeholder="Ex: Uno, Poker, Meu RPG..." className="bg-black/50 border-white/10" />
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleSaveAsPreset}>Salvar na Biblioteca</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                        {/* Card Especial: Sol de Prios */}
                        <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-950/20 flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-amber-500">
                                <Sparkles className="w-5 h-5" />
                                <h4 className="font-bold text-lg">Sol de Prios</h4>
                            </div>
                            <p className="text-sm text-amber-200/60 flex-1">O sistema oficial. Caso tenhas perdido, podes restaurá-lo para a biblioteca aqui.</p>
                            <Button variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-950/50" onClick={saveSolDePriosToLibrary}>
                                Adicionar à Biblioteca
                            </Button>
                        </div>

                        {/* Presets do Usuário */}
                        {presets.map(preset => (
                            <div key={preset.id} className="p-6 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-4 group hover:border-white/20 transition-all">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-lg text-white">{preset.name}</h4>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-400" onClick={() => handleExportJSON(preset)} title="Baixar JSON">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={() => handleDeletePreset(preset.id)} title="Apagar">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <FileJson className="w-3 h-3" />
                                    <span>{(preset.cards_data as any[])?.length || 0} cartas registadas</span>
                                </div>
                                <Button className="mt-auto w-full bg-white/10 hover:bg-white/20 text-white" onClick={() => handleLoadPreset(preset)}>
                                    Carregar para a Mesa
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        ) : (
            // --- UI NORMAL (LEITURA E EDIÇÃO NA MESA) ---
            <Tabs defaultValue="cards" className="flex-1 flex flex-col overflow-hidden z-10">
                <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/20">
                    <TabsList className="bg-white/5 p-1 border border-white/5">
                        <TabsTrigger value="rules" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white px-6">Regras</TabsTrigger>
                        <TabsTrigger value="cards" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-6">Cartas</TabsTrigger>
                    </TabsList>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-white/30" />
                        <Input 
                            placeholder="Pesquisar..." 
                            value={searchCard}
                            onChange={e => setSearchCard(e.target.value)}
                            className="bg-black/40 border-white/10 pl-9 text-xs text-white focus:border-amber-500/50"
                        />
                    </div>
                </div>

                <TabsContent value="rules" className="flex-1 p-0 m-0 overflow-hidden relative">
                    <div className="absolute top-4 right-8 z-20">
                        {isMaster && (
                            <Button 
                                size="sm" 
                                variant="outline"
                                className={`border-white/10 backdrop-blur-md ${isEditingRules ? 'bg-green-900/20 text-green-400 border-green-500/50' : 'text-slate-400 hover:text-white'}`}
                                onClick={() => isEditingRules ? saveActiveRules() : setIsEditingRules(true)}
                            >
                                {isEditingRules ? <Save className="w-4 h-4 mr-2"/> : <Edit className="w-4 h-4 mr-2"/>}
                                {isEditingRules ? "Salvar Texto" : "Editar"}
                            </Button>
                        )}
                    </div>
                    <ScrollArea className="h-full px-8 py-6">
                        <div className="max-w-3xl mx-auto pb-20">
                            {isEditingRules ? (
                                <Textarea 
                                    value={rulesText} 
                                    onChange={e => setRulesText(e.target.value)} 
                                    className="w-full h-[60vh] bg-slate-900/50 border-white/10 p-6 font-mono text-sm text-slate-300 focus:ring-amber-500/50 leading-relaxed"
                                    placeholder="Escreva as regras aqui..."
                                />
                            ) : (
                                <div className="whitespace-pre-wrap text-slate-300 font-serif leading-8 text-lg">
                                    {rulesText || <span className="text-white/20 italic">Sem regras definidas. Vá à Biblioteca ou Edite o texto.</span>}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="cards" className="flex-1 p-0 m-0 overflow-hidden relative bg-black/20">
                    <ScrollArea className="h-full p-6">
                        {isMaster && (
                            <div className="sticky top-0 z-30 flex justify-end mb-6 pointer-events-none">
                                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20 pointer-events-auto rounded-full px-6">
                                            <Plus className="w-4 h-4 mr-2" /> Nova Carta
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-md">
                                        <DialogHeader><DialogTitle>Adicionar Carta</DialogTitle></DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-xs text-slate-400">Título</label>
                                                <Input value={newCard.title} onChange={e => setNewCard({...newCard, title: e.target.value})} className="bg-black/50 border-white/10" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-slate-400">Tipo</label>
                                                <Select value={newCard.type} onValueChange={(val: any) => setNewCard({...newCard, type: val})}>
                                                    <SelectTrigger className="bg-black/50 border-white/10"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                        <SelectItem value="general">📜 Regra Geral</SelectItem>
                                                        <SelectItem value="moon">🌑 Lua / Mágica</SelectItem>
                                                        <SelectItem value="sun">☀️ Sol / Item</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-slate-400">Descrição</label>
                                                <Textarea value={newCard.description} onChange={e => setNewCard({...newCard, description: e.target.value})} className="bg-black/50 border-white/10 min-h-[100px]" />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleCreateCard}>Criar</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {filteredCards.map(card => (
                                <div key={card.id} className={`group relative p-5 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col gap-3 overflow-hidden backdrop-blur-sm ${card.type === 'moon' ? 'bg-indigo-950/20 border-indigo-500/20 hover:border-indigo-500/50' : card.type === 'sun' ? 'bg-amber-950/20 border-amber-500/20 hover:border-amber-500/50' : 'bg-slate-900/40 border-white/10'}`}>
                                    <div className="flex justify-between items-start z-10">
                                        <h3 className={`font-serif font-bold text-lg leading-tight ${card.type === 'moon' ? 'text-indigo-200' : card.type === 'sun' ? 'text-amber-200' : 'text-slate-200'}`}>{card.title}</h3>
                                        {isMaster && <button onClick={() => handleDeleteCard(card.id)} className="text-white/10 hover:text-red-400 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>}
                                    </div>
                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    <p className="text-sm text-slate-300/90 leading-relaxed font-light z-10 whitespace-pre-wrap">{card.description}</p>
                                    <div className="mt-auto pt-2 flex justify-start z-10">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${card.type === 'moon' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : card.type === 'sun' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-white/5 border-white/10 text-slate-400'}`}>{card.type === 'general' ? 'Regra' : card.type}</span>
                                    </div>
                                    <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[60px] pointer-events-none opacity-20 ${card.type === 'moon' ? 'bg-indigo-500' : card.type === 'sun' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        )}
      </div>
    </div>
  );
}