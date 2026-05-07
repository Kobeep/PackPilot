<p align="center">
  <img src="docs/assets/logo-placeholder.png" alt="PackPilot Logo" width="120" />
</p>

<h1 align="center">PackPilot</h1>

<p align="center">
  <strong>Your autopilot for app installations.</strong><br/>
  Select. Install. Done. ⚡
</p>

<p align="center">
  <a href="https://github.com/Kobeep/PackPilot/releases"><img src="https://img.shields.io/github/v/release/Kobeep/PackPilot?style=flat-square&color=blue" alt="Release"></a>
  <a href="https://github.com/Kobeep/PackPilot/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Kobeep/PackPilot?style=flat-square" alt="License"></a>
  <a href="https://github.com/Kobeep/PackPilot/issues"><img src="https://img.shields.io/github/issues/Kobeep/PackPilot?style=flat-square&color=orange" alt="Issues"></a>
  <img src="https://img.shields.io/badge/platform-Windows-0078D6?style=flat-square&logo=windows" alt="Platform">
  <img src="https://img.shields.io/badge/built_with-Tauri_+_React-FFC131?style=flat-square&logo=tauri" alt="Tech">
</p>

---

## 🎯 What is PackPilot?

**PackPilot** is a lightweight, beautifully designed desktop application that lets you install all your favorite apps on a fresh machine in one click.

Instead of manually downloading installers from 20 different websites, you simply:

1. 🔍 **Browse or search** from thousands of available apps
2. ☑️ **Check the ones you want** (Chrome, VS Code, Discord, Spotify...)
3. 🚀 **Hit "Install All"** and grab a coffee

PackPilot handles everything under the hood using your system's native package manager.

> 💡 Think of it as **Ninite on steroids** — open-source, cross-platform (coming soon), and with profiles you can save & share.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🖥️ **One-Click Batch Install** | Select multiple apps and install them all simultaneously |
| 🔍 **Instant Search** | Fuzzy search across the entire winget repository in real-time |
| 📂 **Categories** | Browse apps by category: Browsers, Dev Tools, Communication, Media, etc. |
| 💾 **Import / Export Profiles** | Save your app selections to a `.json` file. Share it, back it up, or use it on another PC |
| 📊 **Live Progress Tracking** | Beautiful progress bars showing real-time installation status for each app |
| 🔄 **Update Checker** | Scan installed apps and update outdated ones in bulk |
| ⚙️ **Post-Install Scripts** | Run custom scripts after installation (e.g., configure Git, set dark mode) |
| 🪶 **Ultra Lightweight** | Built with Tauri — ~8 MB installer, <30 MB RAM usage |

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | [Tauri v2](https://v2.tauri.app/) | Native performance, tiny bundle size (vs Electron's 150MB+) |
| **Frontend** | React 18 + TypeScript | Component-based UI with type safety |
| **Styling** | Tailwind CSS | Rapid, consistent, beautiful UI development |
| **Backend** | Rust | Blazing fast system-level operations, memory safety |
| **Package Manager** | [winget](https://github.com/microsoft/winget-cli) (Windows) | Microsoft's official CLI package manager, built into Win 10/11 |
| **Future** | Homebrew (macOS), apt/dnf/flatpak (Linux) | Cross-platform expansion planned |

---

## 📸 Screenshots

> 🚧 Coming soon — the app is currently in active development.

---

## 🚀 Getting Started

### Prerequisites

- **Windows 10/11** (with winget available — it comes pre-installed on modern Windows)
- **Node.js** >= 18
- **Rust** >= 1.70
- **pnpm** (recommended) or npm

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Kobeep/PackPilot.git
cd PackPilot

# Install frontend dependencies
pnpm install

# Run in development mode (launches Tauri + React dev server)
pnpm tauri dev
```

### Building for Production

```bash
pnpm tauri build
```

The installer will be generated in `src-tauri/target/release/bundle/`.

---

## 📁 Project Structure

```
PackPilot/
├── src/                    # React frontend
│   ├── components/         # UI components (AppCard, SearchBar, Sidebar, InstallQueue, Toast)
│   ├── stores/             # Zustand state management
│   ├── types/              # TypeScript type definitions
│   ├── assets/             # Static assets (icons, SVGs)
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles & Tailwind directives
├── src-tauri/              # Rust backend (Tauri)
│   ├── src/
│   │   ├── lib.rs          # Tauri command handlers
│   │   ├── models.rs       # Data models (AppModel)
│   │   └── package_manager/# Platform abstraction layer
│   │       ├── linux/      # DNF + Flatpak backends
│   │       └── windows/    # Winget + Chocolatey backends
│   ├── capabilities/       # Tauri permission definitions
│   └── Cargo.toml
├── docs/                   # Documentation & architecture
├── profiles/               # Example import/export profiles
└── package.json
```

---

## 💾 Profile Format (Import/Export)

Profiles are simple JSON files that you can share, version control, or back up:

```json
{
  "name": "My Dev Setup",
  "description": "Everything I need for web development",
  "created_at": "2026-04-23T01:00:00Z",
  "platform": "windows",
  "apps": [
    { "id": "Google.Chrome", "category": "Browsers" },
    { "id": "Microsoft.VisualStudioCode", "category": "Development" },
    { "id": "Git.Git", "category": "Development" },
    { "id": "Docker.DockerDesktop", "category": "Development" },
    { "id": "Discord.Discord", "category": "Communication" },
    { "id": "Spotify.Spotify", "category": "Media" }
  ],
  "post_install_scripts": [
    {
      "trigger_after": "Git.Git",
      "script": "git config --global user.name 'Kobe' && git config --global core.autocrlf true"
    }
  ]
}
```

---

## 🗺️ Roadmap

- [x] Project planning & architecture
- [ ] **v0.1** — MVP: Browse, search, and batch install apps via winget
- [ ] **v0.2** — Import/Export profiles (JSON)
- [ ] **v0.3** — Update checker & bulk updates
- [ ] **v0.4** — Post-install scripts
- [ ] **v0.5** — Cloud sync via GitHub Gist
- [ ] **v1.0** — Stable Windows release
- [ ] **v1.5** — macOS support (Homebrew backend)
- [ ] **v2.0** — Linux support (apt/dnf/flatpak)

---

## 🤝 Contributing

Contributions are welcome! Please check the [Issues](https://github.com/Kobeep/PackPilot/issues) tab for open tasks.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ and ☕ by <a href="https://github.com/Kobeep">Kobeep</a>
</p>
