use async_trait::async_trait;
use tokio::process::Command;
use crate::models::AppModel;
use super::super::PackageManager;

pub struct Chocolatey;

#[async_trait]
impl PackageManager for Chocolatey {
    fn name(&self) -> &'static str {
        "chocolatey"
    }

    async fn is_available(&self) -> bool {
        Command::new("choco")
            .arg("--version")
            .output()
            .await
            .map(|out| out.status.success())
            .unwrap_or(false)
    }

    async fn search(&self, query: &str) -> Result<Vec<AppModel>, String> {
        let output = Command::new("choco")
            .arg("search")
            .arg(query)
            .arg("--limit-output")
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut results = Vec::new();

        for line in stdout.lines() {
            if line.is_empty() || line.starts_with("Chocolatey") {
                continue;
            }

            let parts: Vec<&str> = line.split('|').collect();
            if parts.len() >= 2 {
                let id = parts[0].trim();
                let version = parts[1].trim();

                results.push(AppModel {
                    id: id.to_string(),
                    name: id.to_string(),
                    description: "Managed by Chocolatey".to_string(),
                    publisher: "Community".to_string(),
                    version: version.to_string(),
                    category: Some("App".to_string()),
                    icon_url: None,
                    source: "chocolatey".to_string(),
                });
            }
        }

        Ok(results)
    }

    async fn install(&self, app_id: &str) -> Result<(), String> {
        let status = Command::new("choco")
            .arg("install")
            .arg("-y")
            .arg(app_id)
            .status()
            .await
            .map_err(|e| e.to_string())?;

        if status.success() {
            Ok(())
        } else {
            Err(format!("Installation failed for {}", app_id))
        }
    }

    async fn uninstall(&self, app_id: &str) -> Result<(), String> {
        let status = Command::new("choco")
            .arg("uninstall")
            .arg("-y")
            .arg(app_id)
            .status()
            .await
            .map_err(|e| e.to_string())?;

        if status.success() {
            Ok(())
        } else {
            Err(format!("Uninstall failed for {}", app_id))
        }
    }

    async fn list_upgradable(&self) -> Result<Vec<AppModel>, String> {
        let output = Command::new("choco")
            .arg("outdated")
            .arg("--limit-output")
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut results = Vec::new();

        for line in stdout.lines() {
            if line.is_empty() || line.starts_with("Chocolatey") {
                continue;
            }
            // Format: name|current_version|available_version|pinned
            let parts: Vec<&str> = line.split('|').collect();
            if parts.len() >= 3 {
                results.push(AppModel {
                    id: parts[0].trim().to_string(),
                    name: parts[0].trim().to_string(),
                    description: format!("Update: {} → {}", parts[1].trim(), parts[2].trim()),
                    publisher: "Community".to_string(),
                    version: parts[2].trim().to_string(),
                    category: Some("App".to_string()),
                    icon_url: None,
                    source: "chocolatey".to_string(),
                });
            }
        }

        Ok(results)
    }
}
