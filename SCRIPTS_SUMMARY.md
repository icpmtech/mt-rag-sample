# 📋 Resumo dos Scripts de Ambiente

Este documento resume todos os scripts criados para gerenciar a aplicação RAG.

## 🔧 Scripts Disponíveis

### 1. `load-env.ps1` - Carregamento de Variáveis
**Uso:** `.\load-env.ps1`
- ✅ Carrega todas as variáveis de ambiente do azd
- ✅ Verifica se as variáveis essenciais estão definidas
- ✅ Mostra resumo das configurações principais

### 2. `check-env.ps1` - Verificação de Variáveis
**Uso:** `.\check-env.ps1`
- 🔍 Verifica se as variáveis estão carregadas na sessão atual
- 📋 Mostra informações sobre o ambiente ativo
- 💡 Fornece comandos úteis para executar a aplicação

### 3. `stop-ports.ps1` - Limpeza de Portas
**Uso:** `.\stop-ports.ps1`
- 🛑 Identifica processos usando portas específicas (50505, 3000, 5000, 8000)
- ❓ Pergunta antes de parar cada processo
- 🧹 Limpa portas ocupadas para evitar conflitos

### 4. `start-backend.ps1` - Backend Individual
**Uso:** `.\start-backend.ps1`
- 🔍 Encontra automaticamente uma porta disponível (50505-50600)
- 📱 Inicia apenas o backend da aplicação
- ⚡ Carrega variáveis de ambiente automaticamente
- 🔄 Suporte a reload automático durante desenvolvimento

### 5. `start-full-app.ps1` - Aplicação Completa
**Uso:** `.\start-full-app.ps1`
- 🚀 Inicia frontend + backend simultaneamente
- 🎯 Encontra portas disponíveis automaticamente
- 📊 Executa em background jobs para monitoramento
- 🛑 Permite parar todos os serviços com ENTER

## 🎯 Fluxo de Uso Recomendado

### Para Desenvolvimento Diário:
```powershell
# 1. Verificar ambiente
.\check-env.ps1

# 2. Se necessário, carregar variáveis
.\load-env.ps1

# 3. Iniciar aplicação completa
.\start-full-app.ps1
```

### Para Resolver Problemas de Porta:
```powershell
# 1. Parar processos nas portas
.\stop-ports.ps1

# 2. Iniciar backend individual
.\start-backend.ps1
```

### Para Primeira Execução:
```powershell
# 1. Carregar ambiente
.\load-env.ps1

# 2. Verificar se tudo está ok
.\check-env.ps1

# 3. Iniciar aplicação
.\start-full-app.ps1
```

## 🌐 URLs de Acesso

Após iniciar a aplicação, ela estará disponível em:
- **Backend**: http://localhost:[porta-backend] (ex: http://localhost:50544)
- **Frontend**: http://localhost:[porta-frontend] (ex: http://localhost:3000)

As portas são encontradas automaticamente e mostradas na saída dos scripts.

## 🔧 Variáveis Essenciais Verificadas

Os scripts verificam estas variáveis críticas:
- `AZURE_SEARCH_SERVICE` - Serviço Azure Cognitive Search
- `AZURE_SEARCH_INDEX` - Índice de busca
- `AZURE_STORAGE_ACCOUNT` - Conta de armazenamento
- `AZURE_STORAGE_CONTAINER` - Container de armazenamento
- `AZURE_OPENAI_SERVICE` - Serviço Azure OpenAI
- `AZURE_OPENAI_CHATGPT_MODEL` - Modelo de chat GPT
- `AZURE_OPENAI_CHATGPT_DEPLOYMENT` - Deployment do chat
- `AZURE_OPENAI_EMB_MODEL_NAME` - Modelo de embeddings
- `AZURE_OPENAI_EMB_DEPLOYMENT` - Deployment de embeddings
- `AZURE_OPENAI_ENDPOINT` - Endpoint do OpenAI
- `AZURE_VISION_ENDPOINT` - Endpoint do Computer Vision
- `AZURE_TENANT_ID` - ID do tenant Azure
- `AZURE_SUBSCRIPTION_ID` - ID da subscription

## 🐛 Solução de Problemas Comuns

### ❌ "Porta já está sendo usada"
```powershell
.\stop-ports.ps1  # Parar processos
.\start-backend.ps1  # Tentará outra porta
```

### ❌ "Variáveis não carregadas"
```powershell
.\load-env.ps1  # Recarregar do azd
```

### ❌ "Ambiente azd não encontrado"
```powershell
azd env list  # Ver ambientes
azd env select <nome>  # Selecionar ambiente
```

### ❌ "Ambiente virtual não encontrado"
```powershell
cd app
python -m venv .venv
.\.venv\Scripts\Activate.ps1
cd backend
pip install -r requirements.txt
```

## 📝 Logs e Monitoramento

Para ver logs em tempo real quando usando `start-full-app.ps1`:
```powershell
# Ver logs do backend
Receive-Job -Id <backend-job-id> -Keep

# Ver logs do frontend  
Receive-Job -Id <frontend-job-id> -Keep
```

Os IDs dos jobs são mostrados na saída do script.

## 🔄 Atualização

Para atualizar a versão do azd (se mostrar warning):
```powershell
winget upgrade Microsoft.Azd
```