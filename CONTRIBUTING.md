# Contributing to PackPilot

First off, thank you for considering contributing to PackPilot! 🎉

## 📋 How to Contribute

### Reporting Bugs

- Use the [GitHub Issues](https://github.com/Kobeep/PackPilot/issues) tab
- Use the **Bug Report** template
- Include your OS version, app version, and steps to reproduce

### Suggesting Features

- Open an issue with the **Feature Request** template
- Describe the use case and expected behavior

### Code Contributions

1. **Check existing issues** — look for issues labeled `good first issue` or `help wanted`
2. **Fork & clone** the repository
3. **Create a branch** from `main`: `git checkout -b feature/your-feature`
4. **Make your changes** — follow the code style guidelines below
5. **Test your changes** — ensure nothing is broken
6. **Submit a PR** — reference the issue number in your PR description

## 🧑‍💻 Development Setup

### Prerequisites

- Node.js >= 18
- Rust >= 1.70
- pnpm (recommended)
- Windows 10/11 with winget

### Running Locally

```bash
pnpm install
pnpm tauri dev
```

## 🎨 Code Style

### Frontend (TypeScript/React)
- Use functional components with hooks
- Use TypeScript strict mode
- Follow the existing component structure in `src/components/`

### Backend (Rust)
- Follow standard Rust formatting (`cargo fmt`)
- Use `cargo clippy` for linting
- Add doc comments for public functions

## 📝 Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add search functionality
fix: resolve installation progress not updating
docs: update README with new screenshots
chore: update dependencies
```

## 📜 Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something awesome together.
