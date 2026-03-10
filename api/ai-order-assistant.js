const API_VERSION = '2025-10';

function getEnv() {
  const shop = process.env.SHOPIFY_SHOP;
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  if (!shop || !token) {
    throw new Error('Variáveis SHOPIFY_SHOP e SHOPIFY_ADMIN_TOKEN não configuradas.');
  }
  return { shop, token };
}

async function shopifyFetch(path, options = {}) {
  const { shop, token } = getEnv();
  const response = await fetch(`https://${shop}/admin/api/${API_VERSION}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error('Parse error:', e);
  }
  return { status: response.status, data };
}

// Busca cliente por nome, email ou telefone
async function findCustomer(query) {
  if (!query || query.trim().length === 0) return null;

  const searchQuery = query.toLowerCase().trim();
  const { data } = await shopifyFetch(`/graphql.json`, {
    method: 'POST',
    body: JSON.stringify({
      query: `
        query SearchCustomers($query: String!) {
          customers(first: 10, query: $query) {
            edges {
              node {
                id
                email
                firstName
                lastName
                phone
              }
            }
          }
        }
      `,
      variables: { query: searchQuery }
    })
  });

  if (data.data?.customers?.edges && data.data.customers.edges.length > 0) {
    return data.data.customers.edges[0].node;
  }
  return null;
}

// Busca produtos por nome ou SKU
async function findProduct(query) {
  if (!query || query.trim().length === 0) return null;

  const searchQuery = query.toLowerCase().trim();
  const { data } = await shopifyFetch(`/graphql.json`, {
    method: 'POST',
    body: JSON.stringify({
      query: `
        query SearchProducts($query: String!) {
          products(first: 10, query: $query) {
            edges {
              node {
                id
                title
                handle
                variants(first: 5) {
                  edges {
                    node {
                      id
                      title
                      sku
                      price
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: { query: searchQuery }
    })
  });

  if (data.data?.products?.edges && data.data.products.edges.length > 0) {
    return data.data.products.edges[0].node;
  }
  return null;
}

// Cria um rascunho de pedido (draft)
async function createDraftOrder(customerId, lineItems) {
  const { data } = await shopifyFetch(`/graphql.json`, {
    method: 'POST',
    body: JSON.stringify({
      query: `
        mutation CreateDraftOrder($input: DraftOrderInput!) {
          draftOrderCreate(input: $input) {
            draftOrder {
              id
              number
              email
              lineItems {
                id
                title
                quantity
              }
              invoiceUrl
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        input: {
          customerId,
          lineItems,
          useCustomerDefaultAddress: true
        }
      }
    })
  });

  if (data.data?.draftOrderCreate?.draftOrder) {
    return data.data.draftOrderCreate.draftOrder;
  }

  if (data.data?.draftOrderCreate?.userErrors) {
    throw new Error(data.data.draftOrderCreate.userErrors[0].message);
  }

  throw new Error('Erro ao criar rascunho de pedido');
}

// Analisa o comando do usuário e extrai informações
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

  // Detecta intenção de criar pedido
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

  // Detecta cliente
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

  // Detecta produto
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

  // Se não achou padrão específico, tenta extrair quantidade e produtos de forma mais genérica
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

// Processa o comando e toma ações inteligentes
async function processCommand(prompt) {
  const analysis = analyzeCommand(prompt);

  if (analysis.intent === 'create_order') {
    // Busca cliente
    let customer = null;
    if (analysis.customerQuery) {
      customer = await findCustomer(analysis.customerQuery);
    }

    // Busca produto
    let product = null;
    if (analysis.productQuery) {
      product = await findProduct(analysis.productQuery);
    }

    // Tenta criar o pedido
    if (customer && product) {
      const variant = product.variants?.edges?.[0]?.node;
      if (!variant) {
        throw new Error('Produto não possui variantes disponíveis');
      }

      const lineItems = [
        {
          variantId: variant.id,
          quantity: analysis.quantity || 1
        }
      ];

      const draftOrder = await createDraftOrder(customer.id, lineItems);

      return {
        success: true,
        action: 'order_created',
        draftOrder,
        message: `✅ Pedido criado com sucesso para ${customer.firstName || customer.email}!`,
        details: {
          customer: {
            name: customer.firstName,
            email: customer.email
          },
          product: product.title,
          quantity: analysis.quantity || 1,
          draftOrderId: draftOrder.id,
          invoiceUrl: draftOrder.invoiceUrl
        }
      };
    }

    if (!customer) {
      return {
        success: false,
        action: 'missing_customer',
        message: `⚠️ Cliente não encontrado. Procurei por: "${analysis.customerQuery || 'não especificado'}"`,
        suggestion: 'Informe o nome, email ou telefone do cliente.'
      };
    }

    if (!product) {
      return {
        success: false,
        action: 'missing_product',
        message: `⚠️ Produto não encontrado. Procurei por: "${analysis.productQuery || 'não especificado'}"`,
        suggestion: 'Especifique o nome ou SKU do produto.'
      };
    }
  }

  return {
    success: false,
    action: 'unclear_intent',
    message: '🤔 Não consegui entender o comando. Tente algo como: "criar pedido de 2 camisetas azuis para João Silva"',
    analysis
  };
}

export { processCommand, analyzeCommand, findCustomer, findProduct, createDraftOrder };
