import React, { useState, useEffect } from "react";
import { RemoteMachine } from "../types";
import {
  Grid3X3,
  Tv,
  Terminal,
  Activity,
  Cpu,
  RefreshCw,
  Sliders,
  Expand,
  Zap,
  Play,
  MonitorOff,
  Wifi,
  ShieldCheck,
  Power,
  ChevronDown
} from "lucide-react";

interface MultiScreenGridProps {
  machines: RemoteMachine[];
  onSelectMachine: (machine: RemoteMachine, mode: "terminal" | "desktop") => void;
  onRunAction: (machineId: string, action: string, target?: string) => Promise<string>;
}

export default function MultiScreenGrid({
  machines,
  onSelectMachine,
  onRunAction
}: MultiScreenGridProps) {
  const [layoutMode, setLayoutMode] = useState<"1x1" | "1x2" | "2x2">("2x2");
  const [selectedCellMachines, setSelectedCellMachines] = useState<string[]>([]);
  const [fastCommand, setFastCommand] = useState("df -h");
  const [fastOutputs, setFastOutputs] = useState<{ [key: string]: string }>({});
  const [runningFastCmd, setRunningFastCmd] = useState(false);
  const [screenNoise, setScreenNoise] = useState(true);

  // Initialize selected machines for the cells
  const onlineMachines = machines.filter((m) => m.status === "online");

  useEffect(() => {
    if (onlineMachines.length > 0) {
      setSelectedCellMachines([
        onlineMachines[0]?.id || "",
        onlineMachines[1]?.id || onlineMachines[0]?.id || "",
        onlineMachines[2]?.id || onlineMachines[0]?.id || "",
        onlineMachines[3]?.id || onlineMachines[0]?.id || ""
      ]);
    }
  }, [machines]);

  const handleCellSelect = (cellIndex: number, machineId: string) => {
    setSelectedCellMachines((prev) => {
      const next = [...prev];
      next[cellIndex] = machineId;
      return next;
    });
  };

  const executeFastCommandOnAll = async () => {
    if (!fastCommand) return;
    setRunningFastCmd(true);
    const updatedOutputs: { [key: string]: string } = {};

    for (const machId of selectedCellMachines) {
      if (!machId) continue;
      const m = machines.find((x) => x.id === machId);
      if (!m || m.status !== "online") continue;

      // Simulate output response based on common commands
      const timestamp = new Date().toLocaleTimeString();
      let cmdOut = `[${timestamp}] $ ${fastCommand}\n`;

      if (fastCommand.includes("df")) {
        cmdOut += `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        97G   42G   55G  44% /\ntmpfs           7.8G     0  7.8G   0% /dev/shm\n/dev/loop0       63M   63M     0 100% /snap/core`;
      } else if (fastCommand.includes("free") || fastCommand.includes("mem")) {
        cmdOut += `               total        used        free      shared  buff/cache   available\nMem:        16324204     9942104     4120300      102422     2261800     6382104\nSwap:        2097148           0     2097148`;
      } else if (fastCommand.includes("docker ps") || fastCommand.includes("docker")) {
        cmdOut += `CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS\n4920fd4014d3   nginx:alpine   "/docker-entrypoint.…"   2 days ago      Up 14 hours    0.0.0.0:80->80/tcp\na8102429bc41   postgres:15    "docker-entrypoint.s…"   2 days ago      Up 14 hours    0.0.0.0:5432->5432/tcp`;
      } else if (fastCommand.includes("uptime")) {
        cmdOut += ` 00:26:42 up 42 days, 14:22,  1 user,  load average: 0.12, 0.08, 0.05`;
      } else {
        cmdOut += `Command successfully run inside secure thread context.\nExit code: 0\nNo further stdout standard records returned.`;
      }

      updatedOutputs[machId] = cmdOut;
    }

    setFastOutputs(updatedOutputs);
    setRunningFastCmd(false);
  };

  const getGridConfig = () => {
    switch (layoutMode) {
      case "1x1":
        return "grid-cols-1";
      case "1x2":
        return "grid-cols-1 md:grid-cols-2";
      default:
        return "grid-cols-1 md:grid-cols-2";
    }
  };

  const getCellLimit = () => {
    if (layoutMode === "1x1") return 1;
    if (layoutMode === "1x2") return 2;
    return 4;
  };

  return (
    <div className="flex-1 bg-slate-950 p-8 flex flex-col h-full text-slate-100 overflow-y-auto">
      
      {/* Top Cockpit Header Panel */}
      <div className="bg-[#0c0c0c] border border-white/10 p-6 mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/40 block mb-1 font-mono">COCKPIT AREA</span>
          </div>
          <h2 className="text-3xl font-serif italic text-white/90">Multi-Screen Monitor</h2>
          <p className="text-xs text-white/50 mt-2 font-light tracking-wide max-w-xl">
            Established active display matrix, controlling live secure host threads concurrently.
          </p>
        </div>

        {/* Toolbar parameters */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Signal Noise Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono tracking-widest uppercase text-white/40">ANALOG NOISE:</span>
            <button
              onClick={() => setScreenNoise(!screenNoise)}
              className={`px-3 py-1 text-[9px] font-bold font-mono transition uppercase tracking-wider ${
                screenNoise 
                  ? "bg-indigo-600 border border-transparent text-white" 
                  : "bg-white/5 border border-white/10 text-white/40"
              }`}
            >
              {screenNoise ? "Noise: ON" : "Noise: OFF"}
            </button>
          </div>

          {/* Grid configuration toggle */}
          <div className="flex items-center bg-white/5 p-1 border border-white/10 text-[9px] font-mono uppercase tracking-widest">
            <button
              onClick={() => setLayoutMode("1x1")}
              className={`px-3 py-1 transition ${layoutMode === "1x1" ? "bg-white/10 text-white font-bold" : "text-white/40 hover:text-white"}`}
            >
              1 Screen
            </button>
            <button
              onClick={() => setLayoutMode("1x2")}
              className={`px-3 py-1 transition ${layoutMode === "1x2" ? "bg-white/10 text-white font-bold" : "text-white/40 hover:text-white"}`}
            >
              2 Screens
            </button>
            <button
              onClick={() => setLayoutMode("2x2")}
              className={`px-3 py-1 transition ${layoutMode === "2x2" ? "bg-white/10 text-white font-bold" : "text-white/40 hover:text-white"}`}
            >
              4 Screens
            </button>
          </div>
        </div>
      </div>

      {/* Concurrent Command Broadcaster Panel */}
      <div className="bg-[#0c0c0c] border border-white/10 p-5 mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-white/60">Broadcast CLI:</span>
        </div>
        <div className="flex-1 w-full flex items-center gap-2 bg-black/40 border border-white/15 px-3 py-2">
          <span className="font-mono text-xs text-white/30">$</span>
          <input
            type="text"
            value={fastCommand}
            onChange={(e) => setFastCommand(e.target.value)}
            placeholder="Type a query (e.g. 'df -h', 'free -m', 'docker ps') to send to active screens..."
            className="flex-1 bg-transparent text-xs text-white placeholder-white/20 focus:outline-none border-none focus:ring-0 p-0 font-mono"
          />
        </div>
        <button
          onClick={executeFastCommandOnAll}
          disabled={runningFastCmd}
          className="w-full md:w-auto bg-indigo-600 hover:bg-white hover:text-black text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 transition shrink-0 border border-transparent hover:border-white/15"
        >
          {runningFastCmd ? "Executing..." : "Broadcast Command"}
        </button>
      </div>

      {/* Multi-Desktop Visual Workspace Grid */}
      <div className={`grid ${getGridConfig()} gap-6 flex-1`}>
        {Array.from({ length: getCellLimit() }).map((_, index) => {
          const selectedId = selectedCellMachines[index];
          const m = machines.find((x) => x.id === selectedId);

          return (
            <div
              key={index}
              className={`bg-[#0d0d0d] border flex flex-col overflow-hidden relative group transition-all duration-300 ${
                m && m.status === "online" 
                  ? "border-white/10" 
                  : "border-white/5 opacity-50 bg-black/40"
              }`}
            >
              {/* Cell Header Controls */}
              <div className="bg-black/60 h-11 px-4 flex justify-between items-center border-b border-white/10 text-xs">
                {/* Machine Selection dropdown */}
                <div className="relative">
                  <select
                    value={selectedId || ""}
                    onChange={(e) => handleCellSelect(index, e.target.value)}
                    className="appearance-none bg-black/80 border border-white/10 rounded-none pl-3 pr-8 py-1 text-[10px] font-bold text-white/60 font-mono uppercase tracking-wider focus:outline-none hover:border-white/30 transition cursor-pointer"
                  >
                    <option value="">-- SCREEN UNCONNECTED --</option>
                    {onlineMachines.map((om) => (
                      <option key={om.id} value={om.id}>
                        {om.name.toUpperCase()} ({om.ip})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-white/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Display connection active tag */}
                {m && m.status === "online" && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-mono font-bold bg-white/5 px-2.5 py-0.5 border border-white/10 uppercase tracking-widest">
                      <Wifi className="w-3 h-3 text-emerald-400" />
                      TUNNEL SECURED
                    </div>
                  </div>
                )}
              </div>

              {/* Cell Screen Viewport with CRT CRT animation scanline */}
              <div className="flex-1 bg-black aspect-video relative flex flex-col justify-center items-center overflow-hidden">
                {screenNoise && m && m.status === "online" && (
                  <div className="absolute inset-0 pointer-events-none bg-radial-noise opacity-[0.03] mix-blend-screen z-10" />
                )}

                {/* Screen content */}
                {m && m.status === "online" ? (
                  <div className="absolute inset-0 p-5 flex flex-col justify-between font-mono z-0">
                    
                    {/* Top bar info inside CRT */}
                    <div className="flex justify-between items-center text-[9px] text-white/30 border-b border-white/5 pb-2 uppercase tracking-wider">
                      <span>MONITOR_CH: 0{index + 1}</span>
                      <span>OS: {m.os.toUpperCase()}</span>
                      <span>CPU: {m.metrics.cpu}% | RAM: {m.metrics.ram}%</span>
                    </div>

                    {/* Quick outputs/logs or mock command results */}
                    <div className="flex-1 py-4 text-[10px] overflow-y-auto leading-relaxed text-white/70">
                      {fastOutputs[m.id] ? (
                        <div className="whitespace-pre text-indigo-300 font-mono">{fastOutputs[m.id]}</div>
                      ) : (
                        <div className="flex flex-col gap-1 text-white/40">
                          <span className="text-white/20 font-bold">// SYSTEM ACTIVE LOG STREAM</span>
                          {m.logs.slice(-3).map((log, i) => (
                            <span key={i} className="truncate tracking-wide">{log}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom action panel overlay on cell hover */}
                    <div className="absolute inset-0 bg-black/90 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                      <button
                        onClick={() => onSelectMachine(m, "desktop")}
                        className="bg-indigo-600 hover:bg-white hover:text-black text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 transition border border-transparent"
                      >
                        Launch GUI
                      </button>
                      <button
                        onClick={() => onSelectMachine(m, "terminal")}
                        className="bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 transition"
                      >
                        SSH Shell
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-white/30 font-sans">
                    <MonitorOff className="w-8 h-8 text-white/10 mb-3" />
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Channel Idle</h4>
                    <p className="text-[9px] text-white/20 max-w-[200px] mt-1 leading-relaxed">
                      Select active node thread to stream secure signal interface.
                    </p>
                  </div>
                )}
              </div>

              {/* Cell Footer metadata information */}
              {m && m.status === "online" && (
                <div className="bg-black/40 h-8 px-4 border-t border-white/10 flex justify-between items-center text-[9px] font-mono text-white/30 uppercase tracking-widest">
                  <span>CHANNEL_ID: {m.id}</span>
                  <span>Uptime: {m.metrics.uptime}</span>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
