use async_trait::async_trait;
use tokio::process::Command;
use std::collections::HashSet;
use crate::models::AppModel;
use super::super::PackageManager;

pub struct Dnf;

#[async_trait]
impl PackageManager for Dnf {
    fn name(&self) -> &'static str { "dnf" }

    async fn is_available(&self) -> bool {
        Command::new("which").arg("dnf").output().await
            .map(|out| out.status.success()).unwrap_or(false)
    }

    async fn search(&self, query: &str) -> Result<Vec<AppModel>, String> {
        let output = Command::new("dnf").arg("search").arg(query)
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let installed = self.list_installed().await.unwrap_or_default();
        let mut results = Vec::new();

        for line in stdout.lines() {
            let line = line.trim();
            if line.starts_with('=') || line.starts_with("Matched") || line.is_empty() { continue; }

            let parts: Vec<&str> = if line.contains(" : ") {
                line.splitn(2, " : ").collect()
            } else if line.contains('\t') {
                line.splitn(2, '\t').collect()
            } else {
                line.splitn(2, ' ').collect()
            };

            if parts.len() == 2 {
                let full_name = parts[0].trim();
                let desc = parts[1].trim();
                let id = full_name.split('.').next().unwrap_or(full_name).to_string();
                let is_installed = installed.contains(&id);

                results.push(AppModel {
                    id: id.clone(), name: id.clone(),
                    description: desc.to_string(),
                    publisher: "DNF Repository".to_string(),
                    version: "Latest".to_string(),
                    category: Some("System".to_string()),
                    icon_url: None,
                    source: "dnf".to_string(),
                    is_installed,
                    is_verified: true, // Official repo = verified
                });
            }
        }
        Ok(results)
    }

    async fn install(&self, app_id: &str) -> Result<(), String> {
        let s = Command::new("pkexec").arg("dnf").arg("install").arg("-y").arg(app_id)
            .status().await.map_err(|e| e.to_string())?;
        if s.success() { Ok(()) } else { Err(format!("Installation failed for {}", app_id)) }
    }

    async fn uninstall(&self, app_id: &str) -> Result<(), String> {
        let s = Command::new("pkexec").arg("dnf").arg("remove").arg("-y").arg(app_id)
            .status().await.map_err(|e| e.to_string())?;
        if s.success() { Ok(()) } else { Err(format!("Uninstall failed for {}", app_id)) }
    }

    async fn list_upgradable(&self) -> Result<Vec<AppModel>, String> {
        let output = Command::new("dnf").arg("check-update").arg("--quiet")
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut results = Vec::new();
        for line in stdout.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with("Last metadata") || line.starts_with("Obsoleting") { continue; }
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                let id = parts[0].split('.').next().unwrap_or(parts[0]).to_string();
                results.push(AppModel {
                    id: id.clone(), name: id, description: "Update available".to_string(),
                    publisher: "DNF Repository".to_string(), version: parts[1].to_string(),
                    category: Some("System".to_string()), icon_url: None, source: "dnf".to_string(),
                    is_installed: true, is_verified: true,
                });
            }
        }
        Ok(results)
    }

    async fn list_installed(&self) -> Result<HashSet<String>, String> {
        let output = Command::new("dnf").arg("list").arg("installed").arg("--quiet")
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut installed = HashSet::new();
        for line in stdout.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with("Installed") { continue; }
            if let Some(name) = line.split_whitespace().next() {
                let id = name.split('.').next().unwrap_or(name).to_string();
                installed.insert(id);
            }
        }
        Ok(installed)
    }
}
