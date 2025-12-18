import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper simples para limpar HTML se receber mensagem de texto pura
function formatHtmlFallback(html: string): string {
  if (!html) return "Mensagem vazia";
  let text = html.replace(/<br\s*\/?>/gi, '\n').replace(/\n/g, '\n');
  text = text.replace(/<[^>]*?>/g, ''); // Remove tags
  return text.trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { tableId, discordPayload, chatMessage, userName } = body;

    if (!tableId) throw new Error("Faltando tableId");

    // 1. Busca URL do Webhook
    const supabaseAdmin = createClient(
      Deno.env.get("PROJECT_URL")!,
      Deno.env.get("PROJECT_SERVICE_ROLE_KEY")!,
    );

    const { data: tableData, error: tableError } = await supabaseAdmin
      .from("tables")
      .select("discord_webhook_url")
      .eq("id", tableId)
      .single();

    if (tableError || !tableData?.discord_webhook_url) {
      console.log("Sem webhook configurado para a mesa:", tableId);
      return new Response(JSON.stringify({ message: "Sem webhook." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, 
      });
    }

    const webhookUrl = tableData.discord_webhook_url;
    let finalPayload = {};

    // 2. Monta o Payload para o Discord
    if (discordPayload) {
        // MODO NOVO: O Frontend já mandou o JSON pronto (Embeds)
        finalPayload = {
            username: userName || "Mark-14",
            ...discordPayload // Espalha embeds, content, etc.
        };
    } else if (chatMessage) {
        // MODO LEGADO/TEXTO: Converte HTML simples para texto
        finalPayload = {
            username: userName || "Mark-14",
            content: formatHtmlFallback(chatMessage),
        };
    } else {
        // Payload vazio ignora silenciosamente
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // 3. Envia para o Discord
    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalPayload),
    });

    if (!discordResponse.ok) {
      const errText = await discordResponse.text();
      console.error("Erro Discord:", errText);
      return new Response(JSON.stringify({ error: "Discord recusou." }), { headers: corsHeaders, status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Erro Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});