import { env } from "../config/env.js";
import { getDashboard, getPurchases } from "./analytics.service.js";

export async function answerQuestion(userId, question) {
  const [dashboard, purchases] = await Promise.all([
    getDashboard(userId),
    getPurchases(userId)
  ]);

  const context = {
    monthlySpending: dashboard.monthlySpending,
    topPurchasedProducts: dashboard.topPurchasedProducts,
    mostExpensiveProducts: dashboard.mostExpensiveProducts,
    insights: dashboard.insights,
    recentPurchases: purchases.slice(0, 5)
  };

  if (env.openAiApiKey) {
    try {
      return await answerWithOpenAI(question, context);
    } catch (_error) {
      return answerWithLocalHeuristics(question, context);
    }
  }

  return answerWithLocalHeuristics(question, context);
}

async function answerWithOpenAI(question, context) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`
    },
    body: JSON.stringify({
      model: env.openAiModel,
      input: [
        {
          role: "system",
          content:
            "Voce e um analista domestico de compras. Responda em portugues, de forma clara, usando apenas os dados fornecidos."
        },
        {
          role: "user",
          content: `Pergunta: ${question}\n\nDados:\n${JSON.stringify(context)}`
        }
      ]
    })
  });

  const data = await response.json();
  const text = data.output_text || data.output?.[0]?.content?.[0]?.text || "";

  return {
    answer: text || "Nao consegui gerar a resposta agora.",
    provider: "openai"
  };
}

function answerWithLocalHeuristics(question, context) {
  const q = question.toLowerCase();
  const month = context.monthlySpending.at(-1);
  const top = context.topPurchasedProducts[0];
  const expensive = context.mostExpensiveProducts[0];
  const cheapestStore = context.insights.cheapestStores[0];
  const biggestIncrease = context.insights.biggestPriceIncrease[0];

  let answer =
    "Com base no seu historico atual, ainda estou juntando dados. Importe mais cupons para gerar insights mais fortes.";

  if (q.includes("gastei") || q.includes("gasto") || q.includes("mes")) {
    answer = month
      ? `No mes mais recente voce gastou R$ ${month.total.toFixed(2)}.`
      : answer;
  } else if (q.includes("compro mais") || q.includes("frequente")) {
    answer = top
      ? `Seu produto mais comprado ate agora e ${top.product}, com ${top.quantity} unidades acumuladas.`
      : answer;
  } else if (q.includes("caro") || q.includes("mais caro")) {
    answer = expensive
      ? `O item com maior preco medio no seu historico atual e ${expensive.product}, em torno de R$ ${expensive.averagePrice.toFixed(2)}.`
      : answer;
  } else if (q.includes("loja") || q.includes("econom")) {
    answer = cheapestStore
      ? `Pelos seus dados atuais, a loja com melhor media de preco e ${cheapestStore.store}, com media de R$ ${cheapestStore.averagePrice.toFixed(2)}.`
      : answer;
  } else if (q.includes("aument")) {
    answer = biggestIncrease
      ? `${biggestIncrease.product} teve a maior alta detectada, com variacao de ${biggestIncrease.variationPercent}%.`
      : answer;
  } else if (context.recentPurchases.length) {
    answer = `Voce tem ${context.recentPurchases.length} compras recentes analisadas. O destaque atual e ${top?.product || "seu historico em formacao"}.`;
  }

  return {
    answer,
    provider: "local"
  };
}
