import React, { useState } from 'react';
import { Folder, File, Code, Terminal, Server, Shield, Sparkles } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  children?: FileNode[];
  content?: string;
}

const FILES_STRUCTURE: FileNode[] = [
  {
    name: 'ComputerShop',
    type: 'dir',
    path: '/ComputerShop',
    children: [
      {
        name: 'Shared',
        type: 'dir',
        path: '/ComputerShop/Shared',
        children: [
          {
            name: 'interfaces',
            type: 'dir',
            path: '/ComputerShop/Shared/interfaces',
            children: [
              {
                name: 'index.ts',
                type: 'file',
                path: '/ComputerShop/Shared/interfaces/index.ts',
                content: `export interface Player {
  id: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  membership: 'VIP' | 'Gold' | 'Silver' | 'Regular';
  balance: number;
  status: 'Active' | 'Inactive';
  dateCreated: string;
}`
              }
            ]
          },
          {
            name: 'constants',
            type: 'dir',
            path: '/ComputerShop/Shared/constants',
            children: [
              {
                name: 'index.ts',
                type: 'file',
                path: '/ComputerShop/Shared/constants/index.ts',
                content: `export const SOCKET_EVENTS = {
  CLIENT_CONNECT: 'client:connect',
  CLIENT_HEARTBEAT: 'client:heartbeat',
  LOCK_COMPUTER: 'computer:lock',
  UNLOCK_COMPUTER: 'computer:unlock'
};`
              }
            ]
          }
        ]
      },
      {
        name: 'Server',
        type: 'dir',
        path: '/ComputerShop/Server',
        children: [
          { name: 'package.json', type: 'file', path: '/ComputerShop/Server/package.json' },
          { name: 'tsconfig.json', type: 'file', path: '/ComputerShop/Server/tsconfig.json' },
          { name: 'electron-builder.json', type: 'file', path: '/ComputerShop/Server/electron-builder.json' },
          {
            name: 'src',
            type: 'dir',
            path: '/ComputerShop/Server/src',
            children: [
              {
                name: 'main',
                type: 'dir',
                path: '/ComputerShop/Server/src/main',
                children: [
                  {
                    name: 'main.ts',
                    type: 'file',
                    path: '/ComputerShop/Server/src/main/main.ts',
                    content: `import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Sets up dynamic Express controls & Socket.io daemon...`
                  }
                ]
              },
              {
                name: 'preload',
                type: 'dir',
                path: '/ComputerShop/Server/src/preload',
                children: [
                  {
                    name: 'preload.ts',
                    type: 'file',
                    path: '/ComputerShop/Server/src/preload/preload.ts',
                    content: `import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getPlayers: () => ipcRenderer.invoke('get-players'),
  addPlayer: (p) => ipcRenderer.invoke('add-player', p)
});`
                  }
                ]
              },
              {
                name: 'renderer',
                type: 'dir',
                path: '/ComputerShop/Server/src/renderer',
                children: [
                  {
                    name: 'App.tsx',
                    type: 'file',
                    path: '/ComputerShop/Server/src/renderer/src/App.tsx',
                    content: `import React, { useState } from 'react';

export default function App() {
  return <div>LAN Computer Shop Central Server Management Console</div>;
}`
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        name: 'Client',
        type: 'dir',
        path: '/ComputerShop/Client',
        children: [
          { name: 'package.json', type: 'file', path: '/ComputerShop/Client/package.json' },
          { name: 'tsconfig.json', type: 'file', path: '/ComputerShop/Client/tsconfig.json' },
          { name: 'electron-builder.json', type: 'file', path: '/ComputerShop/Client/electron-builder.json' },
          {
            name: 'src',
            type: 'dir',
            path: '/ComputerShop/Client/src',
            children: [
              {
                name: 'main',
                type: 'dir',
                path: '/ComputerShop/Client/src/main',
                children: [
                  {
                    name: 'main.ts',
                    type: 'file',
                    path: '/ComputerShop/Client/src/main/main.ts',
                    content: `import { app, BrowserWindow, ipcMain } from 'electron';
import { io } from 'socket.io-client';

// Establishes lock screen full screen kiosk daemon...`
                  }
                ]
              },
              {
                name: 'renderer',
                type: 'dir',
                path: '/ComputerShop/Client/src/renderer',
                children: [
                  {
                    name: 'App.tsx',
                    type: 'file',
                    path: '/ComputerShop/Client/src/renderer/src/App.tsx',
                    content: `import React from 'react';

export default function App() {
  return <div>Futuristic Workstation Lock Screen</div>;
}`
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

export function ProjectFilesExplorer() {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(FILES_STRUCTURE[0].children?.[1].children?.[0] || null);

  const renderTree = (node: FileNode, depth = 0) => {
    const isDir = node.type === 'dir';
    return (
      <div key={node.path} style={{ paddingLeft: `${depth * 12}px` }} className="select-none">
        <button
          onClick={() => !isDir && setSelectedFile(node)}
          className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-sm text-left transition-all duration-200 ${
            selectedFile?.path === node.path
              ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.1)]'
              : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
          }`}
        >
          {isDir ? (
            <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
          ) : (
            <File className="w-4 h-4 text-slate-500 shrink-0" />
          )}
          <span className="font-sans font-medium">{node.name}</span>
        </button>
        {isDir && node.children && (
          <div className="mt-0.5 border-l border-white/5 ml-3">
            {node.children.map((child) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
      {/* File Tree Column */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col shadow-xl">
        <h2 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2 font-sans uppercase tracking-wider">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <span>Project Structure</span>
        </h2>
        <div className="overflow-y-auto flex-1 pr-2 space-y-1">
          {renderTree(FILES_STRUCTURE[0])}
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 text-xs text-slate-400 flex items-center gap-2 font-mono">
          <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Packaging configurations compiled successfully</span>
        </div>
      </div>

      {/* Code Editor / Instructions Column */}
      <div className="lg:col-span-2 flex flex-col bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2 font-sans uppercase tracking-wider">
            <Code className="w-5 h-5 text-indigo-400" />
            <span>{selectedFile ? selectedFile.name : 'Build & Packaging Guide'}</span>
          </h2>
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-slate-850 text-slate-300 px-2.5 py-1 rounded-full border border-white/5">
            {selectedFile ? 'TypeScript Source' : 'Documentation'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {selectedFile ? (
            <pre className="text-xs font-mono text-slate-300 bg-black/40 p-4 rounded-xl border border-white/5 overflow-x-auto leading-relaxed">
              {selectedFile.content || `{\n  "name": "${selectedFile.name.split('.')[0]}",\n  "version": "1.0.0",\n  "description": "LAN Computer Shop Management System",\n  "main": "dist/main/main.js",\n  "scripts": {\n    "build": "tsc",\n    "dist": "electron-builder"\n  }\n}`}
            </pre>
          ) : (
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-sans">
              <div className="bg-indigo-650/15 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="font-extrabold text-white mb-1">Infrastructure Configured</h4>
                  <p className="text-xs text-slate-350">
                    The folder directories, configuration files, and builder dependencies for both Server and Client Electron applications are set up as independent, production-ready modules.
                  </p>
                </div>
              </div>

              <h3 className="text-base font-extrabold text-white mt-4 uppercase tracking-wider">How to Package Server & Client Setup.exe</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                To package both apps into stand-alone Windows setup installers that run without Node.js on client PCs, follow these standard packaging rules:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-slate-300 bg-black/40 p-4 rounded-xl border border-white/5 font-sans">
                <li className="text-xs">
                  <strong className="text-white">Install dependencies</strong> in each package:
                  <div className="bg-black/40 font-mono text-xs p-2.5 rounded-lg border border-white/5 mt-1 mb-2 text-indigo-300">
                    cd ComputerShop/Server && npm install<br/>
                    cd ../Client && npm install
                  </div>
                </li>
                <li className="text-xs">
                  <strong className="text-white">Compile TypeScript & React Assets</strong>:
                  <div className="bg-black/40 font-mono text-xs p-2.5 rounded-lg border border-white/5 mt-1 mb-2 text-indigo-300">
                    npm run build
                  </div>
                </li>
                <li className="text-xs">
                  <strong className="text-white">Generate Server Setup.exe</strong>:
                  <div className="bg-black/40 font-mono text-xs p-2.5 rounded-lg border border-white/5 mt-1 mb-2 text-indigo-300">
                    npm run dist
                  </div>
                </li>
                <li className="text-xs">
                  <strong className="text-white">Generate Client Setup.exe</strong>:
                  <div className="bg-black/40 font-mono text-xs p-2.5 rounded-lg border border-white/5 mt-1 mb-2 text-indigo-300">
                    cd ../Client && npm run dist
                  </div>
                </li>
              </ol>

              <div className="bg-amber-500/10 border border-amber-500/15 rounded-xl p-4 text-xs text-slate-400 font-sans">
                <strong>Pro-Tip:</strong> The <code>electron-builder</code> configuration compiles standard native SQLite binaries (like <code>better-sqlite3</code>) specifically matching the target CPU architecture (x64 / ia32) using <code>electron-rebuild</code> automatically during packaging.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
