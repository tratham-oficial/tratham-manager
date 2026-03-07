const SHOP = process.env.SHOPIFY_SHOP;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = "2025-10";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  const r = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/products/${id}.json`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    }
  });

  const text = await r.text();
  if (!r.ok) return res.status(r.status).send(text);
  return res.status(200).send(text || "{}");
}
