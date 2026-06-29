import React, { useState, useEffect, useRef } from "react";
import { RemoteMachine } from "../types";
import {
  Play,
  Terminal as TerminalIcon,
  RefreshCw,
  Cpu,
  Shield,
  HelpCircle,
  FileCode,
  Sliders,
  ChevronDown,
  Trash2,
  Settings,
  X,
  Sparkles,
  Info
} from "lucide-react";

interface PowerShellConsoleProps {
  machines: RemoteMachine[];
  onRunAction: (machineId: string, action: string, target?: string) => Promise<string>;
}

interface ScriptPreset {
  name: string;
  description: string;
  code: string;
}

export default function PowerShellConsole({ machines, onRunAction }: PowerShellConsoleProps) {
  // Only suggest windows/rdp machines for PowerShell, but fallbacks to other hosts since PowerShell Core is cross platform
  const windowsMachines = machines.filter(m => m.os === "windows");
  const fallbackMachines = machines.filter(m => m.os !== "windows");
  const availableMachines = [...windowsMachines, ...fallbackMachines];

  const [selectedMachine, setSelectedMachine] = useState<RemoteMachine | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [running, setRunning] = useState(false);

  // Script editing & selections
  const [scriptCode, setScriptCode] = useState("");
  const [interactiveInput, setInteractiveInput] = useState("");
  
  // Terminal history
  const [history, setHistory] = useState<{ type: "cmd" | "out" | "warn" | "err" | "info"; text: string }[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Script presets
  const PRESETS: ScriptPreset[] = [
    {
      name: "Get Running Services Audit",
      description: "Lists active running critical services on the target Windows node.",
      code: `Get-Service | Where-Object {$_.Status -eq "Running"} | Select-Object Name, DisplayName, Status | Sort-Object Name | Select-Object -First 10`
    },
    {
      name: "Diagnostics & Process Resources",
      description: "Retrieves top 10 processes consuming CPU cycles.",
      code: `Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name, Id, CPU, WorkingSet | Format-Table -AutoSize`
    },
    {
      name: "Inspect System Specifications",
      description: "Assembles hardware, architecture, and kernel system versions.",
      code: `Get-ComputerInfo | Select-Object OsName, OsVersion, OsArchitecture, CsName, CsSystemType | Format-List`
    },
    {
      name: "Analyze Security Event Log",
      description: "Slices newest critical authentication events in security logs.",
      code: `Get-EventLog -LogName Security -Newest 10 | Select-Object TimeGenerated, EventID, Source, EntryType, Message`
    },
    {
      name: "Network Socket Ports Listening",
      description: "Traces all current active listening TCP/UDP port attachments.",
      code: `Get-NetTCPConnection | Where-Object {$_.State -eq "Listen"} | Select-Object LocalAddress, LocalPort, State | Format-Table`
    }
  ];

  const [selectedPreset, setSelectedPreset] = useState<ScriptPreset>(PRESETS[0]);

  // Sync preset selection to scriptCode editor
  useEffect(() => {
    setScriptCode(selectedPreset.code);
  }, [selectedPreset]);

  // Sync initial machine connection
  useEffect(() => {
    if (availableMachines.length > 0 && !selectedMachine) {
      handleMachineConnect(availableMachines[0]);
    }
  }, [machines]);

  // Auto scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, connecting, running]);

  const handleMachineConnect = (m: RemoteMachine) => {
    setSelectedMachine(m);
    setConnecting(true);
    setConnected(false);
    setHistory([]);

    setTimeout(() => {
      setHistory([
        { type: "info", text: `Windows PowerShell Core v7.4.2` },
        { type: "info", text: `Copyright (C) Microsoft Corporation. All rights reserved.` },
        { type: "info", text: `\nEstablished remote PSSession client on host [wsman://${m.ip}:5985]` },
        { type: "info", text: `Security Handshake: Kerberos SSL mutual authentication negotiated.` },
        { type: "info", text: `Active Directory Target Identity: ${m.username}` },
        { type: "info", text: `\nType PowerShell commands or click execute on a script preset above.` }
      ]);
      setConnecting(false);
      setConnected(true);
    }, 1000);
  };

  const handleRunScript = () => {
    if (!connected || !selectedMachine || running || !scriptCode.trim()) return;

    setRunning(true);
    
    // Append script boundary marker to terminal
    setHistory(prev => [
      ...prev,
      { type: "cmd", text: `PS C:\\Users\\${selectedMachine.username}> Invoke-Expression -CodeBlock {\n${scriptCode}\n}` }
    ]);

    // Simulate script streaming output line-by-line
    setTimeout(async () => {
      let outputLines: { type: "out" | "warn" | "err" | "info"; text: string }[] = [];
      
      const lowerCode = scriptCode.toLowerCase();
      if (lowerCode.includes("get-service")) {
        outputLines = [
          { type: "info", text: "Status   Name               DisplayName" },
          { type: "info", text: "------   ----               -----------" },
          { type: "out", text: "Running  ADWS               Active Directory Web Services" },
          { type: "out", text: "Running  Appinfo            Application Information" },
          { type: "out", text: "Running  BFE                Base Filtering Engine" },
          { type: "out", text: "Running  CryptSvc           Cryptographic Services" },
          { type: "out", text: "Running  Dhcp               DHCP Client" },
          { type: "out", text: "Running  Dnscache           DNS Client" },
          { type: "out", text: "Running  EventLog           Windows Event Log" },
          { type: "warn", text: "WARNING: WinRM service state is currently transitioning..." },
          { type: "out", text: "Running  Kdc                Kerberos Key Distribution Center" },
          { type: "out", text: "Running  NTDS               Active Directory Domain Services" }
        ];
      } else if (lowerCode.includes("get-process")) {
        outputLines = [
          { type: "info", text: "Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName" },
          { type: "info", text: "-------  ------    -----      -----     ------     --  -- -----------" },
          { type: "out", text: "    482      38    95412     124040     221.04   1024   1 lsass" },
          { type: "out", text: "    322      22    45120      64112      88.15   2412   1 svchost" },
          { type: "out", text: "    190      15    22410      32115      45.02   4812   1 spoolsv" },
          { type: "out", text: "    102       8     8400      12410      14.22    904   1 dns" },
          { type: "err", text: "Get-Process: Access Denied for telemetry process with PID 18882. Run as Administrator." }
        ];
      } else if (lowerCode.includes("get-computerinfo")) {
        outputLines = [
          { type: "out", text: `OsName             : Microsoft Windows Server 2025 Datacenter` },
          { type: "out", text: `OsVersion          : 10.0.26100` },
          { type: "out", text: `OsArchitecture     : 64-bit` },
          { type: "out", text: `CsName             : ${selectedMachine.name}` },
          { type: "out", text: `CsSystemType       : x64-based PC` },
          { type: "out", text: `CsProcessors       : Intel Xeon Platinum processor vCPU Core 3.4GHz` }
        ];
      } else if (lowerCode.includes("get-eventlog")) {
        outputLines = [
          { type: "info", text: "Index Time          EntryType   Source                 EventID Message" },
          { type: "info", text: "----- ----          ---------   ------                 ------- -------" },
          { type: "out", text: " 8404 Jun 25 10:44  SuccessAudit Microsoft-Windows-Security   4624 An account was successfully logged on." },
          { type: "out", text: " 8405 Jun 25 10:45  SuccessAudit Microsoft-Windows-Security   4672 Special privileges assigned to new logon." },
          { type: "err", text: "EventLog: [ERROR ID 18456] Logon failure for domain Admin. Credentials rejected." }
        ];
      } else if (lowerCode.includes("get-nettcpconnection")) {
        outputLines = [
          { type: "info", text: "LocalAddress         LocalPort RemoteAddress        RemotePort State" },
          { type: "info", text: "------------         --------- -------------        ---------- -----" },
          { type: "out", text: "0.0.0.0              3389      0.0.0.0              0          Listen" },
          { type: "out", text: "0.0.0.0              5985      0.0.0.0              0          Listen" },
          { type: "out", text: "127.0.0.1            53        0.0.0.0              0          Listen" },
          { type: "out", text: "10.0.4.15            443       192.168.10.122       54102      Established" }
        ];
      } else {
        // Fallback or custom command
        outputLines = [
          { type: "out", text: `Script execution output block:` },
          { type: "out", text: `---------------------------------------------------------` },
          { type: "out", text: `Command evaluated successfully under remote security sandbox context.` },
          { type: "out", text: `Result Code: HRESULT_SUCCESS (0x0)` }
        ];
      }

      // Stream each line with a typewriter delay
      let lineIndex = 0;
      const interval = setInterval(() => {
        if (lineIndex < outputLines.length) {
          setHistory(prev => [...prev, outputLines[lineIndex]]);
          lineIndex++;
        } else {
          clearInterval(interval);
          setRunning(false);
        }
      }, 350);

    }, 800);
  };

  const handleInteractiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = interactiveInput.trim();
    if (!cmd || running || !selectedMachine) return;

    setHistory(prev => [...prev, { type: "cmd", text: `PS C:\\Users\\${selectedMachine.username}> ${cmd}` }]);
    setInteractiveInput("");

    if (cmd.toLowerCase() === "clear" || cmd.toLowerCase() === "cls") {
      setHistory([]);
      return;
    }

    if (cmd.toLowerCase() === "help") {
      setHistory(prev => [
        ...prev,
        { type: "info", text: "PowerShell Cmdlet Console - Secure Remote Help Utilities:" },
        { type: "info", text: "  - Get-Process : Audit and diagnostics on running processes." },
        { type: "info", text: "  - Get-Service : Monitor Active Directory or WinRM daemon services." },
        { type: "info", text: "  - Get-ComputerInfo : Inspect CPU specifications and kernel parameters." },
        { type: "info", text: "  - cls / clear : Flushes the terminal standard output stream." }
      ]);
      return;
    }

    // Run custom action simulation
    setRunning(true);
    setTimeout(() => {
      let responseText = "";
      let responseType: "out" | "err" | "warn" = "out";

      const cmdLower = cmd.toLowerCase();
      if (cmdLower.includes("get-process")) {
        responseText = `Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id   ProcessName\n-------  ------    -----      -----     ------     --   -----------\n    220      12    14510      22115      12.44    840   svchost`;
      } else if (cmdLower.includes("get-service")) {
        responseText = `Status   Name               DisplayName\n------   ----               -----------\nRunning  WinRM              Windows Remote Management (WS-Management)`;
      } else if (cmdLower.includes("get-computerinfo")) {
        responseText = `OsName : Microsoft Windows Server 2025\nOsVersion : 10.0.26100\nCsName : ${selectedMachine.name}`;
      } else if (cmdLower.includes("whoami")) {
        responseText = `${selectedMachine.name}\\${selectedMachine.username}`;
      } else {
        responseText = `Command '${cmd}' executed successfully. SWS-Management packet received.`;
      }

      setHistory(prev => [...prev, { type: responseType, text: responseText }]);
      setRunning(false);
    }, 600);
  };

  return (
    <div id="powershell-console-container" className="flex-1 overflow-hidden bg-slate-900 p-8 flex flex-col h-full text-slate-100 font-sans">
      
      {/* System Selection Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Remote PowerShell Console</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build and execute robust powershell administrative scripts, retrieve telemetry, and analyze services in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase font-mono">Connect Node:</span>
          <div className="relative">
            <select
              value={selectedMachine?.id || ""}
              onChange={(e) => {
                const target = availableMachines.find((om) => om.id === e.target.value);
                if (target) handleMachineConnect(target);
              }}
              className="appearance-none bg-slate-900 border border-slate-800 rounded-md pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none hover:border-slate-700 transition cursor-pointer font-mono"
            >
              {availableMachines.map((om) => (
                <option key={om.id} value={om.id}>
                  {om.name} ({om.ip}) {om.os === "windows" ? "🔒 Windows" : "🐧 Linux"}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Workspace split: Top is script presets & editor, Bottom is blue PowerShell screen */}
      <div className="flex-1 flex flex-col xl:flex-row gap-6 overflow-hidden min-h-0">
        
        {/* SCRIPT EDITOR PANEL */}
        <div className="xl:w-[420px] bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col shrink-0 overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Administrative Task Library</h3>
          </div>

          {/* Preset list selector */}
          <div className="space-y-2 mb-4">
            <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Script Catalog:</span>
            <div className="space-y-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setSelectedPreset(preset)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex flex-col gap-1 ${
                    selectedPreset.name === preset.name
                      ? "bg-indigo-500/10 border-indigo-500/30 text-white"
                      : "bg-slate-900/40 border-transparent hover:border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="font-bold">{preset.name}</span>
                  <span className="text-[10px] text-slate-500 font-normal leading-relaxed">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Script Textarea Editor */}
          <div className="flex flex-col gap-2 flex-1 mt-2 min-h-[160px]">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono uppercase">
              <span>PS Code Editor:</span>
              <span className="text-indigo-400 lowercase">editable parameters</span>
            </div>
            <textarea
              value={scriptCode}
              onChange={(e) => setScriptCode(e.target.value)}
              disabled={running}
              className="w-full flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-sky-300 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed resize-none h-48"
            />
          </div>

          <button
            onClick={handleRunScript}
            disabled={running || !connected}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-2.5 rounded-lg mt-4 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 text-xs uppercase"
          >
            {running ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running remote script...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute Script on Target</span>
              </>
            )}
          </button>
        </div>

        {/* BLUE POWERSHELL SCREEN CLIENT */}
        <div className="flex-1 bg-[#012456] border border-sky-950 rounded-xl p-5 font-mono text-xs flex flex-col overflow-hidden relative shadow-2xl">
          
          {/* Watermark header inside shell */}
          {selectedMachine && (
            <div className="absolute top-4 right-4 text-[10px] text-[#2c5fa2] flex items-center gap-2 bg-[#021f45] px-2.5 py-1 rounded border border-[#001735]">
              <Shield className="w-3 h-3 text-sky-400" />
              <span>WS-MAN WinRM PIPELINE [AES-256]</span>
            </div>
          )}

          <div className="flex-1 flex flex-col overflow-y-auto leading-relaxed select-text text-slate-100 pr-1">
            
            {/* Connection handshakes */}
            {connecting && (
              <div className="text-sky-300 flex items-center gap-2 animate-pulse mb-3">
                <span>● Negotation handshakes in progress... Connecting to WS-Management service...</span>
              </div>
            )}

            {/* Standard logs history */}
            {history.map((h, i) => (
              <div key={i} className="mb-2 whitespace-pre-wrap">
                {h.type === "cmd" ? (
                  <div className="text-[#a6e22e] font-semibold">{h.text}</div>
                ) : h.type === "warn" ? (
                  <div className="text-amber-300 bg-[#352500] px-2 py-1 rounded border border-[#644200]">{h.text}</div>
                ) : h.type === "err" ? (
                  <div className="text-red-400 bg-[#3a0303] px-2 py-1 rounded border border-[#6f0909]">{h.text}</div>
                ) : h.type === "info" ? (
                  <div className="text-sky-300">{h.text}</div>
                ) : (
                  <div className="text-white">{h.text}</div>
                )}
              </div>
            ))}

            {running && (
              <div className="text-yellow-400 flex items-center gap-2 animate-pulse mt-2">
                <span>● Query stream active: waiting for stdout callback...</span>
              </div>
            )}

            {/* Interactive commandline input */}
            {connected && !running && (
              <form onSubmit={handleInteractiveSubmit} className="flex items-center gap-1.5 mt-auto pt-4 border-t border-[#021f45]/50 shrink-0">
                <span className="text-[#a6e22e] font-semibold">PS C:\Users\{selectedMachine?.username}&gt;</span>
                <input
                  type="text"
                  value={interactiveInput}
                  onChange={(e) => setInteractiveInput(e.target.value)}
                  disabled={running}
                  placeholder="Type PowerShell command (e.g. Get-Process, Get-Service, help)..."
                  className="flex-1 bg-transparent border-none outline-none text-white font-mono text-xs focus:ring-0 p-0 ml-1 placeholder-[#185fa7]"
                  autoFocus
                />
              </form>
            )}

            <div ref={terminalEndRef} />
          </div>

        </div>

      </div>

    </div>
  );
}
