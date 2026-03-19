import { answerQuestion } from "../services/ai.service.js";

export async function askAi(req, res) {
  const { question } = req.body || {};

  if (!question) {
    return res.status(400).json({ message: "Pergunta obrigatoria" });
  }

  const result = await answerQuestion(req.user.id, question);
  return res.json(result);
}
