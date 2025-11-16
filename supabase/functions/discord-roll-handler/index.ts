// supabase/functions/discord-roll-handler/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- NOVAS DEFINIÇÕES DE TIPO ---

// Resultado de uma rolagem de atributo (copiado de dice-parser.ts)
interface AttributeRollResult {
  mainRoll: number;
  advantageRoll: number | null;
  modifier: number;
  totalRoll: number;
  target: number;
  isSuccess: boolean;
  isCrit: boolean;
  isFumble: boolean;
}

// Tipos de dados de rolagem que recebemos dos diálogos
interface ManualRollData {
  rollType: "manual";
  command: string;
  result: { rolls: number[]; modifier: number; total: number; };
}
interface AttributeRollData {
  rollType: "attribute";
  attributeName: string;
  result: AttributeRollResult;
}
interface AbilityRollData {
  rollType: "ability";
  abilityName: string;
  attributeName: string;
  corruptionCost: number;
  result: AttributeRollResult;
}
interface AttackRollData {
  rollType: "attack";
  weaponName: string;
  attributeName: string;
  result: AttributeRollResult;
}
interface DefenseRollData {
  rollType: "defense";
  result: AttributeRollResult;
}
interface DamageRollData {
  rollType: "damage";
  weaponName: string;
  baseRoll: { rolls: number[]; modifier: number; total: number; };
  advantageRoll: { rolls: number[]; modifier: number; total: number; } | null;
  modifier: number;
  totalDamage: number;
}

type RollData = ManualRollData | AttributeRollData | AbilityRollData | AttackRollData | DefenseRollData | DamageRollData;

// --- NOVAS FUNÇÕES DE FORMATAÇÃO DE EMBED ---

// Define a cor da borda com base no sucesso
const getResultColor = (result: AttributeRollResult): number => {
  if (result.isCrit) return 3066993; // Verde (Sucesso Crítico)
  if (result.isSuccess) return 5763719; // Verde claro (Sucesso)
  if (result.isFumble) return 15158332; // Vermelho escuro (Falha Crítica)
  return 10038562; // Vermelho (Falha)
};

// Formata o emoji do resultado
const formatResultString = (result: AttributeRollResult): string => {
  if (result.isCrit) return "✨ **Sucesso Crítico!**";
  if (result.isSuccess) return "✔️ **Sucesso**";
  if (result.isFumble) return "💥 **Falha Crítica!**";
  return "❌ **Falha**";
};

// Formata a string da rolagem (ex: "1 (d20) = 1")
const formatRollString = (result: AttributeRollResult): string => {
  let rollStr = `${result.mainRoll} (d20)`;
  if (result.advantageRoll) {
    rollStr += ` + ${result.advantageRoll} (d4)`;
  }
  return `\`${rollStr} = ${result.totalRoll}\``;
};

// Formata a string do alvo (ex: "Alvo: 10 [-2]")
const formatTargetString = (result: AttributeRollResult): string => {
  let modStr = "";
  if (result.modifier > 0) modStr = ` [${result.target - result.modifier} +${result.modifier}]`;
  if (result.modifier < 0) modStr = ` [${result.target - result.modifier} ${result.modifier}]`;
  return `\`${result.target}\`${modStr}`;
};

// Cria um embed padrão para testes de Atributo (Ataque, Defesa, Habilidade)
const buildTestEmbed = (
  title: string, 
  authorName: string, 
  result: AttributeRollResult, 
  footerText: string | null = null
) => {
  const fields = [
    { name: "Rolagem 🎯 Alvo", value: `${formatRollString(result)} | ${formatTargetString(result)}`, inline: false },
    { name: "Resultado", value: formatResultString(result), inline: false },
  ];

  return {
    author: { name: authorName },
    title: title,
    fields: fields,
    color: getResultColor(result),
    footer: footerText ? { text: footerText } : { text: "Symbaroum VTT" },
  };
};

