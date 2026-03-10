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

## 🤖 Assistente IA Poderoso

### Funcionalidades
O assistente IA processa comandos em linguagem natural português para automatizar criação de pedidos na Shopify:

**Exemplos de comandos:**
- "Criar 2 camisetas azuis para João Silva"
- "Pedido de 1 calça G para maria@email.com"
- "Encomendar 3 unidades de camiseta preta para Cliente XYZ"

**Capacidades:**
- Análise inteligente de intenção (criar pedido, buscar cliente, buscar produto)
- Extração de cliente por nome, email ou telefone via regex
- Extração de produto e quantidade
- Busca em tempo real na Shopify
- Criação automática de draft orders
- Respostas formatadas com feedback visual (✅ ⚠️ 🤔)

### Usando o Assistente
1. Acesse a seção "🤖 Assistente IA Poderoso" no dashboard
2. Digite um comando em linguagem natural
3. O assistente analisa, busca cliente/produto e cria o draft order
4. Visualize os detalhes e abra o link da fatura no Shopify

## 📝 Deploy no Vercel

### Passo 1: Verificar Configuração Local
```bash
# Verifique que tudo está commitado
git status

# Os logs devem mostrar a configuração do vercel.json atualizada
git log --oneline | head -5
```

### Passo 2: Conectar ao Vercel (se necessário)
Se este é seu primeiro deploy, conecte o projeto:

```bash
# Fazer login no Vercel (abre browser)
npx vercel login

# Ligar projeto ao Vercel
npx vercel link
```

### Passo 3: Configurar Variáveis de Ambiente
No painel do Vercel (https://vercel.com):

1. Acesse seu projeto
2. Vá em **Settings → Environment Variables**
3. Adicione:
   ```
   SHOPIFY_SHOP=sua-loja.myshopify.com
   SHOPIFY_ADMIN_TOKEN=seu_token_aqui
   ```
4. Clique "Save"

### Passo 4: Fazer Deploy
```bash
# Deploy automático (se linked)
npx vercel deploy --prod

# Ou esperar push automático do GitHub (se integrado)
git push origin main
```

### Verificar Deploy
```bash
# Ver logs do deployment
npx vercel logs

# Ou acesse a URL: https://seu-projeto.vercel.app
```

## 📝 Troubleshooting Vercel

**Deployment não inicia?**
- Verifique `vercel.json` está no root do projeto
- Confirme que `package.json` tem scripts `dev` e `build`
- Cheque se `.gitignore` não está excluindo arquivos importantes

**Build falha?**
```bash
npx vercel logs --follow  # Ver logs em tempo real
```

**API retorna erro 500?**
- Verifique se variáveis `SHOPIFY_SHOP` e `SHOPIFY_ADMIN_TOKEN` estão setadas no Vercel
- Confirme que o token Shopify ainda é válido
- Cheque logs: `npx vercel logs`

**Endpoint /api/ai não funciona?**
- Confirme `api/ai.js` tem `export default async function handler`
- Variáveis de ambiente devem estar no painel do Vercel, não em `.env.local`

## 📈 Próximos passos

- Integrar IA real (Claude, GPT) no endpoint `/api/ai`
- Implementar autenticação
- Criar sistema de notificações
- Expandir operações automatizadas
- Melhorar reconhecimento de linguagem natural
