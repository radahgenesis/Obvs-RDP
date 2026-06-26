import React, { useState, useEffect, useRef } from "react";
import { RemoteMachine, RemoteFile } from "../types";
import {
  Terminal as TerminalIcon,
  Play,
  Settings,
  X,
  RefreshCw,
  Cpu,
  Shield,
  Search,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  ChevronDown
} from "lucide-react";

interface TerminalClientProps {
  machines: RemoteMachine[];
  initialSelectedMachine?: RemoteMachine | null;
  onRunAction: (machineId: string, action: string, target?: string) => Promise<string>;
}

export default function TerminalClient({
  machines,
  initialSelectedMachine,
  onRunAction
}: TerminalClientProps) {
  const onlineMachines = machines.filter((m) => m.status === "online");
  const [selectedMachine, setSelectedMachine] = useState<RemoteMachine | null>(null);
  const [currentDir, setCurrentDir] = useState("");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ cmd: string; output: string }[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [pinging, setPinging] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Sync initial machine selection
  useEffect(() => {
    if (initialSelectedMachine) {
      handleMachineConnect(initialSelectedMachine);
    } else if (onlineMachines.length > 0 && !selectedMachine) {
      handleMachineConnect(onlineMachines[0]);
    }
  }, [initialSelectedMachine, machines]);

  // Scroll to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, connecting, pinging]);

  const handleMachineConnect = (m: RemoteMachine) => {
    setSelectedMachine(m);
    setConnecting(true);
    setHistory([]);
    setCurrentDir(m.os === "windows" ? "C:\\Users\\" + m.username : "/home/" + m.username);

    // Simulate SSH login sequence
    const connectionLogs = [
      { cmd: "", output: `Connecting to ${m.ip}:${m.port} via ${m.protocol.toUpperCase()}...` },
      { cmd: "", output: `Establishing secure SSL/TLS encrypted tunnel...` },
      { cmd: "", output: `Exchanging cryptographic public keys (RSA/ED25519)...` },
      { cmd: "", output: `Authentication successful! Welcome to ${m.name}.\nLast login: Thu Jun 25 10:44:22 2026 from 192.168.1.122\nType 'help' to view available secure remote operations.` }
    ];

    let delay = 300;
    connectionLogs.forEach((log, index) => {
      setTimeout(() => {
        setHistory((prev) => [...prev, log]);
        if (index === connectionLogs.length - 1) {
          setConnecting(false);
        }
      }, delay);
      delay += 350;
    });
  };

  const executeCommand = async (cmdString: string) => {
    const trimmed = cmdString.trim();
    if (!trimmed || !selectedMachine) return;

    const args = trimmed.split(" ");
    const command = args[0].toLowerCase();
    let output = "";

    switch (command) {
      case "help":
        output = `MultiDesk Terminal secure remote operations:
  - neofetch        : Display system specifications & OS logo.
  - uname -a        : Display kernel and architecture information.
  - ls              : List files in current remote directories.
  - cat <filename>  : Stream remote file standard output.
  - ping <host>     : Test network connection to domain or ip.
  - clear           : Flush active CLI buffer stream.
  - systemctl status: Inspect status of critical daemon tasks.
  - reboot          : Request system restart from remote host.
  - shutdown        : Shut down active console tunnel socket.`;
        break;

      case "clear":
        setHistory([]);
        return;

      case "neofetch":
        output = `
   .-/+oossssoo+/-.               ${selectedMachine.username}@${selectedMachine.name}
  \`:+ssssssssssssssssss+:\`           ---------------------------
  -+ssssssssssssssssssssss+-         OS: ${selectedMachine.os === "linux" ? "Ubuntu LTS" : selectedMachine.os === "windows" ? "Windows Server 2025" : "macOS Sequoia"}
 /ssssssssssssssssssssssssss\\        Kernel: MultiDeskTunnel-Sec
/ssssssssssssshdmmNNmmyyssssss\\      Uptime: ${selectedMachine.metrics.uptime}
+ssssssssshmydmMyyyyhdMyyyssssssd     CPU: Virtual Xeon Core Process
/sssssssshmMyyyhmMMyyyhmMMyyyyssss     Memory: ${selectedMachine.metrics.ram}% allocated
,ssssssssdMyyyyhmMMyyyhmMMyyyyyssss     Memory Limit: 16 GB Allocation
+ssssssssdMyyyyhmMMyyyhmMMyyyyyssss     Platform: Cloud Secure Engine
/sssssssshmMyyyhmMMyyyhmMMyyyyssss     Tunnel Session: Active TLS 1.3
        `;
        break;

      case "uname":
        if (args[1] === "-a") {
          output = `${selectedMachine.os === "linux" ? "Linux" : "Darwin"} 5.4.0-tunnel-socket-x86_64 SMP Thu Jun 25 18:33:04 UTC 2026`;
        } else {
          output = selectedMachine.os === "linux" ? "Linux" : "Darwin";
        }
        break;

      case "ls":
        const files = selectedMachine.fileSystem;
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
          output = "Error: Please specify file path (e.g. cat welcome.txt)";
        } else {
          const matchedFile = selectedMachine.fileSystem.find(
            (f) => f.name.toLowerCase() === args[1].toLowerCase() && f.type === "file"
          );
          if (matchedFile) {
            output = matchedFile.content || "[Empty file]";
          } else {
            output = `cat: ${args[1]}: File not found in directory path.`;
          }
        }
        break;

      case "ping":
        if (!args[1]) {
          output = "Usage: ping <domain/ip>";
        } else {
          const host = args[1];
          setPinging(true);
          setHistory((prev) => [...prev, { cmd: trimmed, output: `PING ${host} (${selectedMachine.ip}) 56(84) bytes of data.` }]);
          
          let count = 0;
          const interval = setInterval(() => {
            const time = (Math.random() * 10 + 2).toFixed(1);
            setHistory((prev) => [
              ...prev,
              { cmd: "", output: `64 bytes from ${host}: icmp_seq=${count + 1} ttl=64 time=${time} ms` }
            ]);
            count++;
            if (count >= 4) {
              clearInterval(interval);
              setPinging(false);
              setHistory((prev) => [
                ...prev,
                { cmd: "", output: `--- ${host} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss` }
              ]);
            }
          }, 600);
          return;
        }
        break;

      case "systemctl":
        if (args[1] === "status") {
          const service = args[2] || "nginx";
          output = `● ${service}.service - System Security Proxy Service
     Loaded: loaded (/etc/systemd/system/${service}.service; enabled)
     Active: active (running) since Thu 2026-06-25 10:04:12 UTC; 14h ago
   Main PID: 12402 (sys-d)
      Tasks: 2 (limit: 4915)
     CGroup: /system.slice/${service}.service
             └─12402 /usr/sbin/${service}`;
        } else if (args[1] === "restart") {
          const service = args[2] || "nginx";
          setHistory((prev) => [...prev, { cmd: trimmed, output: `Sending restart RPC commands for daemon task: ${service}` }]);
          const res = await onRunAction(selectedMachine.id, "restart-service", service);
          output = res;
        } else {
          output = "Usage: systemctl [status|restart] [service]";
        }
        break;

      case "reboot":
        setHistory((prev) => [...prev, { cmd: trimmed, output: "System warm reboot RPC command received. Resetting socket connection..." }]);
        const rebootLog = await onRunAction(selectedMachine.id, "reboot");
        setTimeout(() => {
          setHistory((prev) => [...prev, { cmd: "", output: rebootLog }]);
        }, 1200);
        return;

      case "shutdown":
        output = "Disconnecting SSH terminal session...";
        setTimeout(() => {
          setSelectedMachine(null);
          setHistory([]);
        }, 500);
        break;

      default:
        output = `bash: command not found: ${command}. Type 'help' to see authorized commands.`;
    }

    setHistory((prev) => [...prev, { cmd: trimmed, output }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (connecting || pinging) return;
    executeCommand(input);
    setInput("");
  };

  return (
    <div className="flex-1 bg-slate-900 p-8 flex flex-col h-full text-slate-100 font-sans">
      
      {/* Top Console Command Header Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-green-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Terminal Shell Manager</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Establish direct secure SSH/CLI pipelines using encrypted keys and passwords.
          </p>
        </div>

        {/* Dropdown to select system */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase font-mono">Connect Host:</span>
          <div className="relative">
            <select
              value={selectedMachine?.id || ""}
              onChange={(e) => {
                const target = machines.find((om) => om.id === e.target.value);
                if (target) handleMachineConnect(target);
              }}
              className="appearance-none bg-slate-900 border border-slate-800 rounded-md pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none hover:border-slate-700 transition cursor-pointer font-mono"
            >
              <option value="" disabled>-- Choose Active Host --</option>
              {onlineMachines.map((om) => (
                <option key={om.id} value={om.id}>
                  {om.name} ({om.ip})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Terminal Visualizer Monitor */}
      <div className="flex-1 bg-black border border-slate-800 rounded-xl p-5 font-mono text-xs flex flex-col overflow-hidden relative shadow-2xl">
        
        {/* Connection detail watermark */}
        {selectedMachine && (
          <div className="absolute top-4 right-4 text-[10px] text-slate-600 flex items-center gap-2 bg-slate-950/80 px-2 py-1 rounded border border-slate-900">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span>AUTHENTICATED PORT: {selectedMachine.port} [AES-256-GCM]</span>
          </div>
        )}

        {selectedMachine ? (
          <div className="flex-1 flex flex-col overflow-y-auto leading-relaxed select-text text-green-400">
            {history.map((h, i) => (
              <div key={i} className="mb-2.5 whitespace-pre-wrap">
                {h.cmd && (
                  <div className="text-slate-400">
                    <span className="text-emerald-500 font-bold">{selectedMachine.username}@{selectedMachine.name}</span>
                    <span className="text-slate-500">:</span>
                    <span className="text-blue-400 font-bold">{currentDir}</span>
                    <span className="text-slate-500">$</span> {h.cmd}
                  </div>
                )}
                <div className="mt-1 text-slate-100">{h.output}</div>
              </div>
            ))}

            {connecting && (
              <div className="text-amber-400 flex items-center gap-2 animate-pulse mt-1">
                <span>⚡ Establishing secure handshake... Please wait.</span>
              </div>
            )}

            {pinging && (
              <div className="text-slate-400 flex items-center gap-2 animate-pulse mt-1">
                <span>● Pinging remote network nodes...</span>
              </div>
            )}

            {/* Form CLI Command */}
            {!connecting && (
              <form onSubmit={handleSubmit} className="flex items-center gap-1.5 mt-auto border-t border-slate-950/80 pt-4">
                <span className="text-emerald-500 font-bold">{selectedMachine.username}@{selectedMachine.name}</span>
                <span className="text-slate-500">:</span>
                <span className="text-blue-400 font-bold">{currentDir}</span>
                <span className="text-slate-500">$</span>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={connecting || pinging}
                  placeholder="Type ssh-command... (type 'help' to see list of functions)"
                  className="flex-1 bg-transparent border-none outline-none text-white font-mono text-xs focus:ring-0 p-0 ml-1"
                  autoFocus
                />
              </form>
            )}
            <div ref={terminalEndRef} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 font-sans">
            <TerminalIcon className="w-12 h-12 text-slate-800 mb-2" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-600">No Terminal Socket Active</h4>
            <p className="text-xs text-slate-700 max-w-sm text-center mt-1 leading-normal">
              Please select a connected host from the top dropdown to initiate a secure encrypted Shell session.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
