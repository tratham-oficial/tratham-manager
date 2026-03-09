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

function normalizeVariant(variant) {
  return {
    id: variant?.id ?? null,
    title: variant?.title ?? '',
    price: variant?.price ?? '0.00',
    sku: variant?.sku ?? '',
    inventory_quantity: variant?.inventory_quantity ?? 0
  };
}

function normalizeProduct(product) {
  const variants = Array.isArray(product?.variants)
    ? product.variants.map(normalizeVariant)
    : [];

  const inventory_quantity = variants.reduce((sum, v) => {
    const qty = Number(v?.inventory_quantity);
    return sum + (Number.isFinite(qty) ? qty : 0);
  }, 0);

  return {
    id: product?.id ?? null,
    title: product?.title ?? '',
    vendor: product?.vendor ?? '',
    product_type: product?.product_type ?? '',
    status: product?.status ?? 'active',
    image: product?.image?.src
      ? { src: product.image.src }
      : null,
    images: Array.isArray(product?.images)
      ? product.images.map(img => ({ src: img?.src ?? '' }))
      : [],
    variants,
    inventory_quantity
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const limit = Math.min(Number(req.query.limit || 100), 250);

      const data = await shopifyFetch(`/products.json?limit=${limit}`);

      const products = Array.isArray(data?.products)
        ? data.products.map(normalizeProduct)
        : [];

      return res.status(200).json({
        ok: true,
        products,
        count: products.length
      });
    }

    if (req.method === 'POST') {
      const {
        title,
        body_html = '',
        vendor = 'Tratham',
        product_type = '',
        price,
        sku = '',
        inventory_quantity = 0
      } = req.body || {};

      if (!title || price === undefined || price === null || price === '') {
        return res.status(400).json({
          ok: false,
          error: 'Campos obrigatórios: title e price.'
        });
      }

      const payload = {
        product: {
          title,
          body_html,
          vendor,
          product_type,
          status: 'active',
          variants: [
            {
              price: String(price),
              sku: sku || undefined,
              inventory_management: 'shopify',
              inventory_quantity: Number(inventory_quantity) || 0
            }
          ]
        }
      };

      const data = await shopifyFetch('/products.json', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      return res.status(201).json({
        ok: true,
        product: normalizeProduct(data?.product)
      });
    }

    if (req.method === 'DELETE') {
      const id = req.query.id || req.body?.id;

      if (!id) {
        return res.status(400).json({
          ok: false,
          error: 'ID do produto é obrigatório para exclusão.'
        });
      }

      await shopifyFetch(`/products/${id}.json`, {
        method: 'DELETE'
      });

      return res.status(200).json({
        ok: true,
        deletedId: id
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('products.js error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Erro ao processar produtos.'
    });
  }
}
