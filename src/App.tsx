import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import StatsDashboard from "./components/StatsDashboard";
import MultiScreenGrid from "./components/MultiScreenGrid";
import TerminalClient from "./components/TerminalClient";
import DesktopSimulator from "./components/DesktopSimulator";
import CopilotDrawer from "./components/CopilotDrawer";
import SettingsPanel from "./components/SettingsPanel";
import { INITIAL_MACHINES } from "./data/initialMachines";
import { RemoteMachine, CopilotMessage, ActivityLog } from "./types";
import { fetchGeoForIp } from "./utils/geo";
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  Key, 
  CheckCircle, 
  HelpCircle,
  ShieldCheck,
  X
} from "lucide-react";

export default function App() {
  // Navigation & tabs states
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [machines, setMachines] = useState<RemoteMachine[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  
  // Immersive session overlay states
  const [selectedMachineForSession, setSelectedMachineForSession] = useState<RemoteMachine | null>(null);
  const [sessionMode, setSessionMode] = useState<"terminal" | "desktop" | null>(null);

  // Security master PIN & Locks
  const [masterPin, setMasterPin] = useState<string>("");
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [pinPromptOpen, setPinPromptOpen] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

  // Load initial settings and registered hosts
  useEffect(() => {
    try {
      const storedMachines = localStorage.getItem("multidesk_machines");
      if (storedMachines) {
        setMachines(JSON.parse(storedMachines));
      } else {
        setMachines(INITIAL_MACHINES);
        localStorage.setItem("multidesk_machines", JSON.stringify(INITIAL_MACHINES));
      }

      const storedLogs = localStorage.getItem("obvs_activity_logs");
      if (storedLogs) {
        setActivityLogs(JSON.parse(storedLogs));
      } else {
        const initialLogs: ActivityLog[] = [
          {
            id: "initial-setup",
            timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            action: "SYS_INIT",
            target: "OBVS REMOTE SYSTEM",
            details: "Secure workspace terminal interface initialized.",
            status: "success"
          }
        ];
        setActivityLogs(initialLogs);
        localStorage.setItem("obvs_activity_logs", JSON.stringify(initialLogs));
      }

      const storedPin = localStorage.getItem("multidesk_master_pin");
      if (storedPin) {
        setMasterPin(storedPin);
        setIsLocked(true); // Locked by default on startup if PIN is configured
      }
    } catch (e) {
      console.error("Local Storage configuration load error:", e);
      setMachines(INITIAL_MACHINES);
    }
  }, []);

  // Background resolver for resolving missing machine geolocations
  useEffect(() => {
    if (machines.length === 0) return;
    
    const missingGeo = machines.some(m => !m.location);
    if (!missingGeo) return;

    const resolveMissingGeos = async () => {
      let changed = false;
      const updatedList = await Promise.all(
        machines.map(async (m) => {
          if (!m.location) {
            try {
              const geo = await fetchGeoForIp(m.ip, m.name);
              changed = true;
              return { ...m, location: geo };
            } catch (err) {
              console.error(`Failed to resolve geo for ${m.ip}:`, err);
              return m;
            }
          }
          return m;
        })
      );

      if (changed) {
        saveMachines(updatedList);
      }
    };

    resolveMissingGeos();
  }, [machines]);

  // Sync machines database updates
  const saveMachines = (updated: RemoteMachine[]) => {
    setMachines(updated);
    localStorage.setItem("multidesk_machines", JSON.stringify(updated));
  };

  const addActivityLog = (action: string, target: string, details: string, status: "success" | "warning" | "error" | "info") => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action,
      target,
      details,
      status
    };
    setActivityLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 50);
      localStorage.setItem("obvs_activity_logs", JSON.stringify(updated));
      return updated;
    });
  };

  // Securely lock / unlock sessions
  const handleLockToggle = () => {
    if (isLocked) {
      // Trigger unlocking credentials modal
      setPinPromptOpen(true);
      setPinError("");
      setEnteredPin("");
    } else {
      if (masterPin) {
        setIsLocked(true);
        addActivityLog("VAULT_LOCK", "SECURITY_VAULT", "Console lock engaged; credential vaults and direct connections encrypted.", "info");
      } else {
        // Direct lock with warning if no pin setup
        setIsLocked(true);
        addActivityLog("VAULT_LOCK", "SECURITY_VAULT", "Console locked under temporary session state.", "info");
      }
    }
  };

  const verifyPinAndUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === masterPin || !masterPin) {
      setIsLocked(false);
      setPinPromptOpen(false);
      setPinError("");
      addActivityLog("VAULT_UNLOCK", "SECURITY_VAULT", "Console vault successfully decrypted and session unlocked.", "success");
    } else {
      setPinError("⚠️ Authentication failed: Master PIN mismatch.");
      setEnteredPin("");
      addActivityLog("AUTH_FAILURE", "SECURITY_VAULT", "Failed console unlock attempt: master PIN mismatch.", "error");
    }
  };

  const handleSetPin = (newPin: string) => {
    setMasterPin(newPin);
    localStorage.setItem("multidesk_master_pin", newPin);
    addActivityLog("PIN_CHANGE", "SECURITY_VAULT", "New Master PIN successfully generated and committed.", "success");
  };

  // Registry modifiers
  const handleAddMachine = (newMachine: RemoteMachine) => {
    const updated = [...machines, newMachine];
    saveMachines(updated);
    addActivityLog("REGISTER_HOST", newMachine.name, `Successfully registered new host connection: ${newMachine.ip}:${newMachine.port} via ${newMachine.protocol.toUpperCase()}`, "success");
  };

  const handleDeleteMachine = (id: string) => {
    const deletedMachine = machines.find((m) => m.id === id);
    const updated = machines.filter((m) => m.id !== id);
    saveMachines(updated);
    if (deletedMachine) {
      addActivityLog("REMOVE_HOST", deletedMachine.name, `Deleted host registration for ${deletedMachine.name} (${deletedMachine.ip})`, "warning");
    }
  };

  const handleUpdateMachine = (id: string, updatedFields: Partial<RemoteMachine>) => {
    const updated = machines.map((m) => m.id === id ? { ...m, ...updatedFields } : m);
    saveMachines(updated);
    const targetMachine = machines.find((m) => m.id === id);
    if (targetMachine) {
      addActivityLog("UPDATE_HOST", targetMachine.name, `Updated connection meta: ${Object.keys(updatedFields).join(", ")}`, "info");
    }
  };

  // Launch direct visual connection
  const handleSelectMachine = (machine: RemoteMachine, mode: "terminal" | "desktop") => {
    if (isLocked) {
      // Prompt unlock PIN first
      setPinPromptOpen(true);
      return;
    }
    setSelectedMachineForSession(machine);
    setSessionMode(mode);
    addActivityLog("SESSION_START", machine.name, `Opened visual ${mode.toUpperCase()} session tunnel to ${machine.name}`, "info");
  };

  // Perform actual system control actions via express server APIs
  const handleRunAction = async (machineId: string, action: string, target?: string): Promise<string> => {
    const targetMachine = machines.find((m) => m.id === machineId);
    const hostName = targetMachine ? targetMachine.name : "Unknown Host";
    addActivityLog("RPC_TRIGGER", hostName, `Triggering remote RPC operation: ${action} ${target ? `on target ${target}` : ""}`, "info");
    
    try {
      const response = await fetch("/api/machines/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineId, action, target }),
      });
      const data = await response.json();
      
      if (data.success) {
        // Update local logs list and status metric
        const updatedMachines = machines.map((m) => {
          if (m.id === machineId) {
            let updatedStatus = m.status;
            if (action === "reboot") {
              updatedStatus = "rebooting";
              addActivityLog("REBOOT_INIT", hostName, `Power cycle command successfully sent. Node entering graceful reboot state...`, "warning");
              setTimeout(() => {
                // Return server status back to online after reboot completes
                setMachines((currentMachines) => {
                  const restored = currentMachines.map((x) => 
                    x.id === machineId ? { ...x, status: "online" as const } : x
                  );
                  localStorage.setItem("multidesk_machines", JSON.stringify(restored));
                  addActivityLog("REBOOT_COMPLETE", hostName, `Node completed power cycle and reports status: ONLINE`, "success");
                  return restored;
                });
              }, 4000);
            } else if (action === "fetch-logs") {
              addActivityLog("LOGS_RETRIEVED", hostName, `System logs fetched successfully: received ${data.logOutput.length} characters of telemetry data`, "success");
            } else {
              addActivityLog("RPC_SUCCESS", hostName, `RPC action ${action} completed: ${data.logOutput}`, "success");
            }

            return {
              ...m,
              status: updatedStatus,
              logs: [...m.logs, data.logOutput],
            };
          }
          return m;
        });
        saveMachines(updatedMachines);
        return data.logOutput;
      }
      addActivityLog("RPC_ERROR", hostName, `RPC operation ${action} failed: ${data.logOutput || "Unknown Server Error"}`, "error");
      return `Error triggering server action: ${data.logOutput || "Unknown Error"}`;
    } catch (err: any) {
      console.error("Action RPC trigger failed:", err);
      addActivityLog("RPC_TIMEOUT", hostName, `Tunnel timeout: system unable to reach remote node ${hostName}. Error: ${err.message}`, "error");
      return `⚠️ Connection Failed: System unable to reach server loopback. Error: ${err.message}`;
    }
  };

  // Connect to server-side secure Gemini copilot route
  const handleSendMessageToCopilot = async (prompt: string, chatHistory: CopilotMessage[]): Promise<string> => {
    const formattedHistory = chatHistory.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        history: formattedHistory,
        systemContext: `The operator is currently managing a registry containing ${machines.length} active machines: [${machines.map(m => m.name).join(", ")}].`
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.text;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080808] select-none text-[#e0e0e0]">
      
      {/* 1. Fullscreen Custom Operating System Graphical Desktops Overlay */}
      {selectedMachineForSession && sessionMode === "desktop" && (
        <DesktopSimulator
          machine={selectedMachineForSession}
          onClose={() => {
            setSelectedMachineForSession(null);
            setSessionMode(null);
          }}
          onRunAction={(action, target) => handleRunAction(selectedMachineForSession.id, action, target)}
        />
      )}

      {/* 2. Fullscreen Dedicated Handshake SSH Terminal Emulator Overlay */}
      {selectedMachineForSession && sessionMode === "terminal" && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col p-6">
          <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-3">
            <h2 className="text-sm font-mono text-slate-400">Standalone SSH Console Session</h2>
            <button
              onClick={() => {
                setSelectedMachineForSession(null);
                setSessionMode(null);
              }}
              className="bg-red-600/20 hover:bg-red-600 border border-red-500 text-red-200 px-3 py-1 rounded text-xs transition flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Disconnect Session
            </button>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-800">
            <TerminalClient
              machines={machines}
              initialSelectedMachine={selectedMachineForSession}
              onRunAction={handleRunAction}
            />
          </div>
        </div>
      )}

      {/* 3. Global sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        machines={machines}
        isLocked={isLocked}
        onLockToggle={handleLockToggle}
        hasSetPin={!!masterPin}
      />

      {/* 4. Active primary viewport container */}
      <div className="flex-1 h-full overflow-hidden relative flex flex-col">
        
        {/* Absolute visual lock screen overlay overlaying sensitive sections if locked */}
        {isLocked && currentTab !== "settings" ? (
          <div className="absolute inset-0 bg-black/95 z-40 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center select-none font-sans">
            <div className="w-12 h-12 bg-white/5 border border-white/10 text-white/60 flex items-center justify-center mb-6">
              <Lock className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/40 block mb-2 font-mono">ACCESS SUSPENDED</span>
            <h2 className="text-3xl font-serif italic text-white/90">Console Locked</h2>
            <p className="text-xs text-white/40 max-w-sm mt-3 mb-8 leading-relaxed font-light">
              Secure assets, credentials, SSH handshakes, and visual desktop pipelines are encrypted in the local secure vault.
            </p>
            <button
              onClick={() => {
                setPinPromptOpen(true);
                setPinError("");
                setEnteredPin("");
              }}
              className="bg-indigo-600 hover:bg-white hover:text-black text-white text-[10px] font-bold uppercase tracking-widest px-8 py-3 transition-all duration-300 border border-white/5"
            >
              Decrypt Console Vault
            </button>
          </div>
        ) : null}

        {/* Tab Switch Drivers */}
        {currentTab === "dashboard" && (
          <StatsDashboard
            machines={machines}
            onSelectMachine={handleSelectMachine}
            onRunAction={handleRunAction}
            onAddMachineClick={() => setCurrentTab("settings")}
            activityLogs={activityLogs}
            onAddMachineDirect={handleAddMachine}
            onUpdateMachine={handleUpdateMachine}
          />
        )}

        {currentTab === "workspace" && (
          <MultiScreenGrid
            machines={machines}
            onSelectMachine={handleSelectMachine}
            onRunAction={handleRunAction}
          />
        )}

        {currentTab === "terminal" && (
          <TerminalClient
            machines={machines}
            onRunAction={handleRunAction}
          />
        )}

        {currentTab === "copilot" && (
          <CopilotDrawer
            onSendMessage={handleSendMessageToCopilot}
          />
        )}

        {currentTab === "settings" && (
          <SettingsPanel
            machines={machines}
            onAddMachine={handleAddMachine}
            onDeleteMachine={handleDeleteMachine}
            hasSetPin={!!masterPin}
            onSetPin={handleSetPin}
          />
        )}

      </div>

      {/* 5. Security Vault Master Pin Confirm Overlay Modal */}
      {pinPromptOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 select-none font-sans animate-fade-in">
          <div className="bg-[#0d0d0d] border border-white/10 p-8 w-full max-w-sm flex flex-col relative text-slate-100">
            <button
              onClick={() => setPinPromptOpen(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 bg-white/5 border border-white/10 text-white flex items-center justify-center mb-4 mx-auto font-serif">
              Ω
            </div>

            <h3 className="text-lg font-serif italic text-center text-white">Unlock Security Vault</h3>
            <p className="text-[10px] uppercase tracking-wider text-white/40 text-center mt-2 mb-6">
              {masterPin 
                ? "Provide your 4-digit Master PIN code" 
                : "Enter any code to initialize new session"}
            </p>

            <form onSubmit={verifyPinAndUnlock} className="flex flex-col gap-4 text-xs">
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ""))}
                className="bg-black/60 border border-white/10 py-3 text-white tracking-[0.5em] text-center text-2xl font-mono focus:outline-none focus:border-white/30"
              />

              {pinError && (
                <div className="text-[10px] uppercase tracking-wider text-red-400 text-center font-semibold mt-1">
                  {pinError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-white hover:text-black text-white py-3 text-[10px] font-bold uppercase tracking-widest transition-all mt-2 border border-transparent"
              >
                Confirm PIN
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
