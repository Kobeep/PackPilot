use async_trait::async_trait;
use tokio::process::Command;
use std::collections::HashSet;
use crate::models::AppModel;
use super::super::PackageManager;

pub struct Flatpak;

#[async_trait]
impl PackageManager for Flatpak {
    fn name(&self) -> &'static str { "flatpak" }

    async fn is_available(&self) -> bool {
        Command::new("which").arg("flatpak").output().await
            .map(|out| out.status.success()).unwrap_or(false)
    }

    async fn search(&self, query: &str) -> Result<Vec<AppModel>, String> {
        let output = Command::new("flatpak").arg("search").arg(query)
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let installed = self.list_installed().await.unwrap_or_default();
        let mut results = Vec::new();

        for line in stdout.lines() {
            if line.contains("Application ID") || line.trim().is_empty() || line.starts_with("No matches found") {
                continue;
            }
            let parts: Vec<&str> = line.split('\t').collect();
            if parts.len() >= 4 {
                let name = parts[0].trim();
                let desc = parts[1].trim();
                let id = parts[2].trim();
                let version = parts[3].trim();
                let is_installed = installed.contains(id);

                // Construct Flathub icon URL from application ID
                let icon_url = Some(format!(
                    "https://dl.flathub.org/repo/appstream/x86_64/icons/128x128/{}.png",
                    id
                ));

                results.push(AppModel {
                    id: id.to_string(), name: name.to_string(),
                    description: desc.to_string(),
                    publisher: "Flathub".to_string(),
                    version: version.to_string(),
                    category: Some("App".to_string()),
                    icon_url,
                    source: "flatpak".to_string(),
                    is_installed,
                    is_verified: true, // Flathub = verified
                });
            }
        }
        Ok(results)
    }

    async fn install(&self, app_id: &str) -> Result<(), String> {
        let s = Command::new("flatpak").arg("install").arg("-y").arg("flathub").arg(app_id)
            .status().await.map_err(|e| e.to_string())?;
        if s.success() { Ok(()) } else { Err(format!("Installation failed for {}", app_id)) }
    }

    async fn uninstall(&self, app_id: &str) -> Result<(), String> {
        let s = Command::new("flatpak").arg("uninstall").arg("-y").arg(app_id)
            .status().await.map_err(|e| e.to_string())?;
        if s.success() { Ok(()) } else { Err(format!("Uninstall failed for {}", app_id)) }
    }

    async fn list_upgradable(&self) -> Result<Vec<AppModel>, String> {
        let output = Command::new("flatpak").arg("remote-ls").arg("--updates")
            .arg("--columns=name,application,version")
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut results = Vec::new();
        for line in stdout.lines() {
            if line.trim().is_empty() { continue; }
            let parts: Vec<&str> = line.split('\t').collect();
            if parts.len() >= 3 {
                let id = parts[1].trim();
                results.push(AppModel {
                    id: id.to_string(), name: parts[0].trim().to_string(),
                    description: "Update available".to_string(),
                    publisher: "Flathub".to_string(), version: parts[2].trim().to_string(),
                    category: Some("App".to_string()),
                    icon_url: Some(format!("https://dl.flathub.org/repo/appstream/x86_64/icons/128x128/{}.png", id)),
                    source: "flatpak".to_string(), is_installed: true, is_verified: true,
                });
            }
        }
        Ok(results)
    }

    async fn list_installed(&self) -> Result<HashSet<String>, String> {
        let output = Command::new("flatpak").arg("list").arg("--app").arg("--columns=application")
            .output().await.map_err(|e| e.to_string())?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut installed = HashSet::new();
        for line in stdout.lines() {
            let id = line.trim();
            if !id.is_empty() && !id.starts_with("Application") {
                installed.insert(id.to_string());
            }
        }
        Ok(installed)
    }
}
