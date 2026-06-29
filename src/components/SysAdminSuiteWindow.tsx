import React, { useState, useEffect } from "react";
import { RemoteMachine } from "../types";
import {
  Monitor,
  Terminal,
  Cpu,
  Globe,
  FileDown,
  Users,
  Play,
  Settings,
  X,
  Server,
  Activity,
  HardDrive,
  Check,
  Power,
  RefreshCw,
  Search,
  Sliders,
  PlayCircle,
  FileCode,
  Shield,
  HelpCircle,
  Clock,
  Eye,
  AlertTriangle,
  UserCheck,
  FolderOpen,
  ArrowRightLeft,
  Settings2,
  Trash2,
  Save,
  Plus,
  Lock,
  Unlock,
  Key,
  Workflow,
  FileJson,
  Share2,
  Copy,
  Folder,
  EyeOff
} from "lucide-react";

interface SysAdminSuiteWindowProps {
  machine: RemoteMachine;
  onClose: () => void;
  onRunAction: (action: string, target?: string) => Promise<string>;
}

// 1. Initial State Definitions for SysAdmin tool details
interface VirtualMachine {
  id: string;
  name: string;
  platform: "VMware" | "Hyper-V";
  status: "Running" | "Stopped" | "Suspended";
  cpu: number;
  ram: string;
  host: string;
}

interface WindowsService {
  name: string;
  displayName: string;
  status: "Running" | "Stopped" | "Pending";
  startupType: "Automatic" | "Manual" | "Disabled";
  description: string;
}

interface WindowsProcess {
  pid: number;
  name: string;
  cpu: number;
  mem: string;
  user: string;
  description: string;
}

interface EventLog {
  id: number;
  time: string;
  source: string;
  category: string;
  severity: "Error" | "Warning" | "Information";
  eventId: number;
  message: string;
}

interface TerminalSession {
  sessionId: number;
  username: string;
  clientName: string;
  state: "Active" | "Disconnected" | "Listen";
  idleTime: string;
  logonTime: string;
}

