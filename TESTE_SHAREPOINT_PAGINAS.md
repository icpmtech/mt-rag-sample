# Teste de Integração SharePoint com Páginas

## Verificações a Fazer

### 1. Logic App
- [ ] Deploy do Logic App atualizado
- [ ] Testar com 1-2 documentos da biblioteca SharePoint
- [ ] Verificar se os documentos são indexados com `sourcepage` contendo `#page=N`
- [ ] Verificar se o `storageUrl` contém a URL correta do SharePoint

### 2. Azure AI Search
- [ ] Verificar se o índice contém documentos com:
  - `sourcepage`: "documento.pdf#page=1", "documento.pdf#page=2", etc.
  - `storageUrl`: URLs válidas do SharePoint
  - `category`: "document"
  - `oids`: array vazio
  - `groups`: array vazio

### 3. Frontend
- [ ] Fazer uma pergunta que retorne citações
- [ ] Verificar se as citações aparecem como: "1. documento.pdf (página 2)"
- [ ] Clicar nas citações e verificar se abrem no SharePoint
- [ ] Verificar se o painel de análise mostra mensagem sobre SharePoint

### 4. URLs de Teste
```
SharePoint Site: https://claranetapplications.sharepoint.com/sites/IT
Library: LIST
```

### 5. Comandos para Debugging

#### Verificar índice AI Search:
```bash
# Listar documentos no índice
curl -X GET "https://YOUR-SEARCH-SERVICE.search.windows.net/indexes/multimodal-index/docs?api-version=2023-11-01&$select=id,sourcepage,storageUrl,category" \
  -H "api-key: YOUR-API-KEY"
```

#### Testar busca:
```bash
# Fazer uma busca de teste
curl -X POST "https://YOUR-SEARCH-SERVICE.search.windows.net/indexes/multimodal-index/docs/search?api-version=2023-11-01" \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR-API-KEY" \
  -d '{"search": "*", "top": 5, "select": "sourcepage,storageUrl,content"}'
```

## Exemplo de Documento Indexado Esperado

```json
{
  "id": "documento.pdf_chunk_0",
  "sourcepage": "documento.pdf#page=1",
  "sourcefile": "/sites/IT/LIST/documento.pdf",
  "storageUrl": "https://claranetapplications.sharepoint.com/sites/IT/LIST/documento.pdf",
  "content": "Conteúdo do primeiro chunk...",
  "category": "document",
  "oids": [],
  "groups": [],
  "embedding3": [0.1, 0.2, ...]
}
```

## Resultados Esperados

1. **Citações no Chat**: "1. documento.pdf (página 1)"
2. **Click na Citação**: Abre documento no SharePoint
3. **Painel de Análise**: Mostra mensagem "Este documento está hospedado no SharePoint"