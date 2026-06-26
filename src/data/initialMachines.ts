import { RemoteMachine } from "../types";

export const INITIAL_MACHINES: RemoteMachine[] = [
  {
    id: "mach-ubuntu-prod",
    name: "ubuntu-prod-app-01",
    ip: "104.198.14.88",
    port: 22,
    protocol: "ssh",
    username: "deployer",
    credentialsType: "sshKey",
    sshKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDQC4... [PROD KEY]",
    status: "online",
    os: "linux",
    group: "Production Backend",
    metrics: {
      cpu: 48,
      ram: 62,
      disk: 44,
      networkIn: 240,
      networkOut: 480,
      uptime: "42 days, 14:22:05"
    },
    logs: [
      "Accepted publickey for deployer from 192.168.1.100 port 50422 ssh2",
      "systemd[1]: Started nginx.service - A high performance web server.",
      "dockerd[892]: Container application_api_1 started successfully.",
      "sshd[12402]: Connection closed by authenticating user 185.220.101.4 [preauth]",
      "kernel: [12903.04] EXT4-fs (sda1): mounted filesystem with ordered data mode."
    ],
    terminalHistory: [
      {
        command: "neofetch",
        output: `            .-/+oossssoo+/-.               deployer@ubuntu-prod-app-01
        \`:+ssssssssssssssssss+:\`           ---------------------------
      -+ssssssssssssssssssssss+-         OS: Ubuntu 24.04 LTS x86_64
     /ssssssssssssssssssssssssss\\        Host: Google Compute Engine
    /ssssssssssssshdmmNNmmyyssssss\\      Kernel: 6.8.0-1012-gcp
   +ssssssssshmydmMyyyyhdMyyyssssssd     Uptime: 42 days, 14 hours, 22 mins
  /sssssssshmMyyyhmMMyyyhmMMyyyyssss     Packages: 1140 (dpkg)
 ,ssssssssdMyyyyhmMMyyyhmMMyyyyyssss     Shell: bash 5.2.21
 +ssssssssdMyyyyhmMMyyyhmMMyyyyyssss     Terminal: /dev/pts/0
  /sssssssshmMyyyhmMMyyyhmMMyyyyssss     CPU: Intel Xeon (4) @ 2.80GHz
   +ssssssssshmydmMyyyyhdMyyyssssssd     GPU: Virtual 3D Controller
    /ssssssssssssshdmmNNmmyyssssss/      Memory: 9942MiB / 16042MiB
     /ssssssssssssssssssssssssss/        Disk: 44GB / 100GB (44%)
      -+ssssssssssssssssssssss+-
        \`:+ssssssssssssssssss+:\`
            .-/+oossssoo+/-.`,
        dir: "/home/deployer",
        timestamp: "2026-06-25T14:20:00Z"
      }
    ],
    fileSystem: [
      {
        name: "welcome.txt",
        type: "file",
        path: "/home/deployer/welcome.txt",
        content: "--- Welcome to USA-PROD-APP-01 (Ubuntu 24.04 LTS) ---\n\nThis is the production server hosting our main API endpoint.\nSecurity measures applied:\n- Password authentication disabled.\n- SSH keys only (deployer account).\n- Fail2Ban active with 10-minute lockouts.\n- Automatic system upgrades on security patches.",
        size: "340 B"
      },
      {
        name: "deploy.sh",
        type: "file",
        path: "/home/deployer/deploy.sh",
        content: "#!/bin/bash\necho '🚀 Starting production cluster deployment...'\ndocker-compose pull && docker-compose up -d --remove-orphans\necho 'Checking container status...'\ndocker-compose ps\necho '✅ Deployment completed successfully!'",
        size: "220 B"
      },
      {
        name: "logs",
        type: "directory",
        path: "/home/deployer/logs"
      },
      {
        name: "app.log",
        type: "file",
        path: "/home/deployer/logs/app.log",
        content: "2026-06-26 00:01:10 INFO [main] Starting Server on port 8080\n2026-06-26 00:01:12 INFO [db] Connected to PostgreSQL at 10.0.1.20:5432\n2026-06-26 00:01:15 INFO [redis] Handshake successful. Cluster ready.\n2026-06-26 00:05:00 WARN [api] Rate limit reached for IP 185.220.101.4",
        size: "244 B"
      }
    ]
  },
  {
    id: "mach-win-ad",
    name: "win-ad-controller-01",
    ip: "10.0.4.15",
    port: 3389,
    protocol: "rdp",
    username: "Administrator",
    credentialsType: "password",
    password: "••••••••••••",
    status: "online",
    os: "windows",
    group: "Enterprise Directory",
    metrics: {
      cpu: 28,
      ram: 78,
      disk: 65,
      networkIn: 88,
      networkOut: 112,
      uptime: "15 days, 02:40:11"
    },
    logs: [
      "Event ID 4624: An account was successfully logged on.",
      "Active Directory Domain Services synchronized successfully.",
      "Group Policy settings applied to 42 client workstations.",
      "Kerberos ticket request received for computer PC-CEO-01.",
      "Windows Update: 3 critical patches are pending restart."
    ],
    terminalHistory: [
      {
        command: "Get-Service ADWS, NTDS, Kdc",
        output: `Status   Name               DisplayName
------   ----               -----------
Running  ADWS               Active Directory Web Services
Running  NTDS               Active Directory Domain Services
Running  Kdc                Kerberos Key Distribution Center`,
        dir: "C:\\Users\\Administrator",
        timestamp: "2026-06-25T18:11:00Z"
      }
    ],
    fileSystem: [
      {
        name: "ActiveDirectory_Readme.txt",
        type: "file",
        path: "C:\\Users\\Administrator\\ActiveDirectory_Readme.txt",
        content: "WINDOWS ACTIVE DIRECTORY SECURITY RULES:\n1. Domain Password Policies are enforced (min 14 chars, complex).\n2. Remote access ONLY allowed from registered corporate Admin Subnet.\n3. Keep NTDS database backups encrypted on secure off-site NAS storage.",
        size: "312 B"
      },
      {
        name: "Scripts",
        type: "directory",
        path: "C:\\Users\\Administrator\\Scripts"
      },
      {
        name: "backup-ad.ps1",
        type: "file",
        path: "C:\\Users\\Administrator\\Scripts\\backup-ad.ps1",
        content: "# Active Directory Database Backup Script\nImport-Module ActiveDirectory\n$BackupPath = '\\\\SECURE-NAS\\ad_backups\\'\nWrite-Output 'Backing up Active Directory Domain Services database...'\n# Mock: SystemStateBackup -BackupTarget $BackupPath -Quiet\nWrite-Output 'Backup completed successfully.'",
        size: "410 B"
      }
    ]
  },
  {
    id: "mach-macos-build",
    name: "macos-sequoia-ci-04",
    ip: "192.168.20.44",
    port: 5900,
    protocol: "vnc",
    username: "ci-builder",
    credentialsType: "password",
    password: "••••••••••••",
    status: "online",
    os: "macos",
    group: "CI/CD Build Farm",
    metrics: {
      cpu: 75,
      ram: 85,
      disk: 82,
      networkIn: 950,
      networkOut: 840,
      uptime: "3 days, 11:04:55"
    },
    logs: [
      "VNC screen sharing session connected for user admin_mac",
      "XcodeBuild: Build target 'Runner_iOS' started.",
      "Git: Pulling latest changes from main branch...",
      "Homebrew: Updated 12 packages to latest versions.",
      "CI-Runner[54]: Completed test suite: 1405 tests passed, 0 failed."
    ],
    terminalHistory: [],
    fileSystem: [
      {
        name: "ci-readme.md",
        type: "file",
        path: "/Users/ci-builder/ci-readme.md",
        content: "# macOS CI/CD Worker Node 04\n\nThis system compiles and builds our iOS, macOS, and Safari-specific packages.\n\n### Configured Tools:\n- Xcode 16.0 (iOS SDK 18.0)\n- Node.js v22.2.0 (via nvm)\n- CocoaPods 1.15.2\n- Rustup (Stable 1.78)\n- Fastlane (for App Store Deployment)",
        size: "310 B"
      },
      {
        name: "build-ios.sh",
        type: "file",
        path: "/Users/ci-builder/build-ios.sh",
        content: "#!/bin/bash\nset -e\nexport PATH=/opt/homebrew/bin:$PATH\ncd /Users/ci-builder/workspace/app-mobile\nnpm install && npm run build\nfastlane build_and_sign_ios",
        size: "180 B"
      }
    ]
  },
  {
    id: "mach-alpine-db",
    name: "alpine-cache-redis-prod",
    ip: "10.0.8.22",
    port: 22,
    protocol: "ssh",
    username: "root",
    credentialsType: "password",
    password: "••••••••••••",
    status: "offline",
    os: "linux",
    group: "Database Caching",
    metrics: {
      cpu: 0,
      ram: 0,
      disk: 0,
      networkIn: 0,
      networkOut: 0,
      uptime: "offline"
    },
    logs: [
      "SIGTERM received, shutting down gracefully...",
      "Redis memory database dumped to disk (/var/lib/redis/dump.rdb)",
      "Network interface eth0 deconfigured.",
      "ACPI: Powering off system..."
    ],
    terminalHistory: [],
    fileSystem: [
      {
        name: "redis.conf",
        type: "file",
        path: "/etc/redis/redis.conf",
        content: "bind 127.0.0.1 10.0.8.22\nport 6379\nprotected-mode yes\nmaxmemory 4gb\nmaxmemory-policy allkeys-lru\nsave 900 1\nsave 300 10",
        size: "120 B"
      }
    ]
  }
];
