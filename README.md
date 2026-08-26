<div align="center">

<br>
<picture>
  <source media="(prefers-color-scheme: dark)">
  <img alt="HexHack" src="https://img.shields.io/badge/HEXHACK-v2.0.0-00ff88?style=for-the-badge&labelColor=0a0e14&color=00ff88">
</picture>

<br>
<br>

<img src="https://readme-typing-svg.herokuapp.com?font=JetBrains+Mono&size=28&duration=3000&pause=1000&color=00FF88&center=true&vCenter=true&width=600&lines=%24+initializing+hexhack_os...;%24+access+granted.;%24+welcome%2C+operator." alt="Terminal Banner" />

<br>

### A gamified cybersecurity learning platform with an interactive terminal, hexagonal skill tree, and hands-on labs.

<br>

<img src="https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-5.5-3178c6?style=flat-square&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Vite-5.4-646cff?style=flat-square&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind-3.4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/Supabase-2.57-181818?style=flat-square&logo=supabase&logoColor=white" />
<img src="https://img.shields.io/badge/Lucide-Icons-00ff88?style=flat-square&logo=lucide&logoColor=white" />

<br>
<br>

</div>

---

```
┌─────────────────────────────────────────────────────────────────────┐
│  operator@hexhack:~$ cat /etc/banner                                │
│                                                                     │
│   ██╗  ██╗███████╗██╗  ██╗ ██████╗  ██████╗ ██╗    ██╗   ██╗███████╗  │
│   ██║  ██║██╔════╝██║  ██║██╔═══██╗██╔═══██╗██║    ██║   ██║██╔════╝  │
│   ███████║█████╗  ███████║██║   ██║██║   ██║██║    ██║   ██║███████╗  │
│   ██╔══██║██╔══╝  ██╔══██║██║   ██║██║   ██║██║    ╚██╗ ██╔╝╚════██║  │
│   ██║  ██║███████╗██║  ██║╚██████╔╝╚██████╔╝███████╗╚████╔╝ ███████║  │
│   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝ ╚═══╝  ╚══════╝  │
│                                                                     │
│  > A cybersecurity training platform built for the browser.         │
│  > Interactive terminal. Virtual filesystem. Installable tools.     │
│  > Hexagonal skill tree progression. Hands-on lab environments.     │
│  > Progress saved across sessions. No setup required.               │
│                                                                     │
│  > Type 'help' to begin.                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Overview

HexHack is a browser-based cybersecurity learning platform that teaches hacking skills through guided lessons and hands-on labs. Learners progress through a hexagonal skill tree of course modules, read lessons, and practice what they learn in a fully interactive terminal that simulates a real Linux hacking environment.

The terminal is the centerpiece: learners can navigate a virtual filesystem, install real security tools (nmap, sqlmap, hashcat, hydra, and more), scan simulated targets, exploit vulnerabilities, and capture flags -- all in the browser with no setup required.

---

## Features

### Interactive Terminal

A full-featured terminal emulator running entirely in the browser. It supports a realistic command set with tab completion, command history (up/down arrow keys), and ANSI-style colored output.

```
┌─[operator@hexhack]─[~]─$
└──$ help

Available commands:

--- Filesystem ---
  ls [path]       List directory contents
  cd <path>       Change directory
  pwd             Print working directory
  cat <file>      Display file contents
  mkdir <dir>     Create directory
  touch <file>    Create empty file
  rm <path>       Remove file or directory
  tree [path]     Show directory tree
  find <name>     Find files by name

--- System ---
  whoami          Display current user
  ifconfig        Show network interfaces
  ps aux          List running processes
  uname -a        System information
  sudo <cmd>      Run as root (requires password)

--- Tools ---
  tools           List available tools to install
  apt-get install <tool>  Install a tool
  pip install <tool>      Install a Python tool
  nmap <target>   Network scanner (requires install)
  sqlmap <url>    SQL injection tool (requires install)
  ...
