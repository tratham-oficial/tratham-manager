# Tratham Vercel Shopify

Estrutura pronta para rodar o painel HTML com backend na Vercel.

## Variáveis de ambiente na Vercel
- `SHOPIFY_SHOP` = `1498be-30.myshopify.com`
- `SHOPIFY_ADMIN_TOKEN` = seu token Admin API novo da Shopify

## Rotas
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/products`
- `POST /api/products`
- `DELETE /api/products/:id`
- `GET /api/customers`
- `GET /api/products-count`
- `GET /api/customers-count`
- `POST /api/ai` (stub)

## Deploy
1. Suba a pasta para um repositório GitHub
2. Importe o repositório na Vercel
3. Adicione as variáveis de ambiente
4. Faça redeploy
