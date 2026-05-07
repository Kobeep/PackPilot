mod models;
mod package_manager;

use models::{AppModel, InstallProgress, InstallRequest, PackageManagerInfo};
use package_manager::get_available_managers;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

/// Global rate-limit flag to prevent concurrent searches flooding CLI tools.
static SEARCH_IN_PROGRESS: AtomicBool = AtomicBool::new(false);

// ─── Input Sanitization ──────────────────────────────────────────────────
fn sanitize_id(id: &str) -> Result<String, String> {
    // Allow only alphanumeric, dots, dashes, underscores, slashes, and plus signs
    let sanitized: String = id.chars()
        .filter(|c| c.is_alphanumeric() || *c == '.' || *c == '-' || *c == '_' || *c == '/' || *c == '+')
        .collect();
    
    if sanitized.is_empty() {
        return Err("Invalid package ID: empty after sanitization".to_string());
    }
    if sanitized.len() > 256 {
        return Err("Invalid package ID: too long".to_string());
    }
    Ok(sanitized)
}

// ─── Logging ─────────────────────────────────────────────────────────────
fn log_action(action: &str, detail: &str) {
    let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
    println!("[{}] {} — {}", timestamp, action, detail);
    
    // Also write to log file in a non-blocking way
    let log_line = format!("[{}] {} — {}\n", timestamp, action, detail);
    if let Some(dirs) = dirs::data_dir() {
        let log_dir = dirs.join("packpilot").join("logs");
        let _ = std::fs::create_dir_all(&log_dir);
        let log_file = log_dir.join("packpilot.log");
        let _ = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(log_file)
            .and_then(|mut f| {
                use std::io::Write;
                f.write_all(log_line.as_bytes())
            });
    }
}

// ─── Commands ────────────────────────────────────────────────────────────

#[tauri::command]
async fn search_apps(query: String) -> Result<Vec<AppModel>, String> {
    // Rate limiting: prevent concurrent searches
    if SEARCH_IN_PROGRESS.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() {
        return Ok(vec![]); // Silently skip if a search is already running
    }

    log_action("SEARCH", &format!("query={}", query));
    let managers = get_available_managers();
    let mut all_results = Vec::new();
    
    // Concurrently search across all available managers with timeout
    let mut tasks = Vec::new();
    for manager in managers {
        let q = query.clone();
        tasks.push(tokio::spawn(async move {
            // Graceful timeout: 15 seconds per manager
            match tokio::time::timeout(Duration::from_secs(15), async {
                if manager.is_available().await {
                    manager.search(&q).await.unwrap_or_else(|e| {
                        eprintln!("Search failed for {}: {}", manager.name(), e);
                        vec![]
                    })
                } else {
                    vec![]
                }
            }).await {
                Ok(results) => results,
                Err(_) => {
                    eprintln!("Search timed out for a package manager");
                    vec![]
                }
            }
        }));
    }
    
    for task in tasks {
        match task.await {
            Ok(results) => all_results.extend(results),
            Err(e) => eprintln!("Task join error: {}", e),
        }
    }

    SEARCH_IN_PROGRESS.store(false, Ordering::SeqCst);
    
    log_action("SEARCH_COMPLETE", &format!("query={}, results={}", query, all_results.len()));
    Ok(all_results)
}

#[tauri::command]
async fn install_selected(app_handle: AppHandle, apps: Vec<InstallRequest>) -> Result<Vec<String>, String> {
    log_action("INSTALL_START", &format!("{} app(s)", apps.len()));
    let managers = get_available_managers();
    let mut errors: Vec<String> = Vec::new();

    for (index, app) in apps.iter().enumerate() {
        let sanitized_id = match sanitize_id(&app.id) {
            Ok(id) => id,
            Err(e) => {
                errors.push(e);
                continue;
            }
        };

        // Emit progress: installing
        let _ = app_handle.emit("install-progress", InstallProgress {
            app_id: sanitized_id.clone(),
            status: "installing".to_string(),
            progress: ((index as f64 / apps.len() as f64) * 100.0) as u8,
            message: Some(format!("Installing {} ({}/{})...", sanitized_id, index + 1, apps.len())),
        });

        let manager = managers.iter().find(|m| m.name() == app.source);

        match manager {
            Some(mgr) => {
                log_action("INSTALL", &format!("{} via {}", sanitized_id, app.source));
                match mgr.install(&sanitized_id).await {
                    Ok(()) => {
                        let _ = app_handle.emit("install-progress", InstallProgress {
                            app_id: sanitized_id.clone(),
                            status: "completed".to_string(),
                            progress: 100,
                            message: Some(format!("{} installed successfully", sanitized_id)),
                        });
                        log_action("INSTALL_OK", &sanitized_id);
                    }
                    Err(e) => {
                        let msg = format!("Failed to install {} ({}): {}", sanitized_id, app.source, e);
                        let _ = app_handle.emit("install-progress", InstallProgress {
                            app_id: sanitized_id.clone(),
                            status: "failed".to_string(),
                            progress: 0,
                            message: Some(msg.clone()),
                        });
                        log_action("INSTALL_FAIL", &msg);
                        errors.push(msg);
                    }
                }
            }
            None => {
                let msg = format!("No package manager for source '{}' (app: {})", app.source, sanitized_id);
                log_action("INSTALL_FAIL", &msg);
                errors.push(msg);
            }
        }
    }

    log_action("INSTALL_COMPLETE", &format!("{} success, {} errors", apps.len() - errors.len(), errors.len()));
    Ok(errors)
}

