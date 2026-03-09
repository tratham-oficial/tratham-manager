# Setup no Vercel

## ✅ Pré-Deploy

1. **Faça push para GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Conecte ao Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Clique "New Project"
   - Selecione seu repositório GitHub

## 🔐 Variáveis de Ambiente

No painel do Vercel, adicione sob "Settings → Environment Variables":

```
SHOPIFY_SHOP=sua-loja.myshopify.com
SHOPIFY_ADMIN_TOKEN=seu_token_admin
```

## 📝 Obtendo Token Shopify

1. Acesse seu **Admin Shopify**
2. Vá em **Settings → Apps and integrations → Develop apps**
3. Clique **Create an app** ou use app existente
4. Em **Configuration**, clique na aba **Admin API**
5. Em **Admin API scopes**, ative:
   - `read_products`
   - `write_products`
   - `read_orders`
   - `read_customers`
6. Clique **Save**
7. Na aba **API credentials**, clique **Show token**
8. Copie o token para variável de ambiente do Vercel

## 🚀 Deploy

1. Após configurar variáveis, clique "Deploy"
2. Espere ~1-2 minutos
3. Acesse seu URL gerada automaticamente

## 🔗 Testando Endpoints

Com a URL do Vercel (ex: `https://tratham-manager.vercel.app`):

```bash
# Testar API
curl https://tratham-manager.vercel.app/api/orders
curl https://tratham-manager.vercel.app/api/customers
curl https://tratham-manager.vercel.app/api/products
```

## 🐛 Se não funcionar

1. **Verifique logs**: `vercel logs`
2. **Confirme variáveis**: Settings → Environment Variables
3. **Token expirou?**: Gere novo token
4. **Shop name correto?**: Deve ser exatamente `loja.myshopify.com`