```

### Virtual Filesystem

Each lab comes with a pre-seeded virtual filesystem that persists across sessions. Learners can:

- Navigate directories with `cd`, `ls`, `pwd`, and `tree`
- Read files with `cat` -- including `/etc/passwd`, web configs, and source code
- Create and modify files with `touch`, `mkdir`, and `echo`
- Search the filesystem with `find`
- All changes are saved to the database per user per lab

### Tool Installation System

Learners install real security tools using simulated package managers:

```bash
$ apt-get install nmap
Reading package lists... Done
Building dependency tree... Done
The following NEW packages will be installed:
  nmap
Get:1 http://archive.ubuntu.com/ubuntu focal/main amd64 nmap amd64 7.80 [4,648 kB]
Fetched 4,648 kB in 2s (2,324 kB/s)
Setting up nmap (7.80) ...
[+] Nmap v7.80 installed successfully!

$ pip install sqlmap
Collecting sqlmap
  Downloading sqlmap-1.7.11-py3-none-any.whl (1.2 MB)
Successfully installed sqlmap-1.7.11
[+] SQLMap v1.7.11 installed successfully!
```

Installed tools are tracked per lab and persist between sessions. The full tool registry includes:

| Tool | Package Manager | Version | Description |
|------|----------------|---------|-------------|
| nmap | apt | 7.80 | Network discovery and security auditing |
| sqlmap | pip | 1.7.11 | Automatic SQL injection and database takeover |
| hashcat | apt | 5.1.0 | Worlds fastest password recovery utility |
| hydra | apt | 9.0 | Fast network logon cracker |
| gobuster | apt | 3.6.0 | Directory/file/DNS busting tool |
| john | apt | 1.9.0 | Advanced password cracker |
| nikto | apt | 2.1.6 | Web server vulnerability scanner |
| curl | apt | 7.68.0 | HTTP client |
| netcat | apt | 1.206 | Versatile networking utility |
| wireshark | apt | 3.2.3 | Network protocol analyzer (tshark) |

### Lab-Specific Simulated Environments

Each lab defines a simulated network with target hosts, open ports, running services, and vulnerabilities. Tools produce output that matches the lab's specific environment:

```bash
$ nmap -sV 10.10.10.5
Starting Nmap 7.80 ( https://nmap.org )
Nmap scan report for target.local (10.10.10.5)
Host is up (0.00042s latency).

PORT     STATE    SERVICE     VERSION
22       open     ssh         OpenSSH 8.2p1
80       open     http        Apache 2.4.41
443      open     https       Apache 2.4.41
3306     open     mysql       MySQL 8.0.25

Nmap done: 1 IP address (1 host up) scanned in 3.42 seconds

$ sqlmap -u http://10.10.10.5/admin/login.php --dump
sqlmap/1.7.11#stable - automatic SQL injection
[+] id is vulnerable: boolean-based blind
[+] id is vulnerable: UNION query

Available databases [3]:
  [*] information_schema
  [*] webapp
  [*] users

+----+----------+----------+
| id| username | password |
+----+----------+----------+
| 1  | admin    | admin123 |
| 2  | user     | password |
+----+----------+----------+

[+] FLAG found: FLAG{sql_injection_is_fun}
```

### Lab Validation and Auto-Completion

Labs define success conditions that are checked against the commands learners run. When a learner executes the right command, the objective is auto-marked as complete:

```
[+] Objective complete: Scan the target with nmap
[+] Objective complete: Use sqlmap to find SQL injection on the web server
[+] Objective complete: Find the flag in the database

[!!!] ALL OBJECTIVES COMPLETE! Lab finished!
```

### Hexagonal Skill Tree

Modules are arranged in a hexagonal skill tree. Learners unlock new modules by completing prerequisites. Each hexagon pulses with a color-coded glow indicating its status:

- **Locked** -- prerequisites not yet met
- **Unlocked** -- ready to start
- **In Progress** -- partially completed
- **Completed** -- all lessons and labs done

### Progress Tracking

All progress is saved to Supabase and persists across sessions:

- Lesson completions per user
- Lab completions per user
- Terminal state (virtual filesystem + installed tools) per lab
- Command history per lab for validation

### Navigation

Lessons and labs feature a smooth next/previous navigation flow:

- **Complete and Continue** -- marks the current item done and jumps to the next
- **Previous** -- go back to the prior lesson or lab
- **Start / Continue** -- on module pages, jumps straight to the first incomplete item
- **Module Complete** -- celebration message when all items in a module are finished

---

## Architecture

```
src/
├── App.tsx                      # Root app, view routing, boot screen
├── components/
│   ├── Terminal.tsx             # Interactive terminal with VFS + tool installation
│   ├── LabView.tsx              # Lab page with scenario, tasks, hints, terminal
│   ├── LessonView.tsx           # Lesson page with content + terminal
│   ├── ModuleView.tsx           # Module overview with lessons, labs, start button
│   ├── HexTree.tsx              # Hexagonal skill tree visualization
│   ├── Dashboard.tsx            # Landing dashboard
│   ├── Header.tsx               # Top navigation bar
│   ├── AuthModal.tsx            # Sign-in / sign-up modal
│   └── Markdown.tsx             # Markdown renderer for lesson/lab content
├── lib/
│   ├── auth.tsx                 # Supabase auth context provider
│   ├── supabase.ts              # Supabase client singleton
│   ├── types.ts                 # TypeScript interfaces for all data models
│   ├── useCurriculum.ts         # Hook: fetches modules, lessons, labs, progress
│   ├── vfs.ts                   # Virtual filesystem engine (in-browser)
│   └── labEnvironments.ts       # Lab environment definitions + tool registry
└── index.css                    # Global styles, animations, terminal theme

supabase/
└── migrations/
    ├── 20260822162157_create_curriculum_schema.sql   # Core schema
    └── 20260823132336_create_terminal_state_tables.sql # Terminal persistence
```

### Database Schema

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   modules   │────<│     lessons      │     │        labs         │
├─────────────┤     ├──────────────────┤     ├─────────────────────┤
│ id (uuid)   │     │ id (uuid)        │     │ id (uuid)           │
│ slug        │     │ module_id (FK)   │     │ module_id (FK)      │
│ title       │     │ slug             │     │ slug                │
│ description │     │ title            │     │ title               │
│ difficulty  │     │ content (text)   │     │ scenario            │
│ category    │     │ sort_order       │     │ objective           │
│ position_x  │     │ duration_minutes │     │ tasks (jsonb)       │
│ position_y  │     └──────────────────┘     │ hints (jsonb)       │
│ icon        │                               │ solution (text)     │
│ color       │     ┌──────────────────┐     │ sort_order          │
│ sort_order  │     │ module_prereqs   │     │ difficulty          │
└─────────────┘     ├──────────────────┤     └─────────────────────┘
                    │ module_id (FK)   │
       ┌────────────┤ prereq_id (FK)   │
       │            └──────────────────┘
       │
┌──────┴───────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ lesson_completions│  │  lab_completions     │  │ user_terminal_state  │
├───────────────────┤  ├──────────────────────┤  ├──────────────────────┤
│ user_id (FK)      │  │ user_id (FK)         │  │ id (uuid)            │
│ lesson_id (FK)    │  │ lab_id (FK)          │  │ user_id (FK)         │
│ completed_at      │  │ completed_at        │  │ lab_id (FK)          │
└───────────────────┘  └──────────────────────┘  │ filesystem (jsonb)   │
                                                  │ installed_tools ([]) │
┌──────────────────────┐                          │ cwd (text)           │
│  user_command_log    │                          └──────────────────────┘
├──────────────────────┤
│ id (uuid)            │
│ user_id (FK)         │
│ lab_id (FK)          │
│ command (text)       │
│ created_at           │
└──────────────────────┘
```

All tables have Row Level Security enabled:

- **Curriculum tables** (`modules`, `lessons`, `labs`, `module_prerequisites`) -- publicly readable, not writable via API
- **Progress tables** (`lesson_completions`, `lab_completions`) -- owner-scoped CRUD for authenticated users
- **Terminal state tables** (`user_terminal_state`, `user_command_log`) -- owner-scoped, authenticated users only

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | UI components and state management |
| Build | Vite 5 | Fast dev server and production builds |
| Styling | Tailwind CSS 3 | Utility-first styling with custom theme |
| Icons | Lucide React | Consistent icon set throughout the app |
| Backend | Supabase (PostgreSQL) | Database, auth, and data persistence |
| Auth | Supabase Auth | Email/password authentication |
| Terminal | Custom VFS engine | In-browser virtual filesystem + command simulation |

---

## Design

The interface follows a dark hacker aesthetic with:

- **Color palette**: Deep navy backgrounds (`#0a0e14`, `#0d1117`), green-on-black terminal text (`#00ff88`), cyan accents (`#22d3ee`), and amber for lab difficulty indicators
- **Typography**: JetBrains Mono for all terminal and code text, Inter for body text
- **Animations**: Boot sequence on load, fade-in transitions, pulsing hexagon glows, blinking terminal cursor, scanline effects
- **Layout**: Responsive design with 8px spacing system, max-width content containers, and a fixed bottom navigation bar

---

## Getting Started

The project runs on Vite with a pre-provisioned Supabase instance. All environment variables are pre-populated.

```bash
# Install dependencies
npm install

# Start the dev server (runs automatically in Bolt)
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

---

## Terminal Command Reference

### Filesystem Commands

| Command | Syntax | Description |
|---------|--------|-------------|
| `ls` | `ls [path]` | List directory contents |
| `cd` | `cd <path>` | Change working directory |
| `pwd` | `pwd` | Print current working directory |
| `cat` | `cat <file>` | Display file contents |
| `mkdir` | `mkdir <dir>` | Create a new directory |
| `touch` | `touch <file>` | Create an empty file |
| `rm` | `rm [-rf] <path>` | Remove a file or directory |
| `tree` | `tree [path]` | Show directory tree structure |
| `find` | `find <name>` | Search filesystem by name |
| `echo` | `echo <text>` | Print text to terminal |

### System Commands

| Command | Syntax | Description |
|---------|--------|-------------|
| `whoami` | `whoami` | Display current user |
| `ifconfig` | `ifconfig` | Show network interfaces |
| `ps` | `ps aux` | List running processes |
| `uname` | `uname -a` | Show system information |
| `sudo` | `sudo <cmd>` | Attempt to run as root |

### Tool Commands

| Command | Syntax | Description |
|---------|--------|-------------|
| `tools` | `tools` | List all installable tools |
| `apt-get` | `apt-get install <tool>` | Install an apt package |
| `pip` | `pip install <tool>` | Install a Python package |
| `nmap` | `nmap [-sV] [-O] <target>` | Scan a target host |
| `sqlmap` | `sqlmap -u <url> [--dump]` | Test for SQL injection |
| `hashcat` | `hashcat <hash>` | Crack a password hash |
| `hydra` | `hydra <target>` | Brute force login credentials |
| `gobuster` | `gobuster -u <url>` | Enumerate web directories |
| `nikto` | `nikto -h <host>` | Scan web server for vulnerabilities |
| `curl` | `curl <url>` | Make an HTTP request |
| `nc` | `nc <host> <port>` | Connect to a network port |

### Utility Commands

| Command | Syntax | Description |
|---------|--------|-------------|
| `help` | `help` | Show all available commands |
| `clear` | `clear` | Clear the terminal |
| `banner` | `banner` | Show the welcome banner |

---

## License

This project is built as a learning platform. All simulated tools, environments, and vulnerabilities are fictional and designed for educational purposes only.

---

<div align="center">

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  > "The best way to learn hacking is to hack."                      │
│                                                                     │
│  > Session complete.                                                │
│  > operator@hexhack:~$ logout                                       │
│  > Connection closed.                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

<img src="https://img.shields.io/badge/HexHack-Built_with_Bolt-00ff88?style=for-the-badge&labelColor=0a0e14&color=00ff88" />

</div>
