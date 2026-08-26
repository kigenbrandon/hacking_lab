export interface ToolDefinition {
  slug: string;
  name: string;
  description: string;
  installCommand: string;
  packageManager: 'apt' | 'pip' | 'git';
  installOutput: string[];
  version: string;
}

export interface LabHost {
  ip: string;
  hostname: string;
  ports: LabPort[];
  os: string;
  services: LabService[];
}

export interface LabPort {
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'closed' | 'filtered';
  service: string;
  version: string;
}

export interface LabService {
  name: string;
  port: number;
  version: string;
  vulnerable: boolean;
  vulnerabilityType?: string;
  flag?: string;
}

export interface LabEnvironment {
  labSlug: string;
  hosts: LabHost[];
  initialFiles: Record<string, string>;
  availableTools: string[];
  successConditions: SuccessCondition[];
}

export interface SuccessCondition {
  id: string;
  description: string;
  commandPattern: string;
  hint: string;
}

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  nmap: {
    slug: 'nmap',
    name: 'Nmap',
    description: 'Network discovery and security auditing utility',
    installCommand: 'apt-get install nmap',
    packageManager: 'apt',
    installOutput: [
      'Reading package lists... Done',
      'Building dependency tree... Done',
      'Reading state information... Done',
      'The following NEW packages will be installed:',
      '  nmap',
      'Get:1 http://archive.ubuntu.com/ubuntu focal/main amd64 nmap amd64 7.80+dfsg1-2build1 [4,648 kB]',
      'Fetched 4,648 kB in 2s (2,324 kB/s)',
      'Selecting previously unselected package nmap.',
      'Preparing to unpack .../nmap_7.80+dfsg1-2build1_amd64.deb ...',
      'Unpacking nmap (7.80+dfsg1-2build1) ...',
      'Setting up nmap (7.80+dfsg1-2build1) ...',
      'Processing triggers for man-db (2.9.1-1) ...',
      'nmap installed successfully.',
    ],
    version: '7.80',
  },
  sqlmap: {
    slug: 'sqlmap',
    name: 'SQLMap',
    description: 'Automatic SQL injection and database takeover tool',
    installCommand: 'pip install sqlmap',
    packageManager: 'pip',
    installOutput: [
      'Collecting sqlmap',
      '  Downloading sqlmap-1.7.11-py3-none-any.whl (1.2 MB)',
      'Installing collected packages: sqlmap',
      'Successfully installed sqlmap-1.7.11',
      'sqlmap installed successfully.',
    ],
    version: '1.7.11',
  },
  hashcat: {
    slug: 'hashcat',
    name: 'Hashcat',
    description: 'Worlds fastest password recovery utility',
    installCommand: 'apt-get install hashcat',
    packageManager: 'apt',
    installOutput: [
      'Reading package lists... Done',
      'Building dependency tree... Done',
      'The following NEW packages will be installed:',
      '  hashcat',
      'Get:1 http://archive.ubuntu.com/ubuntu focal/universe amd64 hashcat amd64 5.1.0-1 [1,234 kB]',
      'Fetched 1,234 kB in 1s (1,234 kB/s)',
      'Selecting previously unselected package hashcat.',
      'Unpacking hashcat (5.1.0-1) ...',
      'Setting up hashcat (5.1.0-1) ...',
      'hashcat installed successfully.',
    ],
    version: '5.1.0',
  },
  hydra: {
    slug: 'hydra',
    name: 'Hydra',
    description: 'Fast network logon cracker supporting many services',
    installCommand: 'apt-get install hydra',
    packageManager: 'apt',
    installOutput: [
      'Reading package lists... Done',
      'Building dependency tree... Done',
      'The following NEW packages will be installed:',
      '  hydra',
      'Get:1 http://archive.ubuntu.com/ubuntu focal/universe amd64 hydra amd64 9.0-4 [567 kB]',
      'Fetched 567 kB in 1s (567 kB/s)',
      'Selecting previously unselected package hydra.',
      'Unpacking hydra (9.0-4) ...',
      'Setting up hydra (9.0-4) ...',
      'hydra installed successfully.',
    ],
    version: '9.0',
  },
  gobuster: {
    slug: 'gobuster',
    name: 'Gobuster',
    description: 'Directory/file/DNS busting tool written in Go',
    installCommand: 'apt-get install gobuster',
    packageManager: 'apt',
    installOutput: [
      'Reading package lists... Done',
      'Building dependency tree... Done',
      'The following NEW packages will be installed:',
      '  gobuster',
      'Get:1 http://archive.ubuntu.com/ubuntu focal/universe amd64 gobuster amd64 3.6.0-1 [892 kB]',
      'Fetched 892 kB in 1s (892 kB/s)',
      'Selecting previously unselected package gobuster.',
      'Unpacking gobuster (3.6.0-1) ...',
      'Setting up gobuster (3.6.0-1) ...',
      'gobuster installed successfully.',
    ],
    version: '3.6.0',
  },
  john: {
    slug: 'john',
    name: 'John the Ripper',
    description: 'Advanced password cracker',
    installCommand: 'apt-get install john',
    packageManager: 'apt',
    installOutput: [
      'Reading package lists... Done',
      'Building dependency tree... Done',
      'The following NEW packages will be installed:',
      '  john',
      'Get:1 http://archive.ubuntu.com/ubuntu focal/universe amd64 john amd64 1.9.0-1 [1,456 kB]',
      'Fetched 1,456 kB in 2s (728 kB/s)',
      'Selecting previously unselected package john.',
      'Unpacking john (1.9.0-1) ...',
      'Setting up john (1.9.0-1) ...',
      'john installed successfully.',
    ],
    version: '1.9.0',
  },
  nikto: {
    slug: 'nikto',
    name: 'Nikto',
    description: 'Web server scanner for dangerous files and outdated software',
    installCommand: 'apt-get install nikto',
    packageManager: 'apt',
    installOutput: [
      'Reading package lists... Done',
      'Building dependency tree... Done',
      'The following NEW packages will be installed:',
      '  nikto',
      'Get:1 http://archive.ubuntu.com/ubuntu focal/universe amd64 nikto all 1:2.1.6-1 [234 kB]',
      'Fetched 234 kB in 1s (234 kB/s)',
      'Selecting previously unselected package nikto.',
      'Unpacking nikto (1:2.1.6-1) ...',
      'Setting up nikto (1:2.1.6-1) ...',
      'nikto installed successfully.',
    ],
    version: '2.1.6',
  },
  curl: {
    slug: 'curl',
    name: 'curl',
    description: 'Command line tool for transferring data with URLs',
    installCommand: 'apt-get install curl',
    packageManager: 'apt',
    installOutput: [
      'Reading package lists... Done',
      'curl is already the newest version (7.68.0-1ubuntu2).',
      'curl installed successfully.',
    ],
    version: '7.68.0',
  },
  netcat: {
    slug: 'netcat',
    name: 'Netcat',
    description: 'Versatile networking utility for reading and writing data across connections',
    installCommand: 'apt-get install netcat',
    packageManager: 'apt',
    installOutput: [
      'Reading package lists... Done',
      'Building dependency tree... Done',
      'The following NEW packages will be installed:',
      '  netcat',
      'Get:1 http://archive.ubuntu.com/ubuntu focal/main amd64 netcat-openbsd amd64 1.206-1ubuntu1 [42 kB]',
      'Fetched 42 kB in 0s (42 kB/s)',
      'Setting up netcat (1.206-1ubuntu1) ...',
      'netcat installed successfully.',
    ],
    version: '1.206',
  },
  wireshark: {
    slug: 'wireshark',
    name: 'Wireshark CLI',
    description: 'Network protocol analyzer with CLI tools (tshark)',
    installCommand: 'apt-get install wireshark',
    packageManager: 'apt',
    installOutput: [
      'Reading package lists... Done',
      'Building dependency tree... Done',
      'The following NEW packages will be installed:',
      '  wireshark-common tshark',
      'Get:1 http://archive.ubuntu.com/ubuntu focal/universe amd64 tshark amd64 3.2.3-1 [1,890 kB]',
      'Fetched 1,890 kB in 2s (945 kB/s)',
      'Setting up tshark (3.2.3-1) ...',
      'Setting up wireshark-common (3.2.3-1) ...',
      'wireshark installed successfully.',
    ],
    version: '3.2.3',
  },
};