// Função principal que constrói o Payload
const buildPayload = (rollData: RollData, userName: string) => {
  let embed = {};

  switch (rollData.rollType) {
    case "manual": {
      const { command, result } = rollData;
      const rollsStr = `[${result.rolls.join(", ")}]`;
      const modStr = result.modifier > 0 ? ` + ${result.modifier}` : (result.modifier < 0 ? ` - ${Math.abs(result.modifier)}` : "");
      const description = `${rollsStr}${modStr} = **${result.total}**`;
      
      embed = {
        author: { name: userName || "Rolagem" },
        title: `Rolou ${command}`,
        description: description,
        color: 14981709, // Âmbar
        footer: { text: "Symbaroum VTT" }
      };
      break;
    }
    
    case "attribute":
      embed = buildTestEmbed(`Teste de ${rollData.attributeName}`, userName, rollData.result);
      break;
      
    case "attack":
      embed = buildTestEmbed(`Ataque com ${rollData.weaponName}`, userName, rollData.result, `Atributo: ${rollData.attributeName}`);
      break;

    case "defense":
      embed = buildTestEmbed(`Teste de Defesa`, userName, rollData.result);
      break;

    case "ability":
      const footer = rollData.corruptionCost > 0 ? `+${rollData.corruptionCost} Corrupção | Atributo: ${rollData.attributeName}` : `Atributo: ${rollData.attributeName}`;
      embed = buildTestEmbed(`Usou ${rollData.abilityName}`, userName, rollData.result, footer);
      break;

    case "damage": {
      let rollStr = `[${rollData.baseRoll.rolls.join(", ")}] (Base)`;
      if (rollData.advantageRoll) {
        rollStr += ` + [${rollData.advantageRoll.rolls.join(", ")}] (Vantagem)`;
      }
      if (rollData.modifier > 0) {
        rollStr += ` + ${rollData.modifier} (Mod)`;
      } else if (rollData.modifier < 0) {
        rollStr += ` - ${Math.abs(rollData.modifier)} (Mod)`;
      }
      
      embed = {
        author: { name: userName },
        title: `Dano com ${rollData.weaponName}`,
        description: `${rollStr}\nTotal = **${rollData.totalDamage}** Dano`,
        color: 14981709, // Âmbar
        footer: { text: "Symbaroum VTT" }
      };
      break;
    }
  }

  return {
    username: "Symbaroum VTT",
    // avatar_url: "URL_DO_ICONE_AQUI",
    embeds: [embed]
  };
};

/**
 * Função de fallback para limpar o HTML (agora usada apenas para rolagens não-padrão)
 */
function formatHtmlFallback(html: string): string {
  let text = html;
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/\n/g, '\n');
  text = text.replace(
    /^(.*?) (fez um teste de|ataca com|rola o dano de|rola|usou) <span.*?>(.*?)<\/span>/m,
    "**$1** $2 **$3**"
  );
  text = text.replace(/= <span class="text-primary-foreground font-bold text-lg">(.*?)<\/span>/g, "= **$1**");
  text = text.replace(/\[<span class="text-primary-foreground">(.*?)<\/span>\]/g, "[`$1`]");
  text = text.replace(/ ([+\-]) <span class="text-primary-foreground">(.*?)<\/span>/g, " $1 `$2`");
  text = text.replace(/✨ <span.*?>(.*?)<\/span>/g, "✨ **$1**");
  text = text.replace(/💥 <span.*?>(.*?)<\/span>/g, "💥 **$1**");
  text = text.replace(/✔️ <span.*?>(.*?)<\/span>/g, "✔️ **$1**");
  text = text.replace(/❌ <span.*?>(.*?)<\/span>/g, "❌ **$1**");
  text = text.replace(/<span class="text-purple-400">\((.*?)\)<\/span>/g, "*($1)*");
  text = text.replace(/\(Alvo: (\d+).*?\)/g, "(Alvo: $1)");
  text = text.replace(/<[^>]*?>/g, '');
  return text.trim();
}


// --- SERVIDOR PRINCIPAL (ATUALIZADO) ---

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { tableId, rollData, chatMessage, userName } = body;

    if (!tableId) throw new Error("Faltando tableId");
    if (!rollData && !chatMessage) throw new Error("Faltando rollData ou chatMessage");

    const supabaseAdmin = createClient(
      Deno.env.get("PROJECT_URL")!,
      Deno.env.get("PROJECT_SERVICE_ROLE_KEY")!,
    );

    const { data: tableData, error: tableError } = await supabaseAdmin
      .from("tables")
      .select("discord_webhook_url")
      .eq("id", tableId)
      .single();

    if (tableError) throw tableError;
    
    const webhookUrl = tableData?.discord_webhook_url;
    if (!webhookUrl) {
      return new Response(JSON.stringify({ message: "Sem webhook configurado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // --- LÓGICA DE PAYLOAD ATUALIZADA ---
    let payload = {};

    // CASO A: Temos dados estruturados (TODAS as rolagens de diálogo e /r)
    if (rollData) {
      payload = buildPayload(rollData as RollData, userName || "Rolagem");
    } 
    // CASO B: Recebemos HTML (Fallback para rolagens de Proteção, etc.)
    else if (chatMessage) {
      const formattedContent = formatHtmlFallback(chatMessage as string);
      payload = {
        username: userName || "Symbaroum VTT",
        content: formattedContent,
      };
    } 
    // CASO C: Erro
    else {
      throw new Error("Payload inválido");
    }
    
    // --- FIM DA LÓGICA DO PAYLOAD ---
    
    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!discordResponse.ok) {
      console.error("Erro ao enviar para o Discord:", await discordResponse.text());
      return new Response(JSON.stringify({ error: "Falha ao enviar para o Discord." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro na Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});