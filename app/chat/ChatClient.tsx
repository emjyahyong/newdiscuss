"use client";

import { useEffect, useRef, useState } from "react";
import { FiSend } from "react-icons/fi";

type Message = {
  _id: string;
  content: string;
  userId: string;
  userName: string;
  createdAt: string;
};

export default function ChatClient({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  async function fetchMessages() {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      // silently ignore network errors during polling
    }
  }

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      if (res.ok) {
        setContent("");
        await fetchMessages();
      } else {
        const data = await res.json();
        setError(data.error ?? "Erreur lors de l'envoi");
      }
    } catch {
      setError("Impossible d'envoyer le message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 mt-16 text-sm">
            Aucun message. Soyez le premier à écrire !
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.userId === currentUserId;
          return (
            <div
              key={msg._id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex flex-col gap-1 max-w-sm lg:max-w-md ${
                  isOwn ? "items-end" : "items-start"
                }`}
              >
                {!isOwn && (
                  <span className="text-xs font-medium text-gray-500 px-1">
                    {msg.userName}
                  </span>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm break-words ${
                    isOwn
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-gray-400 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t px-4 py-3 flex-shrink-0">
        {error && (
          <p className="text-xs text-red-500 mb-2 px-1">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écrire un message..."
              maxLength={500}
              disabled={sending}
              className="w-full pl-4 pr-16 py-2.5 border border-gray-200 rounded-full bg-gray-50 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-colors disabled:opacity-60"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
              {content.length}/500
            </span>
          </div>
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <FiSend size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
