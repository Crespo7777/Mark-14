import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const COLORS = {
  CRITICAL: 5763719, SUCCESS: 5763719, FAILURE: 9807270,
  FUMBLE: 15548997, DAMAGE: 15158332, SECRET: 7419530
}

const safeStr = (val: any, def = "") => (val ? String(val) : def);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Agora aceitamos 'webhook_url' vindo do Frontend
    const { character, label, total, formula, breakdown, type, degree, is_secret, webhook_url } = await req.json()

    // 2. Prioridade: Usa o URL enviado pela ficha. Se não houver, tenta o Global (fallback).
    const targetUrl = webhook_url || Deno.env.get('DISCORD_WEBHOOK_URL');

    if (!targetUrl) {
      // Retorna 200 OK para não dar erro no console do navegador, mas avisa no log do servidor
      console.log("Nenhum Webhook configurado.");
      return new Response(JSON.stringify({ skipped: true, reason: 'No webhook' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Lógica de Spoiler
    const isHidden = is_secret === true;
    const valTotal = isHidden ? `|| **${total}** ||` : `**${total}**`;
    const valFormula = isHidden ? `|| ${safeStr(formula)} ||` : safeStr(formula);
    const valBreakdown = isHidden ? `|| ${safeStr(breakdown)} ||` : safeStr(breakdown);
    const titlePrefix = isHidden ? "🤫 [SECRETO] " : "";
    
    // Cores
    let color = 3447003;
    if (isHidden) color = COLORS.SECRET;
    else if (type === 'damage') color = COLORS.DAMAGE;
    else if (degree === 'crit-success') color = COLORS.CRITICAL;
    else if (degree === 'crit-failure') color = COLORS.FUMBLE;
    else if (degree === 'success') color = COLORS.SUCCESS;
    else if (degree === 'failure') color = COLORS.FAILURE;

    const embed = {
      title: `${titlePrefix}${safeStr(character, "Personagem")} rolou dados!`,
      description: `**${safeStr(label)}**\n\nResultado: ${valTotal}`,
      color: color,
      fields: [
        { name: "Fórmula", value: valFormula || "N/A", inline: true },
        { name: "Detalhes", value: valBreakdown || "N/A", inline: true }
      ],
      footer: { text: `Pathfinder 2e • ${safeStr(type).toUpperCase()}` }
    };

    if (degree && type !== 'damage') {
      let degreeText = "Sucesso";
      if (degree === 'crit-success') degreeText = "Sucesso Crítico!";
      if (degree === 'crit-failure') degreeText = "Falha Crítica!";
      if (degree === 'failure') degreeText = "Falha";
      embed.fields.push({ name: "Grau", value: isHidden ? `|| ${degreeText} ||` : degreeText, inline: false });
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })

    if (!response.ok) throw new Error("Discord rejected the message");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})