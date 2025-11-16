// supabase/functions/discord-roll-handler/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Interface para os dados estruturados da rolagem /r
 */
interface ManualRollData {
  command: string; // Ex: "1d20+5"
  result: {
    rolls: number[]; // Ex: [15]
    modifier: number; // Ex: 5
    total: number; // Ex: 20
  };
  userName: string; // Ex: "Kaed"
  rollType: "manual";
}

/**
 * Função de fallback para limpar o HTML das rolagens antigas (Testes de Atributo, etc.)
 * Esta é a tua função original, mas com a RegEx de limpeza corrigida.
 */
function formatHtmlFallback(html: string): string {
  let text = html;

  // Quebras de linha
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/\n/g, '\n');

  // Nomes e Títulos
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
  text = text.replace(/\(Alvo: (\d+).*?\)/g, "(Alvo: $1)");

  // CORREÇÃO: Limpar tags HTML restantes de forma NÃO-GULOSA (adiciona o '?')
  text = text.replace(/<[^>]*?>/g, '');

  return text.trim();
}


Deno.serve(async (req: Request) => {
  // Tratar chamada OPTIONS (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Validar a requisição
    // O body pode ter 'rollData' (novo) ou 'chatMessage' (antigo)
    const body = await req.json();
    const { tableId, rollData, chatMessage, userName } = body;

    if (!tableId) {
      throw new Error("Faltando tableId");
    }
    
    if (!rollData && !chatMessage) {
      throw new Error("Faltando rollData ou chatMessage");
    }

    // 2. Criar um cliente Supabase com privilégios de SERVIÇO (ignora RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("PROJECT_URL")!,
      Deno.env.get("PROJECT_SERVICE_ROLE_KEY")!,
    );

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
    
    // --- 5. LÓGICA DE CRIAÇÃO DO PAYLOAD ---
    
    let payload = {};

    // CASO A: Temos dados estruturados (do /r no ChatPanel)
    if (rollData && rollData.rollType === "manual") {
      const data = rollData as ManualRollData;
      const { command, result, userName: rollUserName } = data;
      
      // Formata a descrição da rolagem
      const rollsStr = `[${result.rolls.join(", ")}]`;
      const modStr = result.modifier > 0 ? ` + ${result.modifier}` : (result.modifier < 0 ? ` - ${Math.abs(result.modifier)}` : "");
      const description = `${rollsStr}${modStr} = **${result.total}**`;
      
      payload = {
        username: rollUserName || "Symbaroum VTT",
        // avatar_url: "URL_DO_ICONE_AQUI",
        embeds: [{
          author: {
            name: rollUserName || "Rolagem"
          },
          title: `Rolou ${command}`,
          description: description,
          color: 14981709, // Um tom de "accent" (âmbar)
          footer: {
            text: "Symbaroum VTT"
          }
        }]
      };
      
    } 
    // CASO B: Recebemos HTML (das outras rolagens de diálogo)
    else if (chatMessage) {
      const formattedContent = formatHtmlFallback(chatMessage as string);
      payload = {
        username: userName || "Symbaroum VTT", // Usa o userName se foi passado
        // avatar_url: "URL_DO_ICONE_AQUI",
        content: formattedContent,
      };
    } 
    // CASO C: Erro
    else {
      throw new Error("Payload inválido");
    }
    
    // --- FIM DA LÓGICA DO PAYLOAD ---
    
    // 7. Enviar para o Discord
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