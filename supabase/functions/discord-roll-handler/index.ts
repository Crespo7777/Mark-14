// supabase/functions/discord-roll-handler/index.ts
// (Versão "unificada" para o editor online do Supabase - v2)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";

// 1. O código de _shared/cors.ts foi colado aqui
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Função para limpar o HTML da mensagem de chat e convertê-lo em Markdown
 * básico para o Discord.
 */
function formatHtmlToDiscord(html: string): string {
  let text = html;

  // Quebras de linha
  text = text.replace(/\n/g, '\n');

  // Nomes e Títulos (Ex: "Gandalf ataca com...")
  text = text.replace(
    /^(.*?) (fez um teste de|ataca com|rola o dano de|rola|usou) <span.*?>(.*?)<\/span>/m,
    "**$1** $2 **$3**"
  );
  
  // Resultado Grande (Ex: "= 10")
  text = text.replace(/= <span class="text-primary-foreground font-bold text-lg">(.*?)<\/span>/g, "= **$1**");

  // Rolagens (Ex: "[5, 2]")
  text = text.replace(/\[<span class="text-primary-foreground">(.*?)<\/span>\]/g, "[`$1`]");
  
  // Modificadores (Ex: "+ 3")
  text = text.replace(/ ([+\-]) <span class="text-primary-foreground">(.*?)<\/span>/g, " $1 `$2`");
  
  // Resultados (Crítico, Sucesso, Falha)
  text = text.replace(/✨ <span.*?>(.*?)<\/span>/g, "✨ **$1**");
  text = text.replace(/💥 <span.*?>(.*?)<\/span>/g, "💥 **$1**");
  text = text.replace(/✔️ <span.*?>(.*?)<\/span>/g, "✔️ **$1**");
  text = text.replace(/❌ <span.*?>(.*?)<\/span>/g, "❌ **$1**");

  // Corrupção
  text = text.replace(/<span class="text-purple-400">\((.*?)\)<\/span>/g, "*($1)*");

  // Alvo (Ex: "(Alvo: 10 [12-2])")
  // Simplifica, removendo o cálculo interno
  text = text.replace(/\(Alvo: (\d+).*?\)/g, "(Alvo: $1)");

  // Limpar quaisquer tags HTML restantes
  text = text.replace(/<[^>]*>/g, '');

  return text.trim();
}


Deno.serve(async (req: Request) => {
  // Tratar chamada OPTIONS (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Validar a requisição
    const { tableId, chatMessage } = await req.json();
    if (!tableId || !chatMessage) {
      throw new Error("Faltando tableId ou chatMessage");
    }

    // 2. Criar um cliente Supabase com privilégios de SERVIÇO (ignora RLS)
    // ###################################
    // ### INÍCIO DA CORREÇÃO ###
    // ###################################
    // Usar os novos nomes de secrets
    const supabaseAdmin = createClient(
      Deno.env.get("PROJECT_URL")!,
      Deno.env.get("PROJECT_SERVICE_ROLE_KEY")!,
    );
    // ###################################
    // ### FIM DA CORREÇÃO ###
    // ###################################

    // 3. Buscar o Webhook URL da tabela
    const { data: tableData, error: tableError } = await supabaseAdmin
      .from("tables")
      .select("discord_webhook_url")
      .eq("id", tableId)
      .single();

    if (tableError) throw tableError;
    
    const webhookUrl = tableData?.discord_webhook_url;

    // 4. Se não houver URL, apenas saia com sucesso (sem erro)
    if (!webhookUrl) {
      return new Response(JSON.stringify({ message: "Sem webhook configurado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // 5. Formatar a mensagem HTML para Markdown
    const discordContent = formatHtmlToDiscord(chatMessage);
    
    // 6. Preparar o payload para o Discord
    const payload = {
      // 'username': "Symbaroum VTT", // Opcional: define o nome do "bot"
      // 'avatar_url': "https://.../meu-icone.png", // Opcional
      content: discordContent,
    };
    
    // 7. Enviar para o Discord
    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!discordResponse.ok) {
      // Se o Discord falhar (ex: URL inválido), loga o erro mas não falha para o usuário
      console.error("Erro ao enviar para o Discord:", await discordResponse.text());
      return new Response(JSON.stringify({ error: "Falha ao enviar para o Discord." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500, // Indica um erro no servidor
      });
    }

    // 8. Sucesso
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