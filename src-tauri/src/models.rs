use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppModel {
    pub id: String,
    pub name: String,
    pub description: String,
    pub publisher: String,
    pub version: String,
    pub category: Option<String>,
    pub icon_url: Option<String>,
    pub source: String, // e.g., "dnf", "flatpak", "winget", "apt", "snap", "brew"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InstallProgress {
    pub app_id: String,
    pub status: String,   // "pending" | "downloading" | "installing" | "completed" | "failed"
    pub progress: u8,     // 0 to 100
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PackageManagerInfo {
    pub name: String,
    pub available: bool,
}

#[derive(Debug, Deserialize)]
pub struct InstallRequest {
    pub id: String,
    pub source: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PostInstallScript {
    pub trigger_after: String,
    pub script: String,
}
