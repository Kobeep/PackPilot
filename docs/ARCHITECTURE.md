# Architecture Overview — PackPilot

## High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      PackPilot App                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  FRONTEND (React + TS)                │  │
│  │                                                       │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────────┐  │  │
│  │  │ Sidebar │ │ App Grid │ │ Search │ │  Install   │  │  │
│  │  │  (nav)  │ │  (main)  │ │  Bar   │ │  Queue     │  │  │
│  │  └─────────┘ └──────────┘ └────────┘ └────────────┘  │  │
│  │                                                       │  │
│  │  ┌─────────────────┐  ┌────────────────────────────┐  │  │
│  │  │ Profile Manager │  │  Installation Progress     │  │  │
│  │  │ (import/export) │  │  (real-time status view)   │  │  │
│  │  └─────────────────┘  └────────────────────────────┘  │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │ Tauri IPC (invoke/listen)     │
│  ┌──────────────────────────┴────────────────────────────┐  │
│  │                 BACKEND (Rust / Tauri)                 │  │
│  │                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │   Command    │  │   Package    │  │   Profile    │ │  │
│  │  │   Handlers   │  │   Manager    │  │   Manager    │ │  │
│  │  │  (Tauri IPC) │  │   Service    │  │   Service    │ │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │  │
│  │         │                 │                  │        │  │
│  │  ┌──────┴─────────────────┴──────────────────┴─────┐  │  │
│  │  │            Platform Abstraction Layer            │  │  │
│  │  │  ┌─────────┐  ┌──────────┐  ┌───────────────┐   │  │  │
│  │  │  │  Winget  │  │ Homebrew │  │  APT/DNF/     │   │  │  │
│  │  │  │ Backend  │  │ Backend  │  │  Flatpak      │   │  │  │
│  │  │  │(Windows) │  │ (macOS)  │  │  (Linux)      │   │  │  │
│  │  │  └─────────┘  └──────────┘  └───────────────┘   │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │  Operating System │
                    │   (winget CLI)    │
                    └───────────────────┘
```

## Data Flow

### Installation Flow

```
User selects apps ──► Queue is built ──► Rust backend receives list
                                              │
                                              ▼
                                    For each app (parallel/sequential):
                                              │
                                    ┌─────────┴──────────┐
                                    │  Spawn winget      │
                                    │  install process   │
                                    │  (async)           │
                                    └─────────┬──────────┘
                                              │
                                    Parse stdout/stderr ──► Emit progress events
                                              │                    │
                                              ▼                    ▼
                                    Process completes      Frontend updates
                                              │            progress bars
                                              ▼
                                    Run post-install
                                    scripts (if any)
```

### Profile Import/Export Flow

```
Export: Selected apps ──► Serialize to JSON ──► Save to file / GitHub Gist
Import: Load JSON file ──► Parse & validate ──► Populate app selection grid
```

## Key Design Decisions

1. **Tauri over Electron** — 20x smaller bundle, native performance, Rust safety
2. **winget as primary backend (Windows)** — Official Microsoft tool, pre-installed, huge repository
3. **Platform Abstraction Layer** — Adding macOS/Linux support later requires only implementing a new backend module, zero frontend changes
4. **Async process spawning** — Each installation runs as an async subprocess, enabling parallel installs and real-time progress streaming via Tauri events
5. **JSON profiles** — Human-readable, git-friendly, easy to share and version control
