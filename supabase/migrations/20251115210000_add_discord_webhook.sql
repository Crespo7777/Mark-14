-- supabase/migrations/20251115210000_add_discord_webhook.sql

-- 1. Adicionar a nova coluna para armazenar o URL do Webhook
ALTER TABLE public.tables
ADD COLUMN discord_webhook_url TEXT;

-- 2. (IMPORTANTE) Remover a política de SELECT antiga e muito permissiva
DROP POLICY IF EXISTS "Anyone can view tables" ON public.tables;

-- 3. Adicionar política de SELECT para Jogadores
-- Permite que jogadores vejam as mesas em que estão
CREATE POLICY "Players can view tables they are members of"
  ON public.tables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.table_members
      WHERE table_members.table_id = tables.id
      AND table_members.user_id = auth.uid()
    )
  );
  
-- 4. (IMPORTANTE) Configurar Segurança em Nível de Coluna (CLS)

-- Por padrão, ninguém (exceto o Mestre via sua política "FOR ALL") 
-- pode ver ou atualizar a nova coluna.
-- Concedemos explicitamente permissão de SELECT nas colunas "seguras"
-- para qualquer usuário autenticado (a RLS do Passo 3 ainda se aplica
-- para determinar *quais linhas* eles podem ver).
GRANT SELECT (id, name, description, master_id, created_at) 
ON public.tables 
TO authenticated;

-- A política "Masters can manage their tables" (FOR ALL) 
-- já existente garante que o Mestre (auth.uid() = master_id)
-- tenha permissão total (SELECT, UPDATE, etc.) em *todas* as colunas,
-- incluindo a nova 'discord_webhook_url'.