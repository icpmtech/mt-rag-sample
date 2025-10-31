# SharePoint Document Preview - Implementação Avançada

## Visão Geral

Esta implementação oferece três métodos progressivos para visualizar documentos SharePoint diretamente na aplicação:

1. **Microsoft Graph API Preview** (Mais confiável)
2. **SharePoint Embed URL** (Fallback)
3. **Abertura em Nova Aba** (Última opção)

## Funcionalidades Implementadas

### 1. Microsoft Graph API Integration

**Backend**: `core/sharepoint_graph.py`
- Autentica com Azure usando DefaultAzureCredential
- Obtém site ID, drive item ID e URLs de preview
- Suporte para parsing de URLs SharePoint complexas
- Tratamento de erros robusto

**Rotas API**:
- `POST /sharepoint/preview` - Obtém URLs de preview
- `POST /sharepoint/metadata` - Obtém metadados do documento

### 2. SharePoint Embed URLs

**Geração automática** de URLs no formato:
```
https://tenant.sharepoint.com/_layouts/15/Doc.aspx?sourcedoc=/sites/sitename/library/document.pdf&action=embedview
```

### 3. Frontend Inteligente

**Componente**: `SharePointViewer.tsx`
- Tenta Graph API primeiro
- Fallback para SharePoint Embed
- Último recurso: abre em nova aba
- Interface de usuário intuitiva com status e retry

## Como Funciona

### Fluxo de Preview

1. **Usuário clica na citação** de documento SharePoint
2. **SharePointViewer detecta** que é URL SharePoint
3. **Tenta Graph API**:
   - Chama `/sharepoint/preview`
   - Se sucesso: carrega no iframe
4. **Fallback Embed URL**:
   - Gera URL de embed automaticamente
   - Tenta carregar no iframe
5. **Fallback Nova Aba**:
   - Mostra botão "Abrir no SharePoint"
   - Permite retry das opções anteriores

### Tratamento de Erros

- **X-Frame-Options**: Detecta e fallback automático
- **Permissões**: Mostra opções alternativas
- **Timeouts**: Interface com retry
- **URLs inválidas**: Parsing robusto com fallbacks

## Tipos de Documento Suportados

- **PDFs**: Preview completo com navegação de páginas
- **Word**: Visualização nativa do SharePoint
- **Excel**: Planilhas com funcionalidade básica
- **PowerPoint**: Apresentações em modo visualização
- **Imagens**: Preview direto

## Configuração

### Variáveis de Ambiente

```bash
# Azure AD/Graph API (já configuradas)
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### Permissões Necessárias

**Microsoft Graph API**:
- `Sites.Read.All` - Ler sites SharePoint
- `Files.Read.All` - Ler arquivos SharePoint

## API Reference

### `/sharepoint/preview`

**Request**:
```json
{
    "url": "https://contoso.sharepoint.com/sites/IT/Documents/document.pdf"
}
```

**Response**:
```json
{
    "success": true,
    "preview_info": {
        "embed_url": "https://contoso-my.sharepoint.com/personal/...",
        "web_url": "https://contoso.sharepoint.com/...",
        "download_url": "https://...",
        "site_id": "...",
        "item_id": "..."
    },
    "method": "graph_api"
}
```

### `/sharepoint/metadata`

**Request**:
```json
{
    "url": "https://contoso.sharepoint.com/sites/IT/Documents/document.pdf"
}
```

**Response**:
```json
{
    "success": true,
    "metadata": {
        "name": "document.pdf",
        "size": 1024576,
        "created_datetime": "2024-01-01T10:00:00Z",
        "modified_datetime": "2024-01-02T15:30:00Z",
        "mime_type": "application/pdf",
        "web_url": "https://...",
        "download_url": "https://..."
    }
}
```

## Componentes Frontend

### SharePointViewer

**Props**:
- `sharePointUrl: string` - URL do documento
- `citationHeight: string` - Altura do container

**Estados**:
- `LOADING` - Carregando preview
- `GRAPH_EMBED` - Usando Graph API
- `SHAREPOINT_EMBED` - Usando embed URL
- `NEW_TAB` - Fallback para nova aba
- `ERROR` - Erro no preview

**Funcionalidades**:
- Retry automático e manual
- Indicadores visuais de método usado
- Interface responsiva
- Tratamento de erros amigável

## Testes e Debugging

### Testar Graph API

```bash
# Backend - teste direto
curl -X POST http://localhost:50505/sharepoint/preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"url": "https://contoso.sharepoint.com/sites/IT/Documents/test.pdf"}'
```

### Debug no Frontend

```javascript
// Console do navegador
localStorage.setItem('debug-sharepoint', 'true');
```

### Logs Úteis

- **Backend**: Logs em `sharepoint_graph.py`
- **Frontend**: Console do navegador
- **Graph API**: Azure Portal > App Registration > API permissions

## Limitações Conhecidas

1. **Same-Origin Policy**: Alguns documentos podem não carregar em iframe
2. **Permissões**: Usuário deve ter acesso ao documento no SharePoint
3. **Tamanho**: Documentos muito grandes podem ter timeout
4. **Formatos**: Alguns formatos específicos podem não ter preview

## Melhorias Futuras

1. **Cache**: Implementar cache de URLs de preview
2. **Thumbnails**: Miniaturas para PDFs grandes
3. **Anotações**: Suporte para comentários inline
4. **Download**: Opção de download direto
5. **Compartilhamento**: Links temporários para usuários sem acesso

## Troubleshooting

### Erro "Preview failed"
- Verificar permissões no SharePoint
- Validar token de autenticação
- Conferir URL do documento

### Iframe não carrega
- Document security policy
- Fallback automático ativado
- Verificar X-Frame-Options

### Graph API timeout
- Verificar conectividade
- Aumentar timeout nas configurações
- Fallback para embed URL

## Exemplo de Uso

```typescript
// Uso direto do componente
<SharePointViewer 
    sharePointUrl="https://contoso.sharepoint.com/sites/IT/Documents/manual.pdf"
    citationHeight="600px"
/>
```

Esta implementação garante que os usuários sempre conseguirão acessar os documentos SharePoint, mesmo que alguns métodos falhem, proporcionando uma experiência robusta e user-friendly.