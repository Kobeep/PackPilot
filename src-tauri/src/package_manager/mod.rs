use async_trait::async_trait;
use crate::models::AppModel;

pub mod linux;
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos;

#[async_trait]
pub trait PackageManager: Send + Sync {
    fn name(&self) -> &'static str;
    async fn is_available(&self) -> bool;
    async fn search(&self, query: &str) -> Result<Vec<AppModel>, String>;
    async fn install(&self, app_id: &str) -> Result<(), String>;
    async fn uninstall(&self, app_id: &str) -> Result<(), String>;
    async fn list_upgradable(&self) -> Result<Vec<AppModel>, String>;
}

pub fn get_available_managers() -> Vec<Box<dyn PackageManager>> {
    let mut managers: Vec<Box<dyn PackageManager>> = Vec::new();
    
    #[cfg(target_os = "linux")]
    {
        managers.push(Box::new(linux::dnf::Dnf));
        managers.push(Box::new(linux::flatpak::Flatpak));
        managers.push(Box::new(linux::apt::Apt));
        managers.push(Box::new(linux::snap::Snap));
    }
    
    #[cfg(target_os = "windows")]
    {
        managers.push(Box::new(windows::winget::Winget));
        managers.push(Box::new(windows::chocolatey::Chocolatey));
    }

    #[cfg(target_os = "macos")]
    {
        managers.push(Box::new(macos::homebrew::Homebrew));
    }

    managers
}
