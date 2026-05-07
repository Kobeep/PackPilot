use async_trait::async_trait;
use tokio::process::Command;
use std::collections::HashSet;
use crate::models::AppModel;
use super::super::PackageManager;

pub struct Snap;

#[async_trait]
impl PackageManager for Snap {
    fn name(&self) -> &'static str { "snap" }

    async fn is_available(&self) -> bool {
        Command::new("which").arg("snap").output().await
            .map(|out| out.status.success()).unwrap_or(false)
    }

    async fn search(&self, query: &str) -> Result<Vec<AppModel>, String> {
        let output = Command::new("snap").arg("find").arg(query)
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let installed = self.list_installed().await.unwrap_or_default();
        let mut results = Vec::new();
        let mut header_seen = false;
        for line in stdout.lines() {
            if !header_seen { if line.starts_with("Name") { header_seen = true; } continue; }
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 5 {
                let id = parts[0].to_string();
                let version = parts[1].to_string();
                let publisher = parts[2].to_string();
                let description = parts[4..].join(" ");
                let is_installed = installed.contains(&id);
                // Snap publishers with ✓ or ✪ are verified
                let is_verified = publisher.contains('✓') || publisher.contains('✪') || publisher.ends_with('*');

                results.push(AppModel {
                    id: id.clone(), name: id, description, publisher, version,
                    category: Some("App".to_string()), icon_url: None,
                    source: "snap".to_string(), is_installed, is_verified,
                });
            }
        }
        Ok(results)
    }

    async fn install(&self, app_id: &str) -> Result<(), String> {
        let s = Command::new("snap").arg("install").arg(app_id)
            .status().await.map_err(|e| e.to_string())?;
        if s.success() { Ok(()) } else { Err(format!("Installation failed for {}", app_id)) }
    }

    async fn uninstall(&self, app_id: &str) -> Result<(), String> {
        let s = Command::new("snap").arg("remove").arg(app_id)
            .status().await.map_err(|e| e.to_string())?;
        if s.success() { Ok(()) } else { Err(format!("Uninstall failed for {}", app_id)) }
    }

    async fn list_upgradable(&self) -> Result<Vec<AppModel>, String> {
        let output = Command::new("snap").arg("refresh").arg("--list")
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut results = Vec::new();
        let mut header_seen = false;
        for line in stdout.lines() {
            if !header_seen { if line.starts_with("Name") { header_seen = true; } continue; }
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                results.push(AppModel {
                    id: parts[0].to_string(), name: parts[0].to_string(),
                    description: "Update available".to_string(), publisher: "Snap Store".to_string(),
                    version: parts[1].to_string(), category: Some("App".to_string()),
                    icon_url: None, source: "snap".to_string(), is_installed: true, is_verified: true,
                });
            }
        }
        Ok(results)
    }

    async fn list_installed(&self) -> Result<HashSet<String>, String> {
        let output = Command::new("snap").arg("list")
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut installed = HashSet::new();
        let mut header_seen = false;
        for line in stdout.lines() {
            if !header_seen { if line.starts_with("Name") { header_seen = true; } continue; }
            if let Some(name) = line.split_whitespace().next() {
                installed.insert(name.to_string());
            }
        }
        Ok(installed)
    }
}
