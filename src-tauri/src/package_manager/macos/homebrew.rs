use async_trait::async_trait;
use tokio::process::Command;
use std::collections::HashSet;
use crate::models::AppModel;
use super::super::PackageManager;

pub struct Homebrew;

#[async_trait]
impl PackageManager for Homebrew {
    fn name(&self) -> &'static str { "brew" }

    async fn is_available(&self) -> bool {
        Command::new("which").arg("brew").output().await
            .map(|out| out.status.success()).unwrap_or(false)
    }

    async fn search(&self, query: &str) -> Result<Vec<AppModel>, String> {
        let output = Command::new("brew").arg("search").arg("--desc").arg(query)
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let installed = self.list_installed().await.unwrap_or_default();
        let mut results = Vec::new();
        let mut current_type = "formula";
        for line in stdout.lines() {
            let line = line.trim();
            if line.is_empty() { continue; }
            if line.starts_with("==> Formulae") { current_type = "formula"; continue; }
            if line.starts_with("==> Casks") { current_type = "cask"; continue; }
            if line.starts_with("==>") { continue; }
            if let Some((name, desc)) = line.split_once(": ") {
                let name = name.trim();
                let is_installed = installed.contains(name);
                results.push(AppModel {
                    id: name.to_string(), name: name.to_string(), description: desc.trim().to_string(),
                    publisher: if current_type == "cask" { "Homebrew Cask" } else { "Homebrew" }.to_string(),
                    version: "Latest".to_string(),
                    category: Some(if current_type == "cask" { "App" } else { "System" }.to_string()),
                    icon_url: None, source: "brew".to_string(), is_installed, is_verified: true,
                });
            }
        }
        if results.is_empty() {
            let output2 = Command::new("brew").arg("search").arg(query)
                .output().await.map_err(|e| e.to_string())?;
            let stdout2 = String::from_utf8_lossy(&output2.stdout);
            for line in stdout2.lines() {
                let line = line.trim();
                if line.is_empty() || line.starts_with("==>") || line.starts_with("No ") { continue; }
                let is_installed = installed.contains(line);
                results.push(AppModel {
                    id: line.to_string(), name: line.to_string(), description: "Homebrew package".to_string(),
                    publisher: "Homebrew".to_string(), version: "Latest".to_string(),
                    category: Some("App".to_string()), icon_url: None, source: "brew".to_string(),
                    is_installed, is_verified: true,
                });
            }
        }
        Ok(results)
    }

    async fn install(&self, app_id: &str) -> Result<(), String> {
        let cask = Command::new("brew").arg("install").arg("--cask").arg(app_id)
            .status().await.map_err(|e| e.to_string())?;
        if cask.success() { return Ok(()); }
        let formula = Command::new("brew").arg("install").arg(app_id)
            .status().await.map_err(|e| e.to_string())?;
        if formula.success() { Ok(()) } else { Err(format!("Installation failed for {}", app_id)) }
    }

    async fn uninstall(&self, app_id: &str) -> Result<(), String> {
        let cask = Command::new("brew").arg("uninstall").arg("--cask").arg(app_id).status().await;
        if let Ok(s) = cask { if s.success() { return Ok(()); } }
        let formula = Command::new("brew").arg("uninstall").arg(app_id)
            .status().await.map_err(|e| e.to_string())?;
        if formula.success() { Ok(()) } else { Err(format!("Uninstall failed for {}", app_id)) }
    }

    async fn list_upgradable(&self) -> Result<Vec<AppModel>, String> {
        let output = Command::new("brew").arg("outdated").arg("--json=v2")
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut results = Vec::new();
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
            if let Some(formulae) = json.get("formulae").and_then(|f| f.as_array()) {
                for formula in formulae {
                    let name = formula.get("name").and_then(|n| n.as_str()).unwrap_or("");
                    let latest = formula.get("current_version").and_then(|v| v.as_str()).unwrap_or("?");
                    results.push(AppModel {
                        id: name.to_string(), name: name.to_string(),
                        description: format!("Update to {}", latest), publisher: "Homebrew".to_string(),
                        version: latest.to_string(), category: Some("System".to_string()),
                        icon_url: None, source: "brew".to_string(), is_installed: true, is_verified: true,
                    });
                }
            }
        }
        Ok(results)
    }

    async fn list_installed(&self) -> Result<HashSet<String>, String> {
        let output = Command::new("brew").arg("list").arg("--formula").arg("-1")
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut installed: HashSet<String> = stdout.lines().map(|l| l.trim().to_string()).filter(|l| !l.is_empty()).collect();
        // Also add casks
        if let Ok(cask_out) = Command::new("brew").arg("list").arg("--cask").arg("-1").output().await {
            let cask_stdout = String::from_utf8_lossy(&cask_out.stdout);
            for line in cask_stdout.lines() {
                let l = line.trim();
                if !l.is_empty() { installed.insert(l.to_string()); }
            }
        }
        Ok(installed)
    }
}
