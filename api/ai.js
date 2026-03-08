freturn res.status(200).json(response);unction classifyIntent(prompt) {
  const text = String(prompt || '').toLowerCase();

  if (
    text.includes('criar pedido') ||
    text.includes('novo pedido') ||
    text.includes('montar pedido')
  ) {
    return 'create_order';
  }

  if (
    text.includes('buscar cliente') ||
    text.includes('encontrar cliente') ||
    text.includes('achar cliente')
  ) {
    return 'find_customer';
  }

  if (
    text.includes('buscar produto') ||
    text.includes('encontrar produto') ||
    text.includes('achar produto')
  ) {
    return 'find_product';
  }

  if (
    text.includes('resumo') ||
    text.includes('dashboard') ||
    text.includes('painel')
  ) {
    return 'dashboard_summary';
  }

  return 'general_assistant';
}

function extractEntities(prompt) {
  const text = String(prompt || '');

  const sizeMatch = text.match(/\b(PP|P|M|G|GG|XG|XGG)\b/i);
  const colorMatch = text.match(/\b(preto|branco|off white|bege|azul|verde|cinza|marrom)\b/i);
  const qtyMatch = text.match(/\b(\d+)\s?(unidade|unidades|peça|peças)?\b/i);

  return {
    size: sizeMatch ? sizeMatch[1].toUpperCase() : null,
    color: colorMatch ? colorMatch[1] : null,
    quantity: qtyMatch ? Number(qtyMatch[1]) : null
  };
}

function buildMockResponse(prompt) {
  const intent = classifyIntent(prompt);
  const entities = extractEntities(prompt);

  const base = {
    ok: true,
    mode: 'production',
    prompt,
    intent,
    dryRun: false,
    entities,
    timestamp: new Date().toISOString()
  };

  if (intent === 'create_order') {
    return {
      ...base,
      message: 'Comando entendido. A base já está pronta para evoluir para criação automática de pedido.',
      nextActions: [
        'identificar cliente',
        'identificar produto',
        'validar variante/tamanho',
        'montar order draft',
        'confirmar criação'
      ],
      suggestedPayload: {
        action: 'create_order',
        customer_query: null,
        items: [
          {
            product_query: null,
            quantity: entities.quantity || 1,
            size: entities.size,
            color: entities.color
          }
        ]
      }
    };
  }

  if (intent === 'find_customer') {
    return {
      ...base,
      message: 'Comando entendido. Próximo passo será conectar esta intent à rota de busca de clientes.',
      nextActions: [
        'normalizar nome/email/telefone',
        'consultar Shopify customers',
        'retornar matches ordenados por relevância'
      ],
      suggestedPayload: {
        action: 'find_customer',
        query: prompt
      }
    };
  }

  if (intent === 'find_product') {
    return {
      ...base,
      message: 'Comando entendido. Próximo passo será conectar esta intent à rota de busca de produtos.',
      nextActions: [
        'extrair nome do produto',
        'consultar catálogo',
        'retornar matches com preço e estoque'
      ],
      suggestedPayload: {
        action: 'find_product',
        query: prompt
      }
    };
  }

  if (intent === 'dashboard_summary') {
    return {
      ...base,
      message: 'Comando entendido. Esta intent poderá resumir pedidos, receita, clientes e estoque.',
      nextActions: [
        'ler endpoints do dashboard',
        'consolidar métricas',
        'responder em linguagem natural'
      ],
      suggestedPayload: {
        action: 'dashboard_summary'
      }
    };
  }

  return {
    ...base,
    message: 'Comando recebido. Ainda em modo mock, mas já estruturado para intents operacionais.',
    nextActions: [
      'classificar intenção',
      'extrair entidades',
      'mapear rota operacional',
      'executar com confirmação'
    ],
    suggestedPayload: {
      action: 'general_assistant',
      query: prompt
    }
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return res.status(200).json({
        ok: true,
        status: 'ready',
        mode: 'production',
        supportedIntents: [
          'create_order',
          'find_customer',
          'find_product',
          'dashboard_summary',
          'general_assistant'
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

    const response = buildMockResponse(prompt);

    return res.status(200).json(response);
  } catch (error) {
    console.error('ai.js error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Erro interno na rota de IA.'
    });
  }
}
