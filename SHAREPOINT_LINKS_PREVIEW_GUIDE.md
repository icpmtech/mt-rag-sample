# 📋 Guia de Configuração - Links SharePoint para Preview de Citações

## 🎯 Objetivo
Este guia explica como configurar corretamente os links do SharePoint para que sejam exibidos adequadamente no sistema de preview de citações da aplicação RAG.

## 🔧 Configuração Atual

### URLs do SharePoint Configurados:
- **Site**: `https://claranetapplications.sharepoint.com/sites/IT`
- **Biblioteca**: `Shared Documents` (alterado de "LIST" para melhor compatibilidade)

### Formato de Links Otimizado para Preview:

#### ✅ URL Recomendado (Documento):
```
https://claranetapplications.sharepoint.com/sites/IT/Shared Documents/document-name.pdf
```

#### ✅ URL de Embed Gerado Automaticamente:
```
https://claranetapplications.sharepoint.com/_layouts/15/Doc.aspx?sourcedoc=/sites/IT/Shared Documents/document-name.pdf&action=embedview&wdStartOn=1
```

## 🚀 Como Funciona o Sistema de Preview

### 1. **Detecção Automática**
O sistema detecta automaticamente URLs do SharePoint quando contêm:
- `sharepoint.com`
- `sharepoint`
- `_layouts/15/Doc.aspx`

### 2. **Conversão para Preview**
URLs normais do SharePoint são automaticamente convertidos para URLs de embed otimizados:
```javascript
// Original
https://claranetapplications.sharepoint.com/sites/IT/Shared Documents/doc.pdf

// Convertido para preview
https://claranetapplications.sharepoint.com/_layouts/15/Doc.aspx?sourcedoc=/sites/IT/Shared Documents/doc.pdf&action=embedview&wdStartOn=1
```

### 3. **Renderização no Frontend**
- **Método 1**: Graph API (preferencial) - usa Microsoft Graph para preview
- **Método 2**: SharePoint Embed - gera URL de embed diretamente
- **Método 3**: Nova Aba - abre o documento em nova aba como fallback

## 📝 Exemplos de URLs Configurados Corretamente

### Documentos PDF:
```
https://claranetapplications.sharepoint.com/sites/IT/Shared Documents/manual-usuario.pdf
https://claranetapplications.sharepoint.com/sites/IT/Shared Documents/relatorio-mensal.pdf
```

### Documentos Word:
```
https://claranetapplications.sharepoint.com/sites/IT/Shared Documents/procedimento-operacional.docx
https://claranetapplications.sharepoint.com/sites/IT/Shared Documents/especificacao-tecnica.docx
```

### Documentos Excel:
```
https://claranetapplications.sharepoint.com/sites/IT/Shared Documents/planilha-dados.xlsx
https://claranetapplications.sharepoint.com/sites/IT/Shared Documents/dashboard-kpis.xlsx
```

## 🔄 Fluxo de Preview de Citações

1. **Usuário clica na citação** → Sistema identifica URL do SharePoint
2. **Sistema tenta Graph API** → Se disponível, usa preview oficial da Microsoft
3. **Fallback para Embed URL** → Gera URL de embed otimizado
4. **Renderização** → Exibe documento em iframe ou nova aba

## ⚙️ Arquivos de Configuração Atualizados

### `parameters.json`:
```json
{
  "SharepointSiteAddress_template": {
    "value": "https://claranetapplications.sharepoint.com/sites/IT"
  },
  "SharepointLibraryName_template": {
    "value": "Shared Documents"
  }
}
```

### Componentes Frontend Otimizados:
- `SharePointViewer.tsx` - Renderização de preview
- `AnalysisPanel.tsx` - Detecção de URLs SharePoint
- `api.ts` - Conversão automática para URLs de embed

## 🎯 Benefícios da Configuração Atual

### ✅ **Preview Otimizado**
- URLs automaticamente convertidos para melhor visualização
- Suporte a múltiplos formatos de documento
- Fallback robusto em caso de falha

### ✅ **Detecção Inteligente**
- Identifica automaticamente links do SharePoint
- Distingue entre documentos locais e SharePoint
- Conversão automática para URLs de embed

### ✅ **Experiência do Usuário**
- Preview inline quando possível
- Abertura em nova aba como alternativa
- Loading states e feedback visual

## 🔧 Personalização Adicional

### Para Adicionar Novos Sites SharePoint:
1. Atualize `SharepointSiteAddress_template` em `parameters.json`
2. Configure a biblioteca correta em `SharepointLibraryName_template`
3. Teste os URLs gerados no sistema de preview

### Para Diferentes Bibliotecas:
```json
{
  "SharepointLibraryName_template": {
    "value": "Documents" // ou "Shared Documents", "Lists", etc.
  }
}
```

## 🚨 Notas Importantes

- **Permissões**: Certifique-se de que os usuários tenham acesso aos documentos
- **Graph API**: Configure as permissões adequadas para melhor preview
- **Fallbacks**: O sistema sempre tenta múltiplas abordagens para garantir acesso
- **Compatibilidade**: URLs funcionam com a maioria dos formatos de documento do Office

---

**📚 Para mais informações**, consulte:
- `SHAREPOINT_PREVIEW_IMPLEMENTATION.md`
- `SHAREPOINT_INTEGRATION_SUMMARY.md`