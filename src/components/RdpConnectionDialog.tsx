import React, { useState } from "react";
import { RemoteMachine } from "../types";
import {
  Monitor,
  FolderOpen,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  Volume2,
  Keyboard,
  Printer,
  Copy,
  Sliders,
  ShieldAlert,
  Server,
  Download,
  Check,
  Plus,
  Trash2,
  Save
} from "lucide-react";

interface RdpConnectionDialogProps {
  machine: RemoteMachine;
  onClose: () => void;
  onConnect: (updatedFields: Partial<RemoteMachine>) => void;
}

export default function RdpConnectionDialog({
  machine,
  onClose,
  onConnect
}: RdpConnectionDialogProps) {
  const [activeTab, setActiveTab] = useState<"general" | "display" | "resources" | "experience" | "advanced">("general");
  const [showOptions, setShowOptions] = useState(true);

  // General state
  const [computer, setComputer] = useState(machine.ip);
  const [username, setUsername] = useState(machine.username);
  const [password, setPassword] = useState(machine.password || "");
  const [alwaysAsk, setAlwaysAsk] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Display state
  const [screenSize, setScreenSize] = useState(3); // 1 to 4: Small to Full Screen
  const [colorDepth, setColorDepth] = useState("Highest Quality (32 bit)");

  // Resources state
  const [audioSetting, setAudioSetting] = useState("play-local");
  const [keyboardSetting, setKeyboardSetting] = useState("fullscreen-only");
  const [sharePrinter, setSharePrinter] = useState(true);
  const [shareClipboard, setShareClipboard] = useState(true);
  const [shareDrives, setShareDrives] = useState(false);

  // Experience state
  const [connectionSpeed, setConnectionSpeed] = useState("lan");
  const [bitmapCaching, setBitmapCaching] = useState(true);
  const [showThemes, setShowThemes] = useState(true);
  const [fontSmoothing, setFontSmoothing] = useState(true);

  // Advanced state
  const [authFailureAction, setAuthFailureAction] = useState("warn");
  const [useGateway, setUseGateway] = useState(false);

  // Seed standard profiles specifically matching the machine IP and context
  const DEFAULT_PROFILES = [
    {
      name: "Default",
      computer: machine.ip,
      username: machine.username,
      password: machine.password || "",
      alwaysAsk: false,
      screenSize: 3,
      colorDepth: "Highest Quality (32 bit)",
      audioSetting: "play-local",
      keyboardSetting: "fullscreen-only",
      sharePrinter: true,
      shareClipboard: true,
      shareDrives: false,
      connectionSpeed: "lan",
      bitmapCaching: true,
      showThemes: true,
      fontSmoothing: true,
      authFailureAction: "warn",
      useGateway: false,
    },
    {
      name: "Work Office",
      computer: machine.ip === "10.0.4.15" ? "10.0.4.15" : "192.168.10.135",
      username: machine.ip === "10.0.4.15" ? "Administrator" : "OBVS\\administrator",
      password: "Password_Prod_Secure!",
      alwaysAsk: false,
      screenSize: 4, // Full Screen
      colorDepth: "Highest Quality (32 bit)",
      audioSetting: "play-local",
      keyboardSetting: "fullscreen-only",
      sharePrinter: true,
      shareClipboard: true,
      shareDrives: true,
      connectionSpeed: "lan",
      bitmapCaching: true,
      showThemes: true,
      fontSmoothing: true,
      authFailureAction: "warn",
      useGateway: false,
    },
    {
      name: "Home/Remote",
      computer: machine.ip,
      username: "home_operator",
      password: "SecureHomePassword!",
      alwaysAsk: true,
      screenSize: 3,
      colorDepth: "True Color (24 bit)",
      audioSetting: "play-local",
      keyboardSetting: "fullscreen-only",
      sharePrinter: false,
      shareClipboard: true,
      shareDrives: false,
      connectionSpeed: "broadband",
      bitmapCaching: true,
      showThemes: false,
      fontSmoothing: true,
      authFailureAction: "warn",
      useGateway: false,
    },
    {
      name: "Jump Server Tunnel",
      computer: "10.100.1.254",
      username: "jump_operator",
      password: "JumpGatePassword123",
      alwaysAsk: false,
      screenSize: 1, // 1024x768
      colorDepth: "High Color (16 bit)",
      audioSetting: "do-not-play",
      keyboardSetting: "fullscreen-only",
      sharePrinter: false,
      shareClipboard: true,
      shareDrives: false,
      connectionSpeed: "modem",
      bitmapCaching: true,
      showThemes: false,
      fontSmoothing: false,
      authFailureAction: "connect",
      useGateway: true,
    }
  ];

  const [profiles, setProfiles] = useState<any[]>(() => {
    const saved = localStorage.getItem(`rdp_profiles_${machine.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_PROFILES;
      }
    }
    return DEFAULT_PROFILES;
  });

  const [selectedProfileName, setSelectedProfileName] = useState("Default");
  const [newProfileName, setNewProfileName] = useState("");
  const [showNewProfileInput, setShowNewProfileInput] = useState(false);

  const loadProfile = (prof: any) => {
    if (!prof) return;
    setComputer(prof.computer);
    setUsername(prof.username);
    setPassword(prof.password || "");
    setAlwaysAsk(prof.alwaysAsk ?? false);
    setScreenSize(prof.screenSize ?? 3);
    setColorDepth(prof.colorDepth ?? "Highest Quality (32 bit)");
    setAudioSetting(prof.audioSetting ?? "play-local");
    setKeyboardSetting(prof.keyboardSetting ?? "fullscreen-only");
    setSharePrinter(prof.sharePrinter ?? true);
    setShareClipboard(prof.shareClipboard ?? true);
    setShareDrives(prof.shareDrives ?? false);
    setConnectionSpeed(prof.connectionSpeed ?? "lan");
    setBitmapCaching(prof.bitmapCaching ?? true);
    setShowThemes(prof.showThemes ?? true);
    setFontSmoothing(prof.fontSmoothing ?? true);
    setAuthFailureAction(prof.authFailureAction ?? "warn");
    setUseGateway(prof.useGateway ?? false);
  };

  const handleProfileChange = (profileName: string) => {
    setSelectedProfileName(profileName);
    const found = profiles.find(p => p.name === profileName);
    if (found) {
      loadProfile(found);
    }
  };

  const saveCurrentProfile = () => {
    const updated = profiles.map(p => {
      if (p.name === selectedProfileName) {
        return {
          ...p,
          computer,
          username,
          password,
          alwaysAsk,
          screenSize,
          colorDepth,
          audioSetting,
          keyboardSetting,
          sharePrinter,
          shareClipboard,
          shareDrives,
          connectionSpeed,
          bitmapCaching,
          showThemes,
          fontSmoothing,
          authFailureAction,
          useGateway,
        };
      }
      return p;
    });
    setProfiles(updated);
    localStorage.setItem(`rdp_profiles_${machine.id}`, JSON.stringify(updated));
    setSaveStatus(`Saved settings to '${selectedProfileName}'!`);
    setTimeout(() => setSaveStatus(null), 1500);
  };

  const handleAddNewProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = newProfileName.trim();
    if (!nameTrimmed) return;
    if (profiles.some(p => p.name.toLowerCase() === nameTrimmed.toLowerCase())) {
      alert("A profile with that name already exists!");
      return;
    }

    const newProf = {
      name: nameTrimmed,
      computer,
      username,
      password,
      alwaysAsk,
      screenSize,
      colorDepth,
      audioSetting,
      keyboardSetting,
      sharePrinter,
      shareClipboard,
      shareDrives,
      connectionSpeed,
      bitmapCaching,
      showThemes,
      fontSmoothing,
      authFailureAction,
      useGateway,
    };

    const updated = [...profiles, newProf];
    setProfiles(updated);
    localStorage.setItem(`rdp_profiles_${machine.id}`, JSON.stringify(updated));
    setSelectedProfileName(nameTrimmed);
    setNewProfileName("");
    setShowNewProfileInput(false);
    setSaveStatus(`Created profile '${nameTrimmed}'!`);
    setTimeout(() => setSaveStatus(null), 1500);
  };

  const handleDeleteProfile = () => {
    if (["Default", "Work Office", "Home/Remote", "Jump Server Tunnel"].includes(selectedProfileName)) {
      alert("Cannot delete standard system-seeded profiles.");
      return;
    }
    if (confirm(`Are you sure you want to delete profile '${selectedProfileName}'?`)) {
      const updated = profiles.filter(p => p.name !== selectedProfileName);
      setProfiles(updated);
      localStorage.setItem(`rdp_profiles_${machine.id}`, JSON.stringify(updated));
      setSelectedProfileName("Default");
      const defaultProf = updated.find(p => p.name === "Default") || DEFAULT_PROFILES[0];
      loadProfile(defaultProf);
      setSaveStatus(`Deleted profile!`);
      setTimeout(() => setSaveStatus(null), 1500);
    }
  };

  const handleSave = () => {
    saveCurrentProfile();
  };

  const handleSaveAs = () => {
    const rdpContent = `screen mode id:i:2
use multimon:i:0
desktopwidth:i:${screenSize === 1 ? 1024 : screenSize === 2 ? 1280 : screenSize === 3 ? 1440 : 1920}
desktopheight:i:${screenSize === 1 ? 768 : screenSize === 2 ? 720 : screenSize === 3 ? 900 : 1080}
session bpp:i:${colorDepth.includes("32") ? 32 : colorDepth.includes("24") ? 24 : 16}
winposstr:s:0,3,0,0,1024,768
compression:i:1
keyboardhook:i:2
audiocapturemode:i:0
videoplaybackmode:i:1
connection type:i:${connectionSpeed === "lan" ? 7 : connectionSpeed === "broadband" ? 4 : 1}
displayconnectionbar:i:1
alternate shell:s:
shell working directory:s:
disable wallpaper:i:${showThemes ? 0 : 1}
disable full window drag:i:${showThemes ? 0 : 1}
disable menu anims:i:${showThemes ? 0 : 1}
disable themes:i:${showThemes ? 0 : 1}
disable cursor setting:i:0
bitmapcachepersistenable:i:${bitmapCaching ? 1 : 0}
font smoothing:i:${fontSmoothing ? 1 : 0}
redirectprinters:i:${sharePrinter ? 1 : 0}
redirectclipboard:i:${shareClipboard ? 1 : 0}
redirectdrives:i:${shareDrives ? 1 : 0}
audiomode:i:${audioSetting === "play-local" ? 0 : audioSetting === "do-not-play" ? 1 : 2}
full address:s:${computer}
username:s:${username}
always ask for credentials:i:${alwaysAsk ? 1 : 0}
gatewayusagemethod:i:${useGateway ? 2 : 0}
authentication level:i:${authFailureAction === "warn" ? 1 : authFailureAction === "cancel" ? 2 : 0}
`;

    const blob = new Blob([rdpContent], { type: "application/x-rdp" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const profileSuffix = selectedProfileName ? `-${selectedProfileName.replace(/\s+/g, "_")}` : "";
    link.download = `${machine.name || "connection"}${profileSuffix}.rdp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConnectClick = () => {
    // Call connect passing the updated machine attributes back
    onConnect({
      ip: computer,
      username,
      password,
      // Pass back additional configs as part of the session
    });
  };

  const getScreenSizeLabel = () => {
    switch (screenSize) {
      case 1: return "1024 x 768 pixels";
      case 2: return "1280 x 720 pixels";
      case 3: return "1440 x 900 pixels";
      case 4: return "Full Screen (1920 x 1080)";
      default: return "Full Screen";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none font-sans">
      {/* RDP Window Frame */}
      <div className="bg-[#f0f0f0] border border-[#a0a0a0] rounded-t-lg shadow-2xl w-[460px] flex flex-col text-slate-800 text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        
        {/* Window Title Bar */}
        <div className="bg-white border-b border-[#e0e0e0] h-[34px] px-3 flex justify-between items-center select-none">
          <div className="flex items-center gap-2">
            {/* Beautiful computer network simulator icon representation */}
            <div className="w-[18px] h-[18px] bg-gradient-to-br from-blue-500 to-sky-600 rounded flex items-center justify-center text-white p-0.5 shadow-sm">
              <Monitor className="w-3.5 h-3.5" />
            </div>
            <span className="text-[12px] font-medium text-[#1c1c1c]">Remote Desktop Connection</span>
          </div>
          <div className="flex items-center">
            {/* Windows Style close button */}
            <button
              onClick={onClose}
              className="w-10 h-[34px] hover:bg-red-500 hover:text-white flex items-center justify-center text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection Row (Only visible if showOptions is true) */}
        {showOptions && (
          <div className="flex bg-[#f3f3f3] border-b border-[#ccc] px-2 pt-1 gap-0.5">
            {[
              { id: "general", label: "General" },
              { id: "display", label: "Display" },
              { id: "resources", label: "Local Resources" },
              { id: "experience", label: "Experience" },
              { id: "advanced", label: "Advanced" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-[11px] font-normal transition-all border-t border-x rounded-t ${
                  activeTab === tab.id
                    ? "bg-white border-[#ccc] border-b-transparent translate-y-[1px] font-medium text-blue-600 z-10"
                    : "bg-transparent border-transparent hover:bg-white/50 text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab Body Contents Container */}
        <div className="bg-white p-5 flex-1 min-h-[290px] border-b border-[#dcdcdc]">
          
          {/* Option State: Reduced view (Options hidden) */}
          {!showOptions ? (
            <div className="flex flex-col gap-4">
              {/* Short General View */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                  <Monitor className="w-6 h-6" />
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-16 text-slate-500 font-semibold text-right">Computer:</span>
                    <input
                      type="text"
                      value={computer}
                      onChange={(e) => setComputer(e.target.value)}
                      className="flex-1 border border-[#ccc] px-2 py-1 bg-white hover:border-slate-400 focus:border-blue-500 outline-none text-slate-800 text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-16 text-slate-500 font-semibold text-right">User name:</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="flex-1 border border-[#ccc] px-2 py-1 bg-white hover:border-slate-400 focus:border-blue-500 outline-none text-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: GENERAL */}
              {activeTab === "general" && (
                <div className="flex flex-col gap-4">
                  {/* Logon settings section */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#eef4f9] rounded flex items-center justify-center text-blue-600 border border-blue-200 shrink-0">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <h4 className="font-semibold text-blue-800 border-b border-slate-100 pb-1 text-[11px] uppercase tracking-wider">Logon settings</h4>
                      <p className="text-slate-500 text-[10px] leading-tight">Enter the name of the remote computer.</p>
                      
                      <div className="grid grid-cols-3 items-center gap-1.5 mt-1.5">
                        <span className="text-slate-500 text-right pr-2">Computer:</span>
                        <input
                          type="text"
                          value={computer}
                          onChange={(e) => setComputer(e.target.value)}
                          className="col-span-2 border border-[#ccc] px-2 py-1 hover:border-slate-400 focus:border-blue-500 outline-none font-mono text-[11px]"
                        />
                      </div>

                      <div className="grid grid-cols-3 items-center gap-1.5 mt-1">
                        <span className="text-slate-500 text-right pr-2">User name:</span>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="col-span-2 border border-[#ccc] px-2 py-1 hover:border-slate-400 focus:border-blue-500 outline-none font-mono text-[11px]"
                        />
                      </div>

                      <div className="grid grid-cols-3 items-center gap-1.5 mt-1">
                        <span className="text-slate-500 text-right pr-2">Password:</span>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="col-span-2 border border-[#ccc] px-2 py-1 hover:border-slate-400 focus:border-blue-500 outline-none font-mono text-[11px]"
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 pl-[76px]">
                        <input
                          type="checkbox"
                          id="alwaysAsk"
                          checked={alwaysAsk}
                          onChange={(e) => setAlwaysAsk(e.target.checked)}
                          className="rounded border-[#ccc]"
                        />
                        <label htmlFor="alwaysAsk" className="text-slate-600 text-[11px] cursor-pointer selection:bg-transparent">
                          Always ask for credentials
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Connection Profiles section */}
                  <div className="flex items-start gap-4 border-t border-[#f0f0f0] pt-3.5">
                    <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 border border-indigo-200 shrink-0">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <h4 className="font-semibold text-indigo-800 border-b border-slate-100 pb-1 text-[11px] uppercase tracking-wider">RDP Connection Profiles</h4>
                      <p className="text-slate-500 text-[10px] leading-snug">Save and switch between connection profiles (e.g., Work, Home, Jump Server) for this host.</p>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <select
                          value={selectedProfileName}
                          onChange={(e) => handleProfileChange(e.target.value)}
                          className="flex-1 border border-[#ccc] px-2 py-1 outline-none text-[11px] bg-white hover:border-slate-400 focus:border-blue-500 font-medium"
                        >
                          {profiles.map((p) => (
                            <option key={p.name} value={p.name}>
                              {p.name} {["Default", "Work Office", "Home/Remote", "Jump Server Tunnel"].includes(p.name) ? "(System)" : ""}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={saveCurrentProfile}
                          title="Save settings to active profile"
                          className="bg-white border border-[#ccc] hover:bg-slate-50 p-1.5 rounded text-slate-700 transition flex items-center gap-1 font-medium"
                        >
                          <Save className="w-3.5 h-3.5 text-slate-500" />
                          <span>Save</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowNewProfileInput(!showNewProfileInput)}
                          title="Create new profile"
                          className="bg-white border border-[#ccc] hover:bg-slate-50 p-1.5 rounded text-slate-700 transition flex items-center gap-1 font-medium"
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-500" />
                          <span>New</span>
                        </button>

                        {!["Default", "Work Office", "Home/Remote", "Jump Server Tunnel"].includes(selectedProfileName) && (
                          <button
                            type="button"
                            onClick={handleDeleteProfile}
                            title="Delete custom profile"
                            className="bg-white border border-[#ccc] hover:bg-red-50 hover:border-red-300 p-1.5 rounded text-red-600 transition flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Inline custom profile creation input */}
                      {showNewProfileInput && (
                        <form onSubmit={handleAddNewProfile} className="flex gap-1.5 mt-1.5 items-center bg-slate-50 p-2 border border-dashed border-[#ccc] rounded animate-in slide-in-from-top-1 duration-150">
                          <input
                            type="text"
                            placeholder="e.g., Work Laptop"
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                            className="flex-1 border border-[#ccc] px-2 py-0.5 outline-none text-[11px]"
                            required
                          />
                          <button
                            type="submit"
                            className="bg-[#0066cc] text-white px-2 py-0.5 rounded text-[10px] font-semibold hover:bg-[#0052a3]"
                          >
                            Create
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowNewProfileInput(false); setNewProfileName(""); }}
                            className="text-slate-500 hover:text-slate-700 text-[10px] px-1"
                          >
                            Cancel
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Connection settings section */}
                  <div className="flex items-start gap-4 border-t border-[#f0f0f0] pt-3.5">
                    <div className="w-10 h-10 bg-amber-50 rounded flex items-center justify-center text-amber-600 border border-amber-200 shrink-0">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <h4 className="font-semibold text-amber-800 border-b border-slate-100 pb-1 text-[11px] uppercase tracking-wider">Connection settings</h4>
                      <p className="text-slate-500 text-[10px] leading-snug">Save the current connection settings to an RDP file or open a saved connection.</p>
                      
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleSave}
                          className="bg-white border border-[#ccc] hover:bg-slate-50 px-3 py-1 rounded shadow-xs text-[11px] font-medium text-slate-700 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleSaveAs}
                          className="bg-white border border-[#ccc] hover:bg-slate-50 px-3 py-1 rounded shadow-xs text-[11px] font-medium text-slate-700 transition flex items-center gap-1"
                        >
                          <Download className="w-3 h-3 text-slate-500" />
                          Save As...
                        </button>
                        {saveStatus && (
                          <span className="text-emerald-600 flex items-center gap-1 font-mono text-[10px] ml-auto animate-pulse">
                            <Check className="w-3 h-3" /> {saveStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DISPLAY */}
              {activeTab === "display" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center text-blue-600 border border-blue-200 shrink-0">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <h4 className="font-semibold text-blue-800 border-b border-slate-100 pb-1 text-[11px] uppercase tracking-wider">Remote desktop size</h4>
                      <p className="text-slate-500 text-[10px] leading-snug">Choose the size of your remote desktop. Drag the slider all the way to the right to go fullscreen.</p>
                      
                      {/* Interactive Slider */}
                      <div className="flex flex-col gap-2 mt-4 px-2">
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>Less (1024 x 768)</span>
                          <span className="text-blue-600 font-bold">{getScreenSizeLabel()}</span>
                          <span>More (Full Screen)</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="4"
                          step="1"
                          value={screenSize}
                          onChange={(e) => setScreenSize(parseInt(e.target.value))}
                          className="w-full accent-blue-600 h-1 bg-[#ddd] rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 border-t border-[#f0f0f0] pt-3.5 mt-2">
                    <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 border border-indigo-200 shrink-0">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <h4 className="font-semibold text-indigo-800 border-b border-slate-100 pb-1 text-[11px] uppercase tracking-wider">Colors</h4>
                      <p className="text-slate-500 text-[10px] leading-snug">Choose the color depth of your remote session.</p>
                      
                      <div className="mt-2 flex items-center gap-3">
                        <select
                          value={colorDepth}
                          onChange={(e) => setColorDepth(e.target.value)}
                          className="flex-1 border border-[#ccc] px-2 py-1 outline-none text-[11px] bg-white hover:border-slate-400 focus:border-blue-500"
                        >
                          <option>High Color (15 bit)</option>
                          <option>High Color (16 bit)</option>
                          <option>True Color (24 bit)</option>
                          <option>Highest Quality (32 bit)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LOCAL RESOURCES */}
              {activeTab === "resources" && (
                <div className="flex flex-col gap-4">
                  {/* Audio settings */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#e8fcf0] rounded flex items-center justify-center text-emerald-600 border border-emerald-200 shrink-0">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <h4 className="font-semibold text-emerald-800 border-b border-slate-100 pb-1 text-[11px] uppercase tracking-wider">Remote audio</h4>
                      <p className="text-slate-500 text-[10px] leading-snug">Configure playback and recording options for audio from the remote host.</p>
                      
                      <div className="mt-2 flex flex-col gap-1 text-slate-600 pl-1">
                        {[
                          { id: "play-local", label: "Play on this computer" },
                          { id: "do-not-play", label: "Do not play" },
                          { id: "play-remote", label: "Play on remote computer" }
                        ].map((item) => (
                          <label key={item.id} className="flex items-center gap-2 cursor-pointer text-[11px] selection:bg-transparent">
                            <input
                              type="radio"
                              name="audio"
                              checked={audioSetting === item.id}
                              onChange={() => setAudioSetting(item.id)}
                              className="accent-blue-600"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Local devices */}
                  <div className="flex items-start gap-4 border-t border-[#f0f0f0] pt-3.5">
                    <div className="w-10 h-10 bg-amber-50 rounded flex items-center justify-center text-amber-600 border border-amber-200 shrink-0">
                      <Keyboard className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <h4 className="font-semibold text-amber-800 border-b border-slate-100 pb-1 text-[11px] uppercase tracking-wider">Local devices and resources</h4>
                      <p className="text-slate-500 text-[10px] leading-snug">Choose the devices and resources on this computer that you want to use in your remote session.</p>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2.5 text-slate-600 pl-1">
                        <label className="flex items-center gap-2 cursor-pointer selection:bg-transparent">
                          <input
                            type="checkbox"
                            checked={sharePrinter}
                            onChange={(e) => setSharePrinter(e.target.checked)}
                            className="rounded border-[#ccc]"
                          />
                          <span className="flex items-center gap-1"><Printer className="w-3 h-3 text-slate-500" /> Printers</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer selection:bg-transparent">
                          <input
                            type="checkbox"
                            checked={shareClipboard}
                            onChange={(e) => setShareClipboard(e.target.checked)}
                            className="rounded border-[#ccc]"
                          />
                          <span className="flex items-center gap-1"><Copy className="w-3 h-3 text-slate-500" /> Clipboard</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer selection:bg-transparent col-span-2">
                          <input
                            type="checkbox"
                            checked={shareDrives}
                            onChange={(e) => setShareDrives(e.target.checked)}
                            className="rounded border-[#ccc]"
                          />
                          <span className="flex items-center gap-1"><FolderOpen className="w-3 h-3 text-slate-500" /> Local disk drives (C: / D:)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: EXPERIENCE */}
              {activeTab === "experience" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center text-blue-600 border border-blue-200 shrink-0">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <h4 className="font-semibold text-blue-800 border-b border-slate-100 pb-1 text-[11px] uppercase tracking-wider">Performance optimization</h4>
                      <p className="text-slate-500 text-[10px] leading-snug">Choose your connection speed to optimize response times and graphic performance.</p>
                      
                      <div className="mt-2 flex items-center gap-3">
                        <select
                          value={connectionSpeed}
                          onChange={(e) => setConnectionSpeed(e.target.value)}
                          className="flex-1 border border-[#ccc] px-2 py-1 outline-none text-[11px] bg-white hover:border-slate-400 focus:border-blue-500"
                        >
                          <option value="modem">Modem (56 Kbps) - No wallpaper</option>
                          <option value="broadband">High-speed Broadband (2 Mbps - 10 Mbps)</option>
                          <option value="lan">LAN (10 Mbps or more) - All features</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5 mt-3 text-slate-600 pl-1">
                        <label className="flex items-center gap-2 cursor-pointer selection:bg-transparent">
                          <input
                            type="checkbox"
                            checked={fontSmoothing}
                            onChange={(e) => setFontSmoothing(e.target.checked)}
                            className="rounded border-[#ccc]"
                          />
                          <span>Font smoothing (ClearType)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer selection:bg-transparent">
                          <input
                            type="checkbox"
                            checked={showThemes}
                            onChange={(e) => setShowThemes(e.target.checked)}
                            className="rounded border-[#ccc]"
                          />
                          <span>Desktop composition & Themes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer selection:bg-transparent">
                          <input
                            type="checkbox"
                            checked={bitmapCaching}
                            onChange={(e) => setBitmapCaching(e.target.checked)}
                            className="rounded border-[#ccc]"
                          />
                          <span>Persistent bitmap caching</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ADVANCED */}
              {activeTab === "advanced" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded flex items-center justify-center text-red-600 border border-red-200 shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <h4 className="font-semibold text-red-800 border-b border-slate-100 pb-1 text-[11px] uppercase tracking-wider">Server authentication</h4>
                      <p className="text-slate-500 text-[10px] leading-snug">Verify that you are connecting to the intended remote computer. Security tokens will be negotiated dynamically.</p>
                      
                      <div className="mt-2">
                        <select
                          value={authFailureAction}
                          onChange={(e) => setAuthFailureAction(e.target.value)}
                          className="w-full border border-[#ccc] px-2 py-1 outline-none text-[11px] bg-white hover:border-slate-400 focus:border-blue-500"
                        >
                          <option value="warn">Warn me if authentication fails</option>
                          <option value="connect">Always connect even if auth fails</option>
                          <option value="cancel">Do not connect if auth fails</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 border-t border-[#f0f0f0] pt-3.5">
                    <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 border border-indigo-200 shrink-0">
                      <Server className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <h4 className="font-semibold text-indigo-800 border-b border-slate-100 pb-1 text-[11px] uppercase tracking-wider">Connect from anywhere</h4>
                      <p className="text-slate-500 text-[10px] leading-snug">Configure settings to connect when you are not on your corporate network (RD Gateway proxy settings).</p>
                      
                      <div className="flex items-center gap-2 mt-1.5 pl-1">
                        <input
                          type="checkbox"
                          id="useGateway"
                          checked={useGateway}
                          onChange={(e) => setUseGateway(e.target.checked)}
                          className="rounded border-[#ccc]"
                        />
                        <label htmlFor="useGateway" className="text-slate-600 text-[11px] cursor-pointer selection:bg-transparent">
                          Use RD Gateway server proxy
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Window Bottom Actions */}
        <div className="bg-[#f0f0f0] h-[52px] px-4 flex items-center justify-between border-t border-white">
          {/* Hide/Show options trigger */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="text-slate-700 hover:text-blue-600 text-[11px] font-normal flex items-center gap-1 transition-colors"
          >
            {showOptions ? (
              <>
                <ChevronUp className="w-4 h-4 text-slate-500" />
                <span>Hide Options</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-slate-500" />
                <span>Show Options</span>
              </>
            )}
          </button>

          {/* Action buttons on right */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleConnectClick}
              className="bg-[#0066cc] hover:bg-[#0052a3] text-white font-medium px-5 py-1.5 rounded text-[11px] shadow-sm transition"
            >
              Connect
            </button>
            <button
              onClick={onClose}
              className="bg-[#e1e1e1] hover:bg-[#d5d5d5] border border-[#acacac] text-slate-800 px-4 py-1.5 rounded text-[11px] transition"
            >
              Cancel
            </button>
            <button
              onClick={() => alert("Remote Desktop Connection (RDP) helps you connect to a remote computer running Windows. Ensure the computer has RDP enabled and you are connected to the same virtual tunnel network.")}
              className="bg-[#e1e1e1] hover:bg-[#d5d5d5] border border-[#acacac] text-slate-800 px-3 py-1.5 rounded text-[11px] transition flex items-center justify-center"
              title="Help"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
