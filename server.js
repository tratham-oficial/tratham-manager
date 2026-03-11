const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// Mock de dados
// IA Command Analysis
function analyzeCommand(prompt) {
  const text = String(prompt || '').toLowerCase();
  const analysis = {
    intent: 'unknown',
    keywords: [],
    hasCustomer: false,
    hasProduct: false,
    hasQuantity: false,
    quantity: 1,
    customerQuery: null,
    productQuery: null
  };

  if (
    text.includes('criar pedido') ||
    text.includes('novo pedido') ||
    text.includes('montar pedido') ||
    text.includes('quero pedir') ||
    text.includes('fazer pedido') ||
    text.includes('encomendar') ||
    text.includes('comprar')
  ) {
    analysis.intent = 'create_order';
  }

  const customerPatterns = [
    /para\s+([a-záéíóúâêôãõ\s]+?)(?:\s+com|$|,)/i,
    /cliente:\s*([a-záéíóúâêôãõ\s]+?)(?:,|$)/i,
    /nome:\s*([a-záéíóúâêôãõ\s]+?)(?:,|$)/i,
    /sr\.?\s+([a-záéíóúâêôãõ\s]+?)(?:\s|,|$)/i
  ];

  for (const pattern of customerPatterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      analysis.customerQuery = match[1].trim();
      analysis.hasCustomer = true;
      break;
    }
  }

  const productPatterns = [
    /(\d+)?\s*([a-záéíóúâêôãõ\s\-]+?)\s+(?:em\s+|tamanho|cor|p\/|para)/i,
    /produto:\s*([a-záéíóúâêôãõ\s\-]+?)(?:,|$)/i,
    /item:\s*([a-záéíóúâêôãõ\s\-]+?)(?:,|$)/i
  ];

  for (const pattern of productPatterns) {
    const match = prompt.match(pattern);
    if (match && match[2]) {
      analysis.productQuery = match[2].trim();
      analysis.hasProduct = true;
      if (match[1]) {
        analysis.quantity = parseInt(match[1]) || 1;
        analysis.hasQuantity = true;
      }
      break;
    }
  }

  if (!analysis.productQuery) {
    const qtyMatch = prompt.match(/(\d+)\s+(un|peça|peças|unidade|unidades|camiseta|camisetas|produto|produtos|item|itens)/i);
    if (qtyMatch) {
      analysis.quantity = parseInt(qtyMatch[1]) || 1;
      analysis.hasQuantity = true;
    }

    const generalMatch = prompt.match(/(?:de|com)\s+([a-záéíóúâêôãõ\s\-]+?)(?:,|\s+(?:para|tamanho|cor)|$)/i);
    if (generalMatch) {
      analysis.productQuery = generalMatch[1].trim();
      analysis.hasProduct = true;
    }
  }

  return analysis;
}

