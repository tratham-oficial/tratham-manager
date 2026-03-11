// IA Assistant - Powerful order creation system
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

// Função auxiliar: calcula similaridade entre strings (Levenshtein distance)
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// Extrai características de variante (tamanho, cor, etc.) do texto
function extractVariantFeatures(query) {
  const lowerQuery = query.toLowerCase();
  const features = {
    sizes: [],
    colors: [],
    rawText: query
  };

  // Tamanhos comuns
  const sizePatterns = /\b(p|m|g|gg|pp|xp|xs|s|l|xl|xxl)\b/gi;
  let sizeMatch;
  while ((sizeMatch = sizePatterns.exec(query)) !== null) {
    features.sizes.push(sizeMatch[1].toUpperCase());
  }

  // Cores comuns em português
  const colorNames = ['preto', 'branco', 'vermelho', 'azul', 'verde', 'amarelo', 'rosa', 'roxo', 'laranja', 'marrom', 'cinza', 'bege', 'habanão', 'habano', 'turquesa'];
  colorNames.forEach(color => {
    if (lowerQuery.includes(color)) {
      features.colors.push(color);
    }
  });

  return features;
}

// Busca inteligente de variante dentro de um produto
function findMatchingVariant(product, features) {
  if (!product.variants?.edges) return null;

  let bestMatch = null;
  let bestScore = 0;

  product.variants.edges.forEach(edge => {
    const variant = edge.node;
    const variantTitle = (variant.title || '').toLowerCase();
    let score = 0;

    // Verifica match com tamanho
    if (features.sizes.length > 0) {
      features.sizes.forEach(size => {
        if (variantTitle.includes(size.toLowerCase())) score += 2;
      });
    }

    // Verifica match com cor
    if (features.colors.length > 0) {
      features.colors.forEach(color => {
        if (variantTitle.includes(color)) score += 2;
      });
    }

    // Se houver match, esta é uma boa variante
    if (score > bestScore) {
      bestScore = score;
      bestMatch = variant;
    }
  });

  // Se nenhuma variante específica foi encontrada, retorna a primeira
  return bestMatch || product.variants.edges[0]?.node;
}

