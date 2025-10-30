# Resumo das Alterações para Abertura de Documentos SharePoint

## Problema Resolvido
O sistema estava tentando abrir documentos SharePoint através da rota `/content/` do backend (que serve arquivos do Azure Blob Storage), mas os documentos estavam no SharePoint. Isso causava erros de "URL not found".

## Solução Implementada

### 1. **Logic App (✅ Corrigido + Páginas)**
- **Arquivo**: `c:\mt-rag-azure\rag-logic-app\ingest-app-data\process-data\workflow.json`
- **Mudanças**: 
  - Adicionados campos obrigatórios no mapeamento:
    - `category`: "document"
    - `oids`: [] (para controle de acesso)
    - `groups`: [] (para controle de acesso)
  - **Informação de página**: `sourcepage` agora inclui `#page=N` baseado no índice do chunk
  - **ID único**: Cada chunk recebe ID único com `_chunk_N`
- **Campo storageUrl**: Já estava capturando `{Link}` do SharePoint corretamente

### 2. **Backend - Classe Document (✅ Atualizado)**
- **Arquivo**: `c:\mt-rag-azure\app\backend\approaches\approach.py`
- **Mudanças**:
  - Adicionado campo `storageUrl: Optional[str] = None` na classe Document
  - Incluído `storageUrl` na serialização
  - Processamento do campo `storageUrl` dos resultados de busca

### 3. **Backend - DataPoints (✅ Atualizado)**
- **Arquivo**: `c:\mt-rag-azure\app\backend\approaches\approach.py`
- **Mudanças**:
  - Adicionado `citation_lookup: Optional[dict[str, str]] = None` na classe DataPoints
  - Modificado `get_sources_content()` para construir o mapeamento citation -> URL
  - Incluído citation_lookup no retorno da função

### 4. **Backend - SharePoint Approach (✅ Atualizado)**
- **Arquivo**: `c:\mt-rag-azure\app\backend\approaches\sharepoint_approach.py`
- **Mudanças**:
  - Adicionado citation_lookup na função `get_sharepoint_sources_content()`
  - Mapeamento de títulos de documentos para URLs do SharePoint

### 5. **Frontend - Modelos TypeScript (✅ Atualizado)**
- **Arquivo**: `c:\mt-rag-azure\app\frontend\src\api\models.ts`
- **Mudanças**:
  - Adicionado `citation_lookup?: { [key: string]: string }` no tipo DataPoints

### 6. **Frontend - API (✅ Atualizado)**
- **Arquivo**: `c:\mt-rag-azure\app\frontend\src\api\api.ts`
- **Mudanças**:
  - Modificada função `getCitationFilePath()` para aceitar parâmetro `citationLookup`
  - Lógica para usar URL do SharePoint quando disponível no lookup
  - Fallback para rota `/content/` quando não há URL específica

### 7. **Frontend - Componentes (✅ Atualizados)**
- **Arquivos**: 
  - `c:\mt-rag-azure\app\frontend\src\components\Answer\AnswerParser.tsx`
  - `c:\mt-rag-azure\app\frontend\src\components\Answer\Answer.tsx`
- **Mudanças**:
  - Passagem do `citation_lookup` para a função `getCitationFilePath()`
  - Uso do lookup para obter URLs corretas das citações

### 8. **Frontend - AnalysisPanel (✅ Atualizado)**
- **Arquivo**: `c:\mt-rag-azure\app\frontend\src\components\AnalysisPanel\AnalysisPanel.tsx`
- **Mudanças**:
  - Detecção de URLs do SharePoint
  - Abertura direta em nova aba para URLs do SharePoint (evita problemas de X-Frame-Options)
  - Mensagem informativa para usuário quando documento é do SharePoint

### 9. **Frontend - Traduções (✅ Adicionadas)**
- **Arquivos**:
  - `c:\mt-rag-azure\app\frontend\src\locales\en\translation.json`
  - `c:\mt-rag-azure\app\frontend\src\locales\ptBR\translation.json`
- **Novas chaves**:
  - `sharePointDocumentOpened`: Mensagem informativa
  - `openInSharePoint`: Texto do botão
  - `page`: Texto para exibição de página

### 10. **Suporte a Páginas (✅ Implementado)**
- **Logic App**: Gera `sourcepage` com formato `documento.pdf#page=N`
- **Backend**: Preserva informação de página nas citações
- **Frontend**: Exibe citações com informação de página clara: "documento.pdf (página 2)"

## Como Funciona Agora

1. **Logic App indexa documentos** com campo `storageUrl` contendo URL do SharePoint
2. **Backend busca documentos** incluindo o campo `storageUrl`
3. **Backend constrói citation_lookup** mapeando nome do documento → URL SharePoint
4. **Frontend recebe citation_lookup** junto com as citações
5. **Quando usuário clica na citação**:
   - Se há URL no citation_lookup → abre diretamente o SharePoint
   - Se não há URL → usa rota `/content/` (fallback)
6. **Para SharePoint URLs**: Abre em nova aba (evita problemas de iframe)

## Arquivos de Configuração Criados
- `c:\mt-rag-azure\rag-logic-app\ingest-app-data\parameters.json`
- `c:\mt-rag-azure\rag-logic-app\ingest-app-data\connections.json`

## Próximos Passos
1. Testar o Logic App com uma biblioteca pequena do SharePoint
2. Verificar se os documentos são indexados corretamente no Azure AI Search
3. Testar se as citações abrem corretamente no SharePoint
4. Monitorar logs do Logic App para verificar execução sem erros