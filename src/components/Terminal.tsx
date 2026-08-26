import { useState, useRef, useEffect, useCallback } from 'react';
import type { Lab, ModuleWithStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  createVFS, serializeVFS, deserializeVFS,
  ls as vfsLs, cd as vfsCd, cat as vfsCat,
  mkdir as vfsMkdir, touch as vfsTouch,
  rm as vfsRm, tree as vfsTree, find as vfsFind,
  type VFSState,
} from '@/lib/vfs';
import {
  getLabEnvironment, getTool, isToolInstalled, checkSuccessConditions,
  type LabEnvironment,
} from '@/lib/labEnvironments';
import { XP_VALUES, ACHIEVEMENTS, type AchievementId } from '@/lib/xp';
import { AchievementToast, type ToastPayload } from '@/components/AchievementToast';
import { CheckCircle2, Package, Loader2 } from 'lucide-react';

interface TerminalProps {
  module: ModuleWithStatus;
  lab?: Lab;
  onLabProgress?: (completedConditions: string[]) => void;
  onXP?: (amount: number, label: string) => void;
  onAchievement?: (id: AchievementId) => void;
}

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system' | 'success' | 'flag';
  text: string;
}

const TOOL_SLUGS = new Set([
  'nmap', 'sqlmap', 'hashcat', 'hydra', 'gobuster', 'john', 'nikto', 'netcat', 'wireshark',
]);

const BANNER = `HexHack Terminal v2.0.0
Type 'help' for available commands. Type 'tools' to list installable tools.
`;