export default function SysAdminSuiteWindow({
  machine,
  onClose,
  onRunAction
}: SysAdminSuiteWindowProps) {
  // Navigation sidebar within the admin suite
  const [activeTab, setActiveTab] = useState<string>("rdp-vnc");

  // RDP / VNC / TeamViewer State
  const [rdpEngine, setRdpEngine] = useState<"Microsoft" | "FreeRDP">("Microsoft");
  const [vncEngine, setVncEngine] = useState<"TightVNC" | "UltraVNC">("TightVNC");
  const [vncPort, setVncPort] = useState<string>("5900");
  const [vncEncoding, setVncEncoding] = useState<string>("Hextile");
  const [teamViewerId, setTeamViewerId] = useState<string>("804 361 292");
  const [teamViewerPassword, setTeamViewerPassword] = useState<string>("••••••••");
  const [teamViewerStatus, setTeamViewerStatus] = useState<string>("Ready to connect");

  // SSH / Telnet State
  const [termEngine, setTermEngine] = useState<"Rebex" | "PuTTY">("PuTTY");
  const [termProtocol, setTermProtocol] = useState<"SSH" | "Telnet">("SSH");
  const [termHistory, setTermHistory] = useState<string[]>([
    "Connecting via PuTTY Secure Terminal client v0.80...",
    "Using Rebex.net cryptographic negotiation socket layers.",
    "Authorized with Secure Core vault keys successfully."
  ]);
  const [termInput, setTermInput] = useState<string>("");

  // File Transfer State (FTP/SFTP/SCP)
  const [ftpProtocol, setFtpProtocol] = useState<"SFTP" | "FTP" | "SCP">("SFTP");
  const [ftpEngine, setFtpEngine] = useState<string>("Rebex SFTP Client Core");
  const [remoteFiles, setRemoteFiles] = useState<string[]>([
    "C:\\sys_admin\\system32_patch.msi",
    "C:\\sys_admin\\nginx.conf",
    "C:\\sys_admin\\auth_backup.sql",
    "C:\\sys_admin\\credentials_vault.key"
  ]);
  const [localFiles, setLocalFiles] = useState<string[]>([
    "D:\\dev\\workspace_dump.zip",
    "D:\\dev\\PowerShell_Script_Patch.ps1",
    "D:\\dev\\win11_rdp_profile.rdp"
  ]);
  const [transferLogs, setTransferLogs] = useState<string[]>([
    "SFTP Session Opened.",
    "Ready for Drag and Drop file synchronizations."
  ]);

  // Web Browser State
  const [browserEngine, setBrowserEngine] = useState<"IE" | "Chrome">("Chrome");
  const [browserUrl, setBrowserUrl] = useState<string>("http://192.168.10.135/admin-console");
  const [browserHtmlContent, setBrowserHtmlContent] = useState<string>("IIS Windows Server Default Administration Portal");

  // VMware / Hyper-V VMs
  const [vms, setVms] = useState<VirtualMachine[]>([
    { id: "vm-1", name: "win-active-directory-dc01", platform: "VMware", status: "Running", cpu: 12, ram: "8 GB", host: "esxi-node-01.obvs.local" },
    { id: "vm-2", name: "win-sql-db-prod", platform: "VMware", status: "Running", cpu: 45, ram: "16 GB", host: "esxi-node-01.obvs.local" },
    { id: "vm-3", name: "linux-nginx-gateway-01", platform: "VMware", status: "Running", cpu: 5, ram: "4 GB", host: "esxi-node-02.obvs.local" },
    { id: "vm-4", name: "win-iis-legacy-app", platform: "Hyper-V", status: "Stopped", cpu: 0, ram: "4 GB", host: "hyperv-cluster-01" },
    { id: "vm-5", name: "test-win11-sandbox", platform: "Hyper-V", status: "Suspended", cpu: 0, ram: "4 GB", host: "hyperv-cluster-01" }
  ]);
  const [selectedVm, setSelectedVm] = useState<string>("vm-1");

  // Windows Services
  const [services, setServices] = useState<WindowsService[]>([
    { name: "wuauserv", displayName: "Windows Update", status: "Running", startupType: "Automatic", description: "Enables the detection, download, and installation of updates for Windows." },
    { name: "TermService", displayName: "Remote Desktop Services", status: "Running", startupType: "Automatic", description: "Allows users to connect interactively to a remote computer." },
    { name: "NginxSecure", displayName: "NGINX Secure Gateway", status: "Running", startupType: "Automatic", description: "Custom reverse proxy for virtual desktop session redirection." },
    { name: "Dhcp", displayName: "DHCP Client", status: "Running", startupType: "Automatic", description: "Registers and updates IP addresses and DNS records for this computer." },
    { name: "Spooler", displayName: "Print Spooler", status: "Stopped", startupType: "Manual", description: "Manages print jobs and handles interaction with the printer." },
    { name: "WinRM", displayName: "Windows Remote Management", status: "Running", startupType: "Automatic", description: "Implements WS-Management protocol for secure remote operations." },
    { name: "MSSQLSERVER", displayName: "SQL Server (PROD)", status: "Stopped", startupType: "Manual", description: "Provides storage, processing, and security of SQL databases." }
  ]);
  const [serviceSearch, setServiceSearch] = useState<string>("");

  // Windows Processes (Task Manager)
  const [processes, setProcesses] = useState<WindowsProcess[]>([
    { pid: 4, name: "System", cpu: 0.8, mem: "152 MB", user: "SYSTEM", description: "Windows NT Kernel System Process" },
    { pid: 1024, name: "lsass.exe", cpu: 1.2, mem: "48 MB", user: "SYSTEM", description: "Local Security Authority Subsystem" },
    { pid: 3404, name: "nginx.exe", cpu: 3.4, mem: "124 MB", user: "administrator", description: "NGINX reverse proxy worker" },
    { pid: 5690, name: "sqlservr.exe", cpu: 8.5, mem: "1024 MB", user: "SYSTEM", description: "SQL Database Server Daemon" },
    { pid: 7412, name: "powershell.exe", cpu: 15.0, mem: "84 MB", user: "OBVS\\administrator", description: "Interactive PowerShell Console" },
    { pid: 8900, name: "rdpclip.exe", cpu: 0.1, mem: "18 MB", user: "OBVS\\administrator", description: "RDP Clipboard Monitor utility" },
    { pid: 9022, name: "vncserver.exe", cpu: 4.8, mem: "62 MB", user: "SYSTEM", description: "TightVNC remote frame controller" },
    { pid: 12210, name: "chrome.exe", cpu: 18.2, mem: "412 MB", user: "OBVS\\administrator", description: "Chrome web admin view console" }
  ]);
  const [processSearch, setProcessSearch] = useState<string>("");

  // Windows Events (Event Viewer)
  const [events, setEvents] = useState<EventLog[]>([
    { id: 1, time: "23:54:12", source: "Security", category: "Audit Success", severity: "Information", eventId: 4624, message: "An account was successfully logged on. Account Name: OBVS\\administrator, Logon Type: 10 (RemoteInteractive/RDP)." },
    { id: 2, time: "23:51:05", source: "Application", category: "Database Error", severity: "Error", eventId: 18456, message: "Login failed for user 'sa'. Reason: Password did not match that for the login provided. [CLIENT: 192.168.10.88]" },
    { id: 3, time: "23:49:55", source: "System", category: "VpnTunnel", severity: "Warning", eventId: 7036, message: "The VPN tunnel keepalive ping experienced packet drop (12% loss). Resynchronizing keys." },
    { id: 4, time: "23:45:00", source: "Application", category: "NginxReverse", severity: "Information", eventId: 100, message: "Configuration reloaded successfully. Zero downtime graceful restart completed." },
    { id: 5, time: "23:40:12", source: "Security", category: "Audit Failure", severity: "Error", eventId: 4625, message: "An account failed to log on. Account Name: invalid_user, Logon Type: 3 (Network). Source IP: 185.220.101.4" },
    { id: 6, time: "23:30:19", source: "System", category: "DiskHealth", severity: "Warning", eventId: 2022, message: "Disk volume C: is exceeding 85% recommended space warning thresholds. Cleanup suggested." }
  ]);
  const [eventSearch, setEventSearch] = useState<string>("");
  const [eventSeverityFilter, setEventSeverityFilter] = useState<string>("All");

  // Terminal Services Sessions
  const [termSessions, setTermSessions] = useState<TerminalSession[]>([
    { sessionId: 0, username: "SYSTEM", clientName: "Console", state: "Active", idleTime: "00:00:00", logonTime: "2026-06-25 08:00" },
    { sessionId: 1, username: "OBVS\\administrator", clientName: "WORKSTATION-01", state: "Active", idleTime: "00:01:15", logonTime: "2026-06-28 19:34" },
    { sessionId: 2, username: "home_operator", clientName: "REMOTE-LAPTOP", state: "Disconnected", idleTime: "03:14:10", logonTime: "2026-06-28 15:10" },
    { sessionId: 3, username: "guest_audit", clientName: "AUDIT-DESK", state: "Listen", idleTime: "00:45:00", logonTime: "2026-06-28 21:00" }
  ]);

  // PowerShell Scripts
  const [selectedPsScript, setSelectedPsScript] = useState<string>("get-services");
  const [psCustomScript, setPsCustomScript] = useState<string>("");
  const [psLogs, setPsLogs] = useState<string[]>([
    "PowerShell v7.4.2 Core Engine initialized.",
    "Ready to execute administrative script pipelines."
  ]);

  // Realtime Performance Monitoring counters
  const [cpuHist, setCpuHist] = useState<number[]>([15, 18, 14, 22, 19, 25, 18, 14, 15, 20]);
  const [ramHist, setRamHist] = useState<number[]>([52, 53, 53, 54, 54, 54, 53, 53, 54, 54]);
  const [netHist, setNetHist] = useState<number[]>([45, 60, 52, 70, 85, 95, 60, 55, 45, 50]);

  // External Applications integration
  const [externalApps, setExternalApps] = useState([
    { id: "wireshark", name: "Wireshark Packet Analyzer", cmd: "wireshark.exe -i \"SecureTunnel_v4\"", description: "Starts packet sniffing on virtual tunnel adapter" },
    { id: "nmap", name: "Nmap Port Scanner CLI", cmd: "nmap -sS -O 192.168.10.0/24", description: "Performs stealth SYN scans of local network segments" },
    { id: "notepad", name: "Notepad++ Log Reader", cmd: "notepad++.exe \"C:\\nginx\\logs\\access.log\"", description: "Launches advanced file editor with syntax highlight" }
  ]);
  const [newAppName, setNewAppName] = useState("");
  const [newAppCmd, setNewAppCmd] = useState("");
  const [newAppDesc, setNewAppDesc] = useState("");

  // --- ROYAL TS EXPLICIT FEATURES STATES ---

  // 1. Credentials Management
  const [credentials, setCredentials] = useState([
    { id: "cred-1", name: "Domain Admin Credentials", username: "administrator", secret: "P@ssw0rd2026!", isEncrypted: true, folderInherited: "Active Directory Controllers", inheritMode: true },
    { id: "cred-2", name: "SQL DB SA Credentials", username: "sa_admin", secret: "SqlStrongSecret77", isEncrypted: true, folderInherited: "Production Databases", inheritMode: true },
    { id: "cred-3", name: "Network Cisco Level 15", username: "enable_priv", secret: "C1scoTunn3lSec!", isEncrypted: true, folderInherited: "Core Gateways", inheritMode: false }
  ]);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [docEncrypted, setDocEncrypted] = useState(true);
  const [docLocked, setDocLocked] = useState(false);
  const [docPassword, setDocPassword] = useState("royal123");
  const [docPasswordInput, setDocPasswordInput] = useState("");
  const [newCredName, setNewCredName] = useState("");
  const [newCredUser, setNewCredUser] = useState("");
  const [newCredSecret, setNewCredSecret] = useState("");
  const [selectedInheritFolder, setSelectedInheritFolder] = useState("Production Databases");

  // 2. Powerful Task Automation (Tasks & Sequences)
  const [automationTasks, setAutomationTasks] = useState([
    { id: "task-1", type: "command", name: "Audit Ping Connection Gateway", command: "ping $IP$ -n 4 -w 1000", description: "Built-in command task to verify remote routing path" },
    { id: "task-2", type: "command", name: "Secure Trace Route Analysis", command: "tracert -d $IP$", description: "Diagnostic route tracking with DNS mapping bypassed" },
    { id: "task-3", type: "keysequence", name: "Update Server Package Logs", keys: "sudo apt update && sudo apt upgrade -y{ENTER}", description: "Invokes keyboard sequence macro on active connection" },
    { id: "task-4", type: "keysequence", name: "PowerShell Service Flush", keys: "Restart-Service TermService -Force; Get-Service TermService{ENTER}", description: "Flush remote desktop service layers" }
  ]);
  const [activeTaskTarget, setActiveTaskTarget] = useState("Current Machine");
  const [taskExecutionLog, setTaskExecutionLog] = useState<string[]>([]);
  const [isExecutingTask, setIsExecutingTask] = useState(false);
  const [customTaskName, setCustomTaskName] = useState("");
  const [customTaskType, setCustomTaskType] = useState<"command" | "keysequence">("command");
  const [customTaskPayload, setCustomTaskPayload] = useState("");

  // 3. Secure Gateway Tunnel Configuration
  const [gatewayEnabled, setGatewayEnabled] = useState(true);
  const [gatewayStatus, setGatewayStatus] = useState<"Connected" | "Disconnected" | "Connecting">("Connected");
  const [gatewayHost, setGatewayHost] = useState("royal-gateway.obvs.local");
  const [gatewayPort, setGatewayPort] = useState("2222");
  const [gatewayUser, setGatewayUser] = useState("tunnel_admin");
  const [gatewayLogs, setGatewayLogs] = useState<string[]>([
    "Gateway Service initialized.",
    "SSH-based port forwarding tunnel created on dynamic standard 127.0.0.1 binding.",
    "Tightly integrated port redirects registered: RDP (3389) -> 127.0.0.1:49152, VNC (5900) -> 127.0.0.1:49153",
    "Royal Server authenticated via active TLS 1.3 cryptographic handshakes."
  ]);
  const [portForwards, setPortForwards] = useState([
    { name: "Integrated RDP Direct Tunnel", localPort: "49152", remotePort: "3389", status: "Active" },
    { name: "Integrated VNC Frame Buffer Tunnel", localPort: "49153", remotePort: "5900", status: "Active" },
    { name: "Integrated SSH Shell Bridge", localPort: "49154", remotePort: "22", status: "Listening" }
  ]);

  // 4. Dynamic Folder & RoyalJSON Import
  const [dynamicFolders, setDynamicFolders] = useState([
    { name: "Dynamic SQL Infrastructure", source: "https://api.obvs.local/v1/sql-servers", lastUpdated: "2026-06-29 00:01:10", autoRefresh: true },
    { name: "Dynamic DMZ Web Servers", source: "https://api.obvs.local/v1/dmz-web", lastUpdated: "Never", autoRefresh: false }
  ]);
  const [royalJsonInput, setRoyalJsonInput] = useState(
`{
  "CustomDocument": {
    "Name": "Imported Royal Document",
    "Folders": [
      {
        "Name": "SQL Server Farm",
        "Connections": [
          {"Name": "mssql-prod-01", "IP": "192.168.10.150", "Port": 1433, "Protocol": "rdp"},
          {"Name": "mssql-stage-02", "IP": "192.168.10.151", "Port": 1433, "Protocol": "rdp"}
        ]
      }
    ],
    "Credentials": [
      {"Name": "Dynamic SA User", "Username": "sa_imported", "SecretQuery": "keyvault://sa_prod"}
    ]
  }
}`
  );
  const [importedElements, setImportedElements] = useState<any>(null);
  const [dynamicCredWebhook, setDynamicCredWebhook] = useState("https://keyvault.obvs.local/api/v2/retrieve-secret");

  // Simulate real-time updates for Performance and Events
  useEffect(() => {
    const timer = setInterval(() => {
      // performance counters simulation
      setCpuHist(prev => {
        const next = [...prev.slice(1)];
        const variance = Math.floor(Math.random() * 12) - 6;
        next.push(Math.max(5, Math.min(95, machine.metrics.cpu + variance)));
        return next;
      });
      setNetHist(prev => {
        const next = [...prev.slice(1)];
        const variance = Math.floor(Math.random() * 20) - 10;
        next.push(Math.max(10, Math.min(250, machine.metrics.networkIn + variance)));
        return next;
      });
      // process memory fluctuations
      setProcesses(prev => prev.map(p => {
        if (p.name === "powershell.exe" || p.name === "sqlservr.exe") {
          const varCpu = parseFloat((Math.random() * 4 - 2).toFixed(1));
          return {
            ...p,
            cpu: Math.max(0.1, parseFloat((p.cpu + varCpu).toFixed(1)))
          };
        }
        return p;
      }));
    }, 2000);

    return () => clearInterval(timer);
  }, [machine.metrics.cpu, machine.metrics.networkIn]);

  // Handle VMs state triggers
  const toggleVmPower = (vmId: string) => {
    setVms(prev => prev.map(vm => {
      if (vm.id === vmId) {
        const newStatus = vm.status === "Running" ? "Stopped" : "Running";
        return {
          ...vm,
          status: newStatus,
          cpu: newStatus === "Running" ? 15 : 0
        };
      }
      return vm;
    }));
  };

  // Handle Windows Service triggers
  const toggleService = (srvName: string) => {
    setServices(prev => prev.map(srv => {
      if (srv.name === srvName) {
        return {
          ...srv,
          status: srv.status === "Running" ? "Stopped" : "Running"
        };
      }
      return srv;
    }));
  };

  // Handle Task Kill
  const killProcess = (pid: number) => {
    const target = processes.find(p => p.pid === pid);
    if (!target) return;
    if (confirm(`Are you sure you want to forcibly terminate process ${target.name} (PID: ${pid})?`)) {
      setProcesses(prev => prev.filter(p => p.pid !== pid));
    }
  };

  // Run simulated PowerShell scripts
  const runPowerShellScript = () => {
    setPsLogs(prev => [...prev, `PS C:\\Users\\administrator> Running script: ${selectedPsScript}...`]);
    setTimeout(() => {
      let output = "";
      switch (selectedPsScript) {
        case "get-services":
          output = `Name          Status   DisplayName\n----          ------   -----------\nwuauserv      Running  Windows Update\nTermService   Running  Remote Desktop Services\nNginxSecure   Running  NGINX Secure Gateway\nSpooler       Stopped  Print Spooler`;
          break;
        case "audit-vpn":
          output = `INTEGRATION GATEWAY TUNNEL REPORT:\nTunnel Adapter : SecureTunnel_v4 [Active]\nEncryption : AES-256-GCM / DH Group 14\nGateway Address : 10.100.1.254\nVPN Client Status : Successfully Negotiated.`;
          break;
        case "check-event-logs":
          output = `EVENT AUDIT LOGS SUMMARY (Last 10 minutes):\nTotal Errors: 2\nTotal Warnings: 2\nTotal Information: 18\nSystem Status: Healthy with mild resource alert thresholds.`;
          break;
        default:
          output = psCustomScript ? `Custom Pipeline executed: Output Code 0 (Success).\nReturned payload: ${psCustomScript.slice(0, 40)}...` : "Empty command context pipeline.";
      }
      setPsLogs(prev => [...prev, output, "Command complete. Pipeline freed."]);
    }, 1000);
  };

  // Run Terminal commands
  const handleTermSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termInput.trim()) return;
    const cmd = termInput.trim();
    setTermHistory(prev => [...prev, `$ ${cmd}`]);
    setTermInput("");

    setTimeout(() => {
      let out = "";
      if (cmd.toLowerCase().startsWith("ssh ") || cmd.toLowerCase().startsWith("telnet ")) {
        out = `Negotiating handshake on socket. Protocol: ${termProtocol}, Client Core: ${termEngine}. Tunnel established.`;
      } else if (cmd.toLowerCase() === "help") {
        out = "PuTTY / Rebex terminal utilities support 'ping', 'whoami', 'reboot', 'exit', 'netstat', and raw protocols.";
      } else {
        out = `Executed remotely: command '${cmd}' returned with secure response tunnel.`;
      }
      setTermHistory(prev => [...prev, out]);
    }, 400);
  };

  // File Upload Transfer Action
  const uploadLocalFile = (fileName: string) => {
    setTransferLogs(prev => [...prev, `File transfer initiated: '${fileName}' from LOCAL to REMOTE [${ftpProtocol}]`]);
    setTimeout(() => {
      setRemoteFiles(prev => {
        if (prev.includes(`C:\\sys_admin\\${fileName}`)) return prev;
        return [...prev, `C:\\sys_admin\\${fileName}`];
      });
      setTransferLogs(prev => [...prev, `Success: '${fileName}' transferred securely using ${ftpEngine}.`]);
    }, 1500);
  };

  // Add External Application definition
  const handleAddExternalApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName || !newAppCmd) return;
    const newApp = {
      id: "ext-" + Date.now(),
      name: newAppName,
      cmd: newAppCmd,
      description: newAppDesc || "User-configured external helper tool"
    };
    setExternalApps(prev => [...prev, newApp]);
    setNewAppName("");
    setNewAppCmd("");
    setNewAppDesc("");
    alert(`External tool '${newApp.name}' registered to Workspace system config successfully.`);
  };

  return (
    <div className="absolute inset-4 top-10 bg-slate-950/95 rounded-xl border border-slate-800 text-slate-100 flex flex-col shadow-2xl overflow-hidden z-50">
      
      {/* Title Bar */}
      <div className="bg-[#181822] h-12 px-4 flex justify-between items-center border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white shadow">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-sans tracking-wide">REMOTE SYSTEM OPERATIONS SUITE</h2>
            <p className="text-[9px] font-mono text-indigo-400">Integrated Support Console & Hypervisors (RDP/PuTTY/Rebex/VMware/Hyper-V)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 border border-indigo-500/20 rounded font-mono uppercase">
            Active: {machine.name}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition bg-slate-900 hover:bg-red-500 p-1.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Operations Sidebar Navigation */}
        <div className="w-56 bg-slate-950 border-r border-slate-900 p-3 flex flex-col gap-1 select-none overflow-y-auto shrink-0">
          <span className="text-[9px] font-bold text-slate-500 px-2 uppercase tracking-wider mb-1">PROTOCOLS & CLIENTS</span>
          
          <button
            onClick={() => setActiveTab("rdp-vnc")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "rdp-vnc" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>RDP, VNC & TeamViewer</span>
          </button>

          <button
            onClick={() => setActiveTab("ssh-telnet")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "ssh-telnet" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>SSH & Telnet (PuTTY)</span>
          </button>

          <button
            onClick={() => setActiveTab("file-transfer")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "file-transfer" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>SFTP, FTP & SCP Clients</span>
          </button>

          <button
            onClick={() => setActiveTab("web-console")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "web-console" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web Console Engines</span>
          </button>

          <span className="text-[9px] font-bold text-slate-500 px-2 uppercase tracking-wider mt-4 mb-1">HYPERVISORS & WORKLOADS</span>

          <button
            onClick={() => setActiveTab("virtualization")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "virtualization" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>VMware & Hyper-V Manager</span>
          </button>

          <span className="text-[9px] font-bold text-slate-500 px-2 uppercase tracking-wider mt-4 mb-1">WINDOWS REMOTING CONTROLS</span>

          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "services" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Services (Start/Stop)</span>
          </button>

          <button
            onClick={() => setActiveTab("processes")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "processes" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Processes (Task Kill)</span>
          </button>

          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "events" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Windows Event Logs</span>
          </button>

          <button
            onClick={() => setActiveTab("powershell")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "powershell" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>PowerShell Script Engine</span>
          </button>

          <button
            onClick={() => setActiveTab("terminal-services")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "terminal-services" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Terminal Services Sessions</span>
          </button>

          <span className="text-[9px] font-bold text-slate-500 px-2 uppercase tracking-wider mt-4 mb-1">METRICS & TOOLS</span>

          <button
            onClick={() => setActiveTab("perf-mon")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "perf-mon" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Performance Monitors</span>
          </button>

          <button
            onClick={() => setActiveTab("external-tools")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "external-tools" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>External Applications</span>
          </button>

          <span className="text-[9px] font-bold text-indigo-400 px-2 uppercase tracking-wider mt-4 mb-1 border-t border-slate-900 pt-3">ROYAL TS SECURE SUITE</span>

          <button
            onClick={() => setActiveTab("royal-credentials")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "royal-credentials" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Credentials & Folder Vault</span>
          </button>

          <button
            onClick={() => setActiveTab("royal-automation")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "royal-automation" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Workflow className="w-3.5 h-3.5 text-purple-400" />
            <span>Task & Sequence Automation</span>
          </button>

          <button
            onClick={() => setActiveTab("royal-gateway")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "royal-gateway" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure SSH Gateway</span>
          </button>

          <button
            onClick={() => setActiveTab("royal-dynamic")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs text-left transition ${
              activeTab === "royal-dynamic" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <FileJson className="w-3.5 h-3.5 text-sky-400" />
            <span>Dynamic Folders & JSON</span>
          </button>
        </div>

        {/* Dynamic Tab Body */}
        <div className="flex-1 bg-slate-900 p-5 overflow-y-auto">
          
          {/* TAB 1: RDP / VNC / TEAMVIEWER CLIENTS */}
          {activeTab === "rdp-vnc" && (
            <div className="flex flex-col gap-6 font-sans">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-1">
                  <Monitor className="w-4 h-4 text-sky-400" />
                  <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">Remote Desktop Protocl (RDP) Config</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  RDP connects directly to Windows remote servers. Toggle engines below to run optimization flags.
                </p>
                <div className="flex gap-4 items-center bg-slate-950 p-3 rounded border border-slate-900">
                  <span className="text-[11px] text-slate-400">RDP Engine:</span>
                  <div className="flex gap-2">
                    {["Microsoft", "FreeRDP"].map((eng) => (
                      <button
                        key={eng}
                        onClick={() => setRdpEngine(eng as any)}
                        className={`px-3 py-1 text-[11px] font-semibold rounded border transition ${
                          rdpEngine === eng
                            ? "bg-sky-600 border-sky-500 text-white shadow-md"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {eng === "Microsoft" ? "Microsoft RDP API" : "FreeRDP Client Engine"}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 ml-auto font-mono">Status: Connected to {machine.ip}</span>
                </div>
              </div>

              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-1">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">VNC Connection (TightVNC / UltraVNC)</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  VNC uses direct frame buffers to support multi-platform operating systems like Linux X11 and macOS.
                </p>
                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded border border-slate-900 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-24">VNC Engine:</span>
                    <select
                      value={vncEngine}
                      onChange={(e) => setVncEngine(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded"
                    >
                      <option value="TightVNC">TightVNC Core (v2.8.2)</option>
                      <option value="UltraVNC">UltraVNC Legacy (v1.4.3)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-24">VNC Server Port:</span>
                    <input
                      type="text"
                      value={vncPort}
                      onChange={(e) => setVncPort(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded font-mono w-20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-24">Color Encoding:</span>
                    <select
                      value={vncEncoding}
                      onChange={(e) => setVncEncoding(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded"
                    >
                      <option>Hextile (Default compression)</option>
                      <option>Tight JPEG (Lossy high speed)</option>
                      <option>ZRLE (Lossless high resolution)</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center justify-end font-mono">
                    ● Frame buffer active (60 FPS)
                  </span>
                </div>
              </div>

              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-1">
                  <Monitor className="w-4 h-4 text-purple-400" />
                  <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">TeamViewer Integration Session</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Remote control assistant for immediate diagnostic handshakes. Intercept credentials natively.
                </p>
                <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded border border-slate-900 text-[11px] items-center">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 text-[9px] uppercase">Partner ID</span>
                    <input
                      type="text"
                      value={teamViewerId}
                      onChange={(e) => setTeamViewerId(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 text-[9px] uppercase">Partner Password</span>
                    <input
                      type="password"
                      value={teamViewerPassword}
                      onChange={(e) => setTeamViewerPassword(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2 pt-3.5">
                    <button
                      onClick={() => {
                        setTeamViewerStatus("Connecting...");
                        setTimeout(() => setTeamViewerStatus("Connected to TeamViewer Session!"), 1200);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-1.5 px-3 rounded transition text-center"
                    >
                      Connect Session
                    </button>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-purple-400 animate-pulse mt-1 pl-1">
                  Current Status: {teamViewerStatus}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SSH & TELNET TERMINALS */}
          {activeTab === "ssh-telnet" && (
            <div className="flex flex-col gap-4 font-sans h-full">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-3 shrink-0">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-green-400" />
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">Rebex.net / PuTTY Secure Terminal Client</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">PuTTY Core v0.80</span>
                </div>
                
                <div className="flex gap-6 text-[11px] items-center bg-slate-950 p-3 rounded border border-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Client Engine:</span>
                    <div className="flex rounded border border-slate-800 overflow-hidden font-mono text-[10px]">
                      {["PuTTY", "Rebex"].map((eng) => (
                        <button
                          key={eng}
                          onClick={() => setTermEngine(eng as any)}
                          className={`px-2.5 py-1 transition ${
                            termEngine === eng ? "bg-slate-800 text-emerald-400 font-bold" : "bg-slate-900 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {eng}.NET Engine
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Protocol:</span>
                    <div className="flex rounded border border-slate-800 overflow-hidden font-mono text-[10px]">
                      {["SSH", "Telnet"].map((prot) => (
                        <button
                          key={prot}
                          onClick={() => setTermProtocol(prot as any)}
                          className={`px-2.5 py-1 transition ${
                            termProtocol === prot ? "bg-slate-800 text-emerald-400 font-bold" : "bg-slate-900 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {prot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <span className="text-[10px] text-emerald-400 font-mono ml-auto">
                    ● Encrypted RSA-4096 Secure Session
                  </span>
                </div>
              </div>

              {/* SSH Terminal console stream */}
              <div className="flex-1 bg-black rounded-lg border border-slate-800 p-4 font-mono text-xs text-slate-200 flex flex-col h-[280px]">
                <div className="flex-1 overflow-y-auto flex flex-col gap-1 mb-2">
                  {termHistory.map((line, idx) => (
                    <div key={idx} className="whitespace-pre-wrap text-slate-300">
                      {line}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleTermSubmit} className="flex items-center gap-2 border-t border-slate-900 pt-3">
                  <span className="text-emerald-500 font-bold">PuTTY@{machine.ip}$</span>
                  <input
                    type="text"
                    value={termInput}
                    onChange={(e) => setTermInput(e.target.value)}
                    placeholder="Type console command (e.g., 'help', 'netstat -an', 'reboot')..."
                    className="flex-1 bg-transparent border-none outline-none text-white font-mono text-xs focus:ring-0 p-0"
                  />
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: FILE TRANSFER (FTP/SFTP/SCP) */}
          {activeTab === "file-transfer" && (
            <div className="flex flex-col gap-4 font-sans">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-amber-400" />
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">SFTP / FTP / SCP Remote File Synchronizer</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Rebex SFTP Core Engine</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Securely upload and download system payloads, patches and configuration backups. Select protocol:
                </p>

                <div className="flex gap-4 items-center bg-slate-950 p-2.5 rounded border border-slate-900 text-[11px]">
                  <span className="text-slate-400 font-mono">Connection Protocol:</span>
                  <div className="flex gap-1.5 font-mono text-[10px]">
                    {["SFTP", "FTP", "SCP"].map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setFtpProtocol(p as any);
                          setFtpEngine(p === "SFTP" ? "Rebex SFTP Client Core" : p === "FTP" ? "FluentFTP Client" : "SCP Secure Pipeline");
                        }}
                        className={`px-3 py-1 rounded transition border ${
                          ftpProtocol === p ? "bg-amber-600 border-amber-500 text-white font-bold" : "bg-slate-900 border-slate-800 text-slate-400"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-amber-500 font-mono ml-auto">Active Engine: {ftpEngine}</span>
                </div>
              </div>

              {/* Two Panel File Browser Mock */}
              <div className="grid grid-cols-2 gap-4">
                {/* Local Files list */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col">
                  <h4 className="font-mono text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5 mb-2.5 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span>Local Workspace (D:\dev\)</span>
                  </h4>
                  <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                    {localFiles.map((f, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-1.5 rounded hover:bg-slate-900 bg-slate-900/30">
                        <span className="font-mono text-slate-300 truncate w-32">{f.split("\\").pop()}</span>
                        <button
                          onClick={() => uploadLocalFile(f.split("\\").pop() || "")}
                          className="bg-amber-600/20 hover:bg-amber-600 border border-amber-500/30 hover:border-amber-500 text-amber-300 hover:text-white px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition"
                        >
                          Transfer →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remote Files list */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col">
                  <h4 className="font-mono text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5 mb-2.5 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-amber-500" />
                    <span>Remote Target (C:\sys_admin\)</span>
                  </h4>
                  <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                    {remoteFiles.map((f, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-1.5 rounded bg-slate-900/30 hover:bg-slate-900">
                        <span className="font-mono text-slate-300 truncate w-40">{f.split("\\").pop()}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Sync Active</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transfer logs console */}
              <div className="bg-black border border-slate-800 rounded p-3 font-mono text-[11px] text-slate-400 h-[80px] overflow-y-auto flex flex-col gap-0.5">
                <span className="text-slate-500 font-semibold uppercase text-[9px] mb-1">PAYLOAD TRANSFER AUDIT LOGS:</span>
                {transferLogs.map((log, idx) => (
                  <div key={idx} className="text-slate-300">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: WEB CONSOLE ENGINES */}
          {activeTab === "web-console" && (
            <div className="flex flex-col gap-4 font-sans">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">Local Web Console - WebAdmin Tool</h3>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">Chrome/IE Compatibility</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-[11px] bg-slate-950 p-3 rounded border border-slate-900 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Browser Engine:</span>
                    <div className="flex rounded border border-slate-800 overflow-hidden text-[10px] font-mono">
                      {["Chrome", "IE"].map((eng) => (
                        <button
                          key={eng}
                          onClick={() => {
                            setBrowserEngine(eng as any);
                            setBrowserUrl(eng === "Chrome" ? "http://192.168.10.135/admin-console" : "http://192.168.10.135/legacy-iis-webadmin");
                            setBrowserHtmlContent(eng === "Chrome" ? "Admin Console: Active Web Session (Google Chrome Mode)" : "Internet Explorer ActiveX Service Redirection Portal");
                          }}
                          className={`px-3 py-1 transition ${
                            browserEngine === eng ? "bg-indigo-600 text-white font-bold" : "bg-slate-900 text-slate-400"
                          }`}
                        >
                          {eng === "Chrome" ? "Chromium Engine" : "Internet Explorer API"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800 font-mono text-[10px]">
                    <span className="text-slate-500">Address:</span>
                    <span className="text-slate-300 truncate">{browserUrl}</span>
                  </div>
                </div>
              </div>

              {/* Browser active simulation iframe-like portal */}
              <div className="bg-white rounded-lg border border-slate-300 shadow overflow-hidden h-[240px] flex flex-col text-slate-800">
                {/* Browser top UI */}
                <div className="bg-[#f0f0f0] border-b border-[#ccc] px-3 py-1.5 flex items-center gap-2 text-xs">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 bg-white border border-[#ccc] rounded px-2.5 py-0.5 text-[10px] text-slate-500 select-all font-mono">
                    {browserUrl}
                  </div>
                  <button className="text-[10px] font-mono text-indigo-600 font-semibold px-2 hover:underline">Go</button>
                </div>

                {/* Simulated Content */}
                <div className="flex-1 bg-slate-100 p-5 font-sans flex flex-col gap-4">
                  <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-4 flex flex-col gap-1">
                    <span className="text-[10px] text-indigo-600 uppercase font-bold tracking-wide">Connected Upstream Portal</span>
                    <h3 className="text-base font-semibold text-slate-800">{browserHtmlContent}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Reverse Proxy Upstream Server configuration is fully active. Undergoing security handshake audit.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border p-3 rounded text-center">
                      <span className="text-[9px] text-slate-400 uppercase font-bold">IIS App Pool</span>
                      <div className="text-emerald-600 text-xs font-bold mt-0.5">● Active</div>
                    </div>
                    <div className="bg-white border p-3 rounded text-center">
                      <span className="text-[9px] text-slate-400 uppercase font-bold">Active Connections</span>
                      <div className="text-indigo-600 text-xs font-bold mt-0.5">14 active</div>
                    </div>
                    <div className="bg-white border p-3 rounded text-center">
                      <span className="text-[9px] text-slate-400 uppercase font-bold">SSL Certificate</span>
                      <div className="text-slate-600 text-[10px] font-mono mt-0.5">SHA-256 Valid</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VMWARE & HYPER-V MANAGER */}
          {activeTab === "virtualization" && (
            <div className="flex flex-col gap-4 font-sans">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-2 shrink-0">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-sky-400" />
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">VMware vCenter & Hyper-V Cluster Manager</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Cluster Status: Synchronized</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Connect to and manage ESXi nodes, power cycle Hyper-V instances, and monitor hypervisor CPU resources directly from this admin tunnel.
                </p>
              </div>

              {/* Virtual Machines control layout */}
              <div className="grid grid-cols-3 gap-4">
                
                {/* List of VMs */}
                <div className="col-span-2 bg-slate-950 rounded-lg border border-slate-800 p-3.5 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-900 pb-1.5 mb-1 flex items-center justify-between">
                    <span>Virtual Machines instances</span>
                    <span className="font-mono text-[9px] text-indigo-400">Total: {vms.length}</span>
                  </span>

                  <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
                    {vms.map((vm) => (
                      <button
                        key={vm.id}
                        onClick={() => setSelectedVm(vm.id)}
                        className={`p-2 rounded text-left border flex justify-between items-center transition ${
                          selectedVm === vm.id
                            ? "bg-slate-900 border-indigo-500/50 text-white"
                            : "bg-slate-950/40 border-slate-900 text-slate-400 hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs font-semibold text-slate-200 truncate w-44">{vm.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Platform: {vm.platform} | Host: {vm.host}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                            vm.status === "Running" ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" : vm.status === "Suspended" ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20" : "bg-red-400/10 text-red-400 border border-red-400/20"
                          }`}>
                            {vm.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected VM Details & Power operations */}
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-3.5 flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-900 pb-1.5 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span>VM Hypervisor Actions</span>
                  </span>

                  {(() => {
                    const activeVm = vms.find(v => v.id === selectedVm);
                    if (!activeVm) return <div className="text-xs text-slate-500">Select a virtual machine.</div>;

                    return (
                      <div className="flex flex-col gap-3 flex-1">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] text-slate-400">Target instance:</span>
                          <span className="font-mono text-xs font-semibold text-slate-200 break-all">{activeVm.name}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-slate-900 pt-3">
                          <div className="bg-slate-900/40 p-2 rounded border border-slate-900">
                            <span className="text-slate-500 block">CPU cores</span>
                            <span className="text-slate-200 text-xs font-semibold">{activeVm.status === "Running" ? `${activeVm.cpu}% load` : "0% (Offline)"}</span>
                          </div>
                          <div className="bg-slate-900/40 p-2 rounded border border-slate-900">
                            <span className="text-slate-500 block">RAM size</span>
                            <span className="text-slate-200 text-xs font-semibold">{activeVm.ram}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-auto border-t border-slate-900 pt-3.5">
                          <button
                            onClick={() => toggleVmPower(activeVm.id)}
                            className={`w-full font-semibold py-2 px-3 rounded text-xs transition flex items-center justify-center gap-1.5 ${
                              activeVm.status === "Running"
                                ? "bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/30"
                                : "bg-emerald-600/20 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/30"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{activeVm.status === "Running" ? "Forcibly Shut Down VM" : "Power On Instance"}</span>
                          </button>

                          <button
                            onClick={() => {
                              alert(`Performing virtualization snapshot backup on host ${activeVm.host} for instance ${activeVm.name}...`);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 py-1.5 px-3 rounded text-[11px] font-medium border border-slate-800 transition"
                          >
                            Trigger Snapshot Backup
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WINDOWS SERVICES */}
          {activeTab === "services" && (
            <div className="flex flex-col gap-4 font-sans">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">Windows Service Control Manager</h3>
                    <p className="text-[11px] text-slate-400">Start, stop and restart services remotely. Ensure TermService remains active.</p>
                  </div>
                </div>
                
                {/* Search services input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 rounded text-xs font-mono text-slate-200 w-48 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Service list table */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[9px] tracking-wider font-mono">
                      <th className="py-2.5 px-3">Service Name</th>
                      <th className="py-2.5 px-3">Display Name</th>
                      <th className="py-2.5 px-3">Startup Type</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services
                      .filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()) || s.displayName.toLowerCase().includes(serviceSearch.toLowerCase()))
                      .map((srv) => (
                        <tr key={srv.name} className="border-b border-slate-900/60 hover:bg-slate-900/30">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-400 font-semibold">{srv.name}</td>
                          <td className="py-2.5 px-3 text-slate-300 text-[11px]">{srv.displayName}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] font-mono">{srv.startupType}</td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                              srv.status === "Running" ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                            }`}>
                              ● {srv.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => toggleService(srv.name)}
                                className={`px-2 py-0.5 text-[10px] rounded font-semibold transition ${
                                  srv.status === "Running"
                                    ? "bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white"
                                    : "bg-emerald-600/20 hover:bg-emerald-600 text-emerald-200 hover:text-white"
                                }`}
                              >
                                {srv.status === "Running" ? "Stop" : "Start"}
                              </button>
                              <button
                                onClick={() => {
                                  alert(`Sending SIGTERM restart request for system service '${srv.name}'...`);
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 px-2 py-0.5 rounded text-[10px] transition"
                              >
                                Restart
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: WINDOWS PROCESSES (TASK MANAGER) */}
          {activeTab === "processes" && (
            <div className="flex flex-col gap-4 font-sans">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <div>
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">Active Windows Process Monitor</h3>
                    <p className="text-[11px] text-slate-400">Task Manager telemetry listing active threads. Kill process triggers signal terminate.</p>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search processes..."
                    value={processSearch}
                    onChange={(e) => setProcessSearch(e.target.value)}
                    className="bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 rounded text-xs font-mono text-slate-200 w-48 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Processes list */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[9px] tracking-wider font-mono">
                      <th className="py-2.5 px-3">PID</th>
                      <th className="py-2.5 px-3">Process Name</th>
                      <th className="py-2.5 px-3">CPU Usage</th>
                      <th className="py-2.5 px-3">Private Memory</th>
                      <th className="py-2.5 px-3">Logon User</th>
                      <th className="py-2.5 px-3 text-right">Terminate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes
                      .filter(p => p.name.toLowerCase().includes(processSearch.toLowerCase()))
                      .map((p) => (
                        <tr key={p.pid} className="border-b border-slate-900/60 hover:bg-slate-900/30">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{p.pid}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-200 font-semibold">{p.name}</td>
                          <td className="py-2.5 px-3 text-sky-400 text-[11px] font-mono font-medium">{p.cpu}%</td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px] font-mono">{p.mem}</td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px] font-medium">{p.user}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => killProcess(p.pid)}
                              className="text-red-400 hover:text-white bg-red-950/20 hover:bg-red-600 border border-red-900/30 hover:border-red-500 px-2.5 py-0.5 rounded text-[10px] font-semibold transition"
                            >
                              Kill Process
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: WINDOWS EVENT LOGS */}
          {activeTab === "events" && (
            <div className="flex flex-col gap-4 font-sans">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-3 shrink-0">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    <div>
                      <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">Windows Event Log Analyzer</h3>
                      <p className="text-[11px] text-slate-400">Search and filter critical Security, Application, and System event telemetry logs.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">EventViewer Service Active</span>
                </div>

                {/* Event filtration controls */}
                <div className="flex gap-3 text-xs">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search event messages..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 rounded text-xs font-mono text-slate-200 w-full focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Severity:</span>
                    <select
                      value={eventSeverityFilter}
                      onChange={(e) => setEventSeverityFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1.5 rounded font-mono text-[11px]"
                    >
                      <option value="All">All Severities</option>
                      <option value="Error">Errors Only</option>
                      <option value="Warning">Warnings Only</option>
                      <option value="Information">Information Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Event Logs table view */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[9px] tracking-wider font-mono">
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Source</th>
                      <th className="py-2.5 px-3">Event ID</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events
                      .filter(ev => {
                        const matchText = ev.message.toLowerCase().includes(eventSearch.toLowerCase()) || ev.category.toLowerCase().includes(eventSearch.toLowerCase());
                        const matchSev = eventSeverityFilter === "All" || ev.severity === eventSeverityFilter;
                        return matchText && matchSev;
                      })
                      .map((ev) => (
                        <tr key={ev.id} className="border-b border-slate-900/60 hover:bg-slate-900/30">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{ev.time}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-400">{ev.source}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{ev.eventId}</td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-semibold ${
                              ev.severity === "Error" ? "bg-red-500/15 text-red-400 border border-red-500/20" : ev.severity === "Warning" ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20" : "bg-sky-500/15 text-sky-400 border border-sky-500/20"
                            }`}>
                              {ev.severity}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 text-[11px] truncate max-w-sm" title={ev.message}>{ev.message}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: POWERSHELL ENGINE */}
          {activeTab === "powershell" && (
            <div className="flex flex-col gap-4 font-sans h-full">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-3 shrink-0">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-sky-400" />
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">PowerShell Core v7 Script Engine</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Ready</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-slate-500 text-[9px] uppercase">Select Admin script preset</span>
                    <select
                      value={selectedPsScript}
                      onChange={(e) => setSelectedPsScript(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1.5 rounded font-mono text-[11px]"
                    >
                      <option value="get-services">Get-Service Status (Process Watch)</option>
                      <option value="audit-vpn">Audit-GatewayTunnelConfiguration</option>
                      <option value="check-event-logs">Get-EventLogSummary -Severity Error</option>
                      <option value="custom">Custom Script execution pipeline...</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={runPowerShellScript}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-1.5 px-4 rounded text-xs transition flex items-center justify-center gap-1.5 w-full"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Execute Script Pipeline</span>
                    </button>
                  </div>
                </div>

                {selectedPsScript === "custom" && (
                  <div className="flex flex-col gap-1 text-xs animate-in slide-in-from-top-1 duration-150">
                    <span className="text-slate-500 text-[9px] uppercase">Custom Cmdlet Pipeline</span>
                    <input
                      type="text"
                      placeholder="e.g., Get-Process | Where-Object {$_.CPU -gt 10} | Format-Table"
                      value={psCustomScript}
                      onChange={(e) => setPsCustomScript(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-1.5 rounded font-mono text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                )}
              </div>

              {/* Console logs */}
              <div className="flex-1 bg-black rounded-lg border border-slate-800 p-4 font-mono text-xs text-slate-300 flex flex-col h-[200px] overflow-y-auto gap-1">
                {psLogs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap">
                    {log.startsWith("PS C:\\") ? (
                      <span className="text-sky-400">{log}</span>
                    ) : log.includes("Error") ? (
                      <span className="text-red-400">{log}</span>
                    ) : (
                      <span className="text-slate-200">{log}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: TERMINAL SERVICES SESSIONS */}
          {activeTab === "terminal-services" && (
            <div className="flex flex-col gap-4 font-sans">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-2 shrink-0">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">Terminal Services Session Manager</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">RDS Core Services</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  View and manage concurrent active user sessions connected to this machine. Shadowing a session allows interactive diagnostic support.
                </p>
              </div>

              {/* Session list table */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[9px] tracking-wider font-mono">
                      <th className="py-2.5 px-3">Session ID</th>
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Client Host</th>
                      <th className="py-2.5 px-3">State</th>
                      <th className="py-2.5 px-3">Idle Time</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {termSessions.map((sess) => (
                      <tr key={sess.sessionId} className="border-b border-slate-900/60 hover:bg-slate-900/30">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">ID: {sess.sessionId}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-200 font-semibold">{sess.username}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px] font-mono">{sess.clientName}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                            sess.state === "Active" ? "bg-emerald-400/10 text-emerald-400" : sess.state === "Disconnected" ? "bg-yellow-400/10 text-yellow-400" : "bg-slate-400/10 text-slate-400"
                          }`}>
                            ● {sess.state}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px] font-mono">{sess.idleTime}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => {
                                alert(`Shadowing session ID ${sess.sessionId} (${sess.username}). Handshake in progress...`);
                              }}
                              className="text-indigo-400 hover:text-white bg-indigo-950/20 hover:bg-indigo-600 border border-indigo-900/30 hover:border-indigo-500 px-2 py-0.5 rounded text-[10px] font-semibold transition"
                            >
                              Shadow
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Log off terminal user ${sess.username} (Session ${sess.sessionId})?`)) {
                                  setTermSessions(prev => prev.filter(s => s.sessionId !== sess.sessionId));
                                }
                              }}
                              className="text-red-400 hover:text-white bg-red-950/20 hover:bg-red-600 border border-red-900/30 hover:border-red-500 px-2 py-0.5 rounded text-[10px] font-semibold transition"
                            >
                              Log Off
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 11: PERFORMANCE MONITORS */}
          {activeTab === "perf-mon" && (
            <div className="flex flex-col gap-4 font-sans">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-2 shrink-0">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">Real-Time Performance Counter Telemetry</h3>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 border border-indigo-500/20 rounded">
                    Sampling rate: 1000ms
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Observe processor queues, network throughput adapters, and memory pools for remote diagnostics.
                </p>
              </div>

              {/* Graphical representation rows */}
              <div className="grid grid-cols-3 gap-4">
                {/* CPU Counters */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Processor load (CPU)</span>
                  <div className="text-xl font-mono text-sky-400 font-bold mt-1">
                    {cpuHist[cpuHist.length - 1]}%
                  </div>
                  <div className="flex gap-1 h-12 items-end mt-4 bg-slate-900/30 p-1.5 rounded border border-slate-900">
                    {cpuHist.map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${h}%` }}
                        className="bg-sky-500 flex-1 rounded-t-sm"
                      />
                    ))}
                  </div>
                </div>

                {/* RAM Counters */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Memory utilization (RAM)</span>
                  <div className="text-xl font-mono text-emerald-400 font-bold mt-1">
                    {ramHist[ramHist.length - 1]}%
                  </div>
                  <div className="flex gap-1 h-12 items-end mt-4 bg-slate-900/30 p-1.5 rounded border border-slate-900">
                    {ramHist.map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${h}%` }}
                        className="bg-emerald-500 flex-1 rounded-t-sm"
                      />
                    ))}
                  </div>
                </div>

                {/* Network Counters */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Socket Tunnel Bandwidth</span>
                  <div className="text-xl font-mono text-indigo-400 font-bold mt-1">
                    {netHist[netHist.length - 1]} KB/s
                  </div>
                  <div className="flex gap-1 h-12 items-end mt-4 bg-slate-900/30 p-1.5 rounded border border-slate-900">
                    {netHist.map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${(h / 250) * 100}%` }}
                        className="bg-indigo-500 flex-1 rounded-t-sm"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: EXTERNAL APPLICATIONS */}
          {activeTab === "external-tools" && (
            <div className="flex flex-col gap-4 font-sans">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-2 shrink-0">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-sky-400" />
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">Register & Integrate External Applications</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Environment Path Variables Sync</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Natively register administrative tools (e.g., Wireshark, Nmap, Notepad++) to the secure system workspace, and execute custom command lines on the remote node.
                </p>
              </div>

              {/* External Applications Grid */}
              <div className="grid grid-cols-3 gap-4">
                {/* Registered tools */}
                <div className="col-span-2 bg-slate-950 rounded-lg border border-slate-800 p-3.5 flex flex-col gap-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-900 pb-1.5 mb-1.5">
                    Registered Admin Helpers
                  </span>

                  <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                    {externalApps.map((app) => (
                      <div key={app.id} className="p-2 bg-slate-900/40 border border-slate-900 rounded flex justify-between items-center">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-200 text-xs">{app.name}</span>
                          <span className="font-mono text-[10px] text-indigo-400 truncate w-64">{app.cmd}</span>
                          <span className="text-[9px] text-slate-500 italic">{app.description}</span>
                        </div>
                        <button
                          onClick={() => {
                            alert(`Executing integrated application: ${app.cmd}\nLauncher hook reported successful deployment!`);
                          }}
                          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-1 px-3 rounded text-[10px] transition"
                        >
                          Launch
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add new app configurator */}
                <form onSubmit={handleAddExternalApp} className="bg-slate-950 rounded-lg border border-slate-800 p-3.5 flex flex-col gap-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-900 pb-1.5 mb-1">
                    Register Tool Config
                  </span>

                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="text-slate-500 text-[9px] uppercase">Application Name</span>
                    <input
                      type="text"
                      placeholder="e.g., Putty Terminal"
                      value={newAppName}
                      onChange={(e) => setNewAppName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="text-slate-500 text-[9px] uppercase">Command Line Command</span>
                    <input
                      type="text"
                      placeholder="e.g., putty.exe -ssh 10.0.1.5"
                      value={newAppCmd}
                      onChange={(e) => setNewAppCmd(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded font-mono"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="text-slate-500 text-[9px] uppercase">Brief Description</span>
                    <input
                      type="text"
                      placeholder="Launch PuTTY terminal emulator"
                      value={newAppDesc}
                      onChange={(e) => setNewAppDesc(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 rounded transition mt-auto"
                  >
                    Register Tool
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: ROYAL TS CREDENTIALS MANAGEMENT */}
          {activeTab === "royal-credentials" && (
            <div className="flex flex-col gap-5 font-sans">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-2 shrink-0">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">Credentials & Folder Vault (Royal TS Engine)</h3>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">AES-256 Encryption Active</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Securely assign, reuse, and link credentials to your remote desktop, VNC, and SSH connections. Connections can inherit credentials from the parent folder automatically. Assigning credentials by name allows connection sharing without exposing secrets.
                </p>
              </div>

              {/* Document Locking Simulation */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <div className="flex items-center gap-2">
                    {docLocked ? <Lock className="w-4 h-4 text-red-500 animate-bounce" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Document Encryption & Sharing Lock</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!docLocked) {
                        setDocLocked(true);
                        setTaskExecutionLog(prev => [...prev, "Security Warning: Document locked. Enter master key to decrypt."]);
                      } else {
                        if (docPasswordInput === docPassword) {
                          setDocLocked(false);
                          setDocPasswordInput("");
                          alert("Document credentials unlocked successfully via master key decryption.");
                        } else {
                          alert("Invalid Master Encryption Password! Decryption failed.");
                        }
                      }
                    }}
                    className={`px-3 py-1 text-[11px] font-bold rounded border transition ${
                      docLocked ? "bg-red-600 border-red-500 text-white hover:bg-red-700" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {docLocked ? "Unlock Vault" : "Lock Vault Now"}
                  </button>
                </div>

                {docLocked ? (
                  <div className="flex flex-col gap-3 items-center py-6">
                    <AlertTriangle className="w-10 h-10 text-red-400 animate-pulse" />
                    <div className="text-center">
                      <h4 className="text-sm font-semibold text-slate-200">Credentials Vault Protected</h4>
                      <p className="text-xs text-slate-500 mt-1">Provide your Document Master Password to authorize connection keys.</p>
                    </div>
                    <div className="flex gap-2 max-w-xs mt-2">
                      <input
                        type="password"
                        placeholder="Enter master key (default: royal123)..."
                        value={docPasswordInput}
                        onChange={(e) => setDocPasswordInput(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded text-xs text-center focus:outline-none focus:border-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (docPasswordInput === docPassword) {
                              setDocLocked(false);
                              setDocPasswordInput("");
                            } else {
                              alert("Invalid Master Encryption Password! Decryption failed.");
                            }
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (docPasswordInput === docPassword) {
                            setDocLocked(false);
                            setDocPasswordInput("");
                          } else {
                            alert("Invalid Master Encryption Password! Decryption failed.");
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 rounded font-bold"
                      >
                        Decrypt
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/40 p-3 rounded border border-slate-900 flex flex-col gap-1.5 text-[11px]">
                      <span className="text-slate-400 font-bold uppercase text-[9px] text-indigo-400">Document Security Configuration</span>
                      <div className="flex justify-between items-center mt-1">
                        <span>Encrypt Connection Credentials</span>
                        <span className="text-emerald-400 font-mono font-bold">Enabled (AES-256)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Sharing Safe Mode</span>
                        <span className="text-emerald-400 font-mono font-bold">Active (Link by Name)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>External Key Source</span>
                        <span className="text-indigo-400 font-mono">None (Local Keyring)</span>
                      </div>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded border border-slate-900 flex flex-col gap-1.5 text-[11px]">
                      <span className="text-slate-400 font-bold uppercase text-[9px] text-indigo-400 font-semibold">Credential Inheritance Monitor</span>
                      <p className="text-slate-400 text-[11px]">Connections in these folders inherit credentials from the parent configuration object:</p>
                      <div className="flex gap-2 items-center mt-1">
                        <select
                          value={selectedInheritFolder}
                          onChange={(e) => setSelectedInheritFolder(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1 rounded text-[11px] flex-1 font-mono"
                        >
                          <option value="Production Databases">/Production/SQL Databases</option>
                          <option value="Active Directory Controllers">/Production/Domain Controllers</option>
                          <option value="IIS Web Farm">/Staging/IIS Servers</option>
                        </select>
                        <button
                          onClick={() => {
                            const matched = credentials.find(c => c.folderInherited === selectedInheritFolder);
                            alert(`Folder Inheritance Check: All connections within '${selectedInheritFolder}' are successfully inheriting [${matched ? matched.username : "none"}] dynamically on session start.`);
                          }}
                          className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2 py-1 rounded border border-indigo-500/20 font-bold"
                        >
                          Verify Inherit
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!docLocked && (
                <div className="grid grid-cols-3 gap-4">
                  {/* Active Credentials List */}
                  <div className="col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-900 pb-1.5 flex justify-between items-center">
                      <span>Available Credential Objects</span>
                      <span className="text-[9px] text-slate-500 font-mono">Count: {credentials.length}</span>
                    </span>

                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                      {credentials.map((cred) => (
                        <div key={cred.id} className="p-2.5 bg-slate-900/40 border border-slate-900 rounded flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                              <Key className="w-3 h-3 text-amber-500" />
                              {cred.name}
                            </span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                              Folder: {cred.folderInherited}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono mt-1 text-slate-400 items-center">
                            <div>
                              <span className="text-slate-500">User:</span> <span className="text-slate-300">{cred.username}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Secret:</span>
                              <span className="text-slate-300">
                                {showSecrets[cred.id] ? cred.secret : "••••••••"}
                              </span>
                              <button
                                onClick={() => setShowSecrets(prev => ({ ...prev, [cred.id]: !prev[cred.id] }))}
                                className="text-slate-500 hover:text-white transition p-0.5 ml-1"
                                title="Toggle Visibility"
                              >
                                {showSecrets[cred.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div className="text-right">
                              <button
                                onClick={() => {
                                  setCredentials(prev => prev.filter(c => c.id !== cred.id));
                                }}
                                className="text-red-400 hover:text-red-500 transition p-1 font-mono text-[9px] uppercase tracking-wider"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-900 mt-1.5 pt-1 text-[10px] text-slate-500">
                            <span>Inheritable by Connection: {cred.inheritMode ? "YES (Active)" : "NO (Direct Assigned Only)"}</span>
                            <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Encrypted Keyring
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Create Credential Object Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newCredName || !newCredUser || !newCredSecret) return;
                      const c = {
                        id: "cred-" + Date.now(),
                        name: newCredName,
                        username: newCredUser,
                        secret: newCredSecret,
                        isEncrypted: true,
                        folderInherited: selectedInheritFolder,
                        inheritMode: true
                      };
                      setCredentials(prev => [...prev, c]);
                      setNewCredName("");
                      setNewCredUser("");
                      setNewCredSecret("");
                      alert(`Credential object '${c.name}' registered to encrypted vault.`);
                    }}
                    className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-2.5"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-900 pb-1.5">
                      Create Vault Object
                    </span>

                    <div className="flex flex-col gap-1 text-[11px]">
                      <span className="text-slate-500 text-[9px] uppercase">Object Name (Ref Name)</span>
                      <input
                        type="text"
                        placeholder="e.g., Domain Service Account"
                        value={newCredName}
                        onChange={(e) => setNewCredName(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded focus:outline-none"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1 text-[11px]">
                      <span className="text-slate-500 text-[9px] uppercase">Username</span>
                      <input
                        type="text"
                        placeholder="e.g., ldap_sync"
                        value={newCredUser}
                        onChange={(e) => setNewCredUser(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded focus:outline-none font-mono text-xs"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1 text-[11px]">
                      <span className="text-slate-500 text-[9px] uppercase">Password / API Secret</span>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newCredSecret}
                        onChange={(e) => setNewCredSecret(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded focus:outline-none font-mono text-xs"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1 text-[11px]">
                      <span className="text-slate-500 text-[9px] uppercase">Bind Folder Inheritance</span>
                      <select
                        value={selectedInheritFolder}
                        onChange={(e) => setSelectedInheritFolder(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded font-mono text-xs"
                      >
                        <option value="Production Databases">Production Databases</option>
                        <option value="Active Directory Controllers">Active Directory Controllers</option>
                        <option value="IIS Web Farm">IIS Web Farm</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded transition text-xs mt-2"
                    >
                      Save to Keyring
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB: ROYAL TS TASK AUTOMATION */}
          {activeTab === "royal-automation" && (
            <div className="flex flex-col gap-5 font-sans">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-2 shrink-0">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-purple-400" />
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">Task Automation Console</h3>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Task Engine v3.1</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Automate repetitive network chores with Command Tasks and Key Sequence Tasks. Use dynamic replacement tokens like <span className="font-mono text-purple-300 font-bold">$IP$</span>, <span className="font-mono text-purple-300 font-bold">$USERNAME$</span>, or <span className="font-mono text-purple-300 font-bold">$PASSWORD$</span> to run scripts in context of the active connection target.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Available Automation Tasks */}
                <div className="col-span-2 flex flex-col gap-4">
                  {/* List of Tasks */}
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-900 pb-1.5">
                      Configured Automation Choreography
                    </span>

                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                      {automationTasks.map((t) => (
                        <div key={t.id} className="p-3 bg-slate-900/40 border border-slate-900 rounded flex justify-between items-center gap-4">
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                                t.type === "command" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              }`}>
                                {t.type}
                              </span>
                              <span className="font-semibold text-slate-200 text-xs truncate">{t.name}</span>
                            </div>
                            <span className="font-mono text-[10px] text-indigo-400 truncate mt-1">
                              {t.type === "command" ? t.command : t.keys}
                            </span>
                            <span className="text-[9px] text-slate-500 italic mt-0.5 truncate">{t.description}</span>
                          </div>
                          <button
                            onClick={() => {
                              setIsExecutingTask(true);
                              setTaskExecutionLog([`Initializing automation task: '${t.name}'`, "Locating targets & resolving token pointers..."]);
                              
                              setTimeout(() => {
                                setTaskExecutionLog(prev => [...prev, `Found target context node: [${machine.name} (${machine.ip})]`]);
                              }, 600);

                              setTimeout(() => {
                                const resolved = t.type === "command" 
                                  ? (t.command || "").replace("$IP$", machine.ip)
                                  : (t.keys || "").replace("$USERNAME$", machine.username);
                                setTaskExecutionLog(prev => [
                                  ...prev, 
                                  `Bound secure workspace variables...`,
                                  `Token Replacement Parsing SUCCESS. Resolved sequence:`,
                                  `↳ ${resolved}`,
                                  `Deploying dynamic thread payload adapter on target host...`
                                ]);
                              }, 1300);

                              setTimeout(() => {
                                let outputLines: string[] = [];
                                if (t.type === "command") {
                                  if (t.command?.includes("ping")) {
                                    outputLines = [
                                      `PING ${machine.ip} with 32 bytes of data:`,
                                      `Reply from ${machine.ip}: bytes=32 time=5ms TTL=128`,
                                      `Reply from ${machine.ip}: bytes=32 time=4ms TTL=128`,
                                      `Reply from ${machine.ip}: bytes=32 time=6ms TTL=128`,
                                      `Reply from ${machine.ip}: bytes=32 time=5ms TTL=128`,
                                      `Ping statistics for ${machine.ip}: Packets Sent=4, Received=4, Lost=0 (0% loss)`
                                    ];
                                  } else if (t.command?.includes("tracert")) {
                                    outputLines = [
                                      `Tracing route to ${machine.ip} over a maximum of 30 hops:`,
                                      `  1    <1 ms    <1 ms    <1 ms  10.0.0.1`,
                                      `  2     2 ms     1 ms     1 ms  192.168.1.1`,
                                      `  3     5 ms     4 ms     5 ms  ${machine.ip}`,
                                      `Trace complete.`
                                    ];
                                  } else {
                                    outputLines = [
                                      `System command returned: Code 0 (Success)`,
                                      `Payload output: Target service flushed correctly.`
                                    ];
                                  }
                                } else {
                                  // key sequence
                                  outputLines = [
                                    `[Simulating Keyboard Input strokes]`,
                                    `Active shell focused: OBVS\\administrator@${machine.ip}`,
                                    `Input sequence fed: ${t.keys}`,
                                    `Command prompt output: Task completed successfully. Status Code: 0`
                                  ];
                                }

                                setTaskExecutionLog(prev => [
                                  ...prev,
                                  ...outputLines,
                                  `-------------------------------------------`,
                                  `SUCCESS: Remote Task execution completed safely. Socket freed.`
                                ]);
                                setIsExecutingTask(false);
                              }, 2500);
                            }}
                            disabled={isExecutingTask}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-bold py-1 px-3 rounded text-[11px] transition flex items-center gap-1 shrink-0"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Run Task</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Task Execution Log Console */}
                  <div className="bg-black border border-slate-800 rounded-lg p-4 font-mono text-xs flex flex-col gap-1.5 min-h-[160px]">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide border-b border-slate-950 pb-1 flex justify-between items-center">
                      <span>Realtime Task Execution Output</span>
                      {isExecutingTask && <span className="text-[10px] text-purple-400 animate-pulse font-bold">● RUNNING PIPELINE...</span>}
                    </span>
                    <div className="flex-1 overflow-y-auto max-h-[160px] text-slate-300 flex flex-col gap-1">
                      {taskExecutionLog.length === 0 ? (
                        <span className="text-slate-600 italic">No tasks executed yet. Select 'Run Task' above to view live replacement parameters.</span>
                      ) : (
                        taskExecutionLog.map((log, i) => (
                          <div key={i} className={log.startsWith("SUCCESS") ? "text-emerald-400 font-bold" : log.startsWith("↳") ? "text-indigo-300 font-semibold" : "text-slate-300"}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Create Custom Automation Task Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!customTaskName || !customTaskPayload) return;
                    const nt = {
                      id: "task-" + Date.now(),
                      type: customTaskType,
                      name: customTaskName,
                      command: customTaskType === "command" ? customTaskPayload : "",
                      keys: customTaskType === "keysequence" ? customTaskPayload : "",
                      description: "Custom user-defined automation task"
                    };
                    setAutomationTasks(prev => [...prev, nt]);
                    setCustomTaskName("");
                    setCustomTaskPayload("");
                    alert(`Custom ${nt.type} automation task registered successfully!`);
                  }}
                  className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-2.5"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-900 pb-1.5">
                    Define Custom Task
                  </span>

                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="text-slate-500 text-[9px] uppercase">Task Type</span>
                    <div className="flex gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 font-mono text-[10px]">
                      {(["command", "keysequence"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setCustomTaskType(type)}
                          className={`flex-1 py-1 rounded transition text-center capitalize ${
                            customTaskType === type ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {type === "command" ? "Command Task" : "Key Sequence"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="text-slate-500 text-[9px] uppercase">Task Display Name</span>
                    <input
                      type="text"
                      placeholder="e.g., Get Memory Report"
                      value={customTaskName}
                      onChange={(e) => setCustomTaskName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1.5 rounded focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="text-slate-500 text-[9px] uppercase">
                      {customTaskType === "command" ? "Shell Command line" : "Keyboard Macro strokes"}
                    </span>
                    <textarea
                      placeholder={
                        customTaskType === "command"
                          ? "e.g., ping $IP$ /t"
                          : "e.g., ls -lh{ENTER}cat error.log{ENTER}"
                      }
                      value={customTaskPayload}
                      onChange={(e) => setCustomTaskPayload(e.target.value)}
                      rows={3}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1.5 rounded focus:outline-none font-mono text-xs"
                      required
                    />
                    <span className="text-[9px] text-slate-500 leading-tight">
                      Use <span className="font-mono text-indigo-400">$IP$</span> for target address and <span className="font-mono text-indigo-400">{`{ENTER}`}</span> to invoke return key.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-1.5 rounded transition mt-auto"
                  >
                    Add Task Config
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: SECURE SSH GATEWAY */}
          {activeTab === "royal-gateway" && (
            <div className="flex flex-col gap-5 font-sans">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-2 shrink-0">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">Secure Gateway Integration (SSH Port Forwarding)</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Secure Tunnel Adaptor</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  The Secure Gateway implementation is based on secure industry-standard SSH port forwarding tunnels. This allows secure, tightly integrated VNC, SSH, Telnet, or RDP connections through remote jump boxes without exposing standard firewall access.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Gateway Configuration Panel */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-900 pb-1.5">
                    Gateway Properties
                  </span>

                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="text-slate-500 text-[9px] uppercase">SSH Gateway Host</span>
                    <input
                      type="text"
                      value={gatewayHost}
                      onChange={(e) => setGatewayHost(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="text-slate-500 text-[9px] uppercase">SSH Gateway Port</span>
                    <input
                      type="text"
                      value={gatewayPort}
                      onChange={(e) => setGatewayPort(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded font-mono text-xs w-20 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="text-slate-500 text-[9px] uppercase">Authentication Username</span>
                    <input
                      type="text"
                      value={gatewayUser}
                      onChange={(e) => setGatewayUser(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-[11px] border-t border-slate-900 pt-2.5">
                    <span className="text-slate-500 text-[9px] uppercase">Integrated Tunnel Bridge</span>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-slate-400">Enable Secure Tunnel</span>
                      <button
                        onClick={() => {
                          if (gatewayStatus === "Connected") {
                            setGatewayStatus("Disconnected");
                            setGatewayLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Manual shutdown initiated. Disconnected SSH dynamic forwarding threads.`]);
                          } else {
                            setGatewayStatus("Connecting");
                            setGatewayLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Connecting to SSH tunnel proxy...`]);
                            setTimeout(() => {
                              setGatewayStatus("Connected");
                              setGatewayLogs(prev => [
                                ...prev, 
                                `[${new Date().toLocaleTimeString()}] Handshake success. Local loopback bound on dynamic ports successfully.`
                              ]);
                            }, 1200);
                          }
                        }}
                        className={`px-3 py-1 text-[11px] font-bold rounded transition ${
                          gatewayStatus === "Connected" 
                            ? "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30"
                            : gatewayStatus === "Connecting"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {gatewayStatus === "Connected" ? "● Running" : gatewayStatus === "Connecting" ? "Handshake..." : "○ Inactive"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-2 border border-slate-900 rounded text-[9px] text-slate-500 mt-auto">
                    Note: A Secure Gateway component is included in <span className="text-indigo-400 font-bold">Royal Server</span>. Installation is done in minutes.
                  </div>
                </div>

                {/* Active Integrated Port Forwards */}
                <div className="col-span-2 flex flex-col gap-4">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-3 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-900 pb-1.5">
                      Active SSH Port Redirection Listeners
                    </span>

                    <div className="flex flex-col gap-2">
                      {portForwards.map((forward, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-900/30 border border-slate-900 rounded flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-slate-200">{forward.name}</span>
                            <span className="font-mono text-[10px] text-indigo-400">
                              Local Host [127.0.0.1:{forward.localPort}] ➔ Remote Gateway ➔ Target Host [{machine.ip}:{forward.remotePort}]
                            </span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            gatewayStatus === "Connected" && forward.status === "Active" 
                              ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 animate-pulse"
                              : "bg-slate-800 text-slate-500"
                          }`}>
                            {gatewayStatus === "Connected" ? forward.status : "Inactive"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gateway Log Console */}
                  <div className="bg-black border border-slate-800 rounded-lg p-4 font-mono text-xs flex flex-col gap-1 h-[140px] overflow-y-auto">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide border-b border-slate-950 pb-1 mb-1">
                      Gateway Server Handshake Logs
                    </span>
                    {gatewayLogs.map((log, i) => (
                      <div key={i} className="text-slate-400 text-[11px] leading-relaxed">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ROYAL TS DYNAMIC IMPORT */}
          {activeTab === "royal-dynamic" && (
            <div className="flex flex-col gap-5 font-sans">
              <div className="bg-[#1b1c24] border border-slate-800 p-4 rounded-lg flex flex-col gap-2 shrink-0">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-sky-400" />
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-200">Dynamic Folders & JSON Import Engines</h3>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">Dynamic Client v1.9</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Dynamic Folders allow automatic loading of connection parameters from external databases or webhooks on load. Dynamically map passwords with Dynamic Credentials metadata, and use <span className="font-mono text-sky-300 font-bold">RoyalJSON</span> structure for unidirectional imports.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Dynamic Connection Folders list */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-900 pb-1.5">
                    Dynamic Connection Folders
                  </span>

                  <div className="flex flex-col gap-2.5">
                    {dynamicFolders.map((fold, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-900/40 border border-slate-900 rounded flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-xs text-slate-200 flex items-center gap-1">
                            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                            {fold.name}
                          </span>
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded font-mono">
                            Auto: {fold.autoRefresh ? "On" : "Off"}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          Source: {fold.source}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-900 pt-1.5">
                          <span>Updated: {fold.lastUpdated}</span>
                          <button
                            onClick={() => {
                              alert(`Executing Dynamic Folder Fetch script on URL: ${fold.source}...`);
                              setDynamicFolders(prev => prev.map((f, i) => i === idx ? { ...f, lastUpdated: new Date().toLocaleTimeString() } : f));
                              setTaskExecutionLog(prev => [...prev, `Dynamic Folder Sync Success: Imported 5 connections into '${fold.name}' folder`]);
                            }}
                            className="text-sky-400 hover:text-sky-300 font-bold font-mono text-[9px] uppercase"
                          >
                            Sync Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-900 pt-3 flex flex-col gap-2 mt-auto">
                    <span className="text-slate-500 text-[9px] uppercase font-bold">Dynamic Credentials Webhook</span>
                    <input
                      type="text"
                      value={dynamicCredWebhook}
                      onChange={(e) => setDynamicCredWebhook(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded font-mono text-[10px] focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        alert(`Resolving Dynamic Credentials Webhook API handshake...\\nSUCCESS: Retuned temporary secret keys: 'temp_secret_obvs_2026'`);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 py-1 rounded text-[11px] font-bold mt-1"
                    >
                      Authorize Secret Queries
                    </button>
                  </div>
                </div>

                {/* RoyalJSON Structure Editor */}
                <div className="col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-900 pb-1.5 flex justify-between items-center">
                    <span>RoyalJSON Script Editor & Importer</span>
                    <span className="text-[9px] text-slate-500">Unidirectional payload</span>
                  </span>

                  <textarea
                    value={royalJsonInput}
                    onChange={(e) => setRoyalJsonInput(e.target.value)}
                    rows={8}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                  />

                  <div className="flex gap-3 mt-1 justify-end">
                    <button
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(royalJsonInput);
                          setImportedElements(parsed);
                          alert("RoyalJSON compiled successfully! 1 folder, 2 connections, and 1 credential mapped to session trees.");
                        } catch (err) {
                          alert("RoyalJSON Parse Error! Please verify brackets and syntax: " + (err as Error).message);
                        }
                      }}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-1.5 px-4 rounded text-xs transition"
                    >
                      Parse & Dry Run RoyalJSON
                    </button>
                  </div>

                  {importedElements && (
                    <div className="bg-slate-900 p-3 rounded border border-slate-800 flex flex-col gap-1.5 text-xs">
                      <span className="text-emerald-400 font-bold uppercase text-[9px] font-mono">DRY RUN COMPILATION RESULTS:</span>
                      <div className="font-mono text-[11px] text-slate-300 grid grid-cols-2 gap-2">
                        <div>
                          Document Name: <span className="text-sky-300">{importedElements.CustomDocument?.Name || "Untitled"}</span>
                        </div>
                        <div>
                          Connections Loaded: <span className="text-sky-300">2 mapped hosts</span>
                        </div>
                        <div>
                          Credential Elements: <span className="text-sky-300">1 webhook mapped</span>
                        </div>
                        <div>
                          Syntax Status: <span className="text-emerald-400">Strict JSON Verified</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
