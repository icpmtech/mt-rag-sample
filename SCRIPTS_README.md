# 📦 Scripts de Ambiente - Resumo

Este diretório contém scripts para facilitar o setup e execução da aplicação RAG.

## 📁 Scripts Disponíveis

### 🔧 `load-env.ps1`
**Propósito**: Carrega todas as variáveis de ambiente do Azure Developer CLI

**Uso**:
```powershell
.\load-env.ps1
```

**O que faz**:
- ✅ Carrega todas as variáveis do ambiente azd ativo
- ✅ Verifica se as variáveis essenciais estão definidas
- ✅ Mostra um resumo das configurações principais
- ✅ Fornece feedback colorido sobre o status

### 🔍 `check-env.ps1`
**Propósito**: Verifica se as variáveis de ambiente estão carregadas na sessão atual

**Uso**:
```powershell
.\check-env.ps1
```

**O que faz**:
- 🔍 Verifica se as variáveis essenciais estão carregadas
- 📋 Mostra informações sobre o ambiente atual
- 💡 Fornece comandos úteis para executar a aplicação
- ⚠️ Alerta se alguma variável está faltando

### 🚀 `start-app.ps1`
**Propósito**: Inicia a aplicação completa (backend + frontend)

**Uso**:
```powershell
.\start-app.ps1
```

**O que faz**:
- 📋 Carrega variáveis de ambiente automaticamente
- 🐍 Ativa o ambiente virtual Python
- ⚙️ Inicia o backend em background (porta 50505)
- 🎨 Inicia o frontend em modo desenvolvimento (porta 3000)
- 🛑 Para ambos os serviços quando interrompido

## 🎯 Fluxo Recomendado

### Para desenvolvimento diário:
```powershell
# Opção 1: Script tudo-em-um (mais simples)
.\start-app.ps1

# Opção 2: Controle manual (mais flexível)
.\load-env.ps1
.\app\start.ps1
```

### Para verificar configuração:
```powershell
.\check-env.ps1
```

### Para recarregar variáveis:
```powershell
.\load-env.ps1
```

## 🌐 URLs da Aplicação

Após iniciar a aplicação:
- **Frontend (React)**: http://localhost:3000
- **Backend (Quart)**: http://localhost:50505

## 🛠️ Pré-requisitos

Antes de usar os scripts, certifique-se de que:
- ✅ Azure Developer CLI (azd) está instalado
- ✅ Ambiente azd está configurado (`azd env list` mostra seu ambiente)
- ✅ Python 3.9+ está instalado
- ✅ Node.js 18+ está instalado
- ✅ Recursos Azure foram provisionados (`azd provision`)

## 🚨 Resolução de Problemas

### ❌ "azd not found" ou comando não reconhecido
- Instale o Azure Developer CLI
- Reinicie o terminal após a instalação

### ❌ Variáveis não carregadas
- Execute `azd env list` para verificar ambientes
- Execute `azd env select <nome-ambiente>` se necessário
- Execute `.\load-env.ps1` novamente

### ❌ Erro no ambiente virtual Python
- Navegue para `app/` e execute: `python -m venv .venv`
- Ative: `.\.venv\Scripts\Activate.ps1`
- Instale dependências: `pip install -r backend/requirements.txt`

### ❌ Erro no npm/frontend
- Navegue para `app/frontend/`
- Execute: `npm install`
- Execute: `npm run build`

## 📝 Logs e Debug

Para ver logs mais detalhados:
```powershell
$env:APP_LOG_LEVEL = "DEBUG"
.\start-app.ps1
```

## 🔄 Atualização dos Scripts

Os scripts são projetados para ser atualizados conforme o projeto evolui. 
Se você adicionar novas variáveis de ambiente ou dependências, 
atualize os scripts correspondentes para manter a consistência.