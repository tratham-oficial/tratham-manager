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
  return {
    id: customer?.id ?? null,
    first_name: customer?.first_name ?? '',
    last_name: customer?.last_name ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    created_at: customer?.created_at ?? null,
    updated_at: customer?.updated_at ?? null,
    total_spent: customer?.total_spent ?? '0.00',
    orders_count: customer?.orders_count ?? 0,
    tags: customer?.tags ?? '',
    state: customer?.state ?? '',
    verified_email: Boolean(customer?.verified_email),
    default_address: {
      name: customer?.default_address?.name ?? '',
      city: customer?.default_address?.city ?? '',
      province: customer?.default_address?.province ?? '',
      country: customer?.default_address?.country ?? '',
      address1: customer?.default_address?.address1 ?? '',
      zip: customer?.default_address?.zip ?? ''
    }
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const limit = Math.min(Number(req.query.limit || 100), 250);

    const data = await shopifyFetch(`/customers.json?limit=${limit}`);

    const customers = Array.isArray(data?.customers)
      ? data.customers.map(normalizeCustomer)
      : [];

    return res.status(200).json({
      ok: true,
      customers,
      count: customers.length
    });
  } catch (error) {
    console.error('customers.js error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Erro ao buscar clientes.'
    });
  }
}
