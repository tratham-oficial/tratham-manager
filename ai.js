export default async function handler(req, res) {
  return res.status(200).json({
    reply: "Assistente IA ainda não configurado no backend."
  });
}
