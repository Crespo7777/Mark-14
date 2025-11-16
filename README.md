# Symbaroum VTT

![Banner do Symbaroum VTT](caminho/para/tua/imagem_de_banner.png)
Um Virtual Tabletop (VTT) completo, focado no sistema de RPG Symbaroum. Esta plataforma permite que Mestres de Jogo criem e gerenciem mesas, enquanto jogadores podem criar e interagir com as suas fichas de personagem digitais em tempo real.

O projeto usa **React (Vite)** no frontend e **Supabase** para todo o backend, incluindo autenticação, base de dados em tempo real, e funções de servidor.

## 🔮 Funcionalidades Principais

* **Gestão de Mesas:**
    * Criação e gestão de mesas de RPG para Mestres.
    * Sistema para jogadores entrarem e participarem nas mesas.
* **Painéis de Controlo:**
    * **Visão do Mestre:** Controlo total sobre NPCs, fichas de jogadores, e entradas de diário globais.
    * **Visão do Jogador:** Acesso às fichas de personagem pessoais, NPCs partilhados e diário da mesa.
* **Fichas de Personagem e NPC:**
    * Fichas digitais completas e editáveis, separadas por abas (Atributos, Combate, Habilidades, Equipamento, etc.).
    * Cálculos automáticos de Vitalidade, Limiar de Dor, Defesa e Carga.
* **Chat e Rolagens:**
    * Chat em tempo real para cada mesa, com suporte a RLS (Row Level Security) para mensagens secretas do Mestre.
    * Sistema de rolagem de dados interativo (ex: `/r 1d20+5`).
    * Rolagens diretas da ficha (testes de atributo, ataques, dano, defesa).
* **Diário (Journal):**
    * Editor de Rich Text (baseado em Tiptap) para criar entradas de diário.
    * Sistema de permissões para entradas do Mestre, privadas do jogador, ou ligadas a personagens/NPCs.
* **Integração com Discord:**
    * Uma Edge Function da Supabase envia automaticamente todas as rolagens de dados para um canal de Discord configurado pelo Mestre.

## 🛠️ Tecnologias Utilizadas

* **Frontend:**
    * [React](https://react.dev/) (com [Vite](https://vitejs.dev/))
    * [TypeScript](https://www.typescriptlang.org/)
    * [Tailwind CSS](https://tailwindcss.com/)
    * [shadcn/ui](https://ui.shadcn.com/) (Biblioteca de componentes)
* **Backend (BaaS):**
    * [Supabase](https://supabase.com/)
    * **Auth:** Gestão de utilizadores e autenticação.
    * **PostgreSQL:** Base de dados relacional.
    * **Realtime:** Sockets para chat ao vivo e atualizações de fichas.
    * **Edge Functions:** Função serverless (Deno) para a integração com Discord.
* **Gestão de Estado e Formulários:**
    * React Context (para estado global da mesa/ficha).
    * [React Hook Form](https://react-hook-form.com/) (para gestão de formulários complexos nas fichas).
    * [Zod](https://zod.dev/) (para validação de schemas).
* **Editor de Texto:**
    * [Tiptap](https://tiptap.dev/)

---

## 🚀 Como Executar o Projeto Localmente

Para configurar este projeto, precisas de configurar o frontend (Vite) e o backend (Supabase).

### 1. Clonar o Repositório

```bash
git clone [URL_DO_TEU_REPOSITORIO_GIT]
cd [NOME_DA_PASTA_DO_PROJETO]

2. Instalar Dependências do Frontend

Bash

npm install

3. Configurar o Backend (Supabase)

Precisas de uma conta gratuita na Supabase para o backend.

    Criar Projeto: Vai a supabase.com e cria um novo projeto.

    Configurar Variáveis de Ambiente:

        No teu projeto Supabase, vai a Settings > API.

        Encontra a URL do Projeto e a Chave anon (public).

        Na raiz do teu projeto local, cria um ficheiro chamado .env.

        Copia o conteúdo abaixo e substitui pelas tuas chaves:
    Snippet de código

# .env (ficheiro local)
# Substitui com os teus dados da Supabase

VITE_SUPABASE_URL="https://[TEU-ID-DE-PROJETO].supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="[TUA-CHAVE-ANON-PUBLIC]"

Configurar a Base de Dados (Migrações): A forma mais fácil de configurar as tuas tabelas e políticas de segurança é usando a Supabase CLI.
Bash

# 1. Instala a Supabase CLI (se ainda não a tens)
npm install -g supabase

# 2. Faz login na tua conta Supabase
supabase login

# 3. Navega para a pasta 'supabase' do projeto
cd supabase

# 4. Liga o teu projeto local ao projeto na nuvem
# (Encontras o [PROJECT-ID] em Settings > General no teu painel Supabase)
supabase link --project-ref [PROJECT-ID]

# 5. Envia a estrutura da base de dados (tabelas e políticas) para a nuvem
supabase db push

Alternativa Manual: Se não quiseres usar a CLI, podes copiar o conteúdo de todos os ficheiros .sql da pasta supabase/migrations (pela ordem de data, do mais antigo ao mais recente) e colá-los no SQL Editor do teu painel Supabase.

Implementar a Edge Function (Integração com Discord): Esta função envia as rolagens para o Discord.
Bash

    # 1. (Ainda na pasta 'supabase') Faz o deploy da função
    # O --no-verify-jwt é necessário porque a chamamos do lado do cliente
    supabase functions deploy discord-roll-handler --no-verify-jwt

    # 2. Adiciona as Secrets (Chaves)
    # A tua função precisa de saber o URL do teu projeto e a chave de serviço
    # Vai ao painel Supabase -> Edge Functions -> 'discord-roll-handler' -> Secrets

    # Adiciona a Secret: PROJECT_URL
    # Valor: (A tua URL do Supabase, ex: https://[ID].supabase.co)
    supabase secrets set PROJECT_URL="https://[TEU-ID-DE-PROJETO].supabase.co"

    # Adiciona a Secret: PROJECT_SERVICE_ROLE_KEY
    # Valor: (A tua chave 'service_role' de Settings > API)
    supabase secrets set PROJECT_SERVICE_ROLE_KEY="[TUA-CHAVE-SERVICE-ROLE]"

4. Iniciar a Aplicação Local

Agora que o frontend e o backend estão configurados:
Bash

# 1. Volta para a pasta raiz do projeto
cd ..

# 2. Inicia o servidor de desenvolvimento
npm run dev

A aplicação deverá estar a correr em http://localhost:8080 (ou outra porta indicada).