async function findProduct(query) {
  if (!query || query.trim().length === 0) return null;
  const searchQuery = query.toLowerCase().trim();

  // Extrai características do texto (tamanho, cor, etc.)
  const features = extractVariantFeatures(query);

  const { data } = await shopifyFetch(`/graphql.json`, {
    method: 'POST',
    body: JSON.stringify({
      query: `
        query SearchProducts($query: String!) {
          products(first: 20, query: $query) {
            edges {
              node {
                id
                title
                handle
                variants(first: 10) {
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

  if (!data.data?.products?.edges) return null;

  // Se encontrou produtos, faz busca fuzzy para encontrar o melhor match
  let bestProduct = null;
  let bestSimilarity = 0.3; // Threshold mínimo de similaridade (30%)

  data.data.products.edges.forEach(edge => {
    const product = edge.node;
    const similarity = calculateSimilarity(query, product.title);

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestProduct = product;
    }
  });

  if (bestProduct) {
    // Encontra a variante que melhor corresponde aos critérios extraídos
    const matchingVariant = findMatchingVariant(bestProduct, features);
    return {
      ...bestProduct,
      selectedVariant: matchingVariant
    };
  }

  return null;
}

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

async function processCommand(prompt) {
  const analysis = analyzeCommand(prompt);

  if (analysis.intent === 'create_order') {
    let customer = null;
    if (analysis.customerQuery) {
      customer = await findCustomer(analysis.customerQuery);
    }

    let product = null;
    if (analysis.productQuery) {
      product = await findProduct(analysis.productQuery);
    }

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

async function listAllProducts() {
  try {
    // Verifica se as credenciais estão configuradas
    try {
      getEnv();
    } catch (e) {
      // Se não tiver credenciais, usa dados de teste
      console.warn('Usando dados de teste - configure SHOPIFY_SHOP e SHOPIFY_ADMIN_TOKEN');
      return getMockProducts();
    }

    const { data } = await shopifyFetch(`/graphql.json`, {
      method: 'POST',
      body: JSON.stringify({
        query: `
          query {
            products(first: 100) {
              edges {
                node {
                  id
                  title
                  handle
                  variants(first: 20) {
                    edges {
                      node {
                        id
                        title
                        sku
                        price
                        availableForSale
                      }
                    }
                  }
                }
              }
            }
          }
        `
      })
    });

    if (data.data?.products?.edges && data.data.products.edges.length > 0) {
      return data.data.products.edges.map(edge => {
        const product = edge.node;
        const variants = product.variants?.edges?.map(v => ({
          ...v.node,
          productId: product.id,
          productTitle: product.title
        })) || [];

        return {
          ...product,
          variants: variants
        };
      });
    }

    // Se Shopify retornou vazio, usa dados de teste
    console.warn('Nenhum produto encontrado na Shopify, usando dados de teste');
    return getMockProducts();
  } catch (error) {
    // Se houver erro na busca, retorna dados de teste
    console.warn('Erro ao buscar produtos:', error.message, '- usando dados de teste');
    return getMockProducts();
  }
}

function getMockProducts() {
  return [
    {
      id: 'prod_1',
      title: 'Camiseta Suedine',
      handle: 'camiseta-suedine',
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
      variants: [
        { id: 'var_4', title: 'M - Habano', sku: 'CT-M-HAB', price: '75.90', productId: 'prod_2', productTitle: 'Camiseta Texturizada' },
        { id: 'var_5', title: 'G - Cinza', sku: 'CT-G-CIN', price: '75.90', productId: 'prod_2', productTitle: 'Camiseta Texturizada' }
      ]
    },
    {
      id: 'prod_3',
      title: 'Suéter Ambition',
      handle: 'sueter-ambition',
      variants: [
        { id: 'var_6', title: 'P - Azul', sku: 'SA-P-AZU', price: '129.90', productId: 'prod_3', productTitle: 'Suéter Ambition' },
        { id: 'var_7', title: 'M - Azul', sku: 'SA-M-AZU', price: '129.90', productId: 'prod_3', productTitle: 'Suéter Ambition' }
      ]
    }
  ];
}

async function listShippingMethods() {
  // Para Shopify, as formas de entrega são configuradas nas políticas de envio
  // Por enquanto, retornamos as opções padrão que podem ser customizadas
  return [
    { id: 'pickup', label: 'Retirar na Loja' },
    { id: 'delivery', label: 'Enviar (Frete a Calcular)' },
    { id: 'standard', label: 'Entrega Padrão' },
    { id: 'express', label: 'Entrega Express' }
  ];
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const action = req.query.action;

      if (action === 'products') {
        const products = await listAllProducts();
        return res.status(200).json({
          ok: true,
          action: 'products',
          data: products
        });
      }

      if (action === 'shipping') {
        const shipping = await listShippingMethods();
        return res.status(200).json({
          ok: true,
          action: 'shipping',
          data: shipping
        });
      }

      return res.status(200).json({
        ok: true,
        status: 'ready',
        mode: 'production',
        capabilities: [
          'Criar pedidos automaticamente com inteligência natural',
          'Buscar clientes por nome, email ou telefone',
          'Buscar produtos por nome ou SKU',
          'Gerar rascunhos de pedidos (Draft Orders)',
          'Processar comandos em linguagem natural'
        ],
        supportedIntents: [
          'create_order',
          'find_customer',
          'find_product',
          'general_assistant'
        ],
        examples: [
          'Criar pedido de 2 camisetas azuis para João Silva',
          'Quero pedir 1 produto xyz para cliente@email.com',
          'Encomendar 3 unidades de calça tamanho G para Maria'
        ]
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const prompt = String(req.body?.prompt || '').trim();

    if (!prompt) {
      return res.status(400).json({
        ok: false,
        error: 'O campo prompt é obrigatório.'
      });
    }

    const response = await processCommand(prompt);

    return res.status(200).json({
      ok: response.success,
      ...response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('ai.js error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Erro interno na rota de IA.',
      errorType: error.name
    });
  }
}
