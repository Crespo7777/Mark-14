-- Criar a tabela 'rules'
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
    table_id UUID REFERENCES tables(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    folder_id UUID REFERENCES rule_folders(id) ON DELETE SET NULL,

    CONSTRAINT fk_rules_tables FOREIGN KEY (table_id) REFERENCES tables(id),
    CONSTRAINT fk_rules_user FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT fk_rules_folders FOREIGN KEY (folder_id) REFERENCES rule_folders(id)
);

-- Habilitar RLS (Row-Level Security)
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- ... (Políticas de RLS)
-- A política de SELECT para 'rules' é a mais importante para a leitura.
CREATE POLICY "Rules are visible to all table members"
ON rules FOR SELECT
USING (
    auth.uid() IN (SELECT user_id FROM table_members WHERE table_id = rules.table_id)
);

-- ... (Outras Políticas)