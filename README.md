# Tratham Manager

Painel operacional Shopify com base pronta para evoluir para operador por IA.

## 🚀 Começando

### Pré-requisitos

- Node.js 18.x
- Conta Shopify com acesso de Admin
- Vercel CLI (para desenvolvimento local)

### Setup

1. **Clone ou acesse o repositório**
   ```bash
   cd tratham-manager-main
   ```

2. **Crie arquivo `.env.local`**

   Copie `.env.example` e configure com suas credenciais:
   ```bash
   cp .env.example .env.local
   ```

   Preencha:
   ```
   SHOPIFY_SHOP=sua-loja.myshopify.com
   SHOPIFY_ADMIN_TOKEN=seu_token_de_acesso
   ```

3. **Obtenha suas credenciais Shopify**

   - Acesse seu admin da Shopify
   - Configurações → Apps e integrações → Desenvolvedores → Tokens de acesso
   - Crie um novo token com permissões para:
     - `read_products`, `write_products`
     - `read_orders`
     - `read_customers`

4. **Desenvolvimento local**
   ```bash
   npm run dev
   ```
   Acesse: `http://localhost:3000`

5. **Deploy no Vercel**
   ```bash
   vercel
   ```
   Configure as variáveis de ambiente no painel do Vercel

## 📋 Features

- **Dashboard**: Visão geral com KPIs (pedidos, produtos, clientes, receita)
- **Clientes**: Listagem com busca avançada
- **Produtos**: Gerenciamento e criação de produtos
- **Pedidos**: Visualização com status de pagamento e fulfillment
- **Assistente IA**: Base estruturada para intents operacionais

## 🔌 Endpoints API

- `GET /api/orders` - Lista pedidos
- `GET /api/customers` - Lista clientes
- `GET /api/products` - Lista produtos
- `POST /api/products` - Cria novo produto
- `DELETE /api/products?id=<id>` - Deleta produto
- `GET /api/ai` - Info sobre assistente
- `POST /api/ai` - Processa comando IA

## 📝 Estrutura

```
├── index.html          # Interface principal
├── api/
│   ├── orders.js       # Endpoint de pedidos
│   ├── customers.js    # Endpoint de clientes
│   ├── products.js     # Endpoint de produtos (CRUD)
│   ├── ai.js           # Endpoint do assistente IA
│   └── ...
├── vercel.json         # Configuração Vercel
├── package.json        # Dependências
└── .env.example        # Template de variáveis
```

## ⚙️ Configuração Vercel

O `vercel.json` está configurado com `cleanUrls: true`, permitindo chamadas sem extensão `.json`.

## 🐛 Troubleshooting

**Erro 401 - Unauthorized**
- Verifique se `SHOPIFY_ADMIN_TOKEN` está correto
- Token pode ter expirado, gere novo

**Erro 500 - Internal Server Error**
- Verifique se variáveis de ambiente estão setadas no Vercel
- Veja logs com: `vercel logs`

**Dados não carregam**
- Confirme `SHOPIFY_SHOP` está no formato correto (ex: `minha-loja.myshopify.com`)
- Verifique conexão com Shopify

## 📈 Próximos passos

- Integrar IA real (Claude, GPT) no endpoint `/api/ai`
- Implementar autenticação
- Criar sistema de notificações
- Expandir operações automatizadas
