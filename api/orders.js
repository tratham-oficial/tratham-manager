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
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      data?.errors ||
      data?.error ||
      data?.message ||
      `Erro Shopify: ${response.status}`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return data;
}

function normalizeCustomer(customer) {
  if (!customer) return null;

  return {
    id: customer?.id ?? null,
    first_name: customer?.first_name ?? '',
    last_name: customer?.last_name ?? '',
    email: customer?.email ?? '',
    default_address: {
      name: customer?.default_address?.name ?? '',
      city: customer?.default_address?.city ?? ''
    }
  };
}

function normalizeOrder(order) {
  return {
    id: order?.id ?? null,
    name: order?.name ?? '',
    created_at: order?.created_at ?? null,
    updated_at: order?.updated_at ?? null,
    total_price: order?.total_price ?? '0.00',
    subtotal_price: order?.subtotal_price ?? '0.00',
    total_discounts: order?.total_discounts ?? '0.00',
    financial_status: order?.financial_status ?? '',
    fulfillment_status: order?.fulfillment_status ?? '',
    currency: order?.currency ?? 'BRL',
    customer: normalizeCustomer(order?.customer),
    line_items: Array.isArray(order?.line_items)
      ? order.line_items.map(item => ({
          id: item?.id ?? null,
          title: item?.title ?? '',
          quantity: item?.quantity ?? 0,
          price: item?.price ?? '0.00',
          sku: item?.sku ?? ''
        }))
      : []
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const limit = Math.min(Number(req.query.limit || 100), 250);

    const data = await shopifyFetch(`/orders.json?status=any&limit=${limit}`);

    const orders = Array.isArray(data?.orders)
      ? data.orders.map(normalizeOrder)
      : [];

    return res.status(200).json({
      ok: true,
      orders,
      count: orders.length
    });
  } catch (error) {
    console.error('orders.js error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Erro ao buscar pedidos.'
    });
  }
}
