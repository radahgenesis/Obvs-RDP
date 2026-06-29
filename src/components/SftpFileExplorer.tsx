import React, { useState, useEffect } from "react";
import { RemoteMachine, RemoteFile } from "../types";
import {
  FolderOpen,
  FileText,
  Upload,
  Download,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowRight,
  RefreshCw,
  HardDrive,
  Cpu,
  LogOut,
  Sparkles,
  Search,
  CheckCircle,
  HelpCircle,
  FileCode,
  FolderPlus,
  Play
} from "lucide-react";

interface SftpFileExplorerProps {
  machines: RemoteMachine[];
  onUpdateMachineFileSystem: (machineId: string, updatedFiles: RemoteFile[]) => void;
}

interface LocalFile {
  name: string;
  size: string;
  content: string;
  type: "file" | "directory";
}

export default function SftpFileExplorer({ machines, onUpdateMachineFileSystem }: SftpFileExplorerProps) {
  const sftpCapableMachines = machines.filter(m => m.protocol === "ssh" || m.os === "linux" || m.os === "macos");
  const [selectedMachine, setSelectedMachine] = useState<RemoteMachine | null>(null);
  
  // Connection state
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sftpLogs, setSftpLogs] = useState<string[]>([]);

  // Remote Path navigation states
  const [currentRemotePath, setCurrentRemotePath] = useState("");
  const [remoteFiles, setRemoteFiles] = useState<RemoteFile[]>([]);
  const [selectedRemoteFile, setSelectedRemoteFile] = useState<RemoteFile | null>(null);

  // Search filter
  const [remoteSearch, setRemoteSearch] = useState("");

  // Transfer Queue & Progress state
  const [activeTransfers, setActiveTransfers] = useState<{
    fileName: string;
    direction: "upload" | "download";
    progress: number;
    speed: string;
    totalSize: string;
  }[]>([]);

  // Local Files Sandbox (Simulating the user's local disk)
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([
    { name: "local-app-v2.json", size: "2.4 KB", content: '{\n  "appName": "MultiDesk Secure CLI",\n  "version": "2.4.0",\n  "environment": "production"\n}', type: "file" },
    { name: "build-artifact.tar.gz", size: "14.8 MB", content: "[Binary Gzipped Archive Content]", type: "file" },
    { name: "production-schema.sql", size: "840 B", content: "CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) UNIQUE,\n  password_hash TEXT\n);", type: "file" },
    { name: "assets-folder", size: "0 B", content: "", type: "directory" }
  ]);
  const [newLocalName, setNewLocalName] = useState("");
  const [newLocalContent, setNewLocalContent] = useState("");
  const [isCreatingLocal, setIsCreatingLocal] = useState(false);

  // Auto connect when a machine is selected
  const handleSelectMachine = (machine: RemoteMachine) => {
    setSelectedMachine(machine);
    setConnecting(true);
    setConnected(false);
    setSelectedRemoteFile(null);
    setSftpLogs([
      `Initializing SFTP session subsystem on ${machine.ip}:22...`,
      `Protocol: SSH-2.0-OpenSSH_9.2p1`,
      `Exchanging key agreement credentials (curve25519-sha256)...`,
      `Authenticating user '${machine.username}' using verified vault keystore...`
    ]);

    setTimeout(() => {
      setSftpLogs(prev => [
        ...prev,
        `Authorization validated successfully. Opened SFTP/SCP secure pipeline.`,
        `Subsystem command: 'sftp'`,
        `Current root folder: ${machine.os === "windows" ? "C:\\Users\\" + machine.username : "/home/" + machine.username}`
      ]);
      setConnecting(false);
      setConnected(true);
      setCurrentRemotePath(machine.os === "windows" ? "C:\\Users\\" + machine.username : "/home/" + machine.username);
      setRemoteFiles(machine.fileSystem || []);
    }, 1200);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setSelectedMachine(null);
    setSftpLogs([]);
    setCurrentRemotePath("");
  };

  // Directory drill down/drill up
  const handleRemoteFolderClick = (dir: RemoteFile) => {
    if (dir.type !== "directory") return;
    const pathDelimiter = selectedMachine?.os === "windows" ? "\\" : "/";
    const nextPath = dir.path;
    setCurrentRemotePath(nextPath);
  };

  const handleRemoteGoBack = () => {
    const pathDelimiter = selectedMachine?.os === "windows" ? "\\" : "/";
    const parts = currentRemotePath.split(pathDelimiter);
    if (parts.length <= 1) return;
    parts.pop();
    const nextPath = parts.join(pathDelimiter) || pathDelimiter;
    setCurrentRemotePath(nextPath);
  };

  // Filters remote files to only display files matching current path directory context
  const getVisibleFiles = () => {
    const pathDelimiter = selectedMachine?.os === "windows" ? "\\" : "/";
    return remoteFiles.filter(f => {
      // Check if file is inside currentRemotePath
      if (f.path === currentRemotePath) return false; // same path isn't sub
      const relative = f.path.substring(0, currentRemotePath.length);
      if (relative !== currentRemotePath) return false;
      
      const remainder = f.path.substring(currentRemotePath.length + (currentRemotePath.endsWith(pathDelimiter) ? 0 : 1));
      // remainder shouldn't contain further path delimiters to stay in the immediate directory list
      return !remainder.includes(pathDelimiter) && remainder.length > 0;
    }).filter(f => f.name.toLowerCase().includes(remoteSearch.toLowerCase()));
  };

  // Drag & Drop mechanisms
  const handleDragStart = (e: React.DragEvent, item: LocalFile | RemoteFile, source: "local" | "remote") => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ item, source }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // HTML5 Dropping Files onto the file system panels
  const handleDropOnRemote = (e: React.DragEvent) => {
    e.preventDefault();
    if (!connected || !selectedMachine) return;

    try {
      const dragDataStr = e.dataTransfer.getData("text/plain");
      
      // Check if dragging from our Simulated Local Files list
      if (dragDataStr) {
        const dragData = JSON.parse(dragDataStr);
        if (dragData.source === "local") {
          const localItem = dragData.item as LocalFile;
          triggerUpload(localItem.name, localItem.size, localItem.content);
          return;
        }
      }
    } catch (err) {
      // Not our json representation, might be real operating system files!
    }

    // Process actual files dragged from the user's real operating system desktop!
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const realFiles = Array.from(e.dataTransfer.files);
      realFiles.forEach((rf: any) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string || "Binary Content Stream";
          // Convert size to human readable
          const sizeKb = (rf.size / 1024).toFixed(1) + " KB";
          triggerUpload(rf.name, sizeKb, content);
        };
        reader.readAsText(rf);
      });
    }
  };

  // Local File Upload Sequence Simulator
  const triggerUpload = (name: string, size: string, content: string) => {
    const transferId = Date.now();
    const newTransfer = {
      fileName: name,
      direction: "upload" as const,
      progress: 0,
      speed: "0 KB/s",
      totalSize: size
    };

    setActiveTransfers(prev => [...prev, newTransfer]);
    setSftpLogs(prev => [...prev, `[SFTP] Initiating upload stream for file '${name}' (${size}) to remote target...`]);

    let currentProg = 0;
    const interval = setInterval(() => {
      currentProg += Math.floor(Math.random() * 20) + 10;
      if (currentProg >= 100) {
        currentProg = 100;
        clearInterval(interval);
        
        // Finalize Remote File creation in the filesystem state!
        const pathDelimiter = selectedMachine?.os === "windows" ? "\\" : "/";
        const cleanPath = currentRemotePath + (currentRemotePath.endsWith(pathDelimiter) ? "" : pathDelimiter) + name;
        
        const newRemoteFile: RemoteFile = {
          name,
          type: "file",
          path: cleanPath,
          content,
          size
        };

        const updatedFiles = [...remoteFiles.filter(f => f.path !== cleanPath), newRemoteFile];
        setRemoteFiles(updatedFiles);
        onUpdateMachineFileSystem(selectedMachine.id, updatedFiles);

        setSftpLogs(prev => [
          ...prev,
          `[SFTP] Transfer successfully completed: uploaded '${name}' -> ${cleanPath}`,
          `[SCP] Cryptographic checksum matching OK (SHA-256 integrity passed)`
        ]);

        setTimeout(() => {
          setActiveTransfers(prev => prev.filter(t => t.fileName !== name));
        }, 1000);
      }

      // Update progress meter
      setActiveTransfers(prev => prev.map(t => {
        if (t.fileName === name) {
          const speedNum = (Math.random() * 8 + 3).toFixed(1);
          return {
            ...t,
            progress: currentProg,
            speed: `${speedNum} MB/s`
          };
        }
        return t;
      }));
    }, 250);
  };

  // Download Simulated remote file to Local Files Sandbox
  const handleRemoteDownload = (remoteFile: RemoteFile) => {
    if (remoteFile.type !== "file") return;

    const newTransfer = {
      fileName: remoteFile.name,
      direction: "download" as const,
      progress: 0,
      speed: "0 KB/s",
      totalSize: remoteFile.size || "1 KB"
    };

    setActiveTransfers(prev => [...prev, newTransfer]);
    setSftpLogs(prev => [...prev, `[SCP] Downloading remote file stream '${remoteFile.path}'...`]);

    let currentProg = 0;
    const interval = setInterval(() => {
      currentProg += Math.floor(Math.random() * 25) + 12;
      if (currentProg >= 100) {
        currentProg = 100;
        clearInterval(interval);

        // Add to our Simulated Local Files Sandbox state!
        const alreadyExists = localFiles.some(lf => lf.name === remoteFile.name);
        if (!alreadyExists) {
          const newLocalFile: LocalFile = {
            name: remoteFile.name,
            size: remoteFile.size || "1 KB",
            content: remoteFile.content || "Remote file binary stream clone.",
            type: "file"
          };
          setLocalFiles(prev => [newLocalFile, ...prev]);
        }

        setSftpLogs(prev => [...prev, `[SCP] Download success: '${remoteFile.name}' stored in local desktop cache.`]);

        // Also trigger real browser download for real working application behavior!
        const blob = new Blob([remoteFile.content || ""], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = remoteFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setTimeout(() => {
          setActiveTransfers(prev => prev.filter(t => t.fileName !== remoteFile.name));
        }, 1000);
      }

      setActiveTransfers(prev => prev.map(t => {
        if (t.fileName === remoteFile.name) {
          const speedNum = (Math.random() * 12 + 6).toFixed(1);
          return {
            ...t,
            progress: currentProg,
            speed: `${speedNum} MB/s`
          };
        }
        return t;
      }));
    }, 200);
  };

  const handleRemoteDelete = (file: RemoteFile) => {
    if (confirm(`Are you sure you want to permanently delete '${file.name}' from remote host?`)) {
      const updated = remoteFiles.filter(f => f.path !== file.path);
      setRemoteFiles(updated);
      onUpdateMachineFileSystem(selectedMachine!.id, updated);
      setSftpLogs(prev => [...prev, `[SFTP] Executed rm command on remote path: ${file.path}`]);
      setSelectedRemoteFile(null);
    }
  };

  const handleCreateLocalFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocalName) return;
    const newLf: LocalFile = {
      name: newLocalName.endsWith(".txt") || newLocalName.endsWith(".json") || newLocalName.endsWith(".sql") ? newLocalName : newLocalName + ".txt",
      size: (newLocalContent.length / 1024).toFixed(1) + " KB",
      content: newLocalContent,
      type: "file"
    };
    setLocalFiles([newLf, ...localFiles]);
    setNewLocalName("");
    setNewLocalContent("");
    setIsCreatingLocal(false);
  };

  return (
    <div id="sftp-explorer-container" className="flex-1 overflow-hidden bg-slate-900 p-8 flex flex-col h-full text-slate-100 font-sans">
      
      {/* Header bar and select host */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">SFTP / SCP File Explorer</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Securely copy, drop, and manage server files over encrypted SFTP connection pools.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {connected ? (
            <div className="flex items-center gap-2.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-300 font-bold">{selectedMachine?.name}</span>
              <button
                onClick={handleDisconnect}
                className="text-red-400 hover:text-red-300 transition pl-1.5 border-l border-slate-800 flex items-center gap-1 font-sans"
              >
                <LogOut className="w-3.5 h-3.5" /> Disconnect
              </button>
            </div>
          ) : (
            <>
              <span className="text-xs font-semibold text-slate-500 uppercase font-mono shrink-0">Target Server:</span>
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedMachine?.id || ""}
                  onChange={(e) => {
                    const found = machines.find(m => m.id === e.target.value);
                    if (found) handleSelectMachine(found);
                  }}
                  disabled={connecting}
                  className="appearance-none bg-slate-900 border border-slate-800 rounded-md pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none hover:border-slate-700 transition cursor-pointer font-mono w-full sm:w-64"
                >
                  <option value="" disabled>-- Establish File Connection --</option>
                  {sftpCapableMachines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.ip}) [PORT {m.port}]
                    </option>
                  ))}
                </select>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main File Explorer workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden min-h-0">
        
        {/* LEFT COMPONENT: SIMULATED LOCAL MACHINE SANDBOX */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col overflow-hidden shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">My Local System (Workstation)</h3>
            </div>
            <button
              onClick={() => setIsCreatingLocal(!isCreatingLocal)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 font-bold"
            >
              <FolderPlus className="w-3.5 h-3.5" /> New Sandbox File
            </button>
          </div>

          {isCreatingLocal ? (
            <form onSubmit={handleCreateLocalFile} className="bg-slate-900 p-4 border border-slate-800 rounded-xl mb-4 text-xs space-y-3 animate-in slide-in-from-top-1 duration-150">
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 font-bold">Filename:</span>
                <input
                  type="text"
                  placeholder="e.g. settings-patch.json"
                  value={newLocalName}
                  onChange={(e) => setNewLocalName(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 font-bold">Content Text:</span>
                <textarea
                  placeholder="Write test string parameters..."
                  value={newLocalContent}
                  onChange={(e) => setNewLocalContent(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500 font-mono h-20"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingLocal(false)}
                  className="bg-slate-800 px-3 py-1 rounded text-slate-400 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded"
                >
                  Save to Disk
                </button>
              </div>
            </form>
          ) : null}

          {/* Local files list */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 select-none">
            <div className="text-[10px] text-slate-500 font-mono uppercase px-2 py-1 flex justify-between border-b border-slate-900/60 mb-2">
              <span>File Name</span>
              <span>Size</span>
            </div>
            {localFiles.map((lf) => (
              <div
                key={lf.name}
                draggable
                onDragStart={(e) => handleDragStart(e, lf, "local")}
                className="bg-slate-900/40 border border-slate-900 hover:bg-slate-900/80 p-2.5 rounded-lg flex justify-between items-center cursor-grab active:cursor-grabbing transition group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {lf.type === "directory" ? (
                    <FolderOpen className="w-4 h-4 text-amber-500 fill-amber-500/10 shrink-0" />
                  ) : lf.name.endsWith(".json") || lf.name.endsWith(".sql") ? (
                    <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs font-mono text-slate-300 truncate">{lf.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-500">{lf.size}</span>
                  {connected && (
                    <button
                      onClick={() => triggerUpload(lf.name, lf.size, lf.content)}
                      title="Upload to Remote Host via SFTP"
                      className="opacity-0 group-hover:opacity-100 p-1 text-indigo-400 hover:bg-indigo-500/15 rounded transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Hint Box for dragging */}
            <div className="border border-dashed border-slate-800 rounded-xl p-4 mt-6 text-center text-slate-500 bg-slate-900/10 flex flex-col items-center justify-center gap-1.5">
              <Sparkles className="w-5 h-5 text-slate-700 animate-pulse" />
              <p className="text-xs font-semibold">Simulated Desktop Sandbox</p>
              <p className="text-[10px] text-slate-600 max-w-xs leading-normal">
                You can drag any file from this list and drop it on the Remote Pane to transmit. You can also drag files from your real operating system computer onto either folder pane!
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT: SECURE REMOTE SFTP CONNECTION GATE */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDropOnRemote}
          className={`bg-slate-950 border rounded-xl p-5 flex flex-col overflow-hidden shadow-xl transition-all duration-200 ${
            connected ? "border-indigo-500/30 bg-black/40" : "border-slate-800"
          }`}
        >
          
          {connected && selectedMachine ? (
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              
              {/* Path and Search bar */}
              <div className="flex flex-col gap-3 mb-4 shrink-0">
                
                {/* Navigation Breadcrumbs */}
                <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-900 text-xs font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <button
                      onClick={handleRemoteGoBack}
                      className="p-1 hover:bg-slate-800 text-indigo-400 rounded transition shrink-0"
                      title="Parent Directory"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-slate-500 shrink-0">/SFTP/</span>
                    <span className="text-slate-200 truncate">{currentRemotePath}</span>
                  </div>
                  <button
                    onClick={() => handleSelectMachine(selectedMachine)}
                    className="p-1 hover:bg-slate-800 text-slate-400 rounded transition shrink-0"
                    title="Refresh listing"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Filter input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search remote path..."
                    value={remoteSearch}
                    onChange={(e) => setRemoteSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Files Table List */}
              <div className="flex-1 overflow-y-auto space-y-1 select-none pr-1">
                <div className="text-[10px] text-slate-500 font-mono uppercase px-2 py-1 flex justify-between border-b border-slate-900/60 mb-2">
                  <span>Remote Node Name</span>
                  <span>Size</span>
                </div>

                {getVisibleFiles().map((file) => (
                  <div
                    key={file.path}
                    draggable
                    onDragStart={(e) => handleDragStart(e, file, "remote")}
                    onClick={() => setSelectedRemoteFile(file)}
                    className={`p-2.5 rounded-lg flex justify-between items-center transition cursor-pointer group ${
                      selectedRemoteFile?.path === file.path 
                        ? "bg-indigo-500/10 border border-indigo-500/20" 
                        : "bg-slate-900/20 border border-transparent hover:bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {file.type === "directory" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoteFolderClick(file);
                          }}
                          className="flex items-center gap-1.5 text-left truncate group"
                        >
                          <FolderOpen className="w-4 h-4 text-amber-500 fill-amber-500/10 shrink-0" />
                          <span className="text-xs font-mono text-amber-400 group-hover:underline truncate">{file.name}/</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 truncate">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-xs font-mono text-slate-300 truncate">{file.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[10px] font-mono text-slate-500">{file.size || "--"}</span>
                      
                      {file.type === "file" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoteDownload(file); }}
                          title="Download Securely to Workstation"
                          className="opacity-0 group-hover:opacity-100 p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoteDelete(file); }}
                        title="Permanently rm (Delete)"
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {getVisibleFiles().length === 0 && (
                  <div className="text-center py-12 text-slate-600 text-xs">
                    No matching objects or directories found in current active path.
                  </div>
                )}
              </div>

              {/* Selected File Details Overlay */}
              {selectedRemoteFile && selectedRemoteFile.type === "file" && (
                <div className="mt-4 bg-slate-900 p-3.5 border border-slate-800 rounded-xl text-xs space-y-2 shrink-0 select-text">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-indigo-400 font-mono truncate">{selectedRemoteFile.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{selectedRemoteFile.size}</span>
                  </div>
                  <pre className="max-h-24 overflow-y-auto text-[11px] font-mono bg-black p-2 rounded text-slate-300 leading-normal whitespace-pre-wrap select-all">
                    {selectedRemoteFile.content || "[Empty file content or un-indexed binary stream]"}
                  </pre>
                </div>
              )}

            </div>
          ) : connecting ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200">NEGOTIATING SFTP/SCP TUNNEL...</p>
                <p className="text-xs text-slate-500 mt-1">Acquiring terminal secure keys and loading file index...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2">
              <FolderOpen className="w-12 h-12 text-slate-800" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-600">No SFTP pipeline established</h4>
              <p className="text-xs text-slate-700 max-w-xs text-center leading-normal">
                Choose a capable secure server from the top dropdown to initiate a file transfer subsystem.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* FOOTER: SFTP LOGS & ACTIVE TRANSFERS CONSOLE */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-6 shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Connection Logging Area */}
        <div className="flex flex-col h-28 overflow-hidden">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Tunnel Telemetry Streams:</span>
          <div className="flex-1 bg-black p-2 rounded border border-slate-900 font-mono text-[10px] text-slate-400 overflow-y-auto space-y-1 select-text">
            {sftpLogs.length > 0 ? (
              sftpLogs.map((log, index) => <div key={index} className="leading-snug">{log}</div>)
            ) : (
              <div className="text-slate-600 italic">No connection log streamed. Ready to initialize.</div>
            )}
          </div>
        </div>

        {/* Transfer Operations Queue */}
        <div className="flex flex-col h-28 overflow-hidden">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold mb-1">Secure Transfer Queue:</span>
          <div className="flex-1 bg-black p-3 rounded border border-slate-900 overflow-y-auto space-y-3.5">
            {activeTransfers.map((t) => (
              <div key={t.fileName} className="text-xs space-y-1.5">
                <div className="flex justify-between items-center text-[10.5px] font-mono">
                  <span className="text-slate-300 truncate font-semibold w-1/2">{t.fileName}</span>
                  <span className="text-slate-400">{t.speed}</span>
                  <span className={`text-[9px] uppercase font-bold ${
                    t.direction === "upload" ? "text-indigo-400" : "text-emerald-400"
                  }`}>
                    {t.direction}ing ({t.totalSize})
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-150 ${
                      t.direction === "upload" ? "bg-indigo-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${t.progress}%` }}
                  />
                </div>
              </div>
            ))}

            {activeTransfers.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-600 text-[10px] font-mono uppercase">
                Queue idle. Drop files to transfer.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
