#!/bin/bash

# Define o nome do arquivo com timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/db_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo "Gerando dumps SQL..."

# 1. Dump do Schema e Roles - AGORA USAMOS NPX
npx supabase db dump --schema --data-only --role-only --project-ref "$SUPABASE_PROJECT_REF" --db-url "$SUPABASE_DB_URL" -f "$BACKUP_DIR/schema_roles.sql"

# 2. Dump Apenas dos Dados - AGORA USAMOS NPX
npx supabase db dump --data-only --project-ref "$SUPABASE_PROJECT_REF" --db-url "$SUPABASE_DB_URL" \
    --exclude-schema auth,storage \
    -f "$BACKUP_DIR/data.sql"

echo "Compressão do banco..."
zip -r "$BACKUP_DIR.zip" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"
echo "Backup SQL completo: $BACKUP_DIR.zip"