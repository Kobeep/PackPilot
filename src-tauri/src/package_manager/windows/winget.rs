use async_trait::async_trait;
use tokio::process::Command;
use std::collections::HashSet;
use crate::models::AppModel;
use super::super::PackageManager;

pub struct Winget;

#[async_trait]
impl PackageManager for Winget {
    fn name(&self) -> &'static str { "winget" }

    async fn is_available(&self) -> bool {
        Command::new("winget").arg("--version").output().await
            .map(|out| out.status.success()).unwrap_or(false)
    }

    async fn search(&self, query: &str) -> Result<Vec<AppModel>, String> {
        let output = Command::new("winget").arg("search").arg(query)
            .arg("--accept-source-agreements").output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let installed = self.list_installed().await.unwrap_or_default();
        let mut results = Vec::new();
        let mut parsing_data = false;
        for line in stdout.lines() {
            if line.starts_with("---") { parsing_data = true; continue; }
            if !parsing_data || line.trim().is_empty() { continue; }
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 3 {
                let len = parts.len();
                let source = parts[len - 1];
                let version = parts[len - 2];
                let id = parts[len - 3];
                let name = parts[0..(len - 3)].join(" ");
                let is_installed = installed.contains(id);
                // Apps from "msstore" source are Microsoft-verified
                let is_verified = source == "msstore" || id.starts_with("Microsoft.") || id.starts_with("Google.") || id.starts_with("Mozilla.");

                results.push(AppModel {
                    id: id.to_string(), name, description: "Windows application".to_string(),
                    publisher: "Unknown".to_string(), version: version.to_string(),
                    category: Some("App".to_string()), icon_url: None, source: "winget".to_string(),
                    is_installed, is_verified,
                });
            }
        }
        Ok(results)
    }

    async fn install(&self, app_id: &str) -> Result<(), String> {
        let s = Command::new("winget").arg("install").arg("--id").arg(app_id)
            .arg("--exact").arg("--accept-package-agreements").arg("--accept-source-agreements")
            .status().await.map_err(|e| e.to_string())?;
        if s.success() { Ok(()) } else { Err(format!("Installation failed for {}", app_id)) }
    }

    async fn uninstall(&self, app_id: &str) -> Result<(), String> {
        let s = Command::new("winget").arg("uninstall").arg("--id").arg(app_id)
            .arg("--exact").arg("--accept-source-agreements")
            .status().await.map_err(|e| e.to_string())?;
        if s.success() { Ok(()) } else { Err(format!("Uninstall failed for {}", app_id)) }
    }

    async fn list_upgradable(&self) -> Result<Vec<AppModel>, String> {
        let output = Command::new("winget").arg("upgrade").arg("--accept-source-agreements")
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut results = Vec::new();
        let mut parsing_data = false;
        for line in stdout.lines() {
            if line.starts_with("---") { parsing_data = true; continue; }
            if !parsing_data || line.trim().is_empty() || line.contains("upgrades available") { continue; }
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 4 {
                let len = parts.len();
                let new_ver = parts[len - 2];
                let id = parts[len - 4];
                let name = parts[0..(len - 4)].join(" ");
                results.push(AppModel {
                    id: id.to_string(), name, description: format!("Update to {}", new_ver),
                    publisher: "Unknown".to_string(), version: new_ver.to_string(),
                    category: Some("App".to_string()), icon_url: None, source: "winget".to_string(),
                    is_installed: true, is_verified: true,
                });
            }
        }
        Ok(results)
    }

    async fn list_installed(&self) -> Result<HashSet<String>, String> {
        let output = Command::new("winget").arg("list").arg("--accept-source-agreements")
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut installed = HashSet::new();
        let mut parsing_data = false;
        for line in stdout.lines() {
            if line.starts_with("---") { parsing_data = true; continue; }
            if !parsing_data || line.trim().is_empty() { continue; }
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 3 {
                let id = parts[parts.len() - 3];
                installed.insert(id.to_string());
            }
        }
        Ok(installed)
    }
}
