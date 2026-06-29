import React, { useState, useEffect } from "react";
import { RemoteMachine, MachineOS, ConnectionProtocol, ActivityLog } from "../types";
import NetworkScanner from "./NetworkScanner";
import GlobalMapView from "./GlobalMapView";
import {
  Server,
  Activity,
  Cpu,
  Tv,
  Terminal,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  Network,
  ListRestart,
  HardDrive,
  FileSpreadsheet,
  Plus,
  Shield,
  HelpCircle,
  ExternalLink,
  Wifi,
  Sliders,
  Tag,
  AlertTriangle,
  Bell,
  X,
  Folder,
  Settings,
  Zap
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

interface StatsDashboardProps {
  machines: RemoteMachine[];
  onSelectMachine: (machine: RemoteMachine, mode: "terminal" | "desktop") => void;
  onRunAction: (machineId: string, action: string, target?: string) => Promise<string>;
  onAddMachineClick: () => void;
  activityLogs: ActivityLog[];
  onAddMachineDirect: (machine: RemoteMachine) => void;
  onUpdateMachine: (id: string, updatedFields: Partial<RemoteMachine>) => void;
}

export default function StatsDashboard({
  machines,
  onSelectMachine,
  onRunAction,
  onAddMachineClick,
  activityLogs,
  onAddMachineDirect,
  onUpdateMachine
}: StatsDashboardProps) {
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Real-time CPU and Memory usage history (last 10 points for each machine)
  const [metricsHistory, setMetricsHistory] = useState<Record<string, { time: string; cpu: number; ram: number }[]>>({});
  const [pings, setPings] = useState<Record<string, number>>({});

  useEffect(() => {
    // Initialize pings with plausible initial values
    const initialPings: Record<string, number> = {};
    machines.forEach((m) => {
      if (m.status === "online") {
        initialPings[m.id] = Math.floor(Math.random() * 50) + 12; // 12ms to 62ms
      }
    });
    setPings(initialPings);

    const pingInterval = setInterval(() => {
      setPings((prev) => {
        const next = { ...prev };
        machines.forEach((m) => {
          if (m.status === "online") {
            const current = prev[m.id] || Math.floor(Math.random() * 40) + 15;
            // Generate some realistic small variance (-6ms to +6ms)
            const change = Math.floor(Math.random() * 13) - 6;
            // Keep the simulated RTT within bounds (10ms to 150ms)
            next[m.id] = Math.max(10, Math.min(150, current + change));
          } else {
            delete next[m.id];
          }
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(pingInterval);
  }, [machines]);

  useEffect(() => {
    const initial: Record<string, { time: string; cpu: number; ram: number }[]> = {};
    const now = Date.now();
    
    machines.forEach((m) => {
      const historyPoints = [];
      const baseCpu = m.metrics?.cpu || 40;
      const baseRam = m.metrics?.ram || 60;
      for (let i = 7; i >= 0; i--) {
        const timeStr = new Date(now - i * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        historyPoints.push({
          time: timeStr,
          cpu: m.status === "online" ? Math.max(5, Math.min(99, baseCpu + Math.floor(Math.random() * 14) - 7)) : 0,
          ram: m.status === "online" ? Math.max(5, Math.min(99, baseRam + Math.floor(Math.random() * 6) - 3)) : 0,
        });
      }
      initial[m.id] = historyPoints;
    });
    setMetricsHistory(initial);

    const interval = setInterval(() => {
      setMetricsHistory((prev) => {
        const next = { ...prev };
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        machines.forEach((m) => {
          const currentPoints = next[m.id] || [];
          const baseCpu = m.metrics?.cpu || 40;
          const baseRam = m.metrics?.ram || 60;
          
          const newCpu = m.status === "online" ? Math.max(5, Math.min(99, baseCpu + Math.floor(Math.random() * 20) - 10)) : 0;
          const newRam = m.status === "online" ? Math.max(5, Math.min(99, baseRam + Math.floor(Math.random() * 6) - 3)) : 0;
          
          const updatedPoints = [
            ...currentPoints,
            { time: timeStr, cpu: newCpu, ram: newRam }
          ];
          
          if (updatedPoints.length > 10) {
            updatedPoints.shift();
          }
          next[m.id] = updatedPoints;
        });
        
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [machines]);



  // Inline editing states
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [editGroup, setEditGroup] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagsString, setEditTagsString] = useState("");
  const [editCpuLimit, setEditCpuLimit] = useState(80);
  const [editRamLimit, setEditRamLimit] = useState(85);
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editLat, setEditLat] = useState<number>(0);
  const [editLng, setEditLng] = useState<number>(0);

  const startEditing = (m: RemoteMachine) => {
    setEditingMachineId(m.id);
    setEditGroup(m.group);
    setEditTags(m.tags || []);
    setEditCpuLimit(m.cpuAlertThreshold !== undefined ? m.cpuAlertThreshold : 80);
    setEditRamLimit(m.ramAlertThreshold !== undefined ? m.ramAlertThreshold : 85);
    setEditTagsString("");
    setEditCity(m.location?.city || "");
    setEditCountry(m.location?.country || "");
    setEditLat(m.location?.lat || 0);
    setEditLng(m.location?.lng || 0);
  };

  const saveEditing = (id: string) => {
    onUpdateMachine(id, {
      group: editGroup.trim() || "Development",
      tags: editTags,
      cpuAlertThreshold: editCpuLimit,
      ramAlertThreshold: editRamLimit,
      location: {
        city: editCity.trim(),
        country: editCountry.trim(),
        lat: Number(editLat) || 0,
        lng: Number(editLng) || 0,
        isCustom: true
      }
    });
    setEditingMachineId(null);
  };

  // Tag filter state
  const [filterTag, setFilterTag] = useState<string>("all");

  // All unique tags calculation
  const allTags = ["all", ...Array.from(new Set(machines.flatMap((m) => m.tags || [])))];

  // Group tabs
  const groups = ["all", ...Array.from(new Set(machines.map((m) => m.group)))];

  // Filtered machines
  const filteredMachines = machines.filter((m) => {
    const matchesGroup = filterGroup === "all" || m.group === filterGroup;
    const matchesTag = filterTag === "all" || (m.tags && m.tags.includes(filterTag));
    
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.ip.includes(searchQuery) ||
      m.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.tags && m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      
    return matchesGroup && matchesTag && matchesSearch;
  });

  // Calculate aggregated stats using live metrics history if available
  const totalServers = machines.length;
  const onlineServers = machines.filter((m) => m.status === "online").length;
  
  const getLiveCpu = (m: RemoteMachine) => {
    if (m.status !== "online") return 0;
    const hist = metricsHistory[m.id];
    return hist && hist.length > 0 ? hist[hist.length - 1].cpu : m.metrics.cpu;
  };

  const getLiveRam = (m: RemoteMachine) => {
    if (m.status !== "online") return 0;
    const hist = metricsHistory[m.id];
    return hist && hist.length > 0 ? hist[hist.length - 1].ram : m.metrics.ram;
  };

  const avgCpu = Math.round(
    machines
      .filter((m) => m.status === "online")
      .reduce((acc, m) => acc + getLiveCpu(m), 0) / (onlineServers || 1)
  );
  
  const avgRam = Math.round(
    machines
      .filter((m) => m.status === "online")
      .reduce((acc, m) => acc + getLiveRam(m), 0) / (onlineServers || 1)
  );

  // Active Alerting calculation
  const activeAlertsList = machines.filter((m) => {
    if (m.status !== "online") return false;
    const currentCpu = getLiveCpu(m);
    const currentRam = getLiveRam(m);
    const cpuLimit = m.cpuAlertThreshold !== undefined ? m.cpuAlertThreshold : 80;
    const ramLimit = m.ramAlertThreshold !== undefined ? m.ramAlertThreshold : 85;
    return currentCpu > cpuLimit || currentRam > ramLimit;
  }).map((m) => {
    const currentCpu = getLiveCpu(m);
    const currentRam = getLiveRam(m);
    const cpuLimit = m.cpuAlertThreshold !== undefined ? m.cpuAlertThreshold : 80;
    const ramLimit = m.ramAlertThreshold !== undefined ? m.ramAlertThreshold : 85;
    return {
      machine: m,
      cpuVal: currentCpu,
      ramVal: currentRam,
      cpuLimit,
      ramLimit,
      cpuExceeded: currentCpu > cpuLimit,
      ramExceeded: currentRam > ramLimit,
    };
  });

  const getOsColor = (os: MachineOS) => {
    switch (os) {
      case "windows":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "macos":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      default:
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    }
  };

  const getProtocolBadge = (proto: ConnectionProtocol) => {
    switch (proto) {
      case "ssh":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "vnc":
        return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
      case "rdp":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  const handleQuickReboot = async (machineId: string) => {
    setActionLoadingId(machineId + "-reboot");
    await onRunAction(machineId, "reboot");
    setActionLoadingId(null);
  };

  const handleFetchLogs = async (machineId: string) => {
    setActionLoadingId(machineId + "-logs");
    await onRunAction(machineId, "fetch-logs");
    setActionLoadingId(null);
  };

  const handleWakeOnLan = async (machineId: string, mac?: string) => {
    setActionLoadingId(machineId + "-wol");
    await onRunAction(machineId, "wol", mac);
    setActionLoadingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 p-8 text-slate-100 font-sans">
      
      {/* Top Welcome Title & Add System button */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/40 block mb-2 font-mono">OBVS REMOTE CONSOLE</span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif italic text-white/90 leading-none tracking-tighter">OBVS Remote Clusters</h1>
          <p className="text-xs text-white/50 mt-3 font-light tracking-wide max-w-2xl leading-relaxed">
            Established secure, encrypted SSH tunnels and RDP/VNC graphical desktops in a unified, high-contrast, editorial layout.
          </p>
        </div>
        <button
          onClick={onAddMachineClick}
          className="px-6 py-3 bg-indigo-600 hover:bg-white hover:text-black text-black text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 shrink-0 self-start lg:self-auto border border-white/10 shadow-lg text-white"
        >
          + Add Interface
        </button>
      </div>

      {/* Aggregated Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Total Machines */}
        <div className="bg-slate-950 p-6 border border-white/10 flex items-center justify-between hover:border-white/20 transition-all">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-semibold">Registry Hosts</span>
            <span className="text-4xl font-serif italic text-white mt-2 leading-none">{totalServers}</span>
            <span className="text-[10px] font-mono text-emerald-400 mt-2 font-medium">{onlineServers} actively connected</span>
          </div>
          <div className="w-11 h-11 bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
            <Server className="w-5 h-5" />
          </div>
        </div>

        {/* Global CPU Pool */}
        <div className="bg-slate-950 p-6 border border-white/10 flex items-center justify-between hover:border-white/20 transition-all">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-semibold">Average CPU Load</span>
            <span className="text-4xl font-serif italic text-white mt-2 leading-none">{avgCpu}%</span>
            <div className="w-24 bg-white/10 h-1 mt-3 overflow-hidden">
              <div style={{ width: `${avgCpu}%` }} className="bg-blue-500 h-full" />
            </div>
          </div>
          <div className="w-11 h-11 bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        {/* Global Memory Pools */}
        <div className="bg-slate-950 p-6 border border-white/10 flex items-center justify-between hover:border-white/20 transition-all">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-semibold">Memory Allocation</span>
            <span className="text-4xl font-serif italic text-white mt-2 leading-none">{avgRam}%</span>
            <div className="w-24 bg-white/10 h-1 mt-3 overflow-hidden">
              <div style={{ width: `${avgRam}%` }} className="bg-emerald-500 h-full" />
            </div>
          </div>
          <div className="w-11 h-11 bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Tunnel Network Bandwidth */}
        <div className="bg-slate-950 p-6 border border-white/10 flex items-center justify-between hover:border-white/20 transition-all">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-semibold">Tunnel Bandwidth</span>
            <span className="text-3xl font-serif italic text-white mt-2 leading-none">1.28 MB/s</span>
            <span className="text-[10px] text-indigo-400 font-mono mt-2 flex items-center gap-1 uppercase tracking-wider">
              <Network className="w-3 h-3 text-indigo-400" />
              Secure SSH-TLS Proxy
            </span>
          </div>
          <div className="w-11 h-11 bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
            <Network className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Active Alerts Banner */}
      {activeAlertsList.length > 0 && (
        <div className="bg-red-950/20 border border-red-500/30 p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-950 border border-red-500/50 text-red-400 shrink-0 animate-pulse rounded-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-red-400 font-mono flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                Active Infrastructure Alerts ({activeAlertsList.length})
              </h3>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-300 font-mono">
                {activeAlertsList.map((alert) => (
                  <span key={alert.machine.id} className="flex items-center gap-1.5 bg-red-950/50 border border-red-500/20 px-2 py-0.5 text-red-200">
                    <span className="text-white font-bold">[{alert.machine.name}]</span>
                    <span>
                      {alert.cpuExceeded ? `CPU: ${alert.cpuVal}% (Limit: ${alert.cpuLimit}%)` : ""}
                      {alert.cpuExceeded && alert.ramExceeded ? " / " : ""}
                      {alert.ramExceeded ? `RAM: ${alert.ramVal}% (Limit: ${alert.ramLimit}%)` : ""}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-[9px] uppercase font-mono tracking-widest text-red-400/60 bg-red-950/40 border border-red-500/20 px-2 py-1 rounded shrink-0">
            SECURE RECTIFIER SHIELD ACTIVE
          </div>
        </div>
      )}

      {/* Global Infrastructure Map View */}
      <GlobalMapView 
        machines={machines}
        onSelectMachine={onSelectMachine}
      />

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-950/50 p-4 border border-white/5 mb-6 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            {/* Filter by Department/Location Group */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Department/Location:</span>
              <div className="flex flex-wrap items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded">
                {groups.map((grp) => (
                  <button
                    key={grp}
                    onClick={() => setFilterGroup(grp)}
                    className={`px-3 py-1 rounded text-[11px] font-semibold capitalize transition ${
                      filterGroup === grp
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    {grp === "all" ? "All Groups" : grp}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Custom Tags */}
            {allTags.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Filter by Tag:</span>
                <div className="flex flex-wrap items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(tag)}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase transition flex items-center gap-1 ${
                        filterTag === tag
                          ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                          : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                      }`}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag === "all" ? "All Tags" : tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search input field */}
          <div className="relative w-full lg:w-72 self-start lg:self-auto">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search host, IP, tags, group..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Machine list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
        {filteredMachines.map((m) => {
          const isOnline = m.status === "online";
          const isRebooting = m.status === "rebooting";
          
          const currentCpu = getLiveCpu(m);
          const currentRam = getLiveRam(m);
          const cpuLimit = m.cpuAlertThreshold !== undefined ? m.cpuAlertThreshold : 80;
          const ramLimit = m.ramAlertThreshold !== undefined ? m.ramAlertThreshold : 85;
          
          const isCpuAlert = isOnline && currentCpu > cpuLimit;
          const isRamAlert = isOnline && currentRam > ramLimit;
          const hasAlert = isCpuAlert || isRamAlert;
          
          const isEditing = editingMachineId === m.id;
          
          return (
            <div
              key={m.id}
              className={`bg-[#0d0d0d] border flex flex-col p-6 transition-all duration-300 relative group rounded-xl ${
                hasAlert
                  ? "border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                  : isOnline 
                  ? "border-white/10 hover:border-white/25" 
                  : isRebooting 
                  ? "border-amber-500/30" 
                  : "border-white/5 opacity-50"
              }`}
            >
              {/* Header: OS, Name, Status dot */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-0.5 text-[9px] font-mono font-bold border uppercase tracking-wider ${getOsColor(m.os)}`}>
                    {m.os}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
                      {m.name}
                      {hasAlert && <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-bounce" />}
                    </h3>
                    <p className="text-[10px] font-mono text-white/40 mt-0.5">{m.ip}:{m.port}</p>
                  </div>
                </div>
                
                {/* Status indicator */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 border border-white/10 font-mono text-[9px] uppercase tracking-wider">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isOnline ? "bg-emerald-400 animate-pulse" : isRebooting ? "bg-amber-400 animate-spin" : "bg-red-400"
                    }`}></span>
                    <span className={
                      isOnline ? "text-emerald-400 font-bold" : isRebooting ? "text-amber-400 font-bold" : "text-red-400 font-bold"
                    }>
                      {m.status}
                    </span>
                  </div>
                  {isOnline && pings[m.id] !== undefined && (
                    <span className="text-[9px] font-mono text-white/40 flex items-center gap-1 uppercase tracking-widest">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        pings[m.id] < 45 ? "bg-emerald-400" : pings[m.id] < 100 ? "bg-amber-400" : "bg-rose-400"
                      }`} />
                      RTT: {pings[m.id]}ms
                    </span>
                  )}
                </div>
              </div>

              {/* Group & Tags Visual Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/20 border border-indigo-900/30 px-1.5 py-0.5 uppercase tracking-wider flex items-center gap-1 rounded">
                  <Folder className="w-2.5 h-2.5 text-indigo-400" /> {m.group}
                </span>
                {m.tags && m.tags.map((tag) => (
                  <span key={tag} className="text-[9px] font-mono text-slate-300 bg-white/5 border border-white/10 px-1.5 py-0.5 uppercase tracking-wider flex items-center gap-1 rounded">
                    <Tag className="w-2.5 h-2.5 text-slate-500" /> {tag}
                  </span>
                ))}
                {m.location && (
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 uppercase tracking-wider flex items-center gap-1 rounded" title={`Lat: ${m.location.lat.toFixed(4)}, Lng: ${m.location.lng.toFixed(4)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    {m.location.city}, {m.location.country}
                  </span>
                )}
              </div>

              {/* Protocol, Tunnel security labels */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider ${getProtocolBadge(m.protocol)}`}>
                  {m.protocol}
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-white/5 text-white/40 border border-white/10">
                  TUNNEL: TLS v1.3
                </span>
              </div>

              {/* Alert Indicator Bar */}
              {hasAlert && (
                <div className="bg-red-950/40 border border-red-500/30 p-2.5 mb-3 flex items-start gap-2 text-red-200 font-mono text-[9px] uppercase tracking-wider rounded">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-red-400">THRESHOLD BREACHED:</span>
                    {isCpuAlert && <p>• CPU ({currentCpu}%) exceeds threshold ({cpuLimit}%)</p>}
                    {isRamAlert && <p>• Memory ({currentRam}%) exceeds threshold ({ramLimit}%)</p>}
                  </div>
                </div>
              )}

              {/* Inline Editing Pane OR Metric Display */}
              {isEditing ? (
                <div className="bg-black/40 p-4 border border-indigo-500/30 flex flex-col gap-3 mb-5 flex-1 justify-center rounded">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-mono font-bold flex items-center gap-1.5">
                      <Sliders className="w-3 h-3" /> Node Configuration
                    </span>
                    <button onClick={() => setEditingMachineId(null)} className="text-white/40 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Category / Group */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Group (Department/Location)</label>
                    <input
                      type="text"
                      value={editGroup}
                      onChange={(e) => setEditGroup(e.target.value)}
                      className="bg-black border border-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="e.g. EU-West, Operations"
                    />
                  </div>

                  {/* Tags list */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Custom Tags</label>
                    <div className="flex flex-wrap gap-1 mb-1 bg-black/50 p-1 border border-white/5 min-h-[24px]">
                      {editTags.length > 0 ? (
                        editTags.map((t) => (
                          <span key={t} className="text-[8px] font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-900/40 px-1 py-0.5 uppercase tracking-wider flex items-center gap-1 rounded">
                            {t}
                            <button
                              type="button"
                              onClick={() => setEditTags(editTags.filter((tag) => tag !== t))}
                              className="text-red-400 hover:text-red-300 ml-1 font-bold font-sans text-xs"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-[9px] text-white/30 italic font-mono p-0.5">No tags</span>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={editTagsString}
                        onChange={(e) => setEditTagsString(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = editTagsString.trim();
                            if (val && !editTags.includes(val)) {
                              setEditTags([...editTags, val]);
                              setEditTagsString("");
                            }
                          }
                        }}
                        className="bg-black border border-white/10 px-2 py-1 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-mono flex-1"
                        placeholder="Tag + Enter"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = editTagsString.trim();
                          if (val && !editTags.includes(val)) {
                            setEditTags([...editTags, val]);
                            setEditTagsString("");
                          }
                        }}
                        className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 text-[9px] px-2 font-bold uppercase tracking-wider"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Alerts Threshold Settings */}
                  <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-2.5">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[8px] font-mono uppercase text-slate-400">
                        <span>CPU limit</span>
                        <span className="text-white font-bold">{editCpuLimit}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={editCpuLimit}
                        onChange={(e) => setEditCpuLimit(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 bg-white/5 h-1 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[8px] font-mono uppercase text-slate-400">
                        <span>RAM limit</span>
                        <span className="text-white font-bold">{editRamLimit}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={editRamLimit}
                        onChange={(e) => setEditRamLimit(parseInt(e.target.value))}
                        className="w-full accent-emerald-500 bg-white/5 h-1 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Geographical Location Coordinates */}
                  <div className="border-t border-white/5 pt-2.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-bold flex items-center gap-1">
                        <Network className="w-3 h-3 text-indigo-400" /> Geographical Location
                      </span>
                      {m.location?.isCustom && (
                        <span className="text-[7px] bg-indigo-500/10 text-indigo-300 px-1 py-0.5 rounded border border-indigo-500/20 font-mono uppercase">
                          Manual Override
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">City</label>
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="bg-black border border-white/10 px-2 py-0.5 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-mono rounded"
                          placeholder="e.g. Frankfurt"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Country</label>
                        <input
                          type="text"
                          value={editCountry}
                          onChange={(e) => setEditCountry(e.target.value)}
                          className="bg-black border border-white/10 px-2 py-0.5 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-mono rounded"
                          placeholder="e.g. Germany"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={editLat}
                          onChange={(e) => setEditLat(parseFloat(e.target.value) || 0)}
                          className="bg-black border border-white/10 px-2 py-0.5 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-mono rounded"
                          placeholder="e.g. 50.1109"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={editLng}
                          onChange={(e) => setEditLng(parseFloat(e.target.value) || 0)}
                          className="bg-black border border-white/10 px-2 py-0.5 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-mono rounded"
                          placeholder="e.g. 8.6821"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 border-t border-white/5 pt-2.5 mt-1">
                    <button
                      onClick={() => saveEditing(m.id)}
                      className="flex-1 bg-indigo-600 hover:bg-white hover:text-black text-white font-bold py-1 text-[9px] uppercase tracking-wider transition-colors border border-transparent rounded"
                    >
                      Save Configuration
                    </button>
                    <button
                      onClick={() => setEditingMachineId(null)}
                      className="bg-white/5 hover:bg-white/10 text-white font-bold py-1 px-2.5 text-[9px] uppercase tracking-wider transition-colors border border-white/10 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Server performance meters */
                <div className="bg-black/30 p-4 border border-white/5 flex flex-col gap-3 mb-5 flex-1 justify-center">
                  {/* CPU meter */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-white/40">
                      <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-white/30" /> CPU Allocation</span>
                      <span className={`font-bold ${isCpuAlert ? "text-red-400 animate-pulse" : "text-white"}`}>
                        {isOnline ? `${currentCpu}%` : "0%"}
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-[2px] overflow-hidden">
                      <div 
                        style={{ width: `${isOnline ? currentCpu : 0}%` }} 
                        className={`h-full ${isCpuAlert ? "bg-red-500 animate-pulse" : "bg-blue-500"}`} 
                      />
                    </div>
                  </div>

                  {/* RAM meter */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-white/40">
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-white/30" /> RAM Allocation</span>
                      <span className={`font-bold ${isRamAlert ? "text-red-400 animate-pulse" : "text-white"}`}>
                        {isOnline ? `${currentRam}%` : "0%"}
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-[2px] overflow-hidden">
                      <div 
                        style={{ width: `${isOnline ? currentRam : 0}%` }} 
                        className={`h-full ${isRamAlert ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} 
                      />
                    </div>
                  </div>

                  {/* Real-time Recharts Area Sparkline */}
                  {isOnline && metricsHistory[m.id] && (
                    <div className="h-14 w-full mt-1 bg-black/40 border border-white/5 p-1 rounded overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metricsHistory[m.id]} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <defs>
                            <linearGradient id={`colorCpu-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={isCpuAlert ? "#ef4444" : "#3b82f6"} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={isCpuAlert ? "#ef4444" : "#3b82f6"} stopOpacity={0.0}/>
                            </linearGradient>
                            <linearGradient id={`colorRam-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={isRamAlert ? "#ef4444" : "#10b981"} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={isRamAlert ? "#ef4444" : "#10b981"} stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="cpu" stroke={isCpuAlert ? "#ef4444" : "#3b82f6"} strokeWidth={1} fillOpacity={1} fill={`url(#colorCpu-${m.id})`} isAnimationActive={false} />
                          <Area type="monotone" dataKey="ram" stroke={isRamAlert ? "#ef4444" : "#10b981"} strokeWidth={1} fillOpacity={1} fill={`url(#colorRam-${m.id})`} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Uptime details */}
                  <div className="flex justify-between text-[9px] font-mono text-white/30 mt-1 border-t border-white/5 pt-2 uppercase tracking-widest">
                    <span>Uptime: {isOnline ? m.metrics.uptime : "offline"}</span>
                    <span>
                      RTT Ping:{" "}
                      {isOnline && pings[m.id] !== undefined ? (
                        <span className={`font-bold ${
                          pings[m.id] < 45 
                            ? "text-emerald-400" 
                            : pings[m.id] < 100 
                            ? "text-amber-400" 
                            : "text-rose-400"
                        }`}>
                          {pings[m.id]}ms
                        </span>
                      ) : (
                        <span className="text-red-400/60 font-bold uppercase">TIMEOUT</span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 mt-auto">
                {!isOnline ? (
                  <button
                    onClick={() => handleWakeOnLan(m.id, m.mac)}
                    disabled={actionLoadingId === m.id + "-wol" || m.status === "connecting"}
                    className="col-span-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/40 text-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg border border-transparent flex items-center justify-center gap-1.5"
                    title={`Send WoL Magic Packet to physical interface MAC ${m.mac || "N/A"}`}
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
                    {actionLoadingId === m.id + "-wol" || m.status === "connecting"
                      ? "Sending Packet..."
                      : "Wake-on-LAN (WoL)"}
                  </button>
                ) : (
                  <>
                    {/* Interactive VNC/RDP Desktop Simulator */}
                    <button
                      disabled={!isOnline}
                      onClick={() => onSelectMachine(m, "desktop")}
                      className={`py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        isOnline
                          ? "bg-indigo-600 hover:bg-white hover:text-black text-white shadow-lg border border-transparent"
                          : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                      }`}
                    >
                      Desktop GUI
                    </button>

                    {/* Secure Shell terminal console */}
                    <button
                      disabled={!isOnline}
                      onClick={() => onSelectMachine(m, "terminal")}
                      className={`py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        isOnline
                          ? "bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black"
                          : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                      }`}
                    >
                      SSH Terminal
                    </button>
                  </>
                )}
              </div>

              {/* Extra Utility Action Controls (Power actions / logs / settings) */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-[9px] uppercase tracking-wider text-white/40 font-mono font-bold">
                <button
                  onClick={() => handleFetchLogs(m.id)}
                  disabled={actionLoadingId === m.id + "-logs"}
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3 h-3 text-indigo-400" />
                  {actionLoadingId === m.id + "-logs" ? "Retrieving..." : "Read Logs"}
                </button>

                <button
                  onClick={() => startEditing(m)}
                  className="hover:text-indigo-400 text-slate-400 transition-colors flex items-center gap-1"
                  title="Configure department group, location, custom tags, or CPU/RAM threshold warnings"
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-400" />
                  Configure
                </button>

                <button
                  onClick={() => handleQuickReboot(m.id)}
                  disabled={actionLoadingId === m.id + "-reboot"}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  <ListRestart className="w-3 h-3 text-amber-500" />
                  {actionLoadingId === m.id + "-reboot" ? "Rebooting..." : "Power Cycle"}
                </button>
              </div>

            </div>
          );
        })}

        {/* Empty placeholder card to Add Host */}
        <div 
          onClick={onAddMachineClick}
          className="bg-transparent border border-dashed border-white/10 hover:border-white/30 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group"
        >
          <div className="w-10 h-10 bg-white/5 border border-white/10 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-white/40 transition-all mb-4 font-serif text-lg">
            +
          </div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white group-hover:text-indigo-400 transition-colors">Register Host</h4>
          <p className="text-[10px] text-white/40 max-w-[200px] mt-2 font-light leading-relaxed">
            Configure standard RDP ports, SSH tunnels or secure VNC nodes.
          </p>
        </div>
      </div>

      {/* IP based Network Scanner Panel */}
      <NetworkScanner onAddMachineDirect={onAddMachineDirect} />

      {/* Log Section - Side-by-Side Dual Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
        
        {/* Left Console: Gate Log Aggregator (Telemetries) */}
        <div className="bg-[#0c0c0c] border border-white/10 p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-white/50" />
              <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-white/60 font-sans">Gate Log Aggregator</h3>
            </div>
            <span className="text-[9px] font-mono tracking-widest uppercase text-white/30 bg-white/5 border border-white/10 px-2.5 py-0.5">
              SSL SHA-256 / STABLE
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto font-mono text-xs">
            {machines.flatMap((m) => m.logs.map((log) => ({ host: m.name, log }))).slice(-6).map((item, i) => (
              <div key={i} className="flex gap-4 p-2.5 bg-black/40 border border-white/5 hover:border-white/10 transition-all">
                <span className="text-[9px] bg-white/5 border border-white/10 text-white/50 px-2 py-0.5 font-bold shrink-0 self-start font-mono tracking-wide uppercase">
                  {item.host}
                </span>
                <span className="text-white/70 font-medium select-text tracking-wide">{item.log}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Console: Recent Activity Audit Trail (User Actions / Accountability) */}
        <div className="bg-[#0c0c0c] border border-white/10 p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-indigo-300 font-sans">Recent Activity Audit Trail</h3>
            </div>
            <span className="text-[9px] font-mono tracking-widest uppercase text-indigo-400/40 bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-0.5">
              ACCOUNTABILITY / AUDIT ACTIVE
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto font-mono text-[11px]">
            {activityLogs && activityLogs.length > 0 ? (
              activityLogs.slice(0, 10).map((log) => {
                const getStatusStyle = (status: string) => {
                  switch (status) {
                    case "success":
                      return "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
                    case "warning":
                      return "text-amber-400 border-amber-500/20 bg-amber-500/5";
                    case "error":
                      return "text-red-400 border-red-500/20 bg-red-500/5";
                    default:
                      return "text-blue-400 border-blue-500/20 bg-blue-500/5";
                  }
                };

                return (
                  <div key={log.id} className="flex flex-col gap-1.5 p-2.5 bg-black/30 border border-white/5 hover:border-indigo-500/20 transition-all rounded">
                    <div className="flex items-start gap-2.5">
                      <span className="text-[9px] text-white/30 font-mono mt-0.5 shrink-0">{log.timestamp}</span>
                      <div className="flex flex-col w-full">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 border font-mono tracking-wide uppercase ${getStatusStyle(log.status)}`}>
                              {log.action}
                            </span>
                            <span className="text-[10px] font-semibold text-white/90">
                              {log.target}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-white/50 mt-1 leading-relaxed">{log.details}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-white/30 italic">No console action trails compiled yet.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