export const DEFAULT_LAB_ENVIRONMENT: LabEnvironment = {
  labSlug: 'default',
  hosts: [
    {
      ip: '10.10.10.5',
      hostname: 'target.local',
      os: 'Linux 5.4.0',
      ports: [
        { port: 22, protocol: 'tcp', state: 'open', service: 'ssh', version: 'OpenSSH 8.2p1' },
        { port: 80, protocol: 'tcp', state: 'open', service: 'http', version: 'Apache 2.4.41' },
        { port: 443, protocol: 'tcp', state: 'open', service: 'https', version: 'Apache 2.4.41' },
        { port: 3306, protocol: 'tcp', state: 'open', service: 'mysql', version: 'MySQL 8.0.25' },
      ],
      services: [
        {
          name: 'ssh',
          port: 22,
          version: 'OpenSSH 8.2p1',
          vulnerable: false,
        },
        {
          name: 'http',
          port: 80,
          version: 'Apache 2.4.41',
          vulnerable: true,
          vulnerabilityType: 'sqli',
          flag: 'FLAG{sql_injection_is_fun}',
        },
        {
          name: 'mysql',
          port: 3306,
          version: 'MySQL 8.0.25',
          vulnerable: true,
          vulnerabilityType: 'weak_password',
          flag: 'FLAG{mysql_default_creds}',
        },
      ],
    },
  ],
  initialFiles: {
    '/etc/passwd': 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\noperator:x:1000:1000:operator:/home/operator:/bin/bash\nsshd:x:108:65534::/run/sshd:/usr/sbin/nologin',
    '/etc/hostname': 'target\n',
    '/home/operator/notes.txt': 'Lab notes:\n- Target IP: 10.10.10.5\n- Try scanning with nmap first\n- Check for web vulnerabilities on port 80\n',
    '/var/www/html/index.html': '<!DOCTYPE html>\n<html>\n<body>\n<h1>Welcome to Target Inc.</h1>\n<p>Admin login at /admin</p>\n</body>\n</html>\n',
    '/var/www/html/admin/login.php': '<?php\n// Login page\n// WARNING: SQL injection vulnerable!\n$user = $_POST["username"];\n$pass = $_POST["password"];\n$query = "SELECT * FROM users WHERE username=\'$user\' AND password=\'$pass\'";\n?>\n',
  },
  availableTools: ['nmap', 'sqlmap', 'hashcat', 'hydra', 'gobuster', 'john', 'nikto', 'curl', 'netcat'],
  successConditions: [
    {
      id: 'scan_target',
      description: 'Scan the target with nmap',
      commandPattern: '^nmap\\s+.*10\\.10\\.10\\.5',
      hint: 'Try: nmap 10.10.10.5',
    },
    {
      id: 'find_sqli',
      description: 'Use sqlmap to find SQL injection on the web server',
      commandPattern: '^sqlmap\\s+.*',
      hint: 'Try: sqlmap -u http://10.10.10.5/admin/login.php',
    },
    {
      id: 'get_flag',
      description: 'Find the flag in the database',
      commandPattern: 'sqlmap\\s+.*--dump',
      hint: 'Try: sqlmap -u http://10.10.10.5/admin/login.php --dump',
    },
  ],
};

export function getLabEnvironment(labSlug: string): LabEnvironment {
  return DEFAULT_LAB_ENVIRONMENT;
}

export function getTool(slug: string): ToolDefinition | null {
  return TOOL_REGISTRY[slug] || null;
}

export function isToolInstalled(installedTools: string[], slug: string): boolean {
  return installedTools.includes(slug);
}

export function checkSuccessConditions(
  command: string,
  conditions: SuccessCondition[]
): SuccessCondition[] {
  const completed: SuccessCondition[] = [];
  for (const cond of conditions) {
    const regex = new RegExp(cond.commandPattern, 'i');
    if (regex.test(command)) {
      completed.push(cond);
    }
  }
  return completed;
}
