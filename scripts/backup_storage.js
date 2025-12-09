// scripts/backup_storage.js
import { createClient } from '@supabase/supabase-js';
// CORRIGIDO: Adicionamos rmSync à lista de importações para compatibilidade ESM
import { createWriteStream, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import archiver from 'archiver'; 

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Erro: Variáveis SUPABASE_URL ou SERVICE_KEY não definidas.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const BUCKET_NAME = 'campaign-images'; // Ajuste se tiver outros buckets

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_DIR = join('backups', 'storage_' + TIMESTAMP);
const ZIP_FILE = BACKUP_DIR + '.zip';

// Criar pasta de trabalho
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

async function downloadFile(bucket, filePath) {
  // Chamada à API para download
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error) throw error;
  
  const targetPath = join(BACKUP_DIR, filePath);
  
  // FIX CRÍTICO: Converte o ArrayBuffer para Buffer de forma ASSÍNCRONA antes do Promise
  const buffer = Buffer.from(await data.arrayBuffer());
  
  // Garantir que a subpasta existe (se o arquivo estiver em 'items/1.png', cria 'items')
  const dir = join(targetPath, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Gravar o arquivo localmente
  const writer = createWriteStream(targetPath);
  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
    // Usa o Buffer já preparado
    writer.end(buffer);
  });
}

// Lógica de listagem mais robusta contra pastas e paginação
async function listAllFiles(bucket) {
    let allFiles = [];
    let offset = 0;
    const LIMIT = 100;
    let hasMore = true;

    while (hasMore) {
        // list() com offset para paginação (não usamos o path como offset, mas sim o número)
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(null, { 
                limit: LIMIT, 
                offset: offset,
                sortBy: { column: 'name', order: 'asc' }
            });

        if (error) {
            console.error("Erro ao listar arquivos:", error);
            break;
        }

        // --- FILTRO DE ROBUSTEZ ---
        // 1. Garante que é um arquivo real (folders/placeholders têm id null ou são o root path)
        // 2. O .name === "" é o próprio bucket, que ignoramos.
        const files = data.filter(item => 
            item.name !== '.emptyFolderPlaceholder' && 
            item.id !== null &&
            item.name !== ""
        );

        // O nome do arquivo no storage inclui o path (ex: 'items/123.png')
        allFiles.push(...files.map(f => f.name));
        
        // Se recebemos menos que o limite, não há mais páginas
        hasMore = data.length === LIMIT;
        offset += data.length;
        
        if (hasMore) {
           console.log(`AVISO: Paginação em curso. Total de itens listados: ${offset}.`);
        }
    }
    return allFiles;
}

async function runStorageBackup() {
    console.log(`Iniciando backup do Storage para ${BUCKET_NAME}...`);
    
    const allFiles = await listAllFiles(BUCKET_NAME);
    console.log(`Encontrados ${allFiles.length} arquivos.`);

    for (const file of allFiles) {
        try {
            console.log(`Baixando: ${file}`);
            await downloadFile(BUCKET_NAME, file);
        } catch (e) {
            // Se falhar o download (pode ser problema de RLS ou item corrompido), 
            // registramos o erro e continuamos, garantindo que o backup não pára.
            console.error(`Falha ao baixar ${file}:`, e.message || 'Erro desconhecido');
        }
    }
    
    // Compressão
    const output = createWriteStream(ZIP_FILE);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function() {
      console.log(`Backup Storage completo: ${archive.pointer()} bytes.`);
      // CORRIGIDO: Agora rmSync é importado e funciona no contexto ESM.
      rmSync(BACKUP_DIR, { recursive: true, force: true });
    });

    archive.pipe(output);
    // Adicionamos todos os arquivos da pasta de trabalho
    archive.directory(BACKUP_DIR, false);
    await archive.finalize();
}

runStorageBackup().catch(err => {
    console.error("Erro fatal no backup do Storage:", err);
    process.exit(1);
});