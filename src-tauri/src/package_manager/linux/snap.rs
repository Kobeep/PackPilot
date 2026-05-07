use async_trait::async_trait;
use tokio::process::Command;
use crate::models::AppModel;
use super::super::PackageManager;

pub struct Snap;

#[async_trait]
impl PackageManager for Snap {
    fn name(&self) -> &'static str {
        "snap"
    }

    async fn is_available(&self) -> bool {
        Command::new("which")
            .arg("snap")
            .output()
            .await
            .map(|out| out.status.success())
            .unwrap_or(false)
    }

    async fn search(&self, query: &str) -> Result<Vec<AppModel>, String> {
        let output = Command::new("snap")
            .arg("find")
            .arg(query)
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut results = Vec::new();

        // snap find output:
        // Name       Version   Publisher  Notes  Summary
        // package    1.0.0     publisher  -      Description text
        let mut header_seen = false;
        for line in stdout.lines() {
            if !header_seen {
                if line.starts_with("Name") {
                    header_seen = true;
                }
                continue;
            }

            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 5 {
                let id = parts[0].to_string();
                let version = parts[1].to_string();
                let publisher = parts[2].to_string();
                // Notes is parts[3], summary is the rest
                let description = parts[4..].join(" ");

                results.push(AppModel {
                    id: id.clone(),
                    name: id,
                    description,
                    publisher,
                    version,
                    category: Some("App".to_string()),
                    icon_url: None,
                    source: "snap".to_string(),
                });
            }
        }

        Ok(results)
    }

    async fn install(&self, app_id: &str) -> Result<(), String> {
        let status = Command::new("snap")
            .arg("install")
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
        let status = Command::new("snap")
            .arg("remove")
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
        let output = Command::new("snap")
            .arg("refresh")
            .arg("--list")
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut results = Vec::new();

        let mut header_seen = false;
        for line in stdout.lines() {
            if !header_seen {
                if line.starts_with("Name") {
                    header_seen = true;
                }
                continue;
            }

            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                let id = parts[0].to_string();
                let version = parts[1].to_string();

                results.push(AppModel {
                    id: id.clone(),
                    name: id,
                    description: "Update available".to_string(),
                    publisher: "Snap Store".to_string(),
                    version,
                    category: Some("App".to_string()),
                    icon_url: None,
                    source: "snap".to_string(),
                });
            }
        }

        Ok(results)
    }
}
