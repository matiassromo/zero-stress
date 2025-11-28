"use client";

import { useState, useRef, useEffect } from "react";
import { analyzeData, AnalysisResponse } from "@/lib/apiv2/chatAnalysis";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: AnalysisResponse;
  error?: string;
}

export default function ChatbotAnalysis() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPrompt.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: currentPrompt.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentPrompt("");
    setIsLoading(true);

    try {
      const response = await analyzeData(currentPrompt.trim());

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.explanation,
        data: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Lo siento, ocurrió un error al procesar tu solicitud.",
        error: error?.message || "Error desconocido",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-800">
          Análisis de Datos con IA
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Haz preguntas sobre tus datos en lenguaje natural
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Comienza una conversación
              </h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Escribe una pregunta sobre tus datos en español y obtén análisis, consultas SQL y visualizaciones automáticamente.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-3xl ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-2xl rounded-br-sm"
                    : "bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm"
                } px-5 py-4`}
              >
                {message.role === "user" ? (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                ) : (
                  <div className="space-y-4">
                    {/* Explanation */}
                    <div>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {message.content}
                      </p>
                    </div>

                    {/* SQL Query */}
                    {message.data?.sql_query && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Consulta SQL
                          </span>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto">
                          <pre className="text-xs text-gray-700 font-mono">
                            {message.data.sql_query}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Charts */}
                    {message.data?.charts && message.data.charts.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Visualizaciones
                          </span>
                        </div>
                        <div className="grid gap-4">
                          {message.data.charts.map((chart, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                            >
                              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                {chart.title}
                              </h3>
                              <div className="flex justify-center">
                                <img
                                  src={`data:image/png;base64,${chart.image_base64}`}
                                  alt={chart.title}
                                  className="max-w-full h-auto rounded"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Tipo: {chart.type}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {message.error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-700">
                          <span className="font-semibold">Error:</span>{" "}
                          {message.error}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-3xl bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                  <span className="text-sm text-gray-500">
                    Analizando datos...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={currentPrompt}
                onChange={(e) => setCurrentPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta sobre los datos..."
                disabled={isLoading}
                rows={1}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
            </div>
            <button
              type="submit"
              disabled={!currentPrompt.trim() || isLoading}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Presiona Enter para enviar, Shift + Enter para nueva línea
          </p>
        </form>
      </div>
    </div>
  );
}
