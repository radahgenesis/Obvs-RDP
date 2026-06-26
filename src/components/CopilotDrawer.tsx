import React, { useState, useEffect, useRef } from "react";
import { CopilotMessage } from "../types";
import {
  BotMessageSquare,
  Send,
  Sparkles,
  Cpu,
  ShieldAlert,
  Clipboard,
  Check,
  HelpCircle,
  FileText,
  Terminal,
  ShieldCheck,
  Code
} from "lucide-react";

interface CopilotDrawerProps {
  onSendMessage: (prompt: string, history: CopilotMessage[]) => Promise<string>;
}

export default function CopilotDrawer({ onSendMessage }: CopilotDrawerProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "init-msg",
      role: "assistant",
      content: "👋 Greetings! I am your **Gemini AI Sysadmin Copilot**.\n\nI am configured inside your MultiDesk environment to generate shell scripts, diagnose server error logs, format crontabs, and audit SSH key setups.\n\nHow can I help you optimize your remote systems today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg: CopilotMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const responseText = await onSendMessage(trimmed, messages);
      const assistantMsg: CopilotMessage = {
        id: "assistant-" + Date.now(),
        role: "assistant",
        content: responseText,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: CopilotMessage = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: "⚠️ **Connection Error**: Failed to reach the server copilot API route. Please ensure that your server is active and configured correctly.",
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Pre-made quick action buttons for common server tasks
  const presets = [
    { title: "deploy-cluster.sh", desc: "Docker production deploy script", prompt: "Generate a robust production shell script to deploy a standard docker-compose cluster containing Nginx, PostgreSQL, and Redis. Include healthcheck guards." },
    { title: "crontab-backups", desc: "Hourly encrypted backup cron", prompt: "Help me write a secure crontab backup entry that archives '/var/www/html/' to a remote NAS location, encrypts it with gpg, and runs every morning at 2 AM." },
    { title: "ssh-hardening-audit", desc: "Linux sshd config audit", prompt: "What are the top 5 secure configurations to apply to '/etc/ssh/sshd_config' to prevent brute force attacks? Provide the exact config lines." },
    { title: "nginx-proxy-tls", desc: "Nginx reverse-proxy SSL setup", prompt: "Generate an Nginx server block configuration that acts as a secure reverse-proxy redirecting HTTP port 80 to TLS HTTPS port 443, supporting WebSockets." }
  ];

  // Helper to format messages containing markdown or code blocks beautifully
  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        // Extract language and code
        const lines = part.split("\n");
        const header = lines[0].replace("```", "").trim() || "bash";
        const code = lines.slice(1, -1).join("\n");
        const blockId = `${msgId}-code-${index}`;

        return (
          <div key={index} className="my-4 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs shadow-md">
            <div className="bg-slate-900 px-4 py-2 flex justify-between items-center border-b border-slate-800 text-slate-400">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 font-sans flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                {header}
              </span>
              <button
                onClick={() => handleCopy(code, blockId)}
                className="hover:text-white transition flex items-center gap-1 text-[10px] font-semibold"
              >
                {copiedId === blockId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3 h-3" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-slate-100 select-text font-mono leading-relaxed bg-black/40">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Process standard inline text
      return (
        <span key={index} className="whitespace-pre-wrap select-text text-sm leading-relaxed text-slate-300">
          {part.split("\n").map((line, lIdx) => {
            // Simple check for bold markers **
            if (line.includes("**")) {
              const bParts = line.split(/\*\*(.*?)\*\*/g);
              return (
                <span key={lIdx} className="block mt-1">
                  {bParts.map((bp, bpIdx) => bpIdx % 2 === 1 ? <strong key={bpIdx} className="text-white font-bold">{bp}</strong> : bp)}
                </span>
              );
            }
            return <span key={lIdx} className="block mt-1">{line}</span>;
          })}
        </span>
      );
    });
  };

  return (
    <div className="flex-1 bg-slate-900 p-8 flex flex-col h-full text-slate-100 font-sans overflow-hidden">
      
      {/* Top AI Copilot Title header */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BotMessageSquare className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Gemini Sysadmin Copilot</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Consult the integrated server administrator to design deployment scripts, hardening files, and crontabs.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Gemini 3.5 Flash
        </div>
      </div>

      {/* Main split dashboard: left chat, right quick admin presets */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
        
        {/* Chat message column */}
        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
          
          {/* Scrollable messages container */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5">
            {messages.map((m) => {
              const isAssistant = m.role === "assistant";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 max-w-4xl ${isAssistant ? "" : "flex-row-reverse self-end"}`}
                >
                  {/* Avatar bubble */}
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                    isAssistant ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-200"
                  }`}>
                    {isAssistant ? <BotMessageSquare className="w-4.5 h-4.5" /> : "U"}
                  </div>

                  {/* Bubble text content */}
                  <div className={`rounded-xl px-4 py-3 border select-text ${
                    isAssistant
                      ? "bg-slate-900/60 border-slate-800 text-slate-200"
                      : "bg-indigo-600/10 border-indigo-500/20 text-white"
                  }`}>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-1.5">
                      <span>{isAssistant ? "GEMINI CO-PILOT" : "CONSOLE OPERATOR"}</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {renderMessageContent(m.content, m.id)}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 max-w-lg">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white shrink-0 flex items-center justify-center text-xs">
                  <BotMessageSquare className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <div className="rounded-xl px-4 py-3 border bg-slate-900/60 border-slate-800 text-slate-400 flex items-center gap-2 font-medium">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>Gemini is compiling recommendations...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form input controls */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-4 bg-slate-950 border-t border-slate-900 flex gap-2.5 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask for bash scripts, crontab configs, ssh configurations, or audit advice..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition disabled:bg-slate-900 disabled:text-slate-600 shadow-md shadow-indigo-600/10"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Right quick presets template column */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Quick sysadmin queries
            </h4>
            <p className="text-[10px] text-slate-500">
              Click any blueprint tile below to automatically prompt Gemini for direct copy-pasteable files.
            </p>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.prompt)}
                disabled={loading}
                className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-indigo-500/40 text-left transition hover:-translate-y-0.5 shadow-md flex gap-2.5 items-start group disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                <div className="w-7 h-7 rounded bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition">{p.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
