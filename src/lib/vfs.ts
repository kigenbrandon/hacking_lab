export interface VFSFile {
  type: 'file';
  content: string;
  permissions?: string;
}

export interface VFSDirectory {
  type: 'dir';
  children: Record<string, VFSNode>;
  permissions?: string;
}

export type VFSNode = VFSFile | VFSDirectory;

export interface VFSState {
  root: VFSDirectory;
  cwd: string;
}

function normalizePath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return '/' + stack.join('/');
}

export function resolvePath(cwd: string, input: string): string {
  if (input.startsWith('/')) return normalizePath(input);
  if (input === '~') return '/';
  if (input.startsWith('~/')) return normalizePath(input.slice(1));
  return normalizePath(cwd + '/' + input);
}

function getNodeAt(root: VFSDirectory, path: string): VFSNode | null {
  if (path === '/') return root;
  const parts = path.split('/').filter(Boolean);
  let current: VFSNode = root;
  for (const part of parts) {
    if (current.type !== 'dir') return null;
    const child = current.children[part];
    if (!child) return null;
    current = child;
  }
  return current;
}

function getParentDir(root: VFSDirectory, path: string): { parent: VFSDirectory; name: string } | null {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  const name = parts[parts.length - 1];
  let current: VFSNode = root;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current.type !== 'dir') return null;
    const child = current.children[parts[i]];
    if (!child) return null;
    current = child;
  }
  if (current.type !== 'dir') return null;
  return { parent: current, name };
}

export function createVFS(initialFiles?: Record<string, string>): VFSState {
  const root: VFSDirectory = { type: 'dir', children: {} };
  if (initialFiles) {
    for (const [path, content] of Object.entries(initialFiles)) {
      const normalized = normalizePath(path);
      const parts = normalized.split('/').filter(Boolean);
      let current = root;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current.children[parts[i]]) {
          current.children[parts[i]] = { type: 'dir', children: {} };
        }
        const node = current.children[parts[i]];
        if (node.type !== 'dir') break;
        current = node;
      }
      current.children[parts[parts.length - 1]] = {
        type: 'file',
        content,
        permissions: 'rw-r--r--',
      };
    }
  }
  return { root, cwd: '/' };
}

export function ls(state: VFSState, target?: string): string[] | null {
  const path = target ? resolvePath(state.cwd, target) : state.cwd;
  const node = getNodeAt(state.root, path);
  if (!node) return null;
  if (node.type === 'file') return [path.split('/').filter(Boolean).pop() || ''];
  return Object.keys(node.children).sort();
}

export function cd(state: VFSState, target: string): VFSState | null {
  if (!target || target === '~') return { ...state, cwd: '/' };
  const path = resolvePath(state.cwd, target);
  const node = getNodeAt(state.root, path);
  if (!node || node.type !== 'dir') return null;
  return { ...state, cwd: path };
}

export function cat(state: VFSState, target: string): string | null {
  const path = resolvePath(state.cwd, target);
  const node = getNodeAt(state.root, path);
  if (!node || node.type !== 'file') return null;
  return node.content;
}

export function mkdir(state: VFSState, target: string): VFSState | null {
  const path = resolvePath(state.cwd, target);
  const parent = getParentDir(state.root, path);
  if (!parent) return null;
  if (parent.parent.children[parent.name]) return null;
  parent.parent.children[parent.name] = { type: 'dir', children: {} };
  return { ...state };
}

export function touch(state: VFSState, target: string): VFSState | null {
  const path = resolvePath(state.cwd, target);
  const parent = getParentDir(state.root, path);
  if (!parent) return null;
  if (!parent.parent.children[parent.name]) {
    parent.parent.children[parent.name] = {
      type: 'file',
      content: '',
      permissions: 'rw-r--r--',
    };
  }
  return { ...state };
}

export function write(state: VFSState, target: string, content: string): VFSState | null {
  const path = resolvePath(state.cwd, target);
  const parent = getParentDir(state.root, path);
  if (!parent) return null;
  const existing = parent.parent.children[parent.name];
  if (existing && existing.type === 'dir') return null;
  parent.parent.children[parent.name] = {
    type: 'file',
    content,
    permissions: 'rw-r--r--',
  };
  return { ...state };
}

export function rm(state: VFSState, target: string): VFSState | null {
  const path = resolvePath(state.cwd, target);
  const parent = getParentDir(state.root, path);
  if (!parent || !parent.parent.children[parent.name]) return null;
  delete parent.parent.children[parent.name];
  return { ...state };
}

export function tree(state: VFSState, target?: string): string[] {
  const path = target ? resolvePath(state.cwd, target) : state.cwd;
  const node = getNodeAt(state.root, path);
  if (!node) return [];
  const result: string[] = [];
  function walk(node: VFSNode, prefix: string, name: string) {
    result.push(`${prefix}${name}`);
    if (node.type === 'dir') {
      const children = Object.keys(node.children).sort();
      children.forEach((childName, i) => {
        const isLast = i === children.length - 1;
        const child = node.children[childName];
        walk(child, prefix + (isLast ? '    ' : '│   '), childName);
      });
    }
  }
  walk(node, '', path === '/' ? '/' : path.split('/').filter(Boolean).pop() || '/');
  return result;
}

export function find(state: VFSState, name: string): string[] {
  const results: string[] = [];
  function walk(node: VFSNode, path: string) {
    if (path.includes(name)) results.push(path);
    if (node.type === 'dir') {
      for (const [childName, child] of Object.entries(node.children)) {
        walk(child, path === '/' ? `/${childName}` : `${path}/${childName}`);
      }
    }
  }
  walk(state.root, '');
  return results;
}

export function serializeVFS(state: VFSState): string {
  return JSON.stringify({ root: state.root, cwd: state.cwd });
}

export function deserializeVFS(json: string): VFSState {
  const parsed = JSON.parse(json);
  return { root: parsed.root, cwd: parsed.cwd };
}
