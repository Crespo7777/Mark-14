-- Corrige as permissões para a coluna discord_webhook_url
-- Autoriza usuários logados a lerem e atualizarem o webhook

GRANT SELECT (discord_webhook_url) ON public.tables TO authenticated;
GRANT UPDATE (discord_webhook_url) ON public.tables TO authenticated;