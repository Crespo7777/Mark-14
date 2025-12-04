import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReferenceCard, RulePreset } from "../types";
import { SOL_DE_PRIOS_RULES, SOL_DE_PRIOS_CARDS } from "../solDePriosData";

export function useRulesSystem(roomId: string, isMaster: boolean) {
  // --- ESTADOS ---
  const [rulesText, setRulesText] = useState("");
  const [refCards, setRefCards] = useState<ReferenceCard[]>([]);
  const [presets, setPresets] = useState<RulePreset[]>([]);
  const [loading, setLoading] = useState(true);

  // --- INICIALIZAÇÃO ---
  useEffect(() => {
    fetchActiveData();
    fetchPresets();

    const channel = supabase.channel('rules-system')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rules' }, () => fetchActiveData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reference_cards' }, () => fetchActiveData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rule_presets' }, () => fetchPresets())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // --- FETCHERS ---
  const fetchActiveData = async () => {
    const { data: rules } = await supabase.from('game_rules').select('content').eq('room_id', roomId).maybeSingle();
    if (rules) setRulesText(rules.content || "");
    
    const { data: cards } = await supabase.from('reference_cards').select('*').eq('room_id', roomId).order('title');
    if (cards) setRefCards(cards as any[]);
    setLoading(false);
  };

  const fetchPresets = async () => {
    const { data } = await supabase.from('rule_presets').select('*').eq('room_id', roomId).order('created_at', { ascending: false });
    if (data) setPresets(data as any[]);
  };

  // --- AÇÕES: REGRAS ATIVAS ---
  const saveRulesText = async (text: string) => {
    if (!isMaster) return;
    const { data } = await supabase.from('game_rules').select('id').eq('room_id', roomId).maybeSingle();
    if (data) await supabase.from('game_rules').update({ content: text }).eq('id', data.id);
    else await supabase.from('game_rules').insert({ room_id: roomId, content: text });
    toast.success("Texto atualizado!");
  };

  const createCard = async (card: Omit<ReferenceCard, 'id'>) => {
    if (!isMaster) return;
    await supabase.from('reference_cards').insert({ room_id: roomId, ...card });
    toast.success("Carta criada!");
  };

  const deleteCard = async (id: string) => {
    if (!isMaster) return;
    if(!confirm("Apagar carta?")) return;
    await supabase.from('reference_cards').delete().eq('id', id);
  };

  // --- AÇÕES: BIBLIOTECA & PRESETS ---
  
  // 1. Criar novo em branco
  const createBlankSystem = async (name: string) => {
    if (!isMaster) return;
    const initialText = `# ${name}\n\nEscreva as regras aqui...`;
    
    // Salva na biblioteca
    await supabase.from('rule_presets').insert({
        room_id: roomId, name, description: "Sistema manual.", rules_content: initialText, cards_data: []
    });

    // Carrega na mesa
    await loadSystemToTable(initialText, []);
    toast.success(`Sistema "${name}" criado!`);
  };

  // 2. Salvar estado atual como preset
  const saveCurrentAsPreset = async (name: string) => {
    if (!isMaster) return;
    const { error } = await supabase.from('rule_presets').insert({
        room_id: roomId, name, rules_content: rulesText, cards_data: refCards
    });
    if (error) toast.error("Erro ao salvar.");
    else toast.success("Salvo na biblioteca!");
  };

  // 3. Atualizar preset existente (Sync)
  const updatePreset = async (presetId: string, presetName: string) => {
    if (!isMaster) return;
    if(!confirm(`Atualizar "${presetName}" com o que está na mesa?`)) return;
    await supabase.from('rule_presets').update({ rules_content: rulesText, cards_data: refCards }).eq('id', presetId);
    toast.success("Preset atualizado!");
  };

  // 4. Carregar preset para a mesa
  const loadPreset = async (preset: RulePreset) => {
    if (!isMaster) return;
    if(!confirm(`Carregar "${preset.name}"? Substituirá a mesa atual.`)) return;
    await loadSystemToTable(preset.rules_content, preset.cards_data);
    toast.success("Sistema carregado!");
  };

  // 5. Deletar Preset
  const deletePreset = async (id: string) => {
    if (!isMaster) return;
    if(!confirm("Apagar da biblioteca?")) return;
    await supabase.from('rule_presets').delete().eq('id', id);
    toast.success("Removido.");
  };

  // 6. Importar JSON
  const importJson = async (json: any) => {
    if (!isMaster) return;
    if (!json.name || !json.cards_data) { toast.error("JSON Inválido"); return; }
    await supabase.from('rule_presets').insert({
        room_id: roomId, name: json.name + " (Imp)", description: json.description,
        rules_content: json.rules_content, cards_data: json.cards_data
    });
    toast.success("Importado!");
  };

  // 7. Sol de Prios (Hardcoded)
  const restoreSolDePrios = async () => {
    if (!isMaster) return;
    await supabase.from('rule_presets').insert({
        room_id: roomId, name: "Sol de Prios (Oficial)", rules_content: SOL_DE_PRIOS_RULES, cards_data: SOL_DE_PRIOS_CARDS
    });
    toast.success("Restaurado!");
  };

  // --- HELPER PRIVADO ---
  const loadSystemToTable = async (content: string, cards: any[]) => {
    // 1. Limpa regras antigas
    await supabase.from('game_rules').delete().eq('room_id', roomId);
    // 2. Insere novas regras
    await supabase.from('game_rules').insert({ room_id: roomId, content });
    
    // 3. Limpa cartas antigas
    await supabase.from('reference_cards').delete().eq('room_id', roomId);
    
    // 4. Insere novas cartas (se houver)
    if (cards && cards.length > 0) {
        const cleanCards = cards.map(c => ({
            room_id: roomId, title: c.title, description: c.description, type: c.type
        }));
        await supabase.from('reference_cards').insert(cleanCards);
    }
  };

  return {
    rulesText, refCards, presets, loading,
    saveRulesText, createCard, deleteCard,
    createBlankSystem, saveCurrentAsPreset, updatePreset, loadPreset, deletePreset, importJson, restoreSolDePrios
  };
}