// Mock de dados
const mockData = {
  orders: [
    {
      id: '1',
      name: '#1001',
      created_at: new Date().toISOString(),
      total_price: '500.00',
      financial_status: 'paid',
      fulfillment_status: 'fulfilled',
      customer: {
        id: '1',
        first_name: 'João',
        last_name: 'Silva',
        email: 'joao@example.com',
        default_address: { name: 'João Silva', city: 'São Paulo' }
      },
      line_items: []
    }
  ],
  customers: [
    {
      id: '1',
      first_name: 'João',
      last_name: 'Silva',
      email: 'joao@example.com',
      total_spent: '1500.00',
      created_at: new Date().toISOString(),
      default_address: { name: 'João Silva', city: 'São Paulo' }
    }
  ],
  products: [
    {
      id: 'prod_1',
      title: 'Camiseta Suedine',
      handle: 'camiseta-suedine',
      vendor: 'Tratham',
      price: '89.90',
      status: 'active',
      image: { src: 'https://via.placeholder.com/150' },
      inventory_quantity: 100,
      variants: [
        { id: 'var_1', title: 'M - Habanão', sku: 'CS-M-HAB', price: '89.90', productId: 'prod_1', productTitle: 'Camiseta Suedine' },
        { id: 'var_2', title: 'G - Azul', sku: 'CS-G-AZU', price: '89.90', productId: 'prod_1', productTitle: 'Camiseta Suedine' },
        { id: 'var_3', title: 'P - Vermelho', sku: 'CS-P-VER', price: '89.90', productId: 'prod_1', productTitle: 'Camiseta Suedine' }
      ]
    },
    {
      id: 'prod_2',
      title: 'Camiseta Texturizada',
      handle: 'camiseta-texturizada',
      vendor: 'Tratham',
      price: '75.90',
      status: 'active',
      image: { src: 'https://via.placeholder.com/150' },
      inventory_quantity: 50,
      variants: [
        { id: 'var_4', title: 'M - Habano', sku: 'CT-M-HAB', price: '75.90', productId: 'prod_2', productTitle: 'Camiseta Texturizada' },
        { id: 'var_5', title: 'G - Cinza', sku: 'CT-G-CIN', price: '75.90', productId: 'prod_2', productTitle: 'Camiseta Texturizada' }
      ]
    },
    {
      id: 'prod_3',
      title: 'Suéter Ambition',
      handle: 'sueter-ambition',
      vendor: 'Tratham',
      price: '129.90',
      status: 'active',
      image: { src: 'https://via.placeholder.com/150' },
      inventory_quantity: 30,
      variants: [
        { id: 'var_6', title: 'P - Azul', sku: 'SA-P-AZU', price: '129.90', productId: 'prod_3', productTitle: 'Suéter Ambition' },
        { id: 'var_7', title: 'M - Azul', sku: 'SA-M-AZU', price: '129.90', productId: 'prod_3', productTitle: 'Suéter Ambition' }
      ]
    }
  ]
};

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Routes
  if (pathname === '/' || pathname === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  } else if (pathname === '/api/orders') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, orders: mockData.orders, count: mockData.orders.length }));
  } else if (pathname === '/api/customers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, customers: mockData.customers, count: mockData.customers.length }));
  } else if (pathname === '/api/products') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, products: mockData.products, count: mockData.products.length }));
    } else if (req.method === 'POST') {
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, product: mockData.products[0] }));
    } else if (req.method === 'DELETE') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, deletedId: parsedUrl.query.id }));
    }
  } else if (pathname === '/api/ai') {
    if (req.method === 'GET') {
      const queryParams = new URL(`http://${req.headers.host}${req.url}`).searchParams;
      const action = queryParams.get('action');

      if (action === 'products') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          action: 'products',
          data: mockData.products
        }));
        return;
      }

      if (action === 'shipping') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          action: 'shipping',
          data: [
            { id: 'pickup', label: 'Retirar na Loja' },
            { id: 'delivery', label: 'Enviar (Frete a Calcular)' },
            { id: 'standard', label: 'Entrega Padrão' },
            { id: 'express', label: 'Entrega Express' }
          ]
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        status: 'ready',
        capabilities: [
          'Criar pedidos automaticamente com inteligência natural',
          'Buscar clientes por nome, email ou telefone',
          'Buscar produtos por nome ou SKU',
          'Gerar rascunhos de pedidos (Draft Orders)',
          'Processar comandos em linguagem natural'
        ],
        supportedIntents: ['create_order', 'find_customer', 'find_product', 'general_assistant'],
        examples: [
          'Criar pedido de 2 camisetas azuis para João Silva',
          'Quero pedir 1 produto xyz para cliente@email.com',
          'Encomendar 3 unidades de calça tamanho G para Maria'
        ]
      }));
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const data = JSON.parse(body);
        const prompt = data.prompt || '';

        // Analisa o comando
        const analysis = analyzeCommand(prompt);

        if (analysis.intent === 'create_order') {
          // Busca cliente nos dados mock
          const customerQuery = (analysis.customerQuery || '').toLowerCase();
          const customer = mockData.customers.find(c => {
            const fullName = (c.first_name + ' ' + c.last_name).toLowerCase();
            return fullName.includes(customerQuery) ||
                   c.first_name.toLowerCase().includes(customerQuery) ||
                   c.email.toLowerCase().includes(customerQuery);
          });

          // Busca produto nos dados mock
          const productQuery = (analysis.productQuery || '').toLowerCase();
          const product = mockData.products.find(p =>
            p.title.toLowerCase().includes(productQuery)
          );

          if (customer && product) {
            const response = {
              ok: true,
              success: true,
              action: 'order_created',
              message: `✅ Pedido criado com sucesso para ${customer.first_name}!`,
              details: {
                customer: {
                  name: customer.first_name + ' ' + customer.last_name,
                  email: customer.email
                },
                product: product.title,
                quantity: analysis.quantity || 1,
                draftOrderId: 'draft_' + Math.random().toString(36).substr(2, 9),
                invoiceUrl: `https://admin.shopify.com/orders/draft_${Math.random().toString(36).substr(2, 9)}`
              },
              timestamp: new Date().toISOString()
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } else if (!customer) {
            const response = {
              ok: false,
              success: false,
              action: 'missing_customer',
              message: `⚠️ Cliente não encontrado. Procurei por: "${analysis.customerQuery || 'não especificado'}"`,
              suggestion: 'Informe o nome, email ou telefone do cliente.',
              analysis,
              timestamp: new Date().toISOString()
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } else {
            const response = {
              ok: false,
              success: false,
              action: 'missing_product',
              message: `⚠️ Produto não encontrado. Procurei por: "${analysis.productQuery || 'não especificado'}"`,
              suggestion: 'Especifique o nome ou SKU do produto.',
              analysis,
              timestamp: new Date().toISOString()
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          }
        } else {
          const response = {
            ok: false,
            success: false,
            action: 'unclear_intent',
            message: '🤔 Não consegui entender o comando. Tente algo como: "criar pedido de 2 camisetas azuis para João Silva"',
            analysis,
            timestamp: new Date().toISOString()
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        }
      });
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`📱 Interface: http://localhost:${PORT}/`);
  console.log(`🔌 API disponível em http://localhost:${PORT}/api/`);
});
