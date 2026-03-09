const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

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
      id: '1',
      title: 'Camiseta Básica',
      vendor: 'Tratham',
      price: '50.00',
      status: 'active',
      image: { src: 'https://via.placeholder.com/150' },
      inventory_quantity: 100,
      variants: []
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        ok: true, 
        status: 'ready',
        supportedIntents: ['create_order', 'find_customer', 'find_product', 'dashboard_summary']
      }));
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const data = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          prompt: data.prompt,
          message: 'Comando recebido. Modo mock.',
          intent: 'general_assistant'
        }));
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
