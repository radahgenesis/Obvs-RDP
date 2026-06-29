import React, { useState, useEffect, useRef } from "react";
import { RemoteMachine, RemoteFile } from "../types";
import SysAdminSuiteWindow from "./SysAdminSuiteWindow";
import {
  Terminal as TerminalIcon,
  FolderOpen,
  Activity,
  Globe,
  X,
  Minus,
  Maximize2,
  HardDrive,
  FileText,
  Play,
  ArrowLeft,
  Search,
  Wifi,
  Cpu,
  RefreshCw,
  Terminal,
  Shield,
  HelpCircle,
  Sliders
} from "lucide-react";

interface DesktopSimulatorProps {
  machine: RemoteMachine;
  onClose: () => void;
  onRunAction: (action: string, target?: string) => Promise<string>;
}

export default function DesktopSimulator({ machine, onClose, onRunAction }: DesktopSimulatorProps) {
  // Desktop environment states
  const [openApps, setOpenApps] = useState({
    terminal: false,
    fileManager: false,
    sysMonitor: false,
    browser: false,
    txtEditor: false,
    sysAdminSuite: true
  });
  
  const [activeApp, setActiveApp] = useState<"terminal" | "fileManager" | "sysMonitor" | "browser" | "txtEditor" | "sysAdminSuite" | null>("sysAdminSuite");
  const [terminalHistory, setTerminalHistory] = useState<{ cmd: string; output: string }[]>([
    { cmd: "system-connect", output: `Connected securely to Remote Desk [${machine.ip}:${machine.port}] via ${machine.protocol.toUpperCase()}\nType 'help' to see available remote commands.` }
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentDir, setCurrentDir] = useState(machine.os === "windows" ? "C:\\Users\\" + machine.username : "/home/" + machine.username);
  const [activeFile, setActiveFile] = useState<RemoteFile | null>(null);
  const [browserUrl, setBrowserUrl] = useState("http://localhost:8080/dashboard");
  const [pinging, setPinging] = useState(false);
  const [cpuUsage, setCpuUsage] = useState<number[]>(Array(20).fill(machine.metrics.cpu));
  const [ramUsage, setRamUsage] = useState<number[]>(Array(20).fill(machine.metrics.ram));
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory, pinging]);

  // Handle live metric updates in system monitor
  useEffect(() => {
    if (!openApps.sysMonitor) return;

    const interval = setInterval(() => {
      setCpuUsage((prev) => {
        const next = [...prev.slice(1)];
        const variance = Math.floor(Math.random() * 15) - 7;
        const newVal = Math.max(5, Math.min(95, machine.metrics.cpu + variance));
        next.push(newVal);
        return next;
      });

      setRamUsage((prev) => {
        const next = [...prev.slice(1)];
        const variance = Math.floor(Math.random() * 5) - 2;
        const newVal = Math.max(10, Math.min(98, machine.metrics.ram + variance));
        next.push(newVal);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [openApps.sysMonitor, machine.metrics.cpu, machine.metrics.ram]);

  // Draw metrics chart on Canvas
  useEffect(() => {
    if (!openApps.sysMonitor || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.strokeStyle = "rgba(75, 85, 99, 0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 30) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Draw CPU Line (Cyan)
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    cpuUsage.forEach((val, index) => {
      const x = (index / (cpuUsage.length - 1)) * width;
      const y = height - (val / 100) * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under CPU
    ctx.fillStyle = "rgba(6, 182, 212, 0.1)";
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Draw RAM Line (Emerald)
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ramUsage.forEach((val, index) => {
      const x = (index / (ramUsage.length - 1)) * width;
      const y = height - (val / 100) * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under RAM
    ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  }, [cpuUsage, ramUsage, openApps.sysMonitor]);

  // Execute terminal commands locally inside simulator
  const executeCommand = async (cmdString: string) => {
    const trimmed = cmdString.trim();
    if (!trimmed) return;

    const args = trimmed.split(" ");
    const command = args[0].toLowerCase();
    let output = "";

    switch (command) {
      case "help":
        output = `Available Remote Terminal commands:
  - neofetch        : Display system specifications & OS logo.
  - uname -a        : Display kernel and architecture information.
  - ls              : List contents of the current working directory.
  - cat <filename>  : View details/contents of a remote text file.
  - ping <host>     : Test latency connection to a remote IP/website.
  - clear           : Clear terminal history.
  - systemctl status: Check critical remote system services.
  - reboot          : Send a secure remote server restart request.
  - shutdown        : Terminate active terminal session & power off screen.`;
        break;

      case "clear":
        setTerminalHistory([]);
        return;

      case "neofetch":
        output = `
     _\\ _~-\\     ${machine.username}@${machine.name}
    (_______)    -------------------
    /  o o  \\    OS: ${machine.os === "linux" ? "Ubuntu LTS" : machine.os === "windows" ? "Windows Server 2025 Enterprise" : "macOS Sequoia 15.1"}
   |    _    |   Host: Remote Secure Core VM [AES-256 Enabled]
    \\  \\_// /    Kernel: Secure-Tunnel-v4
     \`-.__.-\`    Uptime: ${machine.metrics.uptime}
                 Shell: Remote Workspace Interactive Shell (sh-secure)
                 CPU: Hyper-Threaded Virtual CPU Core
                 Memory: ${machine.metrics.ram}% Consumed / Total Virtual Allocations
                 IP Address: ${machine.ip} [Port: ${machine.port}]
                 Protocol: ${machine.protocol.toUpperCase()} Tunnel
        `;
        break;

      case "uname":
        if (args[1] === "-a") {
          output = `${machine.os === "linux" ? "Linux" : machine.os === "windows" ? "Windows_NT" : "Darwin"} 4.14.0-tunnel-kernel #1 SMP Thu Jun 25 18:33:04 UTC 2026 x86_64 ${machine.os === "linux" ? "GNU/Linux" : ""}`;
        } else {
          output = machine.os === "linux" ? "Linux" : machine.os === "windows" ? "Windows_NT" : "Darwin";
        }
        break;

      case "ls":
        const files = machine.fileSystem.filter((f) => {
          if (machine.os === "windows") {
            return f.path.startsWith(currentDir) && f.path.length > currentDir.length;
          }
          return f.path.startsWith(currentDir) && f.path !== currentDir;
        });

        if (files.length === 0) {
          output = "Directory is empty.";
        } else {
          output = files
            .map((f) => {
              const baseName = f.name;
              const isDir = f.type === "directory";
              return isDir ? `\x1b[34m${baseName}/\x1b[0m` : `\x1b[32m${baseName}\x1b[0m  (${f.size || "0B"})`;
            })
            .join("\n");
        }
        break;

      case "cat":
        if (!args[1]) {
          output = "Error: Please specify a filename (e.g., cat welcome.txt).";
        } else {
          const fileName = args[1];
          const matchedFile = machine.fileSystem.find(
            (f) => f.name.toLowerCase() === fileName.toLowerCase() && f.type === "file"
          );
          if (matchedFile) {
            output = matchedFile.content || "[Empty File]";
          } else {
            output = `cat: ${fileName}: No such file or file is a directory.`;
          }
        }
        break;

      case "ping":
        if (!args[1]) {
          output = "Usage: ping <domain/ip>";
        } else {
          const targetHost = args[1];
          setPinging(true);
          setTerminalHistory((prev) => [...prev, { cmd: trimmed, output: `PING ${targetHost} (${machine.ip}) 56(84) bytes of data.` }]);
          
          let count = 0;
          const pingInterval = setInterval(() => {
            const time = (Math.random() * 15 + 4).toFixed(1);
            setTerminalHistory((prev) => [
              ...prev,
              { cmd: "", output: `64 bytes from ${targetHost}: icmp_seq=${count + 1} ttl=56 time=${time} ms` }
            ]);
            count++;
            if (count >= 4) {
              clearInterval(pingInterval);
              setPinging(false);
              setTerminalHistory((prev) => [
                ...prev,
                { cmd: "", output: `--- ${targetHost} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time ${time}ms` }
              ]);
            }
          }, 600);
          return;
        }
        break;

      case "systemctl":
        if (args[1] === "status") {
          const service = args[2] || "nginx";
          output = `● ${service}.service - High Performance service tunnel daemon
     Loaded: loaded (/etc/systemd/system/${service}.service; enabled; vendor preset: enabled)
     Active: active (running) since Thu 2026-06-25 10:04:12 UTC; 14h ago
   Main PID: 12402 (tunnel-d)
      Tasks: 4 (limit: 4915)
     Memory: 18.2M
     CGroup: /system.slice/${service}.service
             └─12402 /usr/sbin/${service} -g daemon on;`;
        } else if (args[1] === "restart") {
          const service = args[2] || "nginx";
          setTerminalHistory((prev) => [...prev, { cmd: trimmed, output: `Sending service reboot command to server for ${service}...` }]);
          const res = await onRunAction("restart-service", service);
          output = res;
        } else {
          output = "Usage: systemctl [status|restart] [service-name]";
        }
        break;

      case "reboot":
        setTerminalHistory((prev) => [...prev, { cmd: trimmed, output: "System reboot command received. Connection is terminating..." }]);
        const rebootLog = await onRunAction("reboot");
        setTimeout(() => {
          setTerminalHistory((prev) => [...prev, { cmd: "", output: rebootLog }]);
        }, 1500);
        return;

      case "shutdown":
        output = "Connection closed. Shutting down interactive monitor.";
        setTimeout(() => onClose(), 800);
        break;

      default:
        output = `sh: command not found: ${command}. Type 'help' to see available commands.`;
    }

    setTerminalHistory((prev) => [...prev, { cmd: trimmed, output }]);
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinging) return;
    executeCommand(currentInput);
    setCurrentInput("");
  };

  const openApp = (app: keyof typeof openApps) => {
    setOpenApps((prev) => ({ ...prev, [app]: true }));
    setActiveApp(app);
  };

  const closeApp = (app: keyof typeof openApps) => {
    setOpenApps((prev) => ({ ...prev, [app]: false }));
    if (activeApp === app) {
      setActiveApp(null);
    }
  };

  // OS UI styling configurations
  const getOsWallpaper = () => {
    switch (machine.os) {
      case "windows":
        return "bg-gradient-to-br from-blue-700 via-blue-900 to-slate-900";
      case "macos":
        return "bg-gradient-to-tr from-pink-600 via-purple-700 to-indigo-900";
      default:
        return "bg-gradient-to-b from-amber-950 via-stone-900 to-neutral-950"; // Ubuntu/Linux
    }
  };

  const getTaskbarStyle = () => {
    switch (machine.os) {
      case "windows":
        return "bottom-0 left-0 right-0 h-12 bg-[#1c1c1e]/90 border-t border-slate-700 flex justify-between items-center px-4 z-50 text-white font-sans text-xs";
      case "macos":
        return "bottom-4 left-1/2 -translate-x-1/2 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center gap-4 px-4 z-50 py-2 shadow-2xl";
      default: // Linux Orange/Auberge
        return "top-0 left-0 right-0 h-8 bg-zinc-900 flex justify-between items-center px-4 z-50 text-white text-xs border-b border-zinc-800";
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col overflow-hidden select-none font-sans ${getOsWallpaper()}`}>
      
      {/* Linux Top Bar (Only if Linux) */}
      {machine.os === "linux" && (
        <div className="bg-zinc-900 h-8 text-white px-4 flex justify-between items-center border-b border-black text-xs z-50">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-[#E95420]">Ubuntu Desktop</span>
            <span className="text-zinc-400 hover:text-white cursor-pointer" onClick={() => openApp("terminal")}>Terminal</span>
            <span className="text-zinc-400 hover:text-white cursor-pointer" onClick={() => openApp("fileManager")}>Files</span>
            <span className="text-zinc-400 hover:text-white cursor-pointer" onClick={() => openApp("sysMonitor")}>Resources</span>
          </div>
          <div className="flex items-center gap-3">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-xs text-zinc-300">104.198.14.88</span>
            <span>June 26, 2026</span>
            <button 
              onClick={onClose}
              className="bg-[#E95420] text-white px-2 py-0.5 rounded text-[10px] font-bold hover:bg-orange-700 transition"
            >
              CLOSE SESSION
            </button>
          </div>
        </div>
      )}

      {/* macOS Top Menu Bar */}
      {machine.os === "macos" && (
        <div className="bg-black/20 backdrop-blur text-white h-7 px-4 flex justify-between items-center text-xs z-50 border-b border-white/10">
          <div className="flex items-center gap-4">
            <span className="font-bold"></span>
            <span className="font-semibold cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded">Finder</span>
            <span className="cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded" onClick={() => openApp("fileManager")}>File</span>
            <span className="cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded" onClick={() => openApp("terminal")}>Terminal</span>
            <span className="cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded" onClick={() => openApp("sysMonitor")}>Monitor</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              AES-256 VNC Tunnel
            </div>
            <span>{machine.ip}</span>
            <span>Fri 12:26 AM</span>
            <button 
              onClick={onClose}
              className="bg-red-500/30 hover:bg-red-600 border border-red-500 text-red-200 px-2 py-0.5 rounded text-[10px] transition"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* Desktop Main Work Area */}
      <div className="relative flex-1 p-6 flex flex-col items-start gap-6 z-10">
        
        {/* Desktop Icons */}
        <div className="flex flex-col gap-6 items-center">
          
          {/* SysAdmin Suite Launcher */}
          <button 
            onDoubleClick={() => openApp("sysAdminSuite")}
            onClick={() => openApp("sysAdminSuite")}
            className="group flex flex-col items-center gap-1.5 w-18 text-center text-white"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-600/90 border border-indigo-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all ring-2 ring-indigo-400/40">
              <Sliders className="w-6 h-6 text-white animate-pulse" />
            </div>
            <span className="text-[11px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight text-indigo-300">SysAdmin Suite</span>
          </button>

          {/* Terminal Launcher */}
          <button 
            onDoubleClick={() => openApp("terminal")}
            onClick={() => openApp("terminal")}
            className="group flex flex-col items-center gap-1.5 w-18 text-center text-white"
          >
            <div className="w-12 h-12 rounded-xl bg-black/60 border border-slate-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
              <TerminalIcon className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-[11px] font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">Terminal</span>
          </button>

          {/* File Explorer Launcher */}
          <button 
            onDoubleClick={() => openApp("fileManager")}
            onClick={() => openApp("fileManager")}
            className="group flex flex-col items-center gap-1.5 w-18 text-center text-white"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/80 border border-amber-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-[11px] font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">Files</span>
          </button>

          {/* Resource Monitor Launcher */}
          <button 
            onDoubleClick={() => openApp("sysMonitor")}
            onClick={() => openApp("sysMonitor")}
            className="group flex flex-col items-center gap-1.5 w-18 text-center text-white"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-600/80 border border-cyan-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
              <Activity className="w-6 h-6 text-white animate-pulse" />
            </div>
            <span className="text-[11px] font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">Monitor</span>
          </button>

          {/* Browser Launcher */}
          <button 
            onDoubleClick={() => openApp("browser")}
            onClick={() => openApp("browser")}
            className="group flex flex-col items-center gap-1.5 w-18 text-center text-white"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-600/80 border border-indigo-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-[11px] font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">Web Admin</span>
          </button>
        </div>

        {/* --- SIMULATED WINDOWS --- */}

        {/* 1. Terminal Window */}
        {openApps.terminal && (
          <div 
            style={{ top: "40px", left: "140px", width: "680px", height: "420px" }}
            onClick={() => setActiveApp("terminal")}
            className={`absolute rounded-lg border flex flex-col shadow-2xl overflow-hidden transition-all duration-150 ${
              activeApp === "terminal" ? "border-slate-500 ring-1 ring-slate-400" : "border-slate-700/60 opacity-90"
            }`}
          >
            {/* Window Header */}
            <div className="bg-[#1e1e24] h-9 px-3 flex justify-between items-center border-b border-slate-800 text-white select-none">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-green-400" />
                <span className="text-xs font-mono text-slate-300">Secure SSH Session — {machine.username}@{machine.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-500 cursor-pointer flex items-center justify-center text-[8px] font-bold text-yellow-900" onClick={() => closeApp("terminal")}><Minus className="w-2 h-2" /></div>
                <div className="w-3 h-3 rounded-full bg-green-500 cursor-pointer flex items-center justify-center text-[8px] font-bold text-green-900"><Maximize2 className="w-2 h-2" /></div>
                <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer flex items-center justify-center text-[8px] font-bold text-red-900" onClick={() => closeApp("terminal")}><X className="w-2.5 h-2.5" /></div>
              </div>
            </div>
            
            {/* Terminal Screen */}
            <div className="flex-1 bg-black p-4 font-mono text-xs text-green-400 overflow-y-auto leading-relaxed flex flex-col">
              {terminalHistory.map((item, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {item.cmd && (
                    <div className="text-slate-400">
                      <span className="text-emerald-500 font-bold">{machine.username}@{machine.name}</span>
                      <span className="text-slate-500">:</span>
                      <span className="text-blue-400 font-semibold">{currentDir}</span>
                      <span className="text-slate-500">$</span> {item.cmd}
                    </div>
                  )}
                  <div className="mt-1 mb-2 text-slate-100">{item.output}</div>
                </div>
              ))}
              
              {pinging && (
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="animate-pulse">●</span> Pinging target... Press any key to wait.
                </div>
              )}

              <form onSubmit={handleTerminalSubmit} className="flex items-center gap-1 mt-auto">
                <span className="text-emerald-500 font-bold">{machine.username}@{machine.name}</span>
                <span className="text-slate-500">:</span>
                <span className="text-blue-400 font-semibold">{currentDir}</span>
                <span className="text-slate-500">$</span>
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  disabled={pinging}
                  className="flex-1 bg-transparent border-none outline-none text-white font-mono text-xs focus:ring-0 p-0 ml-1"
                  autoFocus
                  placeholder="Type a command (e.g. 'help', 'neofetch', 'ls')..."
                />
              </form>
              <div ref={terminalEndRef} />
            </div>
          </div>
        )}

        {/* 2. File Explorer Window */}
        {openApps.fileManager && (
          <div 
            style={{ top: "80px", left: "260px", width: "620px", height: "380px" }}
            onClick={() => setActiveApp("fileManager")}
            className={`absolute bg-slate-900/95 rounded-lg border flex flex-col shadow-2xl overflow-hidden transition-all duration-150 ${
              activeApp === "fileManager" ? "border-slate-500 ring-1 ring-slate-400" : "border-slate-800 opacity-90"
            }`}
          >
            {/* Header */}
            <div className="bg-[#1e1e24] h-9 px-3 flex justify-between items-center border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-300">File Manager — SFTP Virtual Tunnel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-500 cursor-pointer" onClick={() => closeApp("fileManager")}></div>
                <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer flex items-center justify-center text-slate-900" onClick={() => closeApp("fileManager")}><X className="w-2.5 h-2.5" /></div>
              </div>
            </div>

            {/* Path Breadcrumbs */}
            <div className="bg-slate-950/80 h-8 px-4 flex items-center justify-between border-b border-slate-800 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                <span>root</span>
                {currentDir.split(machine.os === "windows" ? "\\" : "/").filter(Boolean).map((part, i) => (
                  <React.Fragment key={i}>
                    <span>/</span>
                    <span className="text-slate-200">{part}</span>
                  </React.Fragment>
                ))}
              </div>
              <div className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded uppercase font-bold font-sans">
                Read/Write Connected
              </div>
            </div>

            {/* Sidebar & Folder Grid Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* SFTP Quick Links */}
              <div className="w-36 bg-slate-950/50 border-r border-slate-800 p-2 flex flex-col gap-1 text-xs">
                <button className="flex items-center gap-2 text-blue-400 font-medium hover:bg-slate-800 p-1.5 rounded transition text-left">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Home Dir</span>
                </button>
                <button className="flex items-center gap-2 text-slate-400 hover:bg-slate-800 p-1.5 rounded transition text-left">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>System Volumes</span>
                </button>
                <button className="flex items-center gap-2 text-slate-400 hover:bg-slate-800 p-1.5 rounded transition text-left">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Var Temp</span>
                </button>
              </div>

              {/* Grid of Files */}
              <div className="flex-1 p-4 grid grid-cols-4 gap-4 overflow-y-auto content-start">
                {machine.fileSystem.map((file, idx) => {
                  const isFile = file.type === "file";
                  return (
                    <button
                      key={idx}
                      onDoubleClick={() => {
                        if (isFile) {
                          setActiveFile(file);
                          openApp("txtEditor");
                        }
                      }}
                      onClick={() => {
                        if (isFile) {
                          setActiveFile(file);
                          openApp("txtEditor");
                        }
                      }}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition text-center text-white"
                    >
                      {file.type === "directory" ? (
                        <FolderOpen className="w-10 h-10 text-amber-500 fill-amber-500/10" />
                      ) : (
                        <FileText className="w-10 h-10 text-blue-400" />
                      )}
                      <span className="text-xs truncate w-24 text-slate-200" title={file.name}>{file.name}</span>
                      {file.size && <span className="text-[9px] font-mono text-slate-500">{file.size}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. Text Editor Window */}
        {openApps.txtEditor && activeFile && (
          <div 
            style={{ top: "120px", left: "340px", width: "500px", height: "340px" }}
            onClick={() => setActiveApp("txtEditor")}
            className={`absolute bg-slate-900 rounded-lg border flex flex-col shadow-2xl overflow-hidden transition-all duration-150 ${
              activeApp === "txtEditor" ? "border-blue-500 ring-1 ring-blue-400" : "border-slate-800 opacity-90"
            }`}
          >
            {/* Header */}
            <div className="bg-[#2a2a35] h-9 px-3 flex justify-between items-center border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300">File Editor — {activeFile.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => closeApp("txtEditor")}
                  className="w-3.5 h-3.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] text-slate-400 flex items-center justify-center font-bold"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* Editor Content Area */}
            <textarea
              className="flex-1 bg-slate-950 p-4 font-mono text-xs text-slate-100 outline-none resize-none border-none focus:ring-0 leading-relaxed"
              defaultValue={activeFile.content || ""}
              placeholder="Start editing file..."
            />
            
            {/* Editor Footer Status Bar */}
            <div className="bg-slate-900/90 h-7 px-4 flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-slate-800">
              <span>Encoding: UTF-8</span>
              <span className="text-emerald-400">● Remote Sync Enabled</span>
            </div>
          </div>
        )}

        {/* 4. System Monitor Window */}
        {openApps.sysMonitor && (
          <div 
            style={{ top: "100px", left: "100px", width: "580px", height: "350px" }}
            onClick={() => setActiveApp("sysMonitor")}
            className={`absolute bg-slate-900 rounded-lg border flex flex-col shadow-2xl overflow-hidden transition-all duration-150 ${
              activeApp === "sysMonitor" ? "border-slate-500 ring-1 ring-slate-400" : "border-slate-800 opacity-90"
            }`}
          >
            {/* Header */}
            <div className="bg-[#1e1e24] h-9 px-3 flex justify-between items-center border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-300">Hardware Metrics Monitor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer flex items-center justify-center text-slate-900" onClick={() => closeApp("sysMonitor")}><X className="w-2.5 h-2.5" /></div>
              </div>
            </div>

            {/* Dashboard grid inside VM */}
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
              {/* Resource summaries */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500">CPU LOAD</div>
                  <div className="text-xl font-mono text-cyan-400 font-bold mt-1">
                    {cpuUsage[cpuUsage.length - 1]}%
                  </div>
                  <div className="text-[9px] text-slate-400">4 Cores x 2.8GHz</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500">MEMORY LOAD</div>
                  <div className="text-xl font-mono text-emerald-400 font-bold mt-1">
                    {ramUsage[ramUsage.length - 1]}%
                  </div>
                  <div className="text-[9px] text-slate-400">16 GB Allocation</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500">DISK SPACE</div>
                  <div className="text-xl font-mono text-amber-500 font-bold mt-1">
                    {machine.metrics.disk}%
                  </div>
                  <div className="text-[9px] text-slate-400">Storage usage</div>
                </div>
              </div>

              {/* Dynamic Canvas Chart */}
              <div className="flex-1 bg-slate-950 p-2 rounded border border-slate-800 relative">
                <div className="absolute top-2 left-2 flex items-center gap-4 text-[9px] font-mono text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-400"></span> CPU usage %</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400"></span> Memory %</span>
                </div>
                <canvas ref={canvasRef} width={530} height={140} className="w-full h-full" />
              </div>
            </div>
          </div>
        )}

        {/* 5. Web Browser Admin Window */}
        {openApps.browser && (
          <div 
            style={{ top: "140px", left: "200px", width: "660px", height: "420px" }}
            onClick={() => setActiveApp("browser")}
            className={`absolute bg-slate-950 rounded-lg border flex flex-col shadow-2xl overflow-hidden transition-all duration-150 ${
              activeApp === "browser" ? "border-indigo-500 ring-1 ring-indigo-400" : "border-slate-800 opacity-90"
            }`}
          >
            {/* Header */}
            <div className="bg-[#1e1e24] h-9 px-3 flex justify-between items-center border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">Local Web Console - WebAdmin Tool</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer flex items-center justify-center text-slate-900" onClick={() => closeApp("browser")}><X className="w-2.5 h-2.5" /></div>
              </div>
            </div>

            {/* Address bar */}
            <div className="bg-slate-900 h-10 px-3 flex items-center gap-2 border-b border-slate-800 text-slate-300">
              <button className="p-1 rounded hover:bg-slate-800 text-slate-500"><ArrowLeft className="w-4 h-4" /></button>
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-3 py-1 flex items-center gap-2 text-xs font-mono text-slate-400">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{browserUrl}</span>
              </div>
              <button 
                onClick={() => setBrowserUrl(`http://localhost:8080/dashboard?refresh=${Date.now()}`)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Web Dashboard App */}
            <div className="flex-1 bg-slate-900 overflow-y-auto p-4 text-slate-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">N</div>
                  <div>
                    <h3 className="text-sm font-semibold">NGINX Service Administration</h3>
                    <p className="text-[10px] text-slate-400">Version 1.25.1 (Ubuntu)</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded bg-emerald-400 animate-pulse"></span>
                  Active Host
                </div>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Inbound traffic (24h)</span>
                    <h2 className="text-2xl font-bold font-mono mt-1 text-slate-100">14.8M reqs</h2>
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-2 font-medium">↑ 12% increase from yesterday</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Reverse Proxy Upstreams</span>
                    <h2 className="text-2xl font-bold font-mono mt-1 text-slate-100">3 Nodes</h2>
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-2 font-medium">All nodes reporting green</span>
                </div>
              </div>

              <div className="mt-4 bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs">
                <h4 className="font-semibold mb-2">Configure Routing upstream rules</h4>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between p-2 rounded bg-slate-900 hover:bg-slate-900/50">
                    <span>/api/v1/auth</span>
                    <span className="text-indigo-400 font-mono">upstream_auth_srv</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900 hover:bg-slate-900/50">
                    <span>/api/v1/payment</span>
                    <span className="text-indigo-400 font-mono">upstream_stripe_srv</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {openApps.sysAdminSuite && (
          <SysAdminSuiteWindow
            machine={machine}
            onClose={() => closeApp("sysAdminSuite")}
            onRunAction={onRunAction}
          />
        )}

      </div>

      {/* --- TASKBARS PER SYSTEM TYPE --- */}

      {/* Windows 11-style Taskbar at the bottom */}
      {machine.os === "windows" && (
        <div className={getTaskbarStyle()}>
          {/* Start button and App Pin icons */}
          <div className="flex items-center gap-1.5 flex-1 justify-center max-w-lg mx-auto">
            {/* Mock Windows Start Menu button */}
            <button className="w-9 h-9 flex items-center justify-center rounded hover:bg-white/10 transition">
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4 text-sky-400">
                <div className="bg-sky-400 w-1.5 h-1.5 rounded-sm"></div>
                <div className="bg-sky-400 w-1.5 h-1.5 rounded-sm"></div>
                <div className="bg-sky-400 w-1.5 h-1.5 rounded-sm"></div>
                <div className="bg-sky-400 w-1.5 h-1.5 rounded-sm"></div>
              </div>
            </button>
            <div className="w-[1px] h-6 bg-slate-700/60 mx-1"></div>
            
            <button 
              onClick={() => openApp("sysAdminSuite")}
              className={`w-9 h-9 flex items-center justify-center rounded transition relative ${openApps.sysAdminSuite ? "bg-white/10" : "hover:bg-white/5"}`}
              title="SysAdmin Operations Suite"
            >
              <Sliders className="w-5 h-5 text-indigo-400" />
              {openApps.sysAdminSuite && <div className="absolute bottom-0 w-1 h-1 bg-indigo-400 rounded-full"></div>}
            </button>

            <button 
              onClick={() => openApp("terminal")}
              className={`w-9 h-9 flex items-center justify-center rounded transition relative ${openApps.terminal ? "bg-white/10" : "hover:bg-white/5"}`}
            >
              <TerminalIcon className="w-5 h-5 text-green-400" />
              {openApps.terminal && <div className="absolute bottom-0 w-1 h-1 bg-sky-400 rounded-full"></div>}
            </button>
            
            <button 
              onClick={() => openApp("fileManager")}
              className={`w-9 h-9 flex items-center justify-center rounded transition relative ${openApps.fileManager ? "bg-white/10" : "hover:bg-white/5"}`}
            >
              <FolderOpen className="w-5 h-5 text-amber-400" />
              {openApps.fileManager && <div className="absolute bottom-0 w-1 h-1 bg-sky-400 rounded-full"></div>}
            </button>

            <button 
              onClick={() => openApp("sysMonitor")}
              className={`w-9 h-9 flex items-center justify-center rounded transition relative ${openApps.sysMonitor ? "bg-white/10" : "hover:bg-white/5"}`}
            >
              <Activity className="w-5 h-5 text-cyan-400" />
              {openApps.sysMonitor && <div className="absolute bottom-0 w-1 h-1 bg-sky-400 rounded-full"></div>}
            </button>
          </div>

          {/* Tray clock & wifi */}
          <div className="flex items-center gap-3">
            <Wifi className="w-4 h-4 text-slate-300" />
            <div className="flex flex-col items-end text-[10px] text-slate-300 leading-tight">
              <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              <span>2026-06-26</span>
            </div>
            <button 
              onClick={onClose}
              className="bg-red-600/90 hover:bg-red-700 px-3 py-1 text-white rounded text-[11px] font-semibold transition"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* macOS Dock at the bottom */}
      {machine.os === "macos" && (
        <div className={getTaskbarStyle()}>
          <button 
            onClick={() => openApp("sysAdminSuite")}
            className="group relative flex flex-col items-center hover:-translate-y-2 transition-transform duration-200"
            title="SysAdmin Operations Suite"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-600 border border-indigo-400 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            {openApps.sysAdminSuite && <span className="absolute -bottom-1 text-[16px] text-white/80">•</span>}
          </button>

          <button 
            onClick={() => openApp("terminal")}
            className="group relative flex flex-col items-center hover:-translate-y-2 transition-transform duration-200"
          >
            <div className="w-11 h-11 rounded-xl bg-black/70 border border-white/15 flex items-center justify-center">
              <TerminalIcon className="w-5 h-5 text-green-400" />
            </div>
            {openApps.terminal && <span className="absolute -bottom-1 text-[16px] text-white/80">•</span>}
          </button>
          
          <button 
            onClick={() => openApp("fileManager")}
            className="group relative flex flex-col items-center hover:-translate-y-2 transition-transform duration-200"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            {openApps.fileManager && <span className="absolute -bottom-1 text-[16px] text-white/80">•</span>}
          </button>

          <button 
            onClick={() => openApp("sysMonitor")}
            className="group relative flex flex-col items-center hover:-translate-y-2 transition-transform duration-200"
          >
            <div className="w-11 h-11 rounded-xl bg-cyan-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            {openApps.sysMonitor && <span className="absolute -bottom-1 text-[16px] text-white/80">•</span>}
          </button>

          <button 
            onClick={() => openApp("browser")}
            className="group relative flex flex-col items-center hover:-translate-y-2 transition-transform duration-200"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            {openApps.browser && <span className="absolute -bottom-1 text-[16px] text-white/80">•</span>}
          </button>
        </div>
      )}

      {/* Linux bottom bar status */}
      {machine.os === "linux" && (
        <div className="bg-[#111111] h-10 border-t border-zinc-800 text-zinc-400 text-xs px-4 flex justify-between items-center z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded bg-emerald-500"></span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Interactive Terminal Socket Connected</span>
          </div>
          <span className="font-mono text-[10px]">Session ID: tun_{machine.id}</span>
        </div>
      )}

    </div>
  );
}
