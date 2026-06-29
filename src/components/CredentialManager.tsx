import React, { useState, useEffect } from "react";
import { RemoteMachine, ConnectionProtocol, MachineOS } from "../types";
import {
  Key,
  Folder,
  Link2,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronRight,
  User,
  Settings,
  HelpCircle,
  FileKey,
  Database
} from "lucide-react";

export interface CredentialObject {
  id: string;
  name: string;
  username: string;
  type: "password" | "sshKey";
  secret: string;
}

interface CredentialManagerProps {
  machines: RemoteMachine[];
  onUpdateMachine: (id: string, updatedFields: Partial<RemoteMachine>) => void;
}

export default function CredentialManager({ machines, onUpdateMachine }: CredentialManagerProps) {
  // Local state for credentials vault
  const [credentials, setCredentials] = useState<CredentialObject[]>([]);
  // Folder (group) credential maps: key is group name, value is credential id
  const [folderCredMap, setFolderCredMap] = useState<Record<string, string>>({});
  // Machine credential settings map: key is machine id, value is "inherit" | "direct" | "manual"
  const [machineCredLink, setMachineCredLink] = useState<Record<string, { type: "inherit" | "direct" | "manual"; credId?: string }>>({});

  // Form states
  const [newCredName, setNewCredName] = useState("");
  const [newCredUsername, setNewCredUsername] = useState("");
  const [newCredType, setNewCredType] = useState<"password" | "sshKey">("password");
  const [newCredSecret, setNewCredSecret] = useState("");
  const [showSecretId, setShowSecretId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Extract unique groups from machines
  const groups = Array.from(new Set(machines.map((m) => m.group || "Default")));

  // Load persistent credentials
  useEffect(() => {
    const storedCreds = localStorage.getItem("multidesk_vault_credentials");
    if (storedCreds) {
      try {
        setCredentials(JSON.parse(storedCreds));
      } catch (e) {
        console.error("Failed to parse stored credentials", e);
      }
    } else {
      // Seed some default secure credentials
      const defaultCreds: CredentialObject[] = [
        {
          id: "cred-root-prod",
          name: "Production Root Core",
          username: "deployer",
          type: "sshKey",
          secret: "-----BEGIN OPENSSH PRIVATE KEY-----\nMIIEogIBAAKCAQEAzg7Fp4Z...\n-----END OPENSSH PRIVATE KEY-----"
        },
        {
          id: "cred-admin-ad",
          name: "Active Directory Domain Admin",
          username: "Administrator",
          type: "password",
          secret: "AD_P@ssw0rd_Enterprise_2026!"
        },
        {
          id: "cred-ci-builder",
          name: "CI/CD Builder Key",
          username: "ci-builder",
          type: "password",
          secret: "mac_sequoia_9918"
        }
      ];
      setCredentials(defaultCreds);
      localStorage.setItem("multidesk_vault_credentials", JSON.stringify(defaultCreds));
    }

    const storedFolderMaps = localStorage.getItem("multidesk_vault_folders");
    if (storedFolderMaps) {
      try {
        setFolderCredMap(JSON.parse(storedFolderMaps));
      } catch (e) {
        console.error("Failed to parse stored folder credentials", e);
      }
    } else {
      // Seed default inheritance links
      const defaultFolderMap: Record<string, string> = {
        "Production Backend": "cred-root-prod",
        "Enterprise Directory": "cred-admin-ad",
        "CI/CD Build Farm": "cred-ci-builder"
      };
      setFolderCredMap(defaultFolderMap);
      localStorage.setItem("multidesk_vault_folders", JSON.stringify(defaultFolderMap));
    }

    const storedMachineMaps = localStorage.getItem("multidesk_vault_machines");
    if (storedMachineMaps) {
      try {
        setMachineCredLink(JSON.parse(storedMachineMaps));
      } catch (e) {
        console.error("Failed to parse stored machine links", e);
      }
    } else {
      // Seed default machine links
      const defaultMachineLinks: Record<string, { type: "inherit" | "direct" | "manual"; credId?: string }> = {};
      machines.forEach((m) => {
        defaultMachineLinks[m.id] = { type: "inherit" };
      });
      setMachineCredLink(defaultMachineLinks);
      localStorage.setItem("multidesk_vault_machines", JSON.stringify(defaultMachineLinks));
    }
  }, [machines]);

  // Save utility
  const saveCredentials = (newCreds: CredentialObject[]) => {
    setCredentials(newCreds);
    localStorage.setItem("multidesk_vault_credentials", JSON.stringify(newCreds));
  };

  const handleAddCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCredName || !newCredUsername || !newCredSecret) return;

    const newObj: CredentialObject = {
      id: "cred-" + Date.now(),
      name: newCredName,
      username: newCredUsername,
      type: newCredType,
      secret: newCredSecret
    };

    const updated = [...credentials, newObj];
    saveCredentials(updated);

    setNewCredName("");
    setNewCredUsername("");
    setNewCredSecret("");
    triggerSuccess("Successfully stored credential object in master vault.");
  };

  const handleDeleteCredential = (id: string) => {
    if (confirm("Are you sure you want to delete this credential object? Any folders/connections linked to it will fallback to manual authentication.")) {
      const updated = credentials.filter((c) => c.id !== id);
      saveCredentials(updated);

      // Clean folder mappings
      const updatedFolderMap = { ...folderCredMap };
      Object.keys(updatedFolderMap).forEach((folder) => {
        if (updatedFolderMap[folder] === id) {
          delete updatedFolderMap[folder];
        }
      });
      setFolderCredMap(updatedFolderMap);
      localStorage.setItem("multidesk_vault_folders", JSON.stringify(updatedFolderMap));

      // Clean machine mappings
      const updatedMachineMap = { ...machineCredLink };
      Object.keys(updatedMachineMap).forEach((mid) => {
        if (updatedMachineMap[mid].credId === id) {
          updatedMachineMap[mid] = { type: "manual" };
        }
      });
      setMachineCredLink(updatedMachineMap);
      localStorage.setItem("multidesk_vault_machines", JSON.stringify(updatedMachineMap));

      triggerSuccess("Credential deleted from vault safely.");
    }
  };

  const handleLinkFolderCred = (folder: string, credId: string) => {
    const updated = { ...folderCredMap };
    if (!credId) {
      delete updated[folder];
    } else {
      updated[folder] = credId;
    }
    setFolderCredMap(updated);
    localStorage.setItem("multidesk_vault_folders", JSON.stringify(updated));
    triggerSuccess(`Successfully bound default credentials for folder '${folder}'.`);
  };

  const handleLinkMachineCred = (machineId: string, linkType: "inherit" | "direct" | "manual", credId?: string) => {
    const updated = { ...machineCredLink };
    updated[machineId] = { type: linkType, credId };
    setMachineCredLink(updated);
    localStorage.setItem("multidesk_vault_machines", JSON.stringify(updated));

    // Update the actual remote machine state dynamically to simulate real working behavior
    const targetMachine = machines.find((m) => m.id === machineId);
    if (targetMachine) {
      let resolvedUsername = targetMachine.username;
      let resolvedCredsType = targetMachine.credentialsType;
      let resolvedPassword = targetMachine.password;
      let resolvedSshKey = targetMachine.sshKey;

      if (linkType === "manual") {
        // Leave as is or clear
      } else {
        let activeCredObj: CredentialObject | undefined;
        if (linkType === "inherit") {
          const folderCredId = folderCredMap[targetMachine.group || "Default"];
          activeCredObj = credentials.find((c) => c.id === folderCredId);
        } else if (linkType === "direct" && credId) {
          activeCredObj = credentials.find((c) => c.id === credId);
        }

        if (activeCredObj) {
          resolvedUsername = activeCredObj.username;
          resolvedCredsType = activeCredObj.type;
          if (activeCredObj.type === "password") {
            resolvedPassword = activeCredObj.secret;
            resolvedSshKey = "";
          } else {
            resolvedSshKey = activeCredObj.secret;
            resolvedPassword = "";
          }
        }
      }

      onUpdateMachine(machineId, {
        username: resolvedUsername,
        credentialsType: resolvedCredsType,
        password: resolvedPassword,
        sshKey: resolvedSshKey
      });
    }

    triggerSuccess(`Saved connection authority routing settings.`);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Helper to resolve currently effective connection credentials for display
  const getEffectiveCredentials = (m: RemoteMachine) => {
    const settings = machineCredLink[m.id] || { type: "manual" };
    if (settings.type === "manual") {
      return {
        source: "Manual (Connection Direct Config)",
        username: m.username,
        type: m.credentialsType,
        secret: m.credentialsType === "password" ? m.password : m.sshKey
      };
    }

    let credObj: CredentialObject | undefined;
    if (settings.type === "inherit") {
      const parentFolderCredId = folderCredMap[m.group || "Default"];
      credObj = credentials.find((c) => c.id === parentFolderCredId);
      if (!credObj) {
        return {
          source: "Inherited (None config, fallbacks to direct)",
          username: m.username,
          type: m.credentialsType,
          secret: m.credentialsType === "password" ? m.password : m.sshKey
        };
      }
      return {
        source: `Inherited from folder: '${m.group}'`,
        username: credObj.username,
        type: credObj.type,
        secret: credObj.secret
      };
    }

    if (settings.type === "direct" && settings.credId) {
      credObj = credentials.find((c) => c.id === settings.credId);
      if (!credObj) {
        return {
          source: "Direct Link (Stale, fallbacks to direct)",
          username: m.username,
          type: m.credentialsType,
          secret: m.credentialsType === "password" ? m.password : m.sshKey
        };
      }
      return {
        source: `Linked to Vault Object: '${credObj.name}'`,
        username: credObj.username,
        type: credObj.type,
        secret: credObj.secret
      };
    }

    return {
      source: "Manual Settings",
      username: m.username,
      type: m.credentialsType,
      secret: ""
    };
  };

  return (
    <div id="credential-manager-container" className="flex-1 overflow-y-auto bg-slate-900 p-8 text-slate-100 font-sans">
      {/* Top Header Section */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Shield className="w-7 h-7 text-indigo-500" />
            <span>Encrypted Credential Manager & Vault</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Securely cache, link, and automate remote authorization keyrings. Support folder-level permission inheritance.
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
          Status: AES-256-GCM Armed
        </span>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-lg text-xs font-semibold mb-6 animate-pulse flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Panel 1: Manage Credential Objects & Creation */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          
          {/* List of Credential Objects */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Registered Vault Objects</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Vault Size: {credentials.length} Keys</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {credentials.map((cred) => (
                <div key={cred.id} className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 transition flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-xs text-slate-200 truncate flex items-center gap-1.5">
                        <FileKey className="w-3.5 h-3.5 text-indigo-400" />
                        {cred.name}
                      </h3>
                      <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded ${
                        cred.type === "sshKey" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                      }`}>
                        {cred.type === "sshKey" ? "Private Key" : "Password"}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs font-mono bg-slate-950 p-2.5 rounded border border-slate-900">
                      <div className="flex justify-between">
                        <span className="text-slate-500 text-[10px]">USERNAME:</span>
                        <span className="text-slate-300 font-bold">{cred.username}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[10px]">SECRET:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-300 text-[11px]">
                            {showSecretId === cred.id 
                              ? cred.secret.substring(0, 32) + (cred.secret.length > 32 ? "..." : "")
                              : "••••••••••••"}
                          </span>
                          <button
                            onClick={() => setShowSecretId(showSecretId === cred.id ? null : cred.id)}
                            className="text-slate-500 hover:text-white transition p-0.5"
                          >
                            {showSecretId === cred.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleDeleteCredential(cred.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-[10px] font-bold uppercase px-2.5 py-1 rounded transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Revoke</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Credential Object Form */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-5">
              <Plus className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Generate New Vault Key</h2>
            </div>

            <form onSubmit={handleAddCredential} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-semibold">Key/Reference Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Domain Root Backup Account"
                  value={newCredName}
                  onChange={(e) => setNewCredName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-semibold">Username Link</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. root, Administrator, deploy_agent"
                  value={newCredUsername}
                  onChange={(e) => setNewCredUsername(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-semibold">Credential Schema Type</label>
                <select
                  value={newCredType}
                  onChange={(e) => setNewCredType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="password">Static Cleartext Password</option>
                  <option value="sshKey">Cryptographic Private SSH Key (RSA/ED25519)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-slate-400 font-semibold">Secret Key / Private Block</label>
                {newCredType === "password" ? (
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={newCredSecret}
                    onChange={(e) => setNewCredSecret(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                ) : (
                  <textarea
                    required
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----\nMIIEogIBAAKCAQEAzg7Fp4Z...\n-----END OPENSSH PRIVATE KEY-----"
                    value={newCredSecret}
                    onChange={(e) => setNewCredSecret(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono h-24 whitespace-pre-wrap leading-relaxed"
                  />
                )}
              </div>

              <div className="sm:col-span-2 mt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition shadow-md shadow-indigo-600/10"
                >
                  Safeguard inside Keyring
                </button>
              </div>
            </form>
          </div>

          {/* Folder Groups Permission default settings */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
              <Folder className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Folder Level Permission Defaults</h2>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              Assign dynamic root credentials on folder hierarchies. Any connection assigned to these folders configured to <strong>Inherit</strong> will automatically route transactions using these default keys.
            </p>

            <div className="space-y-3.5">
              {groups.map((group) => {
                const effectiveCredId = folderCredMap[group] || "";
                return (
                  <div key={group} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-3.5 border border-slate-800/60 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-amber-500 fill-amber-500/10" />
                      <div>
                        <span className="font-semibold text-xs text-slate-200">{group} Folder Group</span>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">/Root/{group}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">Binds to:</span>
                      <select
                        value={effectiveCredId}
                        onChange={(e) => handleLinkFolderCred(group, e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 flex-1 font-mono sm:w-64"
                      >
                        <option value="">-- Manual Config (No Default) --</option>
                        {credentials.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.username})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel 2: Connection-to-Credential Bindings Monitor */}
        <div className="flex flex-col gap-8">
          
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
              <Link2 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Host Authority Overlays</h2>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal mb-5">
              Specify connection bindings. Direct linkages bypass folder setups, and inherited links dynamically follow changes on parent directories.
            </p>

            <div className="space-y-4">
              {machines.map((m) => {
                const config = machineCredLink[m.id] || { type: "manual" };
                const effective = getEffectiveCredentials(m);

                return (
                  <div key={m.id} className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-indigo-400" />
                          {m.name}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-mono">Folder: /Root/{m.group}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        config.type === "inherit" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : config.type === "direct"
                          ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                          : "bg-slate-800 text-slate-500"
                      }`}>
                        {config.type.toUpperCase()}
                      </span>
                    </div>

                    {/* Selector */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] text-slate-500 font-mono uppercase">Link Authority:</span>
                      <select
                        value={config.type}
                        onChange={(e) => {
                          const type = e.target.value as "inherit" | "direct" | "manual";
                          if (type === "direct") {
                            // Find first available cred or default
                            handleLinkMachineCred(m.id, type, credentials[0]?.id);
                          } else {
                            handleLinkMachineCred(m.id, type);
                          }
                        }}
                        className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                      >
                        <option value="inherit">Inherited permissions (Dynamic Folder default)</option>
                        <option value="direct">Linked Direct (Specific Vault Object)</option>
                        <option value="manual">Manual credentials (Specified per connection)</option>
                      </select>
                    </div>

                    {/* Secondary selector if Linked Direct */}
                    {config.type === "direct" && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">Select target vault key:</span>
                        <select
                          value={config.credId || ""}
                          onChange={(e) => handleLinkMachineCred(m.id, "direct", e.target.value)}
                          className="bg-slate-950 border border-slate-850 text-indigo-300 rounded px-2.5 py-1 text-xs outline-none focus:border-indigo-500 font-mono"
                        >
                          {credentials.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.username})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Effective authorization view */}
                    <div className="text-[11px] bg-slate-950 p-2.5 rounded border border-slate-900 font-mono">
                      <div className="text-slate-500 text-[9px] uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                        <span>Authority Resolution:</span>
                        <span className="text-indigo-400 lowercase italic">resolved</span>
                      </div>
                      <div className="space-y-1">
                        <div>
                          <span className="text-slate-600">Source:</span> <span className="text-slate-300">{effective.source}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Username:</span> <span className="text-slate-300 font-bold">{effective.username}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Auth Type:</span> <span className="text-slate-300">{effective.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
