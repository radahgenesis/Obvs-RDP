import React, { useState, useEffect, useRef } from "react";
import { 
  Network, 
  ShieldCheck, 
  Key, 
  Download, 
  Copy, 
  QrCode, 
  Check, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Activity, 
  FileText, 
  Wifi, 
  WifiOff, 
  Play, 
  Square,
  ArrowUpRight,
  ArrowDownLeft,
  Server,
  Terminal
} from "lucide-react";
import { RemoteMachine } from "../types";

interface VpnPeer {
  id: string;
  name: string;
  machineId?: string; // Optional link to a registered remote machine
  vpnIp: string;
  publicKey: string;
  allowedIps: string;
  status: "connected" | "disconnected" | "idle";
  lastHandshake?: string;
  transferRx?: string;
  transferTx?: string;
}

interface VpnConfig {
  protocol: "wireguard" | "openvpn" | "tailscale";
  serverPort: number;
  serverAddress: string;
  subnetRange: string;
  dnsServers: string;
  serverPrivateKey: string;
  serverPublicKey: string;
  mtu: number;
  keepalive: number;
}

interface VpnSetupPanelProps {
  machines: RemoteMachine[];
}

export default function VpnSetupPanel({ machines }: VpnSetupPanelProps) {
  // VPN Config state with persistence
  const [vpnConfig, setVpnConfig] = useState<VpnConfig>(() => {
    const saved = localStorage.getItem("obvs_vpn_config");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    // Default WireGuard configuration
    return {
      protocol: "wireguard",
      serverPort: 51820,
      serverAddress: "vpn.obvs-infrastructure.net",
      subnetRange: "10.200.0.1/24",
      dnsServers: "1.1.1.1, 8.8.8.8",
      serverPrivateKey: "uKz+A5Gg6v9lK1m2N3b4V5c6X7z8L9p0Q1w2E3r4T5y=",
      serverPublicKey: "p8Q0w1E2r3T4y5U6i7O8p9A0s1D2f3G4h5J6k7L8z9X=",
      mtu: 1420,
      keepalive: 25
    };
  });

  // VPN Peers state with persistence
  const [peers, setPeers] = useState<VpnPeer[]>(() => {
    const saved = localStorage.getItem("obvs_vpn_peers");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "peer-1",
        name: "HQ-Gateway-Client",
        vpnIp: "10.200.0.2/32",
        publicKey: "hqCl1eNt8z9X7P6o5I4u3Y2t1R0e9W8q7P6o5I4u3Y2=",
        allowedIps: "10.200.0.2/32",
        status: "connected",
        lastHandshake: "24 seconds ago",
        transferRx: "24.5 MB",
        transferTx: "128.9 MB"
      },
      {
        id: "peer-2",
        name: "ubuntu-prod-app-01",
        machineId: "mach-1", // Reference to the first default machine if exists
        vpnIp: "10.200.0.10/32",
        publicKey: "ub01Pr0d8z9X7P6o5I4u3Y2t1R0e9W8q7P6o5I4u3Y2=",
        allowedIps: "10.200.0.10/32",
        status: "connected",
        lastHandshake: "1 min 12s ago",
        transferRx: "148.2 MB",
        transferTx: "41.9 MB"
      }
    ];
  });

  // VPN operational states
  const [vpnActive, setVpnActive] = useState<boolean>(() => {
    return localStorage.getItem("obvs_vpn_active") === "true";
  });
  
  // Real-time chart telemetry simulation
  const [trafficHistory, setTrafficHistory] = useState<Array<{ rx: number; tx: number; time: string }>>([]);
  const [vpnLogs, setVpnLogs] = useState<string[]>([]);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [selectedPeerForConfig, setSelectedPeerForConfig] = useState<string>("peer-1");
  const [qrCodeOpen, setQrCodeOpen] = useState<boolean>(false);

  // Add peer form state
  const [newPeerName, setNewPeerName] = useState("");
  const [newPeerMachineId, setNewPeerMachineId] = useState("");
  const [newPeerIp, setNewPeerIp] = useState("10.200.0.11/32");
  const [newPeerPublicKey, setNewPeerPublicKey] = useState("");

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Save states to local storage on change
  useEffect(() => {
    localStorage.setItem("obvs_vpn_config", JSON.stringify(vpnConfig));
  }, [vpnConfig]);

  useEffect(() => {
    localStorage.setItem("obvs_vpn_peers", JSON.stringify(peers));
  }, [peers]);

  useEffect(() => {
    localStorage.setItem("obvs_vpn_active", String(vpnActive));
  }, [vpnActive]);

  // Generate cryptographic keys
  const generateKeys = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let priv = "";
    let pub = "";
    for (let i = 0; i < 43; i++) {
      priv += chars.charAt(Math.floor(Math.random() * chars.length));
      pub += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    priv += "=";
    pub += "=";
    
    setVpnConfig(prev => ({
      ...prev,
      serverPrivateKey: priv,
      serverPublicKey: pub
    }));

    addLog(`[VPN] Re-generated cryptographic keypairs for ${vpnConfig.protocol.toUpperCase()} server interface.`);
  };

  const generatePeerKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let pub = "";
    for (let i = 0; i < 43; i++) {
      pub += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pub += "=";
    setNewPeerPublicKey(pub);
  };

  // Logging utility
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setVpnLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 40));
  };

  // Simulating live VPN state
  useEffect(() => {
    addLog(`[VPN] Virtual Private Network control interface initialized.`);
    if (vpnActive) {
      addLog(`[VPN] VPN Server Tunnel interface active on ${vpnConfig.subnetRange} [${vpnConfig.protocol.toUpperCase()}]`);
    } else {
      addLog(`[VPN] VPN Daemon is currently IDLE. Waiting for tunnel engagement...`);
    }

    // Populate initial traffic history
    const initialHistory = Array.from({ length: 20 }, (_, i) => ({
      rx: Math.floor(Math.random() * 40) + 10,
      tx: Math.floor(Math.random() * 30) + 5,
      time: new Date(Date.now() - (20 - i) * 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }));
    setTrafficHistory(initialHistory);
  }, []);

  // Interval-based live traffic telemetry simulator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (vpnActive) {
      interval = setInterval(() => {
        // Randomly simulate traffic rates
        const activePeers = peers.filter(p => p.status === "connected").length;
        const baseRx = activePeers * (Math.floor(Math.random() * 85) + 15);
        const baseTx = activePeers * (Math.floor(Math.random() * 60) + 10);
        
        setTrafficHistory(prev => {
          const next = [...prev, {
            rx: Number((baseRx / 10).toFixed(1)),
            tx: Number((baseTx / 10).toFixed(1)),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }];
          return next.slice(-20); // Keep last 20 ticks
        });

        // Occasional random log event
        if (Math.random() < 0.2) {
          const randomPeer = peers[Math.floor(Math.random() * peers.length)];
          const events = [
            `[VPN] Keepalive handshake received from peer: ${randomPeer.name}`,
            `[VPN] Route table lookup: routing packet for ${randomPeer.vpnIp}`,
            `[VPN] Peer statistics updated. Tx/Rx counter commit.`,
            `[VPN] Encryption handshake cycle completed successfully.`
          ];
          addLog(events[Math.floor(Math.random() * events.length)]);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [vpnActive, peers]);

  // Handle tunnel start/stop toggle
  const toggleVpn = () => {
    const nextState = !vpnActive;
    setVpnActive(nextState);
    if (nextState) {
      addLog(`[VPN] Initializing Secure Gateway tunneling layer (${vpnConfig.protocol.toUpperCase()})...`);
      addLog(`[VPN] Binding UDP Daemon to host port ${vpnConfig.serverPort}.`);
      addLog(`[VPN] Route tables engaged: mapping overlay IP subnet ${vpnConfig.subnetRange}`);
      addLog(`[VPN] VPN SERVER DAEMON ONLINE. Interfaces configured successfully.`);
      
      // Mark peers as connected
      setPeers(prev => prev.map(p => ({ ...p, status: "connected" })));
    } else {
      addLog(`[VPN] Shutting down VPN Daemon.`);
      addLog(`[VPN] Discarding overlay routes. Port ${vpnConfig.serverPort} unbound.`);
      addLog(`[VPN] VPN SERVER DAEMON OFFLINE.`);
      
      // Mark peers as disconnected
      setPeers(prev => prev.map(p => ({ ...p, status: "disconnected" })));
    }
  };

  // Add peer handler
  const handleAddPeer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeerName.trim()) return;

    // Check if machine link is selected
    const linkedMachine = machines.find(m => m.id === newPeerMachineId);
    const finalName = linkedMachine ? linkedMachine.name : newPeerName.trim();

    const newPeerObj: VpnPeer = {
      id: "peer-" + Date.now(),
      name: finalName,
      machineId: newPeerMachineId || undefined,
      vpnIp: newPeerIp.trim(),
      publicKey: newPeerPublicKey.trim() || "pub" + Math.random().toString(36).substring(2, 20) + "=",
      allowedIps: newPeerIp.trim(),
      status: vpnActive ? "connected" : "idle",
      lastHandshake: "Never",
      transferRx: "0 B",
      transferTx: "0 B"
    };

    setPeers(prev => [...prev, newPeerObj]);
    addLog(`[VPN] Registered new secure peer mapping: ${newPeerObj.name} [IP: ${newPeerObj.vpnIp}]`);
    
    // Reset fields
    setNewPeerName("");
    setNewPeerMachineId("");
    setNewPeerIp(`10.200.0.${peers.length + 12}/32`);
    setNewPeerPublicKey("");
  };

  // Delete peer handler
  const handleDeletePeer = (id: string) => {
    const target = peers.find(p => p.id === id);
    if (target) {
      setPeers(prev => prev.filter(p => p.id !== id));
      addLog(`[VPN] Revoked configuration & access authorization for peer: ${target.name}`);
      if (selectedPeerForConfig === id) {
        setSelectedPeerForConfig(peers[0]?.id || "");
      }
    }
  };

  // Generate configuration content on the fly
  const selectedPeerObj = peers.find(p => p.id === selectedPeerForConfig);
  
  const generateWireGuardConfig = () => {
    if (!selectedPeerObj) return "# No peer selected";
    
    return `[Interface]
# VPN Overlay Address assigned to client
Address = ${selectedPeerObj.vpnIp}
PrivateKey = [CLIENT_PRIVATE_KEY_HERE]
DNS = ${vpnConfig.dnsServers}
MTU = ${vpnConfig.mtu}

[Peer]
# Main Server Interface Credentials
PublicKey = ${vpnConfig.serverPublicKey}
Endpoint = ${vpnConfig.serverAddress}:${vpnConfig.serverPort}
AllowedIPs = ${vpnConfig.subnetRange}
PersistentKeepalive = ${vpnConfig.keepalive}
`;
  };

  const generateOpenVpnConfig = () => {
    if (!selectedPeerObj) return "# No peer selected";
    
    return `client
dev tun
proto udp
remote ${vpnConfig.serverAddress} ${vpnConfig.serverPort}
resolv-retry infinite
nobackup
persist-key
persist-tun
cipher AES-256-GCM
auth SHA256
verb 3

<ca>
-----BEGIN CERTIFICATE-----
MIIBtzCCASgCCQCB9Xh9YhS2pDANBgkqhkiG9w0BAQsFADASMRAwDgYDVQQDDAdD
T05TT0xFMCAXDTI2MDYyNjIwMTIwMFoYDzIxMjYwNjAyMjAxMjAwWjASMRAwDgYD
VQQDDAdDT05TT0xFMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3lKz+A5Gg
-----END CERTIFICATE-----
</ca>
<cert>
# Client address mapping: ${selectedPeerObj.vpnIp}
-----BEGIN CERTIFICATE-----
MIIBtzCCASgCCQCB9Xh9YhS2pDANBgkqhkiG9w0BAQsFADASMRAwDgYDVQQDDAdC
-----END CERTIFICATE-----
</cert>
<key>
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoGBALeUrP4DkaA=
-----END PRIVATE KEY-----
</key>
`;
  };

  const configText = vpnConfig.protocol === "wireguard" ? generateWireGuardConfig() : generateOpenVpnConfig();

  // Copy to clipboard
  const handleCopyConfig = () => {
    navigator.clipboard.writeText(configText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    addLog(`[VPN] Configuration code block copied to operator clipboard.`);
  };

  // Download config file
  const handleDownloadConfig = () => {
    const filename = `${selectedPeerObj?.name || "peer-vpn"}.${vpnConfig.protocol === "wireguard" ? "conf" : "ovpn"}`;
    const blob = new Blob([configText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog(`[VPN] Exported client configuration file: ${filename}`);
  };

  // Quick stats calculations
  const totalTx = trafficHistory.reduce((acc, curr) => acc + curr.tx, 0);
  const totalRx = trafficHistory.reduce((acc, curr) => acc + curr.rx, 0);
  const currentTxRate = trafficHistory[trafficHistory.length - 1]?.tx || 0;
  const currentRxRate = trafficHistory[trafficHistory.length - 1]?.rx || 0;

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 p-6 space-y-6">
      
      {/* Visual Header / Banner */}
      <div className="bg-slate-900 border border-white/10 rounded-xl p-6 relative overflow-hidden">
        {/* Dynamic scanning radar background glow */}
        <div className="absolute inset-0 bg-radial-at-t from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldCheck className="w-48 h-48 text-indigo-500" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase font-mono text-indigo-400 font-bold tracking-[0.2em]">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Secure Encrypted Overlay
            </div>
            <h1 className="text-2xl font-serif italic text-white leading-tight">
              Virtual Private Network Engine
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Establish secure client-to-site tunnels and virtual private subnets across registered infrastructure nodes. Encrypt diagnostic logs and remote desktop feeds securely.
            </p>
          </div>

          {/* Master VPN Switch */}
          <div className="flex items-center gap-4 bg-black/40 border border-white/5 p-4 rounded-lg shrink-0">
            <div className="flex flex-col text-right">
              <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500">
                Overlay Tunnel Daemon
              </span>
              <span className={`text-xs font-mono font-bold ${vpnActive ? "text-emerald-400 animate-pulse" : "text-slate-400"}`}>
                {vpnActive ? "● ONLINE & BOUND" : "○ DISENGAGED"}
              </span>
            </div>
            <button
              onClick={toggleVpn}
              className={`px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider rounded border transition-all flex items-center gap-2 ${
                vpnActive 
                  ? "bg-red-500/15 hover:bg-red-500 hover:text-white border-red-500/40 text-red-300" 
                  : "bg-indigo-600 hover:bg-indigo-500 text-white border-transparent"
              }`}
            >
              {vpnActive ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Kill Daemon
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Launch VPN
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left column: Server Settings & Config */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Top row widget: Live Telemetry Dashboard */}
          {vpnActive && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Traffic RX widget */}
              <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 block mb-1">
                    Uplink Rate (RX)
                  </span>
                  <div className="text-2xl font-mono text-emerald-400 font-bold flex items-baseline gap-1">
                    {currentRxRate} <span className="text-xs text-slate-400">Kbps</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 mt-1 block">
                    Session cumulative: {((totalRx + 1200) / 10).toFixed(1)} MB
                  </span>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
              </div>

              {/* Traffic TX widget */}
              <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 block mb-1">
                    Downlink Rate (TX)
                  </span>
                  <div className="text-2xl font-mono text-indigo-400 font-bold flex items-baseline gap-1">
                    {currentTxRate} <span className="text-xs text-slate-400">Kbps</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 mt-1 block">
                    Session cumulative: {((totalTx + 3800) / 10).toFixed(1)} MB
                  </span>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>

              {/* Active Peers widget */}
              <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 block mb-1">
                    Authorized Peers Connected
                  </span>
                  <div className="text-2xl font-mono text-white font-bold flex items-baseline gap-1">
                    {peers.filter(p => p.status === "connected").length} <span className="text-xs text-slate-400">/ {peers.length}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 mt-1 block">
                    Active subnet: {vpnConfig.subnetRange}
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg text-white/60 border border-white/10">
                  <Network className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

          {/* Telemetry Chart */}
          {vpnActive && (
            <div className="bg-slate-900/40 border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" /> Real-time Bandwidth Telemetry
                </span>
                <div className="flex items-center gap-3 text-[9px] font-mono">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> RX Uplink</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400" /> TX Downlink</span>
                </div>
              </div>

              {/* Bandwidth chart */}
              <div ref={chartContainerRef} className="h-32 w-full mt-2 relative flex items-end">
                <svg className="w-full h-full">
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="100%" y2="20" stroke="rgba(255, 255, 255, 0.03)" strokeWidth={1} />
                  <line x1="0" y1="60" x2="100%" y2="60" stroke="rgba(255, 255, 255, 0.03)" strokeWidth={1} />
                  <line x1="0" y1="100" x2="100%" y2="100" stroke="rgba(255, 255, 255, 0.03)" strokeWidth={1} />
                  
                  {/* Dynamic pathways based on traffic rates */}
                  {trafficHistory.length > 1 && (
                    <>
                      {/* RX Path */}
                      <path
                        d={trafficHistory.map((val, idx) => {
                          const x = (idx / (trafficHistory.length - 1)) * 100;
                          const maxVal = Math.max(...trafficHistory.map(h => Math.max(h.rx, h.tx, 1)));
                          const y = 120 - (val.rx / maxVal) * 100;
                          return `${idx === 0 ? 'M' : 'L'} ${x}% ${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth={2}
                        className="transition-all duration-300"
                      />
                      
                      {/* TX Path */}
                      <path
                        d={trafficHistory.map((val, idx) => {
                          const x = (idx / (trafficHistory.length - 1)) * 100;
                          const maxVal = Math.max(...trafficHistory.map(h => Math.max(h.rx, h.tx, 1)));
                          const y = 120 - (val.tx / maxVal) * 100;
                          return `${idx === 0 ? 'M' : 'L'} ${x}% ${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth={2}
                        className="transition-all duration-300"
                      />
                    </>
                  )}
                </svg>
              </div>
            </div>
          )}

          {/* VPN Server Configuration Editor Card */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-xs uppercase tracking-wider font-mono font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" /> Gateway Server Daemon Configuration
              </h2>
              <span className="text-[8px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20 font-mono uppercase">
                Active Protocol: {vpnConfig.protocol}
              </span>
            </div>

            {/* Config Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400">VPN Protocol</label>
                <select
                  value={vpnConfig.protocol}
                  onChange={(e) => setVpnConfig(prev => ({ ...prev, protocol: e.target.value as any }))}
                  disabled={vpnActive}
                  className="bg-black/60 border border-white/10 rounded px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="wireguard">WireGuard (Recommended)</option>
                  <option value="openvpn">OpenVPN</option>
                  <option value="tailscale">Tailscale Overlay Link</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400">Server Listening Port (UDP)</label>
                <input
                  type="number"
                  value={vpnConfig.serverPort}
                  onChange={(e) => setVpnConfig(prev => ({ ...prev, serverPort: parseInt(e.target.value) || 0 }))}
                  disabled={vpnActive}
                  className="bg-black/60 border border-white/10 rounded px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400">DNS Servers</label>
                <input
                  type="text"
                  value={vpnConfig.dnsServers}
                  onChange={(e) => setVpnConfig(prev => ({ ...prev, dnsServers: e.target.value }))}
                  disabled={vpnActive}
                  className="bg-black/60 border border-white/10 rounded px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400">Server Endpoint Domain / IP</label>
                <input
                  type="text"
                  value={vpnConfig.serverAddress}
                  onChange={(e) => setVpnConfig(prev => ({ ...prev, serverAddress: e.target.value }))}
                  disabled={vpnActive}
                  className="bg-black/60 border border-white/10 rounded px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400">Overlay Subnet Range</label>
                <input
                  type="text"
                  value={vpnConfig.subnetRange}
                  onChange={(e) => setVpnConfig(prev => ({ ...prev, subnetRange: e.target.value }))}
                  disabled={vpnActive}
                  className="bg-black/60 border border-white/10 rounded px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Cryptographic Secrets Section (Only relevant for WireGuard/OpenVPN) */}
            {vpnConfig.protocol === "wireguard" && (
              <div className="border-t border-white/5 pt-4 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>CRYPTOGRAPHIC PUBLIC/PRIVATE KEYS</span>
                  <button
                    onClick={generateKeys}
                    disabled={vpnActive}
                    className="flex items-center gap-1 text-indigo-400 hover:text-white transition disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-generate Server Keys
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Key className="w-3 h-3 text-red-400/70" /> Server Private Key (Keep secret)
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={vpnConfig.serverPrivateKey}
                      className="bg-black/80 border border-white/5 text-slate-400 rounded px-2.5 py-2 select-all focus:outline-none font-mono text-[10px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Key className="w-3 h-3 text-indigo-400" /> Server Public Key (Share with clients)
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={vpnConfig.serverPublicKey}
                      className="bg-black/80 border border-white/5 text-slate-400 rounded px-2.5 py-2 select-all focus:outline-none font-mono text-[10px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Peer Profiles, Download configs, QR Code generator */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-xs uppercase tracking-wider font-mono font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Dynamic Client Configuration Compiler
              </h2>
              
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-slate-400">Select Client Profile:</span>
                <select
                  value={selectedPeerForConfig}
                  onChange={(e) => {
                    setSelectedPeerForConfig(e.target.value);
                    setQrCodeOpen(false);
                  }}
                  className="bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:outline-none font-mono"
                >
                  {peers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedPeerObj ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Visual file layout card preview */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>GENERATE {vpnConfig.protocol.toUpperCase()} config block</span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyConfig}
                        className="flex items-center gap-1 text-slate-300 hover:text-white transition px-2 py-0.5 bg-white/5 border border-white/10 rounded"
                      >
                        {copiedText ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Block
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleDownloadConfig}
                        className="flex items-center gap-1 text-slate-300 hover:text-white transition px-2 py-0.5 bg-white/5 border border-white/10 rounded"
                      >
                        <Download className="w-3 h-3" /> Download .conf
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/80 border border-white/5 p-4 rounded text-[10px] font-mono text-indigo-300 overflow-x-auto whitespace-pre leading-relaxed select-text shadow-inner max-h-[220px]">
                    {configText}
                  </div>
                </div>

                {/* QR Code and Mobile scan simulation */}
                <div className="bg-black/40 border border-white/5 p-4 rounded flex flex-col justify-between items-center text-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500 block">
                      Rapid Mobile Provisioning
                    </span>
                    <p className="text-[10px] font-mono text-slate-400 leading-tight">
                      Scan QR vector payload to synchronize connection on client apps.
                    </p>
                  </div>

                  {qrCodeOpen ? (
                    /* Mock visual elegant QR code matrix */
                    <div className="w-32 h-32 bg-white p-2 relative rounded flex flex-col gap-0.5 shadow-2xl justify-center items-center">
                      <div className="grid grid-cols-8 gap-1 w-full h-full p-1 bg-white">
                        {Array.from({ length: 64 }).map((_, idx) => {
                          const isFilled = (idx % 3 === 0 || idx % 7 === 0 || idx < 8 || idx % 8 === 0 || idx > 56 || (idx % 8 === 7 && idx < 16));
                          return (
                            <div 
                              key={idx} 
                              className={`w-full h-full rounded-sm ${isFilled ? "bg-black" : "bg-white"}`} 
                            />
                          );
                        })}
                      </div>
                      <span className="absolute bottom-1 right-1 text-[8px] font-mono font-bold text-indigo-600 uppercase bg-indigo-100 px-0.5 rounded">
                        {vpnConfig.protocol}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setQrCodeOpen(true)}
                      className="w-28 h-28 bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 text-white rounded flex flex-col justify-center items-center gap-2.5 transition-all group"
                    >
                      <QrCode className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-all duration-300" />
                      <span className="text-[8px] uppercase tracking-widest font-mono text-slate-400 group-hover:text-white">
                        Compile QR Code
                      </span>
                    </button>
                  )}

                  <span className="text-[8px] font-mono text-slate-500">
                    PEER KEY ENCODED: {selectedPeerObj.publicKey.substring(0, 10)}...
                  </span>
                </div>

              </div>
            ) : (
              <p className="text-xs font-mono text-red-400/80 py-4 text-center">
                No peer client profiles configured yet. Add a peer below.
              </p>
            )}
          </div>
        </div>

        {/* Right column: Peer Manager & Logs */}
        <div className="space-y-6">
          
          {/* Active VPN Peers list */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="text-xs uppercase tracking-wider font-mono font-bold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-400" /> VPN Subnet Peers list
              </h2>
              <span className="text-[9px] font-mono text-slate-400">{peers.length} Nodes</span>
            </div>

            {/* List of Peers */}
            <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
              {peers.map((peer) => {
                const linkedMachine = machines.find(m => m.id === peer.machineId);
                return (
                  <div 
                    key={peer.id}
                    className={`bg-black/40 border p-3 flex flex-col gap-2 relative group transition-colors ${
                      selectedPeerForConfig === peer.id 
                        ? "border-indigo-500 bg-indigo-950/5" 
                        : "border-white/5 hover:border-white/10"
                    }`}
                  >
                    {/* Delete Peer Button */}
                    <button
                      onClick={() => handleDeletePeer(peer.id)}
                      className="absolute top-2.5 right-2.5 text-slate-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                      title="Revoke peer credentials"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Name & status */}
                    <div className="flex items-center gap-2 pr-6">
                      <span className={`w-2 h-2 rounded-full ${
                        peer.status === "connected" 
                          ? "bg-emerald-500 animate-pulse" 
                          : peer.status === "disconnected" 
                            ? "bg-red-500" 
                            : "bg-slate-600"
                      }`} />
                      <span 
                        className="text-xs font-mono font-bold text-white cursor-pointer hover:text-indigo-400"
                        onClick={() => setSelectedPeerForConfig(peer.id)}
                      >
                        {peer.name}
                      </span>
                      {linkedMachine && (
                        <span className="text-[7px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded uppercase tracking-wider font-mono" title={`Linked to remote host machine: ${linkedMachine.ip}`}>
                          HOST LINKED
                        </span>
                      )}
                    </div>

                    {/* Meta data parameters */}
                    <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[9px] font-mono text-slate-400 border-t border-white/5 pt-1.5">
                      <div className="flex justify-between">
                        <span>VPN IP:</span>
                        <span className="text-slate-300 font-bold">{peer.vpnIp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Handshake:</span>
                        <span className="text-slate-400">{peer.lastHandshake || "Never"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transferred:</span>
                        <span className="text-indigo-400 font-bold">RX: {peer.transferRx}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transferred:</span>
                        <span className="text-emerald-400 font-bold">TX: {peer.transferTx}</span>
                      </div>
                    </div>

                    {/* Interactive focus config link button */}
                    <div className="flex justify-between items-center text-[8px] font-mono mt-1 border-t border-white/5 pt-1.5">
                      <span className="text-slate-500 truncate select-all pr-4">
                        PUB: {peer.publicKey}
                      </span>
                      <button
                        onClick={() => setSelectedPeerForConfig(peer.id)}
                        className="text-indigo-400 hover:text-white font-bold shrink-0"
                      >
                        LOAD CONFIG →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Form to add Peer Client */}
            <form onSubmit={handleAddPeer} className="border-t border-white/5 pt-4 space-y-3">
              <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 block font-bold">
                Register New Authorized Client Peer
              </span>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-mono text-slate-500 uppercase">Link with Host Machine (Optional)</label>
                <select
                  value={newPeerMachineId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    setNewPeerMachineId(mId);
                    const selectedMach = machines.find(m => m.id === mId);
                    if (selectedMach) {
                      setNewPeerName(selectedMach.name);
                    }
                  }}
                  className="bg-black text-[10px] border border-white/10 rounded px-2 py-1.5 font-mono text-white focus:outline-none"
                >
                  <option value="">-- No host machine link --</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.ip})</option>
                  ))}
                </select>
              </div>

              {!newPeerMachineId && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-slate-500 uppercase">Client Name / Tag</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. mobile-tablet-01"
                    value={newPeerName}
                    onChange={(e) => setNewPeerName(e.target.value)}
                    className="bg-black text-[10px] border border-white/10 rounded px-2 py-1.5 font-mono text-white focus:outline-none placeholder-slate-600"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-slate-500 uppercase">Assigned VPN Overlay IP</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10.200.0.12/32"
                    value={newPeerIp}
                    onChange={(e) => setNewPeerIp(e.target.value)}
                    className="bg-black text-[10px] border border-white/10 rounded px-2 py-1.5 font-mono text-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-slate-500 uppercase">Public Key</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Automatic keypair"
                      value={newPeerPublicKey}
                      onChange={(e) => setNewPeerPublicKey(e.target.value)}
                      className="bg-black text-[10px] border border-white/10 rounded px-2 py-1.5 font-mono text-white focus:outline-none flex-1 truncate text-[8px] placeholder-slate-600"
                    />
                    <button
                      type="button"
                      onClick={generatePeerKey}
                      className="bg-indigo-600 hover:bg-indigo-500 px-2 py-1 text-[10px] text-white rounded font-mono"
                      title="Generate test public key"
                    >
                      Gen
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600/10 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/20 font-mono text-[10px] py-2 font-bold uppercase tracking-wider transition-all rounded flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Commit Client Profile
              </button>
            </form>
          </div>

          {/* Real-time VPN Terminal Logs */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" /> VPN daemon log pipeline
              </span>
              <button
                onClick={() => setVpnLogs([])}
                className="text-[9px] font-mono text-slate-500 hover:text-white transition"
              >
                Clear Log
              </button>
            </div>

            <div className="bg-black/90 border border-white/5 p-4 rounded text-[9px] font-mono text-slate-400 h-44 overflow-y-auto space-y-1.5 leading-normal select-text">
              {vpnLogs.length === 0 ? (
                <div className="text-slate-600 italic text-center py-8">Log pipeline empty. Daemon waiting.</div>
              ) : (
                vpnLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-white/5 pb-1 last:border-b-0 break-words">
                    <span className="text-indigo-400/80">{log.substring(0, 10)}</span>
                    <span className="text-slate-300">{log.substring(10)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
