# 🚀 Correção de Deployment - Vercel

## ✅ O que foi corrigido

### 1. Configuração Vercel Melhorada
- **Arquivo**: `vercel.json`
- **Mudanças**:
  - Adicionado `buildCommand` e `devCommand` explícitos
  - Configurado `functions` para usar Node.js 18.x
  - Adicionado `rewrites` para servir static files e API routes corretamente
  - Adicionado `env` com `NODE_ENV: production`

**Antes**:
```json
{
  "cleanUrls": true
}
```

**Depois**:
```json
{
  "cleanUrls": true,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. Instalação do Vercel CLI
- Instalado `vercel@50.29.0` como dev dependency
- Permite usar `npx vercel` para gerenciar deployments

### 3. Documentação Completa
- **README.md** atualizado com:
  - Guia detalhado de deployment Vercel
  - Instruções para configurar variáveis de ambiente
  - Seção completa sobre o Assistente IA
  - Troubleshooting para erros comuns

## 🎯 O que você precisa fazer

### Passo 1: Configurar Variáveis de Ambiente no Vercel

Se você já tem um projeto no Vercel:
1. Acesse https://vercel.com/dashboard
2. Clique no seu projeto `tratham-manager`
3. Vá em **Settings → Environment Variables**
4. Adicione essas variáveis (você deve ter já):
   ```
   SHOPIFY_SHOP=sua-loja.myshopify.com
   SHOPIFY_ADMIN_TOKEN=seu_token_admin
   ```
5. Clique **Save** para cada uma

Se você **NÃO** tem um projeto no Vercel conectado:
```bash
npx vercel link
# Isso vai abrir um browser para conectar a este repositório
```

### Passo 2: Triggar Deploy Manual (se necessário)

Se o deploy automático não começar após o push:
```bash
# Fazer deploy em produção
npx vercel deploy --prod
```

Ou use o painel do Vercel:
1. Vá em https://vercel.com/dashboard
2. Abra seu projeto
3. Clique **Redeploy** no deployment mais recente

### Passo 3: Verificar Logs

Se o deployment falhar:
```bash
# Ver logs em tempo real
npx vercel logs --follow

# Ver logs específicos de uma URL
npx vercel logs https://tratham-manager.vercel.app
```

## 🔍 Como Saber se Funciona

### Teste 1: Acessar a Interface
```
https://seu-projeto.vercel.app
```
Deve carregar o dashboard com todos os gráficos

### Teste 2: Testar Endpoints
```bash
# GET - Info sobre assistente IA
curl https://seu-projeto.vercel.app/api/ai

# POST - Criar ordem com IA
curl -X POST https://seu-projeto.vercel.app/api/ai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Criar 1 camiseta para João Silva"}'
```

### Teste 3: Usar o Assistente IA
1. Abra https://seu-projeto.vercel.app
2. Vá até a seção "🤖 Assistente IA Poderoso"
3. Digite um comando como: "Criar 2 camisetas para João Silva"
4. Deve retornar erro amigável ou sucesso

## 📊 Commits Realizados

```
bf4142a - docs: adicionar guia completo de deployment e documentação do assistente IA
f1e8433 - fix: melhorar configuração do Vercel com rewrites e build correto
bc534ee - chore: atualizar configurações de permissões locais
e31f265 - feat: criar assistente IA poderoso para criar pedidos automaticamente
```

## ⚠️ Notas Importantes

1. **Variáveis de Ambiente**:
   - NÃO use `.env.local` no Vercel, adicione no painel
   - O `.env.local` é apenas para desenvolvimento local

2. **Token Shopify**:
   - Se retorna erro 401, o token expirou
   - Gere um novo token no admin Shopify

3. **Primeira execução**:
   - O primeiro deploy pode levar 1-2 minutos
   - Após isso, cada push do GitHub faz redeploy automático

4. **Troubleshooting**:
   - Se API retorna 500: verifique variáveis de ambiente
   - Se página não carrega: verifique se `index.html` está no root
   - Se API não existe: verifique que `api/ai.js` tem `export default`

## 📞 Próximos Passos

Após confirmar que está funcionando:
1. Integrar uma IA real (Claude, GPT) no `/api/ai`
2. Implementar autenticação
3. Adicionar notificações em tempo real
4. Expandir automações

---

**Data da correção**: 2026-03-09
**Status**: ✅ Pronto para produção