export function Terminal({ module, lab, onLabProgress, onXP, onAchievement }: TerminalProps) {
  const { user } = useAuth();
  const env: LabEnvironment = lab ? getLabEnvironment(lab.slug) : getLabEnvironment('default');

  const [lines, setLines] = useState<TerminalLine[]>([{ type: 'system', text: BANNER }]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [vfs, setVfs] = useState<VFSState>(() => createVFS(env.initialFiles));
  const [installedTools, setInstalledTools] = useState<string[]>([]);
  const [installing, setInstalling] = useState(false);
  const [completedConditions, setCompletedConditions] = useState<Set<string>>(new Set());
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [stateLoaded, setStateLoaded] = useState(false);
  const [toasts, setToasts] = useState<ToastPayload[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const toastId = useRef(0);

  const addToast = useCallback((t: Omit<ToastPayload, 'id'>) => {
    const id = String(++toastId.current);
    setToasts((prev) => [...prev, { ...t, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const awardXP = useCallback((type: keyof typeof XP_VALUES, label: string) => {
    const amount = XP_VALUES[type];
    onXP?.(amount, label);
    addToast({ type: 'xp', label, xp: amount });
  }, [onXP, addToast]);

  const unlockAchievement = useCallback((id: AchievementId) => {
    setUnlockedAchievements((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      if (ach) {
        addToast({ type: 'achievement', label: ach.label, detail: ach.desc, icon: ach.icon, xp: ach.xpBonus });
        onXP?.(ach.xpBonus, ach.label);
        onAchievement?.(id);
      }
      return next;
    });
  }, [addToast, onXP, onAchievement]);

  // Load persisted state
  useEffect(() => {
    if (!user || !lab) { setStateLoaded(true); return; }
    (async () => {
      const { data } = await supabase
        .from('user_terminal_state').select('*').eq('lab_id', lab.id).maybeSingle();
      if (data) {
        try { setVfs(deserializeVFS(data.filesystem)); } catch { setVfs(createVFS(env.initialFiles)); }
        setInstalledTools(data.installed_tools || []);
      }
      setStateLoaded(true);
    })();
  }, [user, lab, env.initialFiles]);

  const saveState = useCallback(async (newVfs: VFSState, newTools: string[]) => {
    if (!user || !lab) return;
    const fsJson = serializeVFS(newVfs);
    const { data: existing } = await supabase
      .from('user_terminal_state').select('id').eq('lab_id', lab.id).maybeSingle();
    if (existing) {
      await supabase.from('user_terminal_state')
        .update({ filesystem: fsJson, installed_tools: newTools, cwd: newVfs.cwd, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('user_terminal_state').insert({ lab_id: lab.id, filesystem: fsJson, installed_tools: newTools, cwd: newVfs.cwd });
    }
  }, [user, lab]);

  const logCommand = useCallback(async (command: string) => {
    if (!user || !lab) return;
    await supabase.from('user_command_log').insert({ lab_id: lab.id, command });
  }, [user, lab]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const addLines = useCallback((newLines: TerminalLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const checkLabProgress = useCallback((command: string) => {
    if (!lab || !onLabProgress) return;
    const newlyCompleted = checkSuccessConditions(command, env.successConditions);
    if (newlyCompleted.length === 0) return;
    setCompletedConditions((prev) => {
      const next = new Set(prev);
      for (const cond of newlyCompleted) {
        if (!next.has(cond.id)) {
          next.add(cond.id);
          addLines([{ type: 'success', text: `[+] Objective complete: ${cond.description}` }]);
          awardXP('objective_complete', cond.description);
        }
      }
      const allCompleted = Array.from(next);
      onLabProgress(allCompleted);
      if (allCompleted.length === env.successConditions.length) {
        addLines([
          { type: 'flag', text: '' },
          { type: 'flag', text: '╔══════════════════════════════════════╗' },
          { type: 'flag', text: '║   ALL OBJECTIVES COMPLETE!           ║' },
          { type: 'flag', text: '║   Lab finished! XP awarded.          ║' },
          { type: 'flag', text: '╚══════════════════════════════════════╝' },
          { type: 'flag', text: '' },
        ]);
        awardXP('lab_complete', `Lab: ${lab.title}`);
      }
      return next;
    });
  }, [lab, onLabProgress, env.successConditions, addLines, awardXP]);

  const runCommand = useCallback(async (raw: string) => {
    const cmd = raw.trim();
    addLines([{ type: 'input', text: cmd }]);
    if (cmd) logCommand(cmd);
    if (!cmd) return;

    const parts = cmd.split(/\s+/);
    const base = parts[0].toLowerCase(); // normalize for switch
    const rawBase = parts[0];
    const args = parts.slice(1);
    const argStr = args.join(' ');

    // Tool-not-installed gate (case-insensitive)
    if (TOOL_SLUGS.has(base) && base !== 'curl' && !isToolInstalled(installedTools, base)) {
      addLines([
        { type: 'error', text: `${rawBase}: command not found` },
        { type: 'output', text: `Hint: install with 'apt-get install ${base}'` },
      ]);
      return;
    }

    switch (base) {
      case 'help':
        addLines([
          { type: 'output', text: 'Available commands:' },
          { type: 'output', text: '' },
          { type: 'output', text: '--- Filesystem ---' },
          { type: 'output', text: '  ls [path]               List directory contents' },
          { type: 'output', text: '  cd <path>               Change directory' },
          { type: 'output', text: '  pwd                     Print working directory' },
          { type: 'output', text: '  cat <file>              Display file contents' },
          { type: 'output', text: '  mkdir <dir>             Create directory' },
          { type: 'output', text: '  touch <file>            Create empty file' },
          { type: 'output', text: '  echo <text>             Print text' },
          { type: 'output', text: '  rm [-rf] <path>         Remove file/directory' },
          { type: 'output', text: '  tree [path]             Show directory tree' },
          { type: 'output', text: '  find <name>             Find files by name' },
          { type: 'output', text: '' },
          { type: 'output', text: '--- System ---' },
          { type: 'output', text: '  whoami                  Display current user' },
          { type: 'output', text: '  ifconfig                Network interfaces' },
          { type: 'output', text: '  ps aux                  Running processes' },
          { type: 'output', text: '  uname -a                System info' },
          { type: 'output', text: '  sudo <cmd>              Run as root' },
          { type: 'output', text: '' },
          { type: 'output', text: '--- Tools (install first) ---' },
          { type: 'output', text: '  tools                   List installable tools' },
          { type: 'output', text: '  apt-get install <tool>  Install apt package' },
          { type: 'output', text: '  pip install <tool>      Install Python package' },
          { type: 'output', text: '  nmap [-sV] [-O] <ip>    Network scanner' },
          { type: 'output', text: '  sqlmap -u <url>         SQL injection tool' },
          { type: 'output', text: '  hashcat <hash>          Password cracker' },
          { type: 'output', text: '  hydra <ip>              Brute force tool' },
          { type: 'output', text: '  gobuster -u <url>       Directory buster' },
          { type: 'output', text: '  nikto -h <host>         Web scanner' },
          { type: 'output', text: '  curl <url>              HTTP client' },
          { type: 'output', text: '  nc <host> <port>        Netcat' },
          { type: 'output', text: '' },
          { type: 'output', text: '  clear / banner / help' },
        ]);
        break;

      case 'tools':
        addLines([
          { type: 'output', text: 'Installable tools for this lab:' },
          { type: 'output', text: '' },
          ...env.availableTools.map((slug) => {
            const tool = getTool(slug);
            const installed = isToolInstalled(installedTools, slug);
            return {
              type: 'output' as const,
              text: `  ${installed ? '[x]' : '[ ]'} ${slug.padEnd(12)} ${tool?.description || ''}`,
            };
          }),
          { type: 'output', text: '' },
          { type: 'output', text: "Use 'apt-get install <tool>' or 'pip install <tool>'" },
        ]);
        break;

      case 'apt-get': {
        if (args[0]?.toLowerCase() !== 'install' || !args[1]) {
          addLines([{ type: 'error', text: 'apt-get: usage: apt-get install <package>' }]);
          break;
        }
        const toolSlug = args[1].toLowerCase();
        const tool = getTool(toolSlug);
        if (!tool || !env.availableTools.includes(toolSlug)) {
          addLines([{ type: 'error', text: `E: Unable to locate package ${args[1]}` }]);
          break;
        }
        if (isToolInstalled(installedTools, toolSlug)) {
          addLines([{ type: 'output', text: `${tool.name} is already the newest version.` }]);
          break;
        }
        setInstalling(true);
        for (const line of tool.installOutput) {
          await new Promise((r) => setTimeout(r, 120));
          addLines([{ type: 'output', text: line }]);
        }
        const newTools = [...installedTools, toolSlug];
        setInstalledTools(newTools);
        setInstalling(false);
        await saveState(vfs, newTools);
        addLines([{ type: 'success', text: `[+] ${tool.name} v${tool.version} installed!` }]);
        awardXP('tool_install', `Installed ${tool.name}`);
        if (newTools.length === 1) unlockAchievement('first_tool');
        if (newTools.length >= 5) unlockAchievement('all_tools');
        break;
      }

      case 'pip': {
        if (args[0]?.toLowerCase() !== 'install' || !args[1]) {
          addLines([{ type: 'error', text: 'pip: usage: pip install <package>' }]);
          break;
        }
        const toolSlug = args[1].toLowerCase();
        const tool = getTool(toolSlug);
        if (!tool || !env.availableTools.includes(toolSlug)) {
          addLines([{ type: 'error', text: `ERROR: Could not find a version that satisfies the requirement ${args[1]}` }]);
          break;
        }
        if (isToolInstalled(installedTools, toolSlug)) {
          addLines([{ type: 'output', text: `Requirement already satisfied: ${toolSlug}` }]);
          break;
        }
        setInstalling(true);
        for (const line of tool.installOutput) {
          await new Promise((r) => setTimeout(r, 120));
          addLines([{ type: 'output', text: line }]);
        }
        const newTools = [...installedTools, toolSlug];
        setInstalledTools(newTools);
        setInstalling(false);
        await saveState(vfs, newTools);
        addLines([{ type: 'success', text: `[+] ${tool.name} v${tool.version} installed!` }]);
        awardXP('tool_install', `Installed ${tool.name}`);
        if (newTools.length === 1) unlockAchievement('first_tool');
        if (newTools.length >= 5) unlockAchievement('all_tools');
        break;
      }

      case 'ls': {
        const result = vfsLs(vfs, argStr || undefined);
        if (result === null) {
          addLines([{ type: 'error', text: `ls: cannot access '${argStr}': No such file or directory` }]);
        } else if (result.length === 0) {
          addLines([{ type: 'output', text: '' }]);
        } else {
          addLines(result.map((name) => ({ type: 'output' as const, text: name })));
        }
        break;
      }

      case 'cd': {
        const newState = vfsCd(vfs, argStr || '~');
        if (newState) { setVfs(newState); }
        else { addLines([{ type: 'error', text: `cd: ${argStr}: No such file or directory` }]); }
        break;
      }

      case 'pwd':
        addLines([{ type: 'output', text: vfs.cwd }]);
        break;

      case 'cat': {
        if (!argStr) { addLines([{ type: 'error', text: 'cat: missing operand' }]); break; }
        const content = vfsCat(vfs, argStr);
        if (content === null) {
          addLines([{ type: 'error', text: `cat: ${argStr}: No such file or directory` }]);
        } else {
          addLines(content.split('\n').map((line) => ({ type: 'output' as const, text: line })));
        }
        break;
      }

      case 'mkdir': {
        if (!argStr) { addLines([{ type: 'error', text: 'mkdir: missing operand' }]); break; }
        const newState = vfsMkdir(vfs, argStr);
        if (newState) { setVfs(newState); await saveState(newState, installedTools); }
        else { addLines([{ type: 'error', text: `mkdir: cannot create directory '${argStr}'` }]); }
        break;
      }

      case 'touch': {
        if (!argStr) { addLines([{ type: 'error', text: 'touch: missing file operand' }]); break; }
        const newState = vfsTouch(vfs, argStr);
        if (newState) { setVfs(newState); await saveState(newState, installedTools); }
        break;
      }

      case 'rm': {
        if (!argStr) { addLines([{ type: 'error', text: 'rm: missing operand' }]); break; }
        const rmTarget = (args[0] === '-rf' || args[0] === '-r' || args[0] === '-f') ? args[1] : args[0];
        const newState = vfsRm(vfs, rmTarget);
        if (newState) { setVfs(newState); await saveState(newState, installedTools); }
        else { addLines([{ type: 'error', text: `rm: cannot remove '${rmTarget}': No such file or directory` }]); }
        break;
      }

      case 'tree': {
        const result = vfsTree(vfs, argStr || undefined);
        addLines(result.map((line) => ({ type: 'output' as const, text: line })));
        break;
      }

      case 'find': {
        if (!argStr) { addLines([{ type: 'error', text: 'find: missing argument' }]); break; }
        const results = vfsFind(vfs, argStr);
        if (results.length === 0) {
          addLines([{ type: 'output', text: `find: no matches for '${argStr}'` }]);
        } else {
          addLines(results.map((r) => ({ type: 'output' as const, text: r })));
        }
        break;
      }

      case 'echo':
        addLines([{ type: 'output', text: argStr }]);
        break;

      case 'whoami':
        addLines([{ type: 'output', text: 'operator' }]);
        break;

      case 'uname':
        addLines([{ type: 'output', text: 'Linux hexhack 5.4.0-135-generic #152-Ubuntu SMP x86_64 GNU/Linux' }]);
        break;

      case 'ifconfig':
        addLines([
          { type: 'output', text: 'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500' },
          { type: 'output', text: '        inet 10.10.14.5  netmask 255.255.255.0  broadcast 10.10.14.255' },
          { type: 'output', text: '        ether 08:00:27:a4:5f:e1  txqueuelen 1000  (Ethernet)' },
          { type: 'output', text: '' },
          { type: 'output', text: 'lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536' },
          { type: 'output', text: '        inet 127.0.0.1  netmask 255.0.0.0' },
        ]);
        break;

      case 'ps':
        addLines([
          { type: 'output', text: 'USER       PID  %CPU  %MEM     COMMAND' },
          { type: 'output', text: 'root         1  0.0   0.1     /sbin/init' },
          { type: 'output', text: 'www-data   452  0.2   1.3     apache2' },
          { type: 'output', text: 'root       890  0.0   0.2     /usr/sbin/sshd' },
          { type: 'output', text: 'mysql      910  0.5   3.2     mysqld' },
          { type: 'output', text: 'operator  1234  0.1   0.5     bash' },
        ]);
        break;

      case 'sudo':
        if (!argStr) { addLines([{ type: 'error', text: 'sudo: a command is required' }]); break; }
        addLines([
          { type: 'output', text: '[sudo] password for operator: ' },
          { type: 'error', text: 'Sorry, try again.' },
          { type: 'error', text: 'sudo: 3 incorrect password attempts' },
        ]);
        break;

      case 'nmap': {
        // Accept IP addresses and any-case hostnames
        const target = args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a) || /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(a));
        if (!target) { addLines([{ type: 'error', text: 'nmap: missing host argument' }]); break; }
        const host = env.hosts.find((h) => h.ip === target || h.hostname.toLowerCase() === target.toLowerCase());
        if (!host) { addLines([{ type: 'error', text: `nmap: Failed to resolve "${target}".` }]); break; }
        const flags = args.filter((a) => a.startsWith('-'));
        const showVersion = flags.some((f) => f.includes('sV') || f.includes('A') || f === '-sV' || f === '-A');
        const showOS = flags.some((f) => f.includes('O') || f.includes('A') || f === '-O' || f === '-A');
        addLines([
          { type: 'output', text: `Starting Nmap 7.80 ( https://nmap.org )` },
          { type: 'output', text: `Nmap scan report for ${host.hostname} (${host.ip})` },
          { type: 'output', text: `Host is up (0.00042s latency).` },
          { type: 'output', text: '' },
          { type: 'output', text: 'PORT      STATE   SERVICE' + (showVersion ? '     VERSION' : '') },
          ...host.ports.map((p) => ({
            type: 'output' as const,
            text: `${String(p.port + '/tcp').padEnd(9)} ${p.state.padEnd(7)} ${p.service.padEnd(10)}${showVersion ? ' ' + p.version : ''}`,
          })),
        ]);
        if (showOS) addLines([{ type: 'output', text: '' }, { type: 'output', text: `OS: ${host.os} (99% confidence)` }]);
        addLines([
          { type: 'output', text: '' },
          { type: 'output', text: `Nmap done: 1 IP scanned in ${(Math.random() * 4 + 1).toFixed(2)}s` },
        ]);
        if (showVersion) unlockAchievement('nmap_pro');
        break;
      }

      case 'sqlmap': {
        const urlArg = args.find((a) => a.startsWith('http'));
        if (!urlArg) { addLines([{ type: 'error', text: 'sqlmap: no URL provided (use -u <url>)' }]); break; }
        const dump = args.includes('--dump');
        const host = env.hosts.find((h) => urlArg.includes(h.ip) || urlArg.includes(h.hostname));
        const vulnService = host?.services.find((s) => s.vulnerable && s.vulnerabilityType === 'sqli');
        addLines([
          { type: 'output', text: `sqlmap/1.7.11 - automatic SQL injection tool` },
          { type: 'output', text: `[INFO] testing connection to target URL` },
          { type: 'output', text: `[INFO] heuristics detected web server: Apache` },
          { type: 'output', text: `[INFO] testing parameter: id` },
        ]);
        if (vulnService) {
          addLines([
            { type: 'output', text: '[+] id is vulnerable: boolean-based blind' },
            { type: 'output', text: '[+] id is vulnerable: UNION query' },
            { type: 'output', text: '' },
            { type: 'output', text: 'Available databases: information_schema, webapp, users' },
          ]);
          if (dump) {
            addLines([
              { type: 'output', text: '' },
              { type: 'output', text: "[INFO] fetching table 'users' in database 'webapp'" },
              { type: 'output', text: '' },
              { type: 'output', text: '+----+----------+----------+' },
              { type: 'output', text: '| id | username | password |' },
              { type: 'output', text: '+----+----------+----------+' },
              { type: 'output', text: '| 1  | admin    | admin123 |' },
              { type: 'output', text: '| 2  | user     | password |' },
              { type: 'output', text: '+----+----------+----------+' },
              { type: 'output', text: '' },
              { type: 'flag', text: `[+] FLAG: ${vulnService.flag || 'FLAG{sql_injection_success}'}` },
            ]);
            addToast({ type: 'flag', label: 'Flag Captured!', detail: vulnService.flag || 'FLAG{sql_injection_success}', icon: '🚩', xp: XP_VALUES.flag_capture });
            awardXP('flag_capture', 'SQL injection flag');
            unlockAchievement('first_flag');
            unlockAchievement('sql_injection');
          } else {
            addLines([{ type: 'output', text: "[!] Use --dump to extract table data" }]);
          }
        } else {
          addLines([{ type: 'error', text: '[!] Parameters do not appear to be injectable' }]);
        }
        break;
      }

      case 'hashcat': {
        const hashArg = args.find((a) => !a.startsWith('-'));
        if (!hashArg) { addLines([{ type: 'error', text: 'hashcat: no hash provided' }]); break; }
        addLines([
          { type: 'output', text: 'hashcat (v5.1.0) starting...' },
          { type: 'output', text: 'OpenCL Platform: Intel(R) Corporation' },
          { type: 'output', text: `Hash mode: MD5` },
          { type: 'output', text: `Target: ${hashArg}` },
          { type: 'output', text: 'Dictionary: /usr/share/wordlists/rockyou.txt' },
          { type: 'output', text: '' },
          { type: 'output', text: 'Status...........: Cracked' },
          { type: 'output', text: '' },
          { type: 'success', text: `${hashArg}:password123` },
          { type: 'output', text: 'Session completed. 1/1 hash cracked.' },
        ]);
        unlockAchievement('hash_cracker');
        break;
      }

      case 'hydra': {
        const target = args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
        if (!target) { addLines([{ type: 'error', text: 'hydra: no target IP specified' }]); break; }
        addLines([
          { type: 'output', text: `Hydra v9.5 (c) 2023 by van Hauser/THC` },
          { type: 'output', text: `[DATA] attacking ssh://${target}:22` },
          { type: 'output', text: '[DATA] 14344 passwords loaded from rockyou.txt' },
          { type: 'output', text: '[DATA] 4 tasks running in parallel' },
          { type: 'output', text: '' },
          { type: 'output', text: `[ATTEMPT] target ${target} - login "root" - pass "123456" - 1 of 14344` },
          { type: 'output', text: `[ATTEMPT] target ${target} - login "root" - pass "password" - 2 of 14344` },
          { type: 'output', text: '...' },
          { type: 'output', text: '' },
          { type: 'success', text: `[22][ssh] host: ${target} login: root password: toor` },
          { type: 'output', text: '1 of 1 target successfully completed.' },
        ]);
        unlockAchievement('brute_force');
        break;
      }

      case 'gobuster': {
        const urlArg = args.find((a) => a.startsWith('http'));
        if (!urlArg) { addLines([{ type: 'error', text: 'gobuster: no URL provided (use -u <url>)' }]); break; }
        addLines([
          { type: 'output', text: `Gobuster v3.6.0` },
          { type: 'output', text: `URL: ${urlArg}` },
          { type: 'output', text: 'Wordlist: /usr/share/wordlists/dirb/common.txt' },
          { type: 'output', text: '' },
          { type: 'output', text: '/admin                (Status: 200) [Size: 1234]' },
          { type: 'output', text: '/login                (Status: 200) [Size: 567]' },
          { type: 'output', text: '/config               (Status: 301) [Size: 312]' },
          { type: 'output', text: '/backup               (Status: 403) [Size: 277]' },
          { type: 'output', text: '/api                  (Status: 200) [Size: 89]' },
          { type: 'output', text: '/robots.txt           (Status: 200) [Size: 25]' },
          { type: 'output', text: '' },
          { type: 'output', text: 'Finished in 12.3 seconds' },
        ]);
        break;
      }

      case 'nikto': {
        const hIdx = args.indexOf('-h');
        const target = hIdx !== -1 ? args[hIdx + 1] : args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
        if (!target) { addLines([{ type: 'error', text: 'nikto: no host provided (use -h <host>)' }]); break; }
        addLines([
          { type: 'output', text: '- Nikto v2.1.6' },
          { type: 'output', text: `+ Target IP: ${target}` },
          { type: 'output', text: '+ Server: Apache/2.4.41 (Ubuntu)' },
          { type: 'output', text: '+ /admin: Admin panel detected' },
          { type: 'output', text: '+ /config.php: Configuration file found' },
          { type: 'output', text: '+ OSVDB-3267: /admin/login.php: Admin login page detected' },
          { type: 'output', text: '+ 1 host(s) tested in 8.5 seconds' },
        ]);
        break;
      }

      case 'curl': {
        const urlArg = args.find((a) => a.startsWith('http'));
        if (!urlArg) { addLines([{ type: 'error', text: 'curl: try "curl <url>"' }]); break; }
        const host = env.hosts.find((h) => urlArg.includes(h.ip) || urlArg.includes(h.hostname));
        addLines([
          { type: 'output', text: `* Trying ${host?.ip || '10.10.10.5'}...` },
          { type: 'output', text: `* Connected to ${urlArg.replace(/^https?:\/\//, '')}` },
          { type: 'output', text: '< HTTP/1.1 200 OK' },
          { type: 'output', text: '< Server: Apache/2.4.41 (Ubuntu)' },
          { type: 'output', text: '' },
          ...(urlArg.includes('/admin')
            ? [
                { type: 'output' as const, text: '<html><body>' },
                { type: 'output' as const, text: '<h1>Admin Login</h1>' },
                { type: 'output' as const, text: '<form method="POST" action="login.php">' },
                { type: 'output' as const, text: '  <input name="username"><input name="password" type="password">' },
                { type: 'output' as const, text: '  <button>Login</button></form></body></html>' },
              ]
            : [
                { type: 'output' as const, text: '<html><body><h1>Welcome to Target Inc.</h1></body></html>' },
              ]),
        ]);
        break;
      }

      case 'nc':
      case 'netcat': {
        const target = args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
        const port = args.find((a) => /^\d+$/.test(a));
        if (!target || !port) { addLines([{ type: 'error', text: 'nc: usage: nc <host> <port>' }]); break; }
        const host = env.hosts.find((h) => h.ip === target);
        const portNum = parseInt(port);
        const portInfo = host?.ports.find((p) => p.port === portNum);
        if (portInfo?.state === 'open') {
          addLines([
            { type: 'output', text: `Connection to ${target} ${portNum} port [${portInfo.service}/*] succeeded!` },
            { type: 'output', text: `SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.1` },
          ]);
        } else {
          addLines([{ type: 'error', text: `nc: connect to ${target} port ${portNum} (tcp) failed: Connection refused` }]);
        }
        break;
      }

      case 'clear':
        setLines([{ type: 'system', text: '' }]);
        break;

      case 'banner':
        addLines([{ type: 'system', text: BANNER }]);
        break;

      default:
        addLines([{ type: 'error', text: `${rawBase}: command not found — type 'help'` }]);
    }

    checkLabProgress(cmd);
  }, [module, lab, env, vfs, installedTools, addLines, logCommand, saveState, checkLabProgress, awardXP, unlockAchievement, addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (installing) return;
    const cmd = input;
    if (cmd.trim()) setHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);
    setInput('');
    await runCommand(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const idx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(idx);
      setInput(history[idx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const idx = historyIdx + 1;
      if (idx >= history.length) { setHistoryIdx(-1); setInput(''); }
      else { setHistoryIdx(idx); setInput(history[idx]); }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.split(/\s+/);
      const last = parts[parts.length - 1] || '';
      const allCommands = [
        'help','ls','cd','pwd','cat','mkdir','touch','echo','rm','tree','find',
        'whoami','ifconfig','ps','uname','sudo','tools','apt-get','pip',
        'nmap','sqlmap','hashcat','hydra','gobuster','nikto','curl','nc','clear','banner',
      ];
      if (parts.length === 1) {
        const match = allCommands.find((c) => c.startsWith(last.toLowerCase()));
        if (match) setInput(match + ' ');
      } else {
        const listing = vfsLs(vfs);
        if (listing) {
          const match = listing.find((f) => f.startsWith(last));
          if (match) { parts[parts.length - 1] = match; setInput(parts.join(' ')); }
        }
      }
    }
  };

  if (!stateLoaded) {
    return (
      <div className="bg-[#05080d] border border-[#1c2839] rounded-xl p-4 flex items-center justify-center h-64">
        <Loader2 className="text-green-400 animate-spin" size={20} />
      </div>
    );
  }

  return (
    <>
      <AchievementToast toasts={toasts} onDismiss={dismissToast} />
      <div
        className="bg-[#05080d] border border-[#1c2839] rounded-xl overflow-hidden transition-shadow hover:shadow-[0_0_20px_rgba(0,255,136,0.06)]"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0d1117] border-b border-[#1c2839]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs terminal-text text-slate-500 ml-2">
              operator@hexhack:{vfs.cwd}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {installedTools.length > 0 && (
              <span className="text-xs terminal-text text-slate-600 flex items-center gap-1">
                <Package size={11} /> {installedTools.length} tools
              </span>
            )}
            {lab && completedConditions.size > 0 && (
              <span className="text-xs terminal-text text-green-400 flex items-center gap-1">
                <CheckCircle2 size={11} />
                {completedConditions.size}/{env.successConditions.length} objectives
              </span>
            )}
          </div>
        </div>

        {/* Output */}
        <div ref={scrollRef} className="h-72 overflow-y-auto p-4 terminal-text text-sm leading-relaxed">
          {lines.map((line, i) => (
            <div
              key={i}
              className={
                line.type === 'input'   ? 'text-slate-300' :
                line.type === 'error'   ? 'text-red-400' :
                line.type === 'system'  ? 'text-green-400/70' :
                line.type === 'success' ? 'text-green-400 font-semibold' :
                line.type === 'flag'    ? 'text-amber-400 font-bold animate-pulse-glow' :
                'text-slate-400'
              }
            >
              {line.type === 'input' ? (
                <span>
                  <span className="text-green-400">operator@hexhack</span>
                  <span className="text-slate-600">:</span>
                  <span className="text-cyan-400">{vfs.cwd}</span>
                  <span className="text-slate-600">$ </span>
                  {line.text}
                </span>
              ) : (
                <pre className="whitespace-pre-wrap font-inherit">{line.text || '\u00a0'}</pre>
              )}
            </div>
          ))}

          <form onSubmit={handleSubmit} className="flex items-center mt-1">
            <span className="text-green-400">operator@hexhack</span>
            <span className="text-slate-600">:</span>
            <span className="text-cyan-400">{vfs.cwd}</span>
            <span className="text-slate-600">$&nbsp;</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              disabled={installing}
              className="flex-1 bg-transparent border-none outline-none text-slate-300 terminal-text text-sm caret-green-400"
            />
            {installing && <Loader2 className="text-green-400 animate-spin" size={14} />}
          </form>
        </div>
      </div>
    </>
  );
}
