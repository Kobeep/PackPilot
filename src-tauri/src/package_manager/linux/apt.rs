use async_trait::async_trait;
use tokio::process::Command;
use crate::models::AppModel;
use super::super::PackageManager;

pub struct Apt;

#[async_trait]
impl PackageManager for Apt {
    fn name(&self) -> &'static str {
        "apt"
    }

    async fn is_available(&self) -> bool {
        Command::new("which")
            .arg("apt")
            .output()
            .await
            .map(|out| out.status.success())
            .unwrap_or(false)
    }

    async fn search(&self, query: &str) -> Result<Vec<AppModel>, String> {
        let output = Command::new("apt")
            .arg("search")
            .arg("--names-only")
            .arg(query)
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut results = Vec::new();

        // apt search output format:
        // package-name/suite version arch
        //   Description text
        let lines: Vec<&str> = stdout.lines().collect();
        let mut i = 0;
        while i < lines.len() {
            let line = lines[i].trim();
            
            // Skip sorting/warning lines
            if line.starts_with("WARNING") || line.starts_with("Sorting") || line.starts_with("Full") || line.is_empty() {
                i += 1;
                continue;
            }

            // Package line: "name/suite version arch [installed]"
            if !line.starts_with(' ') && line.contains('/') {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if !parts.is_empty() {
                    let name_suite: Vec<&str> = parts[0].splitn(2, '/').collect();
                    let id = name_suite[0].to_string();
                    let version = if parts.len() > 1 { parts[1] } else { "Unknown" };
                    
                    // Next line is description
                    let desc = if i + 1 < lines.len() {
                        lines[i + 1].trim().to_string()
                    } else {
                        String::new()
                    };

                    results.push(AppModel {
                        id: id.clone(),
                        name: id.clone(),
                        description: desc,
                        publisher: "APT Repository".to_string(),
                        version: version.to_string(),
                        category: Some("System".to_string()),
                        icon_url: None,
                        source: "apt".to_string(),
                    });

                    i += 2; // Skip description line
                    continue;
                }
            }
            i += 1;
        }

        Ok(results)
    }

    async fn install(&self, app_id: &str) -> Result<(), String> {
        let status = Command::new("pkexec")
            .arg("apt")
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
        let status = Command::new("pkexec")
            .arg("apt")
            .arg("remove")
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
        // First update the package list
        let _ = Command::new("pkexec")
            .arg("apt")
            .arg("update")
            .output()
            .await;

        let output = Command::new("apt")
            .arg("list")
            .arg("--upgradable")
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut results = Vec::new();

        for line in stdout.lines() {
            if line.starts_with("Listing") || line.is_empty() {
                continue;
            }
            // Format: package/suite version arch [upgradable from: old_version]
            let parts: Vec<&str> = line.split_whitespace().collect();
            if !parts.is_empty() {
                let name_suite: Vec<&str> = parts[0].splitn(2, '/').collect();
                let id = name_suite[0].to_string();
                let version = if parts.len() > 1 { parts[1] } else { "Unknown" };

                results.push(AppModel {
                    id: id.clone(),
                    name: id,
                    description: "Update available".to_string(),
                    publisher: "APT Repository".to_string(),
                    version: version.to_string(),
                    category: Some("System".to_string()),
                    icon_url: None,
                    source: "apt".to_string(),
                });
            }
        }

        Ok(results)
    }
}
