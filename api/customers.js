const SHOP = process.env.SHOPIFY_SHOP;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = "2025-10";

async function shopifyFetch(endpoint) {
  const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    }
  });

  const text = await res.text();
  if (!res.ok) return { error: true, status: res.status, body: text };
  return text ? JSON.parse(text) : {};
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const data = await shopifyFetch("customers.json?limit=50");
  if (data.error) return res.status(data.status).send(data.body);
  return res.status(200).json(data);
}
