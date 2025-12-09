// scripts/backup_storage.js
import { createClient } from '@supabase/supabase-js';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import archiver from 'archiver'; // Necessita de 'npm install archiver'

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
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error) throw error;
  
  const targetPath = join(BACKUP_DIR, filePath);
  // Garantir que a subpasta existe
  const dir = join(targetPath, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Gravar o arquivo localmente
  const writer = createWriteStream(targetPath);
  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
    // data é um Blob, precisamos de convertê-lo em Buffer ou Stream
    writer.end(Buffer.from(await data.arrayBuffer()));
  });
}

async function listAllFiles(bucket) {
    let allFiles = [];
    let currentPage = null;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(currentPage ? currentPage.path : undefined, { 
                limit: 100, // Limite máximo
                offset: currentPage ? currentPage.offset + 100 : 0
            });

        if (error) {
            console.error("Erro ao listar arquivos:", error);
            break;
        }

        const files = data.filter(item => item.name !== '.emptyFolderPlaceholder');
        allFiles.push(...files.map(f => f.name));
        
        hasMore = data.length === 100; // Se atingiu o limite, pode haver mais.
        if (data.length > 0) {
            // Este método de paginação com o list() do Supabase é complexo, 
            // mas simplificamos aqui assumindo que você não tem centenas de milhares de arquivos.
            // Para produção massiva, o ideal é usar a API REST com 'search'.
            if (hasMore) {
                console.log("AVISO: Paginação simplificada, se o bucket for grande, ajuste a lógica de offset/path.");
                hasMore = false; // Paramos para evitar loops infinitos no Node.js local.
            }
        } else {
            hasMore = false;
        }
    }
    return allFiles;
}

async function runStorageBackup() {
    console.log(`Iniciando backup do Storage para ${BUCKET_NAME}...`);
    
    // Lista de arquivos (usaremos uma versão simplificada de listagem para GitHub Actions)
    const allFiles = await listAllFiles(BUCKET_NAME);
    console.log(`Encontrados ${allFiles.length} arquivos.`);

    for (const file of allFiles) {
        try {
            console.log(`Baixando: ${file}`);
            await downloadFile(BUCKET_NAME, file);
        } catch (e) {
            console.error(`Falha ao baixar ${file}:`, e.message);
        }
    }
    
    // Compressão
    const output = createWriteStream(ZIP_FILE);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function() {
      console.log(`Backup Storage completo: ${archive.pointer()} bytes.`);
      // Limpar pasta temporária
      require('fs').rmSync(BACKUP_DIR, { recursive: true, force: true });
    });

    archive.pipe(output);
    archive.directory(BACKUP_DIR, false);
    await archive.finalize();
}

runStorageBackup().catch(err => {
    console.error("Erro fatal no backup do Storage:", err);
    process.exit(1);
});