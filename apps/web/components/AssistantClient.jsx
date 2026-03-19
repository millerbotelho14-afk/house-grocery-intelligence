"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { AuthGate } from "./AuthGate";

export function AssistantClient() {
  const { token } = useAuth();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim()) return;
    const currentQuestion = question;
    setQuestion("");
    setMessages((current) => [...current, { role: "user", text: currentQuestion }]);
    setLoading(true);

    try {
      const result = await api.askAi(token, currentQuestion);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: result.answer, provider: result.provider }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGate title="Entre para conversar com seu assistente de compras">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="glass rounded-[28px] p-6">
          <h2 className="text-3xl font-semibold">Pergunte qualquer coisa</h2>
          <p className="mt-3 text-[var(--muted)]">
            Exemplos: "Onde estou gastando mais?", "Qual produto subiu mais?", "Qual loja esta compensando?"
          </p>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="mt-6 min-h-40 w-full rounded-[24px] border border-[var(--line)] bg-white px-4 py-4"
            placeholder="Digite sua pergunta..."
          />
          <button onClick={ask} className="mt-4 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white">
            {loading ? "Pensando..." : "Perguntar"}
          </button>
        </section>
        <section className="glass rounded-[28px] p-6">
          <h2 className="text-2xl font-semibold">Respostas</h2>
          <div className="mt-5 space-y-4">
            {messages.length === 0 ? (
              <div className="rounded-[22px] bg-[var(--panel-strong)] p-4 text-[var(--muted)]">
                Ainda nao ha perguntas nesta sessao.
              </div>
            ) : (
              messages.map((message, index) => (
                <article key={`${message.role}-${index}`} className={`rounded-[22px] p-4 ${message.role === "user" ? "bg-[var(--accent-soft)]" : "bg-white"}`}>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    {message.role === "user" ? "Voce" : `Assistente${message.provider ? ` • ${message.provider}` : ""}`}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap">{message.text}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </AuthGate>
  );
}
