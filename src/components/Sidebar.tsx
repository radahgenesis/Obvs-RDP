import React from "react";
import { 
  LayoutDashboard, 
  Grid3X3, 
  Terminal, 
  BotMessageSquare, 
  Settings, 
  Lock, 
  Unlock, 
  ShieldAlert,
  Server,
  Activity,
  UserCheck
} from "lucide-react";
import { RemoteMachine } from "../types";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  machines: RemoteMachine[];
  isLocked: boolean;
  onLockToggle: () => void;
  hasSetPin: boolean;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  machines,
  isLocked,
  onLockToggle,
  hasSetPin
}: SidebarProps) {
  const onlineCount = machines.filter((m) => m.status === "online").length;
  const totalCount = machines.length;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "workspace", label: "Remote Grid View", icon: Grid3X3, badge: onlineCount },
    { id: "terminal", label: "Global Terminals", icon: Terminal },
    { id: "copilot", label: "Gemini Copilot", icon: BotMessageSquare, highlight: true },
    { id: "settings", label: "Server Manager", icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full text-slate-300 font-sans shrink-0">
      
      {/* Brand logo & status info */}
      <div className="p-6 border-b border-slate-800 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center font-bold text-black text-lg select-none font-serif">
            Ω
          </div>
          <div>
            <h2 className="text-xs font-semibold tracking-[0.25em] text-white uppercase leading-none">OBVS REMOTE</h2>
            <span className="text-[9px] text-white/40 font-mono uppercase tracking-widest block mt-1">MultiDesk v4.2</span>
          </div>
        </div>
        
        {/* Connection status pills */}
        <div className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-white/40">
          <div className="flex justify-between items-center bg-white/5 border border-white/10 px-3 py-1.5 font-mono">
            <span>Global status</span>
            <span className="text-emerald-400 italic font-bold">ALL SECURE</span>
          </div>
          <div className="flex justify-between items-center text-[9px] font-mono mt-1">
            <span>Nodes active</span>
            <span className="text-white font-bold">{onlineCount} / {totalCount}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation links */}
      <div className="flex-1 px-6 py-6 overflow-y-auto flex flex-col justify-between">
        <nav className="space-y-6">
          <span className="text-[10px] uppercase tracking-[0.2em] mb-4 text-white/30 italic block">Command Center</span>
          
          <ul className="space-y-3">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentTab === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      if (!isLocked || item.id === "settings") {
                        setCurrentTab(item.id);
                      }
                    }}
                    disabled={isLocked && item.id !== "settings"}
                    className={`w-full text-left py-2 border-b border-white/10 flex items-center justify-between transition-all ${
                      isActive
                        ? "text-white border-white/40 font-semibold"
                        : isLocked && item.id !== "settings"
                        ? "text-white/20 cursor-not-allowed border-transparent"
                        : "text-white/40 hover:text-white hover:border-white/20 border-transparent"
                    }`}
                  >
                    <span className="text-lg font-light tracking-wide">{item.label}</span>
                    
                    {item.badge !== undefined ? (
                      <span className="text-[9px] font-mono tracking-normal bg-white/5 border border-white/10 px-2 py-0.5 text-white/60">
                        {item.badge}
                      </span>
                    ) : (
                      <IconComponent className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "opacity-30"}`} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Dynamic active sessions stat */}
        <div className="pt-6 border-t border-white/10 mt-6 shrink-0">
          <div className="text-[40px] font-serif italic leading-none font-bold text-white/90">{onlineCount}</div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-white/40 mt-1">Live Tunnel Channels</div>
        </div>
      </div>

      {/* Security lock module at bottom */}
      <div className="p-6 border-t border-slate-800 bg-black/40 flex flex-col gap-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-white/40">
          <span>Security Protocol</span>
          <span className={`font-mono text-[9px] ${hasSetPin ? "text-emerald-400" : "text-amber-500"}`}>
            {hasSetPin ? "PIN ENCRYPTED" : "UNSECURED"}
          </span>
        </div>

        {isLocked ? (
          <div className="bg-white/5 border border-red-500/30 p-3 flex flex-col gap-2">
            <span className="text-[9px] uppercase tracking-widest text-red-400 font-mono block">Vault is locked</span>
            <button
              onClick={onLockToggle}
              className="w-full bg-red-600 hover:bg-white hover:text-black text-white py-2 text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Unlock Console
            </button>
          </div>
        ) : (
          <button
            onClick={onLockToggle}
            className="w-full bg-white/5 hover:bg-white hover:text-black border border-white/10 text-white/80 py-2 text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            Lock Session
          </button>
        )}
      </div>

    </div>
  );
}
