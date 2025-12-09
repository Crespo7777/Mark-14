// supabase/functions/discord-roll-handler/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- CONSTANTES DE COR ---
const DISCORD_COLORS = {
  CRITICAL: 3066993,  // Verde
  SUCCESS: 65280,     // Verde Neon
  FUMBLE: 15158332,   // Vermelho Escuro
  FAILURE: 10038562,  // Vermelho
  INFO: 14981709,     // Âmbar
  DEFENSE: 3447003    // Azul
};

// --- HELPER DE SEGURANÇA (IMPORTANTE!) ---
// Previne que valores undefined quebrem o envio para o Discord
const safeStr = (text: any, fallback = "Desconhecido"): string => {
  if (typeof text === 'string' && text.trim().length > 0) return text;
  if (typeof text === 'number') return String(text);
  return fallback;
};

// --- TIPOS ---
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

// --- FORMATADORES ---

const getResultColor = (result: AttributeRollResult): number => {
  if (result.isCrit) return DISCORD_COLORS.CRITICAL;
  if (result.isSuccess) return DISCORD_COLORS.SUCCESS;
  if (result.isFumble) return DISCORD_COLORS.FUMBLE;
  return DISCORD_COLORS.FAILURE;
};

const formatResultString = (result: AttributeRollResult): string => {
  if (result.isCrit) return "✨ **Sucesso Crítico!**";
  if (result.isSuccess) return "✔️ **Sucesso**";
  if (result.isFumble) return "💥 **Falha Crítica!**";
  return "❌ **Falha**";
};

const formatRollString = (result: AttributeRollResult): string => {
  let rollStr = `${result.mainRoll} (d20)`;
  if (result.advantageRoll) {
    rollStr += ` + ${result.advantageRoll} (d4)`;
  }
  return `\`${rollStr} = ${result.totalRoll}\``;
};

const formatTargetString = (result: AttributeRollResult): string => {
  const target = result.target || 0;
  let modStr = "";
  if (result.modifier > 0) modStr = ` [${target - result.modifier} +${result.modifier}]`;
  if (result.modifier < 0) modStr = ` [${target - result.modifier} ${result.modifier}]`;
  return `\`${target}\`${modStr}`;
};

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
    author: { name: safeStr(authorName, "Alguém") },
    title: safeStr(title, "Teste"),
    fields: fields,
    color: getResultColor(result),
    footer: footerText ? { text: footerText } : { text: "Mark-14 VTT" },
  };
};

const buildPayload = (rollData: any, userName: string) => {
  let embed: any = {};
  const safeUser = safeStr(userName, "Rolagem");

  try {
    switch (rollData.rollType) {
      case "manual": {
        const { command, result } = rollData;
        const rollsStr = `[${result.rolls.join(", ")}]`;
        const modStr = result.modifier > 0 ? ` + ${result.modifier}` : (result.modifier < 0 ? ` - ${Math.abs(result.modifier)}` : "");
        const description = `${rollsStr}${modStr} = **${result.total}**`;
        
        embed = {
          author: { name: safeUser },
          title: `Rolou ${safeStr(command, "Dados")}`,
          description: description,
          color: DISCORD_COLORS.INFO,
          footer: { text: "Mark-14 VTT" }
        };
        break;
      }
      case "attribute":
        embed = buildTestEmbed(`Teste de ${safeStr(rollData.attributeName, "Atributo")}`, safeUser, rollData.result);
        break;
      case "attack":
        embed = buildTestEmbed(
            `Ataque com ${safeStr(rollData.weaponName, "Arma")}`, 
            safeUser, 
            rollData.result, 
            `Atributo: ${safeStr(rollData.attributeName, "???")}`
        );
        break;
      case "defense":
        embed = buildTestEmbed(`Teste de Defesa`, safeUser, rollData.result);
        break;
      case "ability":
        const footer = rollData.corruptionCost > 0 
            ? `+${rollData.corruptionCost} Corrupção | Atributo: ${safeStr(rollData.attributeName, "?")}` 
            : `Atributo: ${safeStr(rollData.attributeName, "?")}`;
        embed = buildTestEmbed(`Usou ${safeStr(rollData.abilityName, "Habilidade")}`, safeUser, rollData.result, footer);
        break;
      case "damage": {
        const baseRolls = rollData.baseRoll?.rolls || [0];
        let rollStr = `[${baseRolls.join(", ")}] (Base)`;
        
        if (rollData.advantageRoll && rollData.advantageRoll.rolls) {
          rollStr += ` + [${rollData.advantageRoll.rolls.join(", ")}] (Vantagem)`;
        }
        if (rollData.modifier > 0) {
          rollStr += ` + ${rollData.modifier} (Mod)`;
        } else if (rollData.modifier < 0) {
          rollStr += ` - ${Math.abs(rollData.modifier)} (Mod)`;
        }
        embed = {
          author: { name: safeUser },
          title: `Dano com ${safeStr(rollData.weaponName, "Arma")}`,
          description: `${rollStr}\nTotal = **${rollData.totalDamage}** Dano`,
          color: DISCORD_COLORS.INFO,
          footer: { text: "Mark-14 VTT" }
        };
        break;
      }
      case "protection": {
          const rolls = rollData.result?.rolls || [0];
          const rollsStr = `[${rolls.join(", ")}]`;
          const mod = rollData.result?.modifier || 0;
          const modStr = mod > 0 ? ` + ${mod}` : (mod < 0 ? ` - ${Math.abs(mod)}` : "");
          
          embed = {
            author: { name: safeUser },
            title: `Proteção: ${safeStr(rollData.armorName, "Armadura")}`,
            description: `${rollsStr}${modStr}\nAbsorveu = **${rollData.result?.total || 0}** Dano`,
            color: DISCORD_COLORS.DEFENSE,
            footer: { text: "Mark-14 VTT" }
          };
          break;
      }
      default:
        embed = {
          title: "Rolagem Desconhecida",
          description: "Tipo de rolagem não reconhecido.",
          color: DISCORD_COLORS.FAILURE
        };
        break;
    }
  } catch (e) {
    console.error("Erro ao construir embed:", e);
    embed = {
        title: "Erro de Formatação",
        description: "Ocorreu um erro interno ao formatar os dados.",
        color: DISCORD_COLORS.FAILURE
    };
  }

  return {
    username: "Mark-14 Bot",
    embeds: [embed]
  };
};

function formatHtmlFallback(html: string): string {
  if (!html) return "Mensagem vazia";
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { tableId, rollData, chatMessage, userName } = body;

    if (!tableId) throw new Error("Faltando tableId");

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
    
    let payload = {};
    if (rollData) {
      payload = buildPayload(rollData, userName);
    } else if (chatMessage) {
      const formattedContent = formatHtmlFallback(chatMessage as string);
      payload = {
        username: userName || "Mark-14",
        content: formattedContent,
      };
    } else {
      throw new Error("Payload inválido");
    }
    
    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!discordResponse.ok) {
      // --- CAPTURA O ERRO REAL DO DISCORD ---
      const errorText = await discordResponse.text();
      console.error("Discord Error:", errorText);
      console.error("Payload Tentado:", JSON.stringify(payload));
      
      return new Response(JSON.stringify({ error: "Discord rejeitou a mensagem.", details: errorText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Erro na Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});