import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Server, 
  Terminal, 
  Cpu, 
  HardDrive, 
  Zap, 
  AlertTriangle, 
  BellRing, 
  Plus, 
  Trash2, 
  Play, 
  RotateCw, 
  X, 
  CheckCircle, 
  ShieldAlert, 
  TrendingUp, 
  Globe, 
  Settings,
  RefreshCw
} from "lucide-react";
import { RemoteMachine, SystemMetrics } from "../types";

interface MonitorAlert {
  id: string;
  machineId: string;
  machineName: string;
  metric: "cpu" | "ram" | "disk" | "offline";
  value: number | string;
  threshold: number | string;
  severity: "warning" | "critical";
  timestamp: string;
  silenced: boolean;
}

interface CustomProbe {
  id: string;
  name: string;
  type: "http" | "tcp" | "ping";
  target: string;
  status: "up" | "down" | "pending";
  latency: number;
  interval: number;
}

interface ProcessItem {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  mem: number;
  status: "running" | "sleeping" | "idle";
}

interface ServiceStatus {
  name: string;
  description: string;
  status: "active" | "inactive" | "failed";
  port?: number;
}

interface SystemMonitoringPanelProps {
  machines: RemoteMachine[];
}

export default function SystemMonitoringPanel({ machines }: SystemMonitoringPanelProps) {
  // 1. Selector states
  const [selectedMachineId, setSelectedMachineId] = useState<string>(
    machines[0]?.id || "global"
  );

  // 2. Alert states
  const [alerts, setAlerts] = useState<MonitorAlert[]>(() => {
    const saved = localStorage.getItem("obvs_monitor_alerts");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "alert-1",
        machineId: "mach-1",
        machineName: "ubuntu-prod-app-01",
        metric: "cpu",
        value: 89.4,
        threshold: 80,
        severity: "critical",
        timestamp: "10 mins ago",
        silenced: false
      },
      {
        id: "alert-2",
        machineId: "mach-2",
        machineName: "win-ad-controller",
        metric: "disk",
        value: 91.2,
        threshold: 90,
        severity: "critical",
        timestamp: "24 mins ago",
        silenced: false
      },
      {
        id: "alert-3",
        machineId: "mach-3",
        machineName: "edge-router-tokyo",
        metric: "ram",
        value: 78.5,
        threshold: 75,
        severity: "warning",
        timestamp: "1 hr ago",
        silenced: false
      }
    ];
  });

  // 3. Custom endpoint health checks state
  const [probes, setProbes] = useState<CustomProbe[]>(() => {
    const saved = localStorage.getItem("obvs_monitor_probes");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "probe-1",
        name: "Main App Frontend",
        type: "http",
        target: "https://obvs-infrastructure.net",
        status: "up",
        latency: 42,
        interval: 30
      },
      {
        id: "probe-2",
        name: "Gateway WireGuard",
        type: "ping",
        target: "10.200.0.1",
        status: "up",
        latency: 14,
        interval: 10
      },
      {
        id: "probe-3",
        name: "PostgreSQL Production Cluster",
        type: "tcp",
        target: "10.200.0.10:5432",
        status: "up",
        latency: 8,
        interval: 15
      }
    ];
  });

  // Add probe form
  const [showAddProbe, setShowAddProbe] = useState(false);
  const [newProbeName, setNewProbeName] = useState("");
  const [newProbeType, setNewProbeType] = useState<"http" | "tcp" | "ping">("http");
  const [newProbeTarget, setNewProbeTarget] = useState("");

  // Threshold edit modes
  const [cpuWarningThreshold, setCpuWarningThreshold] = useState<number>(80);
  const [ramWarningThreshold, setRamWarningThreshold] = useState<number>(85);
  const [showThresholdSettings, setShowThresholdSettings] = useState(false);

  // Selected machine running processes simulation state
  const [processes, setProcesses] = useState<Record<string, ProcessItem[]>>({});
  const [services, setServices] = useState<Record<string, ServiceStatus[]>>({});

  // SVG Chart history for multiple machines
  const [metricHistory, setMetricHistory] = useState<Record<string, { cpu: number[]; ram: number[] }>>({});

  // Console feed logs specific to monitoring
  const [monitorLogs, setMonitorLogs] = useState<string[]>([]);

  // Track state changes to local storage
  useEffect(() => {
    localStorage.setItem("obvs_monitor_alerts", JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem("obvs_monitor_probes", JSON.stringify(probes));
  }, [probes]);

  // Log message utility
  const addMonitorLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setMonitorLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 30));
  };

  // Generate processes & services list dynamically for each machine
  useEffect(() => {
    const defaultProcs: Record<string, ProcessItem[]> = {};
    const defaultServs: Record<string, ServiceStatus[]> = {};
    const initialHist: Record<string, { cpu: number[]; ram: number[] }> = {};

    machines.forEach(m => {
      // Processes
      defaultProcs[m.id] = [
        { pid: 1421, name: "systemd", user: "root", cpu: 0.1, mem: 0.4, status: "running" },
        { pid: 2194, name: "sshd: root@pts/0", user: "root", cpu: 1.2, mem: 1.8, status: "running" },
        { pid: 3821, name: "nginx: master process", user: "root", cpu: 0.4, mem: 2.1, status: "running" },
        { pid: 3822, name: "nginx: worker process", user: "www-data", cpu: 3.5, mem: 4.8, status: "running" },
        { pid: 4920, name: "node /app/server.ts", user: "node", cpu: m.metrics.cpu * 0.4, mem: m.metrics.ram * 0.3, status: "running" },
        { pid: 5120, name: "postgresql: writer", user: "postgres", cpu: 0.8, mem: m.metrics.ram * 0.15, status: "idle" },
        { pid: 5124, name: "postgresql: walwriter", user: "postgres", cpu: 0.2, mem: 0.9, status: "idle" },
        { pid: 6109, name: "docker-daemon", user: "root", cpu: 1.1, mem: 3.4, status: "sleeping" },
        { pid: 8219, name: "prometheus-exporter", user: "prometheus", cpu: 2.4, mem: 1.2, status: "running" },
      ];

      // Services
      defaultServs[m.id] = [
        { name: "sshd", description: "OpenSSH Secure Shell Daemon", status: "active", port: 22 },
        { name: "nginx", description: "High-Performance HTTP Web Server", status: "active", port: 80 },
        { name: "postgresql", description: "Object-Relational Database Server", status: m.os === "linux" ? "active" : "inactive", port: 5432 },
        { name: "docker", description: "Containerized Engine Runtime", status: "active" },
        { name: "redis", description: "In-Memory Key-Value Storage Cache", status: "inactive", port: 6379 }
      ];

      // Historic series
      initialHist[m.id] = {
        cpu: Array.from({ length: 15 }, () => Math.max(5, m.metrics.cpu + Math.floor(Math.random() * 20) - 10)),
        ram: Array.from({ length: 15 }, () => Math.max(10, m.metrics.ram + Math.floor(Math.random() * 10) - 5))
      };
    });

    setProcesses(defaultProcs);
    setServices(defaultServs);
    setMetricHistory(initialHist);
    addMonitorLog("Infrastructure Monitoring engine initialized. Metric streams active.");
  }, [machines]);

  // Simulated metrics and probe update tick
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Slightly update machine metric histories
      setMetricHistory(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          const current = next[id];
          if (current) {
            const lastCpu = current.cpu[current.cpu.length - 1] || 50;
            const lastRam = current.ram[current.ram.length - 1] || 50;
            
            // Random walk fluctuation
            const nextCpu = Math.min(100, Math.max(2, lastCpu + (Math.floor(Math.random() * 14) - 7)));
            const nextRam = Math.min(100, Math.max(5, lastRam + (Math.floor(Math.random() * 6) - 3)));

            next.id = {
              cpu: [...current.cpu.slice(1), nextCpu],
              ram: [...current.ram.slice(1), nextRam]
            };
          }
        });
        return next;
      });

      // 2. Fluctuuate active processes CPU/Mem dynamically
      setProcesses(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(mId => {
          next[mId] = next[mId].map(p => {
            if (p.status === "running") {
              const cpuVar = (Math.random() * 4) - 2;
              const newCpu = Math.max(0.1, parseFloat((p.cpu + cpuVar).toFixed(1)));
              return { ...p, cpu: newCpu };
            }
            return p;
          });
        });
        return next;
      });

      // 3. Update dynamic custom endpoint health probes latency/state
      setProbes(prev => {
        return prev.map(p => {
          // 95% success fluctuation
          const success = Math.random() > 0.05;
          const latencyVar = Math.floor(Math.random() * 10) - 5;
          const nextLat = Math.max(2, p.latency + latencyVar);
          return {
            ...p,
            status: success ? "up" : "down",
            latency: success ? nextLat : 0
          };
        });
      });

      // 4. Randomly trigger alert warnings or log info
      if (Math.random() < 0.15) {
        const onlineMachines = machines.filter(m => m.status === "online");
        if (onlineMachines.length > 0) {
          const target = onlineMachines[Math.floor(Math.random() * onlineMachines.length)];
          const metricType = Math.random() > 0.5 ? "cpu" : "ram";
          const currentVal = Math.floor(Math.random() * 25) + 75; // 75 - 100

          const threshold = metricType === "cpu" ? cpuWarningThreshold : ramWarningThreshold;
          if (currentVal > threshold) {
            const isCritical = currentVal > 90;
            const newAlert: MonitorAlert = {
              id: "alert-" + Date.now(),
              machineId: target.id,
              machineName: target.name,
              metric: metricType,
              value: currentVal,
              threshold: threshold,
              severity: isCritical ? "critical" : "warning",
              timestamp: "Just now",
              silenced: false
            };

            setAlerts(prev => [newAlert, ...prev].slice(0, 15));
            addMonitorLog(`[TRIGGERED] ${isCritical ? "CRITICAL" : "WARNING"} threshold breached on ${target.name}. ${metricType.toUpperCase()} reached ${currentVal}% (Limit: ${threshold}%).`);
          }
        }
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [machines, cpuWarningThreshold, ramWarningThreshold]);

  // Actions
  const handleSilenceAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, silenced: true } : a));
    addMonitorLog(`[ALERT] Alert ${id} muted by operator.`);
  };

  const handleResolveAlert = (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      setAlerts(prev => prev.filter(a => a.id !== id));
      addMonitorLog(`[ALERT] Alert of ${alert.metric.toUpperCase()} (${alert.value}%) on host '${alert.machineName}' resolved and cleared.`);
    }
  };

  const handleClearAllAlerts = () => {
    setAlerts([]);
    addMonitorLog("[ALERT] Active incident center flushed. All alerts acknowledged.");
  };

  const handleKillProcess = (machineId: string, pid: number, procName: string) => {
    setProcesses(prev => {
      if (!prev[machineId]) return prev;
      return {
        ...prev,
        [machineId]: prev[machineId].filter(p => p.pid !== pid)
      };
    });
    addMonitorLog(`[PROCESS] Successfully dispatched SIGKILL signal to process PID ${pid} [${procName}] on host ID ${machineId}.`);
  };

  const handleToggleService = (machineId: string, svcName: string) => {
    setServices(prev => {
      if (!prev[machineId]) return prev;
      return {
        ...prev,
        [machineId]: prev[machineId].map(s => {
          if (s.name === svcName) {
            const nextStatus = s.status === "active" ? "inactive" : "active";
            addMonitorLog(`[DAEMON] Service state change initiated: ${svcName} is now ${nextStatus.toUpperCase()} on target.`);
            return { ...s, status: nextStatus };
          }
          return s;
        })
      };
    });
  };

  const handleRestartService = (machineId: string, svcName: string) => {
    addMonitorLog(`[DAEMON] Issuing systemctl restart command for daemon '${svcName}' on machine...`);
    setServices(prev => {
      if (!prev[machineId]) return prev;
      return {
        ...prev,
        [machineId]: prev[machineId].map(s => {
          if (s.name === svcName) {
            return { ...s, status: "failed" }; // Temporary flicker
          }
          return s;
        })
      };
    });

    setTimeout(() => {
      setServices(prev => {
        if (!prev[machineId]) return prev;
        return {
          ...prev,
          [machineId]: prev[machineId].map(s => {
            if (s.name === svcName) {
              addMonitorLog(`[DAEMON] Service restart cycle complete. '${svcName}' is active and healthy.`);
              return { ...s, status: "active" };
            }
            return s;
          })
        };
      });
    }, 1200);
  };

  const handleAddProbeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProbeName.trim() || !newProbeTarget.trim()) return;

    const newProbe: CustomProbe = {
      id: "probe-" + Date.now(),
      name: newProbeName.trim(),
      type: newProbeType,
      target: newProbeTarget.trim(),
      status: "pending",
      latency: 0,
      interval: 15
    };

    setProbes(prev => [...prev, newProbe]);
    addMonitorLog(`[PROBE] Configured custom monitoring probe: ${newProbe.name} targeting ${newProbe.target}`);
    
    // Clear
    setNewProbeName("");
    setNewProbeTarget("");
    setShowAddProbe(false);

    // Dynamic latency check simulation immediately
    setTimeout(() => {
      setProbes(prev => prev.map(p => p.id === newProbe.id ? { ...p, status: "up", latency: Math.floor(Math.random() * 50) + 10 } : p));
      addMonitorLog(`[PROBE] Probe '${newProbe.name}' connected successfully on first evaluation loop.`);
    }, 1500);
  };

  const handleDeleteProbe = (id: string) => {
    const target = probes.find(p => p.id === id);
    if (target) {
      setProbes(prev => prev.filter(p => p.id !== id));
      addMonitorLog(`[PROBE] Deleted health probe check mapping: ${target.name}`);
    }
  };

  // Helper stats Calculations
  const onlineCount = machines.filter(m => m.status === "online").length;
  const criticalAlertCount = alerts.filter(a => a.severity === "critical" && !a.silenced).length;
  const warningAlertCount = alerts.filter(a => a.severity === "warning" && !a.silenced).length;

  const currentSelectedMachine = machines.find(m => m.id === selectedMachineId);
  const selectedProcs = processes[selectedMachineId] || [];
  const selectedServs = services[selectedMachineId] || [];
  const selectedHist = metricHistory[selectedMachineId] || { cpu: [30, 45, 52, 40], ram: [60, 62, 63, 61] };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 p-6 space-y-6">
      
      {/* Banner / Header */}
      <div className="bg-slate-900 border border-white/10 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-at-t from-red-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Activity className="w-48 h-48 text-indigo-500" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase font-mono text-indigo-400 font-bold tracking-[0.2em]">
              <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
              Dynamic Infrastructure Guard
            </div>
            <h1 className="text-2xl font-serif italic text-white leading-tight">
              Real-time Host Monitoring & Incident Manager
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Inspect active operating system tasks, supervise systemd service state, configure warning metrics thresholds, and deploy custom endpoint latency probes.
            </p>
          </div>

          <div className="flex gap-3 shrink-0">
            {/* Quick alert settings button */}
            <button
              onClick={() => setShowThresholdSettings(!showThresholdSettings)}
              className="px-4 py-2 border border-white/10 bg-black/40 hover:bg-black text-slate-300 hover:text-white rounded font-mono text-xs flex items-center gap-2 transition"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              Config Thresholds
            </button>

            {/* Quick probe creator */}
            <button
              onClick={() => setShowAddProbe(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs rounded flex items-center gap-2 transition font-bold uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" />
              New Probe Check
            </button>
          </div>
        </div>
      </div>

      {/* Threshold settings overlay modal block */}
      {showThresholdSettings && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 font-mono text-xs text-slate-300 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5 uppercase text-[10px]">
              <Settings className="w-4 h-4 text-indigo-400" /> Global Alarm Metric Threshold Settings
            </span>
            <button onClick={() => setShowThresholdSettings(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>CPU Alarm Limit (Warning)</span>
                <span className="text-indigo-400 font-bold">{cpuWarningThreshold}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                value={cpuWarningThreshold}
                onChange={(e) => {
                  setCpuWarningThreshold(parseInt(e.target.value));
                  addMonitorLog(`[ALARM] Adjusted CPU global warning threshold to ${e.target.value}%.`);
                }}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Generate warning event when any host experiences CPU usage higher than this value. CPU &gt; 92% is critical by default.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Memory Alarm Limit (Warning)</span>
                <span className="text-indigo-400 font-bold">{ramWarningThreshold}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                value={ramWarningThreshold}
                onChange={(e) => {
                  setRamWarningThreshold(parseInt(e.target.value));
                  addMonitorLog(`[ALARM] Adjusted Memory global warning threshold to ${e.target.value}%.`);
                }}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Generate warning event when system memory consumption surpasses this percent limit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global Status Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Node status summary */}
        <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 block mb-1">
              Cluster Node Health
            </span>
            <div className="text-2xl font-mono text-white font-bold">
              {onlineCount} <span className="text-xs text-slate-400">/ {machines.length} Online</span>
            </div>
            <div className="w-24 bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full transition-all duration-500" 
                style={{ width: `${(onlineCount / Math.max(1, machines.length)) * 100}%` }}
              />
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <Server className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Triggered Alarms count */}
        <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 block mb-1">
              Active Alerts Backlog
            </span>
            <div className="text-2xl font-mono font-bold flex items-baseline gap-1 text-red-400">
              {criticalAlertCount + warningAlertCount}
              <span className="text-xs text-slate-400 font-normal">Pending incident reports</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 mt-1 block">
              {criticalAlertCount} Critical • {warningAlertCount} Warning
            </span>
          </div>
          <div className={`p-3 rounded-lg border ${
            criticalAlertCount > 0 
              ? "bg-red-500/10 text-red-400 border-red-500/20 animate-bounce" 
              : "bg-slate-800 text-slate-400 border-white/10"
          }`}>
            <BellRing className="w-5 h-5" />
          </div>
        </div>

        {/* Custom Probes Healthy percentage */}
        <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 block mb-1">
              Live Probe Status
            </span>
            <div className="text-2xl font-mono text-white font-bold">
              {probes.filter(p => p.status === "up").length} <span className="text-xs text-slate-400">/ {probes.length} Operational</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 mt-1 block">
              Avg Latency: {Math.round(probes.reduce((sum, p) => sum + p.latency, 0) / Math.max(1, probes.length))} ms
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        {/* System Load average */}
        <div className="bg-slate-900/60 border border-white/5 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 block mb-1">
              Cluster Metric Average
            </span>
            <div className="text-2xl font-mono text-indigo-400 font-bold">
              {Math.round(machines.reduce((sum, m) => sum + m.metrics.cpu, 0) / Math.max(1, machines.length))}% <span className="text-xs text-slate-400">Aggregate CPU</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 mt-1 block">
              RAM Aggregate: {Math.round(machines.reduce((sum, m) => sum + m.metrics.ram, 0) / Math.max(1, machines.length))}%
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-lg text-white/60 border border-white/10">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Panel Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Alerts list & Custom Probes health explorer */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Active alerts panel */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-xs uppercase tracking-wider font-mono font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" /> Active System Alarms
              </h2>
              {alerts.length > 0 && (
                <button
                  onClick={handleClearAllAlerts}
                  className="text-[9px] font-mono text-slate-500 hover:text-white transition"
                >
                  Clear All
                </button>
              )}
            </div>

            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-black/20 rounded border border-white/5">
                <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                <span className="text-xs font-mono font-bold text-white">All Systems nominal</span>
                <span className="text-[9px] font-mono text-slate-500 mt-1">No metric alert thresholds breached.</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`bg-black/40 border p-3 rounded flex flex-col gap-1.5 transition relative group ${
                      alert.silenced 
                        ? "border-slate-800 opacity-60" 
                        : alert.severity === "critical" 
                          ? "border-red-500/40 bg-red-950/5" 
                          : "border-amber-500/40 bg-amber-950/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        alert.severity === "critical" ? "bg-red-500 animate-pulse" : "bg-amber-500"
                      }`} />
                      <span className="text-xs font-mono font-bold text-white uppercase tracking-tight">
                        {alert.metric.toUpperCase()} Breach
                      </span>
                      <span className={`text-[8px] font-mono px-1 py-0.5 rounded border uppercase ${
                        alert.severity === "critical" 
                          ? "bg-red-500/10 text-red-400 border-red-500/20" 
                          : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                      }`}>
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-[10px] font-mono text-slate-300">
                      Host <strong className="text-white">'{alert.machineName}'</strong> reports {alert.metric.toUpperCase()} of <span className="text-red-400 font-bold">{alert.value}%</span>, surpassing threshold ({alert.threshold}%).
                    </p>

                    <div className="flex justify-between items-center mt-1 pt-2 border-t border-white/5 text-[9px] font-mono text-slate-500">
                      <span>{alert.timestamp}</span>
                      <div className="flex gap-2">
                        {!alert.silenced && (
                          <button
                            onClick={() => handleSilenceAlert(alert.id)}
                            className="text-slate-400 hover:text-white transition"
                          >
                            Silence
                          </button>
                        )}
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="text-emerald-400 hover:text-emerald-300 font-bold transition"
                        >
                          Resolve →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Endpoint Custom Probes list */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-xs uppercase tracking-wider font-mono font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" /> Latency & Health Probes
              </h2>
              <span className="text-[9px] font-mono text-slate-400">{probes.length} Monitored</span>
            </div>

            {/* Health Probes List */}
            <div className="space-y-3 overflow-y-auto max-h-[300px]">
              {probes.map((probe) => (
                <div key={probe.id} className="bg-black/30 border border-white/5 p-3 rounded space-y-1.5 relative group">
                  <button
                    onClick={() => handleDeleteProbe(probe.id)}
                    className="absolute top-2.5 right-2.5 text-slate-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                    title="Remove probe mapping"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${probe.status === "up" ? "bg-emerald-400" : "bg-red-500 animate-pulse"}`} />
                      <span className="text-xs font-mono font-bold text-white">{probe.name}</span>
                    </div>
                    <span className="text-[8px] uppercase font-mono px-1 bg-slate-800 text-slate-400 rounded">
                      {probe.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="truncate pr-4 text-[9px] text-slate-500">{probe.target}</span>
                    <span className={`font-bold ${probe.status === "up" ? "text-emerald-400" : "text-red-400"}`}>
                      {probe.status === "up" ? `${probe.latency}ms` : "DOWN"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Probe Adding Form */}
            {showAddProbe && (
              <form onSubmit={handleAddProbeSubmit} className="bg-black/60 border border-indigo-500/20 p-4 rounded space-y-3 text-xs font-mono animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-300">New Diagnostic Probe</span>
                  <button type="button" onClick={() => setShowAddProbe(false)} className="text-slate-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-500 uppercase">Probe Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Postgres DB Ping"
                    value={newProbeName}
                    onChange={(e) => setNewProbeName(e.target.value)}
                    className="bg-black border border-white/10 rounded px-2 py-1 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 uppercase">Type</label>
                    <select
                      value={newProbeType}
                      onChange={(e) => setNewProbeType(e.target.value as any)}
                      className="bg-black border border-white/10 rounded px-2 py-1 text-white focus:outline-none"
                    >
                      <option value="http">HTTP Request</option>
                      <option value="tcp">TCP Socket Port</option>
                      <option value="ping">ICMP Ping</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 uppercase">Target Address / Endpoint</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 8.8.8.8 or URL"
                      value={newProbeTarget}
                      onChange={(e) => setNewProbeTarget(e.target.value)}
                      className="bg-black border border-white/10 rounded px-2 py-1 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 rounded uppercase text-[10px] transition-all"
                >
                  Create Endpoint Probe
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Right Columns: Core Inspector Panel */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Machine selector toolbar */}
          <div className="bg-slate-900/50 p-4 border border-white/5 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase font-mono tracking-wider font-bold text-slate-400">
                Target Node Inspector:
              </span>
              <select
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="bg-black border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.ip})
                  </option>
                ))}
              </select>
            </div>

            {currentSelectedMachine && (
              <span className="text-[10px] font-mono text-slate-500 hidden md:inline">
                Uptime: {currentSelectedMachine.metrics.uptime} • OS: <strong className="text-indigo-400 uppercase">{currentSelectedMachine.os}</strong>
              </span>
            )}
          </div>

          {currentSelectedMachine ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Process explorer card (htop / top simulator) */}
              <div className="bg-slate-900/60 border border-white/5 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-xs uppercase tracking-wider font-mono font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" /> Active processes (top task list)
                  </h3>
                  <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                    {selectedProcs.length} TASKS RUNNING
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px] font-mono">
                    <thead>
                      <tr className="text-slate-500 border-b border-white/5 pb-1.5 uppercase">
                        <th className="py-1">PID</th>
                        <th className="py-1">USER</th>
                        <th className="py-1 text-right">CPU%</th>
                        <th className="py-1 text-right">MEM%</th>
                        <th className="py-1 pl-4">COMMAND</th>
                        <th className="py-1 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedProcs.map((proc) => (
                        <tr key={proc.pid} className="hover:bg-white/5 group">
                          <td className="py-1.5 text-slate-400 font-bold">{proc.pid}</td>
                          <td className="py-1.5 text-indigo-300">{proc.user}</td>
                          <td className="py-1.5 text-right font-bold text-emerald-400">{proc.cpu}%</td>
                          <td className="py-1.5 text-right text-slate-300">{proc.mem}%</td>
                          <td className="py-1.5 pl-4 truncate max-w-[120px]" title={proc.name}>
                            {proc.name}
                          </td>
                          <td className="py-1.5 text-right">
                            <button
                              onClick={() => handleKillProcess(selectedMachineId, proc.pid, proc.name)}
                              className="text-[9px] font-mono text-slate-500 hover:text-red-400 font-bold transition px-1 py-0.5 bg-black rounded border border-white/5"
                            >
                              SIGKILL
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Service Control Center (systemd supervisor) */}
              <div className="bg-slate-900/60 border border-white/5 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="text-xs uppercase tracking-wider font-mono font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-400" /> systemd Daemon Services Manager
                  </h3>
                  <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                    SERVICES MANAGEMENT
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedServs.map((svc) => (
                    <div key={svc.name} className="bg-black/40 border border-white/5 p-3 rounded flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            svc.status === "active" 
                              ? "bg-emerald-400" 
                              : svc.status === "failed" 
                                ? "bg-red-500 animate-pulse" 
                                : "bg-slate-600"
                          }`} />
                          <span className="text-xs font-mono font-bold text-white">
                            {svc.name}.service
                          </span>
                          {svc.port && (
                            <span className="text-[8px] text-slate-500 font-mono">
                              PORT: {svc.port}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] font-mono text-slate-400">
                          {svc.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle active / inactive */}
                        <button
                          onClick={() => handleToggleService(selectedMachineId, svc.name)}
                          className={`p-1 bg-white/5 border border-white/10 rounded hover:text-white transition text-[9px] font-mono ${
                            svc.status === "active" ? "text-amber-400" : "text-emerald-400"
                          }`}
                          title={svc.status === "active" ? "Stop daemon" : "Start daemon"}
                        >
                          {svc.status === "active" ? "STOP" : "START"}
                        </button>
                        
                        {/* Restart service */}
                        <button
                          onClick={() => handleRestartService(selectedMachineId, svc.name)}
                          className="p-1 bg-white/5 border border-white/10 rounded text-slate-400 hover:text-white transition"
                          title="Restart daemon service"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Row - Metric Graph visual feedback */}
              <div className="md:col-span-2 bg-slate-900/40 border border-white/5 p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-400" /> Historic Performance Trends
                  </span>
                  <div className="flex items-center gap-3 text-[9px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400" /> CPU Usage %</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Memory Usage %</span>
                  </div>
                </div>

                <div className="h-28 w-full mt-2 relative flex items-end">
                  <svg className="w-full h-full">
                    {/* Horizontal grid guide lines */}
                    <line x1="0" y1="20" x2="100%" y2="20" stroke="rgba(255, 255, 255, 0.03)" strokeWidth={1} />
                    <line x1="0" y1="50" x2="100%" y2="50" stroke="rgba(255, 255, 255, 0.03)" strokeWidth={1} />
                    <line x1="0" y1="80" x2="100%" y2="80" stroke="rgba(255, 255, 255, 0.03)" strokeWidth={1} />
                    
                    {/* SVG Paths for historic trend evaluation */}
                    {selectedHist.cpu && selectedHist.cpu.length > 1 && (
                      <>
                        {/* CPU Path */}
                        <path
                          d={selectedHist.cpu.map((val, idx) => {
                            const x = (idx / (selectedHist.cpu.length - 1)) * 100;
                            const y = 100 - (val / 100) * 80;
                            return `${idx === 0 ? 'M' : 'L'} ${x}% ${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth={2}
                          className="transition-all duration-300"
                        />
                        
                        {/* Memory Path */}
                        <path
                          d={selectedHist.ram.map((val, idx) => {
                            const x = (idx / (selectedHist.ram.length - 1)) * 100;
                            const y = 100 - (val / 100) * 80;
                            return `${idx === 0 ? 'M' : 'L'} ${x}% ${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth={2}
                          className="transition-all duration-300"
                        />
                      </>
                    )}
                  </svg>
                </div>
              </div>

            </div>
          ) : (
            <p className="text-xs font-mono text-center text-slate-500 py-12">
              Select or register a remote host node to inspect system metrics and execute diagnostics.
            </p>
          )}

          {/* Infrastructure Monitoring Log output */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Diagnostics & Incident logs pipeline
              </span>
              <button
                onClick={() => setMonitorLogs([])}
                className="text-[9px] font-mono text-slate-500 hover:text-white transition"
              >
                Clear Logs
              </button>
            </div>

            <div className="bg-black/90 border border-white/5 p-4 rounded text-[9px] font-mono text-slate-400 h-36 overflow-y-auto space-y-1.5 leading-normal select-text">
              {monitorLogs.length === 0 ? (
                <div className="text-slate-600 italic text-center py-6">Diagnostics system quiet. Scanning hosts...</div>
              ) : (
                monitorLogs.map((log, idx) => (
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
