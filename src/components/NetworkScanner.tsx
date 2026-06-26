import React, { useState } from "react";
import { RemoteMachine, MachineOS } from "../types";
import { Wifi } from "lucide-react";

interface NetworkScannerProps {
  onAddMachineDirect: (machine: RemoteMachine) => void;
}

interface DiscoveredHost {
  ip: string;
  status: "active" | "inactive";
  ports: { port: number; service: string; open: boolean }[];
  os: MachineOS;
  hostname: string;
  imported: boolean;
}

export default function NetworkScanner({ onAddMachineDirect }: NetworkScannerProps) {
  const [subnetBase, setSubnetBase] = useState<string>("192.168.1");
  const [startOctet, setStartOctet] = useState<number>(1);
  const [endOctet, setEndOctet] = useState<number>(12);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [currentScanningIp, setCurrentScanningIp] = useState<string>("");
  const [discoveredHosts, setDiscoveredHosts] = useState<DiscoveredHost[]>([]);

  const handleScanNetwork = () => {
    setIsScanning(true);
    setScanProgress(0);
    setDiscoveredHosts([]);
    
    let currentOctet = startOctet;
    const totalToScan = Math.max(1, endOctet - startOctet + 1);
    
    const interval = setInterval(() => {
      const currentIp = `${subnetBase}.${currentOctet}`;
      setCurrentScanningIp(currentIp);
      
      const percentage = Math.round(((currentOctet - startOctet + 1) / totalToScan) * 100);
      setScanProgress(percentage);
      
      // Simulating host discovery at specific octets
      if (currentOctet === 3) {
        setDiscoveredHosts((prev) => [
          ...prev,
          {
            ip: currentIp,
            status: "active",
            ports: [
              { port: 22, service: "ssh", open: true },
              { port: 80, service: "web", open: false }
            ],
            os: "linux",
            hostname: `SVR-DEVEL-03`,
            imported: false
          }
        ]);
      } else if (currentOctet === 7) {
        setDiscoveredHosts((prev) => [
          ...prev,
          {
            ip: currentIp,
            status: "active",
            ports: [
              { port: 3389, service: "rdp", open: true },
              { port: 443, service: "web", open: false }
            ],
            os: "windows",
            hostname: `WIN-AD-DC07`,
            imported: false
          }
        ]);
      } else if (currentOctet === 10) {
        setDiscoveredHosts((prev) => [
          ...prev,
          {
            ip: currentIp,
            status: "active",
            ports: [
              { port: 5900, service: "vnc", open: true }
            ],
            os: "macos",
            hostname: `MAC-MINI-LAB10`,
            imported: false
          }
        ]);
      }
      
      currentOctet++;
      if (currentOctet > endOctet) {
        clearInterval(interval);
        setIsScanning(false);
        setCurrentScanningIp("");
        setScanProgress(100);
      }
    }, 400);
  };

  const handleImportHost = (host: DiscoveredHost) => {
    const matchedProtocol = (host.ports.find((p) => p.open)?.service || "ssh") as any;
    const newMachine: RemoteMachine = {
      id: `host-${Math.random().toString(36).substring(2, 9)}`,
      name: host.hostname,
      ip: host.ip,
      port: host.ports.find((p) => p.open)?.port || 22,
      protocol: matchedProtocol,
      username: "admin",
      credentialsType: "none",
      status: "online",
      os: host.os,
      group: "Scanned",
      metrics: {
        cpu: Math.floor(Math.random() * 20) + 10,
        ram: Math.floor(Math.random() * 25) + 35,
        disk: Math.floor(Math.random() * 30) + 15,
        networkIn: 5,
        networkOut: 2,
        uptime: "0:01"
      },
      logs: [
        `[TUNNEL] Handshake established with scanned IP ${host.ip}`,
        `[SECURITY] Auto-enrolled via local network IP scan on base ${subnetBase}`,
      ],
      terminalHistory: [],
      fileSystem: [
        { name: "shared", type: "directory", path: "/shared" },
        { name: "readme.txt", type: "file", path: "/shared/readme.txt", content: `Welcome to ${host.hostname}. Discovered via subnet scanning.`, size: "2KB" }
      ]
    };
    onAddMachineDirect(newMachine);
    setDiscoveredHosts((prev) =>
      prev.map((h) => (h.ip === host.ip ? { ...h, imported: true } : h))
    );
  };

  return (
    <div className="bg-[#0c0c0c] border border-white/10 p-6 mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-indigo-400 animate-pulse" />
          <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white">IP Network Scanner</h3>
        </div>
        <span className="text-[9px] font-mono tracking-widest uppercase text-white/40">
          LOCAL ARP / SUBNET SCANNER
        </span>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Subnet Base</label>
          <input
            type="text"
            value={subnetBase}
            onChange={(e) => setSubnetBase(e.target.value)}
            disabled={isScanning}
            placeholder="192.168.1"
            className="bg-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Start Octet</label>
          <input
            type="number"
            min={1}
            max={254}
            value={startOctet}
            onChange={(e) => setStartOctet(parseInt(e.target.value) || 1)}
            disabled={isScanning}
            className="bg-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">End Octet</label>
          <input
            type="number"
            min={1}
            max={254}
            value={endOctet}
            onChange={(e) => setEndOctet(parseInt(e.target.value) || 1)}
            disabled={isScanning}
            className="bg-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleScanNetwork}
            disabled={isScanning}
            className={`w-full py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${
              isScanning
                ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-white hover:text-black text-white border-transparent"
            }`}
          >
            {isScanning ? "Scanning..." : "Scan IP Range"}
          </button>
        </div>
      </div>

      {/* Scan Progress Bar */}
      {isScanning && (
        <div className="mb-6 p-4 bg-white/5 border border-white/5 rounded">
          <div className="flex justify-between text-[10px] font-mono text-white/60 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping mr-1"></span>
              Pinging address: <span className="text-white font-bold">{currentScanningIp}</span>
            </span>
            <span>{scanProgress}%</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden">
            <div style={{ width: `${scanProgress}%` }} className="bg-indigo-500 h-full transition-all duration-150" />
          </div>
        </div>
      )}

      {/* Discovered Hosts List */}
      {discoveredHosts.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold mb-3 font-mono">Active Nodes Discovered ({discoveredHosts.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {discoveredHosts.map((host) => (
              <div key={host.ip} className="bg-black/40 border border-white/10 p-4 rounded flex flex-col gap-3 justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-white">{host.ip}</span>
                    <span className="text-[9px] uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 font-mono">{host.os}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-semibold mb-2">{host.hostname}</div>
                  
                  <div className="flex flex-wrap gap-1">
                    {host.ports.map(p => (
                      <span key={p.port} className={`text-[9px] font-mono px-1.5 py-0.5 border ${
                        p.open ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        Port {p.port} ({p.service.toUpperCase()}) {p.open ? "OPEN" : "CLOSED"}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  disabled={host.imported}
                  onClick={() => handleImportHost(host)}
                  className={`w-full py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all border ${
                    host.imported
                      ? "bg-emerald-600/10 text-emerald-400/60 border-emerald-500/20 cursor-default"
                      : "bg-white/5 text-white border-white/10 hover:bg-white hover:text-black hover:border-transparent"
                  }`}
                >
                  {host.imported ? "Added to Registry" : "+ Register Node"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !isScanning && scanProgress === 100 && (
          <div className="text-center p-6 bg-white/5 border border-dashed border-white/10">
            <span className="text-xs text-white/50 font-mono">Scan complete. No active un-registered host responders found in targeted segment.</span>
          </div>
        )
      )}
    </div>
  );
}
