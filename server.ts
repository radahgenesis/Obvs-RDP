import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON bodies
app.use(express.json());

// Initialize Google GenAI client if API key is provided
let aiClient: GoogleGenAI | null = null;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini AI Client initialized successfully on server.");
  } catch (err) {
    console.error("Failed to initialize Gemini AI Client:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is missing. Server Copilot will operate in local fallback mode.");
}

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiEnabled: !!aiClient });
});

// 2. Gemini-powered Sysadmin Copilot Endpoint
app.post("/api/copilot", async (req, res) => {
  const { prompt, history = [], systemContext = "" } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // If no AI client, provide a helpful automated rule-based fallback response
  if (!aiClient) {
    return res.json({
      text: "⚠️ [Local Console Helper] The server's `GEMINI_API_KEY` is not configured. To enable full AI intelligence, please add it in the Secrets panel in the AI Studio UI. \n\nHere is a local suggestion: To perform common server operations, you can use: \n- `ssh user@host` (to start session)\n- `sudo systemctl restart service` (to restart system service)\n- `df -h` (to check disk space)\n- `top` or `htop` (to monitor resource usage).",
    });
  }

  try {
    const formattedHistory = history.map((h: { role: string; content: string }) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.content }],
    }));

    // Generate response using Gemini 3.5 Flash
    const systemInstruction = `You are a high-end Server Administration and Remote Desktop Copilot inside a Multi-Desktop Management Console.
Your job is to assist with remote desktop control, network diagnostics, shell scripting (bash, powershell), crontabs, server setup (Linux/Ubuntu, Windows RDP, macOS), SSH key generation, and system troubleshooting.
Be direct, professional, extremely concise, and provide complete, copy-pasteable script snippets or commands when applicable. Keep explanations short.
${systemContext}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Copilot AI Generation Error:", error);
    res.status(500).json({
      error: "Failed to generate copilot response",
      details: error.message || error,
    });
  }
});

// 3. Mock Machine Actions (Reboot, Logs, Service control) for live feedback
app.post("/api/machines/action", (req, res) => {
  const { machineId, action, target } = req.body;
  
  if (!machineId || !action) {
    return res.status(400).json({ error: "machineId and action are required" });
  }

  // Simulate remote server system responses
  const timestamp = new Date().toISOString();
  let logOutput = "";
  let success = true;

  switch (action) {
    case "reboot":
      logOutput = `[${timestamp}] Initiating warm reboot on system ID ${machineId}...\n[${timestamp}] Connection closed by remote host.\n[${timestamp}] Remote system powering down.\n[${timestamp}] BIOS/UEFI POST self-test passed.\n[${timestamp}] Loading kernel and grub modules...\n[${timestamp}] System services initiating.\n[${timestamp}] Multi-user SSH/VNC target reached. Status: ONLINE.`;
      break;
    case "kill-process":
      logOutput = `[${timestamp}] SIGTERM sent to process ${target || "PID 9042"}.\n[${timestamp}] Process terminated successfully. Released resource handles.`;
      break;
    case "restart-service":
      logOutput = `[${timestamp}] systemctl stop ${target || "nginx"}\n[${timestamp}] Stopping service...\n[${timestamp}] systemctl start ${target || "nginx"}\n[${timestamp}] Service started successfully (Active: running).`;
      break;
    case "fetch-logs":
      logOutput = `[${timestamp}] journalctl -n 10 --no-pager\n-- Logs begin at 2026-06-25 --\n[${timestamp}] sshd[4201]: Accepted publickey for admin from 192.168.1.52\n[${timestamp}] systemd[1]: Starting Periodic Command Scheduler...\n[${timestamp}] nginx[104]: Configuration file /etc/nginx/nginx.conf test is successful\n[${timestamp}] systemd[1]: Started nginx.service - A high performance web server and reverse proxy.`;
      break;
    default:
      success = false;
      logOutput = `[${timestamp}] Unknown command action: ${action}`;
  }

  res.json({ success, logOutput, timestamp });
});

// Setup Vite Dev Server / Static Asset distribution
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Mounting Vite dev server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Remote Desktop Console] server is running on http://localhost:${PORT}`);
  });
}

startServer();
