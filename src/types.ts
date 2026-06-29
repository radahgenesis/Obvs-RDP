export type ConnectionProtocol = "ssh" | "vnc" | "rdp" | "web";
export type MachineOS = "linux" | "windows" | "macos" | "freebsd";
export type MachineStatus = "online" | "offline" | "connecting" | "rebooting";

export interface SystemMetrics {
  cpu: number;
  ram: number;
  disk: number;
  networkIn: number; // KB/s
  networkOut: number; // KB/s
  uptime: string;
}

export interface RemoteFile {
  name: string;
  type: "file" | "directory";
  path: string;
  content?: string;
  size?: string;
}

export interface RemoteMachine {
  id: string;
  name: string;
  ip: string;
  port: number;
  protocol: ConnectionProtocol;
  username: string;
  credentialsType: "password" | "sshKey" | "none";
  password?: string;
  sshKey?: string;
  status: MachineStatus;
  os: MachineOS;
  group: string;
  tags?: string[];
  cpuAlertThreshold?: number;
  ramAlertThreshold?: number;
  location?: {
    city: string;
    country: string;
    lat: number;
    lng: number;
    isCustom?: boolean;
  };
  metrics: SystemMetrics;
  logs: string[];
  terminalHistory: { command: string; output: string; dir: string; timestamp: string }[];
  fileSystem: RemoteFile[];
  mac?: string;
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  details: string;
  status: "success" | "warning" | "error" | "info";
}
