import React, { useState } from "react";
import { RemoteMachine, ConnectionProtocol, MachineOS } from "../types";
import {
  Settings,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  Server,
  Terminal,
  Activity,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Eye,
  EyeOff
} from "lucide-react";

interface SettingsPanelProps {
  machines: RemoteMachine[];
  onAddMachine: (m: RemoteMachine) => void;
  onDeleteMachine: (id: string) => void;
  hasSetPin: boolean;
  onSetPin: (pin: string) => void;
}

export default function SettingsPanel({
  machines,
  onAddMachine,
  onDeleteMachine,
  hasSetPin,
  onSetPin
}: SettingsPanelProps) {
  // New machine state form
  const [name, setName] = useState("");
  const [ip, setIp] = useState("");
  const [port, setPort] = useState(22);
  const [protocol, setProtocol] = useState<ConnectionProtocol>("ssh");
  const [username, setUsername] = useState("");
  const [credentialsType, setCredentialsType] = useState<"password" | "sshKey" | "none">("password");
  const [password, setPassword] = useState("");
  const [sshKey, setSshKey] = useState("");
  const [os, setOs] = useState<MachineOS>("linux");
  const [group, setGroup] = useState("Development");
  const [tagsInput, setTagsInput] = useState("");
  const [cpuAlertThreshold, setCpuAlertThreshold] = useState(80);
  const [ramAlertThreshold, setRamAlertThreshold] = useState(85);

  // PIN settings state
  const [pinInput, setPinInput] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  
  // Visibility states
  const [showCredsId, setShowCredsId] = useState<string | null>(null);

  const handleProtocolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as ConnectionProtocol;
    setProtocol(val);
    // Standard default ports
    if (val === "ssh") setPort(22);
    else if (val === "vnc") setPort(5900);
    else if (val === "rdp") setPort(3389);
    else if (val === "web") setPort(443);
  };

  const handleAddMachineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ip || !username) return;

    const newMachine: RemoteMachine = {
      id: "mach-" + Date.now(),
      name,
      ip,
      port,
      protocol,
      username,
      credentialsType,
      password: credentialsType === "password" ? password : "",
      sshKey: credentialsType === "sshKey" ? sshKey : "",
      status: "online", // Set to online for quick interactive simulation
      os,
      group,
      tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean),
      cpuAlertThreshold,
      ramAlertThreshold,
      metrics: {
        cpu: Math.floor(Math.random() * 40) + 10,
        ram: Math.floor(Math.random() * 50) + 30,
        disk: Math.floor(Math.random() * 60) + 20,
        networkIn: 80,
        networkOut: 120,
        uptime: "1 day, 00:00:10"
      },
      logs: [
        `Direct encrypted ${protocol.toUpperCase()} handshake initialized with target ${ip}`,
        "Security validation parameters satisfied. Session status online."
      ],
      terminalHistory: [],
      fileSystem: [
        {
          name: "welcome.txt",
          type: "file",
          path: os === "windows" ? `C:\\Users\\${username}\\welcome.txt` : `/home/${username}/welcome.txt`,
          content: `Welcome to your custom registered ${os.toUpperCase()} remote desktop!\nThis simulation is connected securely.`,
          size: "150 B"
        }
      ]
    };

    onAddMachine(newMachine);

    // Reset form
    setName("");
    setIp("");
    setUsername("");
    setPassword("");
    setSshKey("");
    setGroup("Development");
    setTagsInput("");
    setCpuAlertThreshold(80);
    setRamAlertThreshold(85);
  };

  const handleSetPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4) return;
    onSetPin(pinInput);
    setPinInput("");
    setPinSuccess(true);
    setTimeout(() => setPinSuccess(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 p-8 text-slate-100 font-sans">
      
      {/* Top Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">System Registry & Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Register new servers, configure master authentication security, and view credential vaults.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* Left Columns: Forms */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          
          {/* Register Remote Host Form */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-6">
              <Plus className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Register New Remote Host</h2>
            </div>

            <form onSubmit={handleAddMachineSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              
              {/* Host Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-semibold">Host Label / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dev-ubuntu-box"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* IP Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-semibold">Host IP / Domain</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 192.168.1.52 or host.com"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Protocol */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-semibold">Connection Protocol</label>
                <select
                  value={protocol}
                  onChange={handleProtocolChange}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="ssh">SSH (Console Terminal Only)</option>
                  <option value="vnc">VNC (Virtual Desktop GUI)</option>
                  <option value="rdp">RDP (Windows Remote Desktop)</option>
                  <option value="web">Web Control (HTTP Dashboard)</option>
                </select>
              </div>

              {/* Port */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-semibold">Tunnel Port</label>
                <input
                  type="number"
                  required
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* OS Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-semibold">Target OS</label>
                <select
                  value={os}
                  onChange={(e) => setOs(e.target.value as MachineOS)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="linux">Linux (Ubuntu / Alpine / Debian)</option>
                  <option value="windows">Windows Server</option>
                  <option value="macos">macOS Sequoia</option>
                  <option value="freebsd">FreeBSD</option>
                </select>
              </div>

              {/* Server group */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-semibold">Group / Department / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Production, EU-West, Operations"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Tags comma-separated */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-semibold">Custom Tags (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Finance, Critical, Staging"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* CPU Warning Threshold */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <label className="text-slate-400 font-semibold">CPU Alert Threshold</label>
                  <span className="text-indigo-400 font-bold">{cpuAlertThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={cpuAlertThreshold}
                  onChange={(e) => setCpuAlertThreshold(parseInt(e.target.value))}
                  className="accent-indigo-500 bg-slate-900 h-8 rounded-lg cursor-pointer px-1"
                />
              </div>

              {/* RAM Warning Threshold */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <label className="text-slate-400 font-semibold">RAM Alert Threshold</label>
                  <span className="text-emerald-400 font-bold">{ramAlertThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={ramAlertThreshold}
                  onChange={(e) => setRamAlertThreshold(parseInt(e.target.value))}
                  className="accent-emerald-500 bg-slate-900 h-8 rounded-lg cursor-pointer px-1"
                />
              </div>

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-semibold">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. root or administrator"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Credentials type selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-semibold">Credentials Authentication</label>
                <select
                  value={credentialsType}
                  onChange={(e) => setCredentialsType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="password">Password Key</option>
                  <option value="sshKey">Cryptographic SSH Key</option>
                  <option value="none">No Credentials</option>
                </select>
              </div>

              {/* Credentials contents */}
              {credentialsType === "password" && (
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-slate-400 font-semibold">Password Lock</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              {credentialsType === "sshKey" && (
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-slate-400 font-semibold">Private SSH Key Block</label>
                  <textarea
                    required
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----\nMIIEogIBAAKCAQEAzg7Fp4Z...\n-----END OPENSSH PRIVATE KEY-----"
                    value={sshKey}
                    onChange={(e) => setSshKey(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono h-24 whitespace-pre-wrap leading-relaxed"
                  />
                </div>
              )}

              {/* Submit button */}
              <div className="sm:col-span-2 mt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition shadow-md shadow-indigo-600/10"
                >
                  Register Machine Session
                </button>
              </div>

            </form>
          </div>

          {/* List Registered Machines and credentials */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-6">
              <Server className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Registered Vault Instances</h2>
            </div>

            <div className="flex flex-col gap-4">
              {machines.map((m) => (
                <div key={m.id} className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {m.name}
                      <span className="text-[9px] uppercase font-mono font-bold bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-500/20">
                        {m.protocol}
                      </span>
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">Host: {m.ip}:{m.port} | OS: {m.os} | Group: {m.group}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 bg-slate-950 px-2 py-1 rounded inline-block">
                      User: <span className="text-slate-300 font-bold">{m.username}</span> | Auth: <span className="text-indigo-400">{m.credentialsType}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteMachine(m.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded transition"
                      title="Remove Host"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: PIN session security configs */}
        <div className="flex flex-col gap-8">
          
          {/* Master PIN configuration */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
              <Lock className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Console Security PIN</h2>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-normal mb-5">
              Secure credential caching: Setup a 4-digit master PIN. When locked, credentials remain strongly hidden and virtual remote desk sessions cannot be launched.
            </p>

            <form onSubmit={handleSetPinSubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-semibold">
                  {hasSetPin ? "Change 4-Digit Master PIN" : "Setup 4-Digit Master PIN"}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 tracking-widest text-center text-lg font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={pinInput.length < 4}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition disabled:bg-slate-900 disabled:text-slate-600 shadow-md"
              >
                Save Security Pin
              </button>

              {pinSuccess && (
                <div className="flex items-center gap-1.5 justify-center text-emerald-400 text-[11px] mt-1 font-semibold animate-pulse">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  PIN configured successfully!
                </div>
              )}
            </form>
          </div>

          {/* Cryptographic Keypair Utilities */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 shadow-lg text-xs">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
              <Key className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Local SSH Key Gen</h2>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal mb-4">
              To setup passwordless secure terminal logons, generate a cryptographic RSA keypair. Add the Public Key in your remote server's <code className="bg-slate-900 text-indigo-400 px-1 rounded">~/.ssh/authorized_keys</code> directory.
            </p>

            <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-2.5 font-mono text-[10px]">
              <div>
                <span className="text-slate-500 uppercase font-bold text-[9px] block mb-1">Generated Public Key:</span>
                <textarea
                  readOnly
                  className="w-full bg-slate-950 border border-slate-950 p-2 text-slate-300 rounded leading-relaxed h-16 select-all outline-none"
                  value="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDQC4/S+4bY9LpGshg7b... multidesk-client@secure"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
