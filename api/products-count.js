const SHOP = process.env.SHOPIFY_SHOP;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = "2025-10";

export default async function handler(req, res) {
  const r = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/products/count.json`, {
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    }
  });

  const text = await r.text();
  if (!r.ok) return res.status(r.status).send(text);

  try {
    return res.status(200).json(JSON.parse(text));
  } catch {
    return res.status(200).send(text);
  }
}
