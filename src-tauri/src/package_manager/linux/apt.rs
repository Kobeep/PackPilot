use async_trait::async_trait;
use tokio::process::Command;
use std::collections::HashSet;
use crate::models::AppModel;
use super::super::PackageManager;

pub struct Apt;

#[async_trait]
impl PackageManager for Apt {
    fn name(&self) -> &'static str { "apt" }

    async fn is_available(&self) -> bool {
        Command::new("which").arg("apt").output().await
            .map(|out| out.status.success()).unwrap_or(false)
    }

    async fn search(&self, query: &str) -> Result<Vec<AppModel>, String> {
        let output = Command::new("apt").arg("search").arg("--names-only").arg(query)
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let installed = self.list_installed().await.unwrap_or_default();
        let mut results = Vec::new();
        let lines: Vec<&str> = stdout.lines().collect();
        let mut i = 0;
        while i < lines.len() {
            let line = lines[i].trim();
            if line.starts_with("WARNING") || line.starts_with("Sorting") || line.starts_with("Full") || line.is_empty() {
                i += 1; continue;
            }
            if !line.starts_with(' ') && line.contains('/') {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if !parts.is_empty() {
                    let name_suite: Vec<&str> = parts[0].splitn(2, '/').collect();
                    let id = name_suite[0].to_string();
                    let version = if parts.len() > 1 { parts[1] } else { "Unknown" };
                    let desc = if i + 1 < lines.len() { lines[i + 1].trim().to_string() } else { String::new() };
                    let is_installed = installed.contains(&id);

                    results.push(AppModel {
                        id: id.clone(), name: id.clone(), description: desc,
                        publisher: "APT Repository".to_string(), version: version.to_string(),
                        category: Some("System".to_string()), icon_url: None,
                        source: "apt".to_string(), is_installed, is_verified: true,
                    });
                    i += 2; continue;
                }
            }
            i += 1;
        }
        Ok(results)
    }

    async fn install(&self, app_id: &str) -> Result<(), String> {
        let s = Command::new("pkexec").arg("apt").arg("install").arg("-y").arg(app_id)
            .status().await.map_err(|e| e.to_string())?;
        if s.success() { Ok(()) } else { Err(format!("Installation failed for {}", app_id)) }
    }

    async fn uninstall(&self, app_id: &str) -> Result<(), String> {
        let s = Command::new("pkexec").arg("apt").arg("remove").arg("-y").arg(app_id)
            .status().await.map_err(|e| e.to_string())?;
        if s.success() { Ok(()) } else { Err(format!("Uninstall failed for {}", app_id)) }
    }

    async fn list_upgradable(&self) -> Result<Vec<AppModel>, String> {
        let _ = Command::new("pkexec").arg("apt").arg("update").output().await;
        let output = Command::new("apt").arg("list").arg("--upgradable")
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut results = Vec::new();
        for line in stdout.lines() {
            if line.starts_with("Listing") || line.is_empty() { continue; }
            let parts: Vec<&str> = line.split_whitespace().collect();
            if !parts.is_empty() {
                let id = parts[0].split('/').next().unwrap_or(parts[0]).to_string();
                let version = if parts.len() > 1 { parts[1] } else { "Unknown" };
                results.push(AppModel {
                    id: id.clone(), name: id, description: "Update available".to_string(),
                    publisher: "APT Repository".to_string(), version: version.to_string(),
                    category: Some("System".to_string()), icon_url: None, source: "apt".to_string(),
                    is_installed: true, is_verified: true,
                });
            }
        }
        Ok(results)
    }

    async fn list_installed(&self) -> Result<HashSet<String>, String> {
        let output = Command::new("dpkg-query").arg("-W").arg("-f=${Package}\n")
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut installed = HashSet::new();
        for line in stdout.lines() {
            let pkg = line.trim();
            if !pkg.is_empty() { installed.insert(pkg.to_string()); }
        }
        Ok(installed)
    }
}
