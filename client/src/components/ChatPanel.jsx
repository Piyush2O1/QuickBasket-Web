import { Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { api, getErrorMessage } from "../api/http.js";
import { getSocket } from "../api/socket.js";

export default function ChatPanel({ roomId }) {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  const socket = useMemo(() => getSocket(), []);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let mounted = true;

    setError("");
    setMessages([]);
    setSuggestions([]);
    socket.emit("join-room", roomId);

    api
      .get(`/chat/messages/${roomId}`)
      .then(({ data }) => {
        if (!mounted) {
          return;
        }

        setMessages(data.messages || []);
      })
      .catch((loadError) => {
        if (!mounted) {
          return;
        }

        setError(getErrorMessage(loadError));
      });

    const onMessage = (message) => {
      if (String(message.roomId) === String(roomId)) {
        setMessages((current) => [...current, message]);
      }
    };

    socket.on("send-message", onMessage);

    return () => {
      mounted = false;
      socket.emit("leave-room", roomId);
      socket.off("send-message", onMessage);
    };
  }, [roomId, socket]);

  const send = async () => {
    const nextText = text.trim();

    if (!nextText) {
      return;
    }

    setText("");
    setError("");

    try {
      await api.post("/chat/messages", {
        roomId,
        text: nextText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    } catch (sendError) {
      setText(nextText);
      setError(getErrorMessage(sendError));
    }
  };

  const getSuggestions = async () => {
    try {
      setError("");

      const lastMessage = messages.at(-1)?.text || text || "Where are you?";
      const { data } = await api.post("/chat/ai-suggestions", {
        role: user.role === "deliveryBoy" ? "delivery_boy" : "user",
        message: lastMessage,
      });

      setSuggestions(data.suggestions || []);
    } catch (suggestionError) {
      setError(getErrorMessage(suggestionError));
    }
  };

  return (
    <section className="glass-panel-strong rounded-[32px] p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Customer chat</p>
          <h2 className="font-display text-2xl font-semibold text-slate-950">Delivery Chat</h2>
        </div>
        <button
          type="button"
          onClick={getSuggestions}
          className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
        >
          <Sparkles size={16} />
          AI
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {error}
        </div>
      )}

      <div className="flex h-72 flex-col gap-2 overflow-y-auto rounded-[24px] border border-white/80 bg-white/62 p-3">
        {messages.map((message) => {
          const mine = String(message.senderId) === String(user.id);

          return (
            <div
              key={message._id || `${message.senderId}-${message.time}-${message.text}`}
              className={`max-w-[80%] rounded-[20px] px-3 py-2 text-sm ${
                mine ? "ml-auto bg-slate-950 text-white" : "bg-white text-slate-800 shadow-sm"
              }`}
            >
              {message.text}
            </div>
          );
        })}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setText(suggestion)}
              className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              send();
            }
          }}
          className="min-w-0 flex-1 rounded-full border border-white/80 bg-white/78 px-4 py-3 outline-none focus:border-emerald-300"
          placeholder="Type a message"
        />
        <button
          type="button"
          onClick={send}
          disabled={!text.trim()}
          className="grid h-12 w-12 place-items-center rounded-full bg-slate-950 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          title="Send"
        >
          <Send size={18} />
        </button>
      </div>
    </section>
  );
}