#[tauri::command]
async fn uninstall_app(app_id: String, source: String) -> Result<(), String> {
    let sanitized = sanitize_id(&app_id)?;
    log_action("UNINSTALL", &format!("{} via {}", sanitized, source));
    
    let managers = get_available_managers();
    let manager = managers.iter().find(|m| m.name() == source)
        .ok_or_else(|| format!("No package manager for source '{}'", source))?;

    manager.uninstall(&sanitized).await?;
    log_action("UNINSTALL_OK", &sanitized);
    Ok(())
}

#[tauri::command]
async fn check_updates() -> Result<Vec<AppModel>, String> {
    log_action("UPDATE_CHECK", "Starting update check across all managers");
    let managers = get_available_managers();
    let mut all_updates = Vec::new();
    
    let mut tasks = Vec::new();
    for manager in managers {
        tasks.push(tokio::spawn(async move {
            match tokio::time::timeout(Duration::from_secs(30), async {
                if manager.is_available().await {
                    manager.list_upgradable().await.unwrap_or_else(|e| {
                        eprintln!("Update check failed for {}: {}", manager.name(), e);
                        vec![]
                    })
                } else {
                    vec![]
                }
            }).await {
                Ok(results) => results,
                Err(_) => {
                    eprintln!("Update check timed out for a manager");
                    vec![]
                }
            }
        }));
    }
    
    for task in tasks {
        if let Ok(results) = task.await {
            all_updates.extend(results);
        }
    }

    log_action("UPDATE_CHECK_COMPLETE", &format!("{} updates found", all_updates.len()));
    Ok(all_updates)
}

#[tauri::command]
async fn detect_managers() -> Result<Vec<PackageManagerInfo>, String> {
    log_action("DETECT", "Detecting available package managers");
    let managers = get_available_managers();
    let mut info = Vec::new();
    
    for manager in &managers {
        let available = manager.is_available().await;
        info.push(PackageManagerInfo {
            name: manager.name().to_string(),
            available,
        });
        log_action("DETECT", &format!("{}: {}", manager.name(), if available { "available" } else { "not found" }));
    }
    
    Ok(info)
}

#[tauri::command]
async fn run_post_install_script(script: String) -> Result<String, String> {
    log_action("POST_INSTALL_SCRIPT", &script);
    
    // Security: basic validation
    let dangerous_patterns = ["rm -rf /", "mkfs", "dd if=", ":(){ :|:&", "fork bomb"];
    for pattern in &dangerous_patterns {
        if script.contains(pattern) {
            return Err(format!("Script blocked: contains dangerous pattern '{}'", pattern));
        }
    }

    #[cfg(target_os = "windows")]
    let output = tokio::process::Command::new("cmd")
        .arg("/C")
        .arg(&script)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    #[cfg(not(target_os = "windows"))]
    let output = tokio::process::Command::new("sh")
        .arg("-c")
        .arg(&script)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    
    if output.status.success() {
        log_action("POST_INSTALL_OK", &script);
        Ok(stdout)
    } else {
        let msg = format!("Script failed: {}", stderr);
        log_action("POST_INSTALL_FAIL", &msg);
        Err(msg)
    }
}

// ─── App Entry Point ─────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            search_apps,
            install_selected,
            uninstall_app,
            check_updates,
            detect_managers,
            run_post_install_script,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
