//! M4 Five OS — Plugin-Style Skill Subsystem
//!
//! Validates, registers, and isolates modular capabilities provided by skills.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillManifest {
    pub name: String,
    pub version: String,
    pub description: String,
    pub capabilities: Vec<String>,
    pub tools: Vec<String>,
    pub permissions: Vec<String>,
    pub configuration: HashMap<String, String>,
    pub enabled: bool,
}

pub struct SkillRegistry {
    skills: RwLock<HashMap<String, SkillManifest>>,
}

impl SkillRegistry {
    pub fn new() -> Arc<Self> {
        let mut builtins = HashMap::new();
        builtins.insert(
            "m4.sysops".to_string(),
            SkillManifest {
                name: "m4.sysops".to_string(),
                version: "1.0.0".to_string(),
                description: "System diagnostics, hardware telemetry, process management".to_string(),
                capabilities: vec!["system_telemetry".to_string(), "process_control".to_string()],
                tools: vec!["system.info".to_string(), "process.list".to_string(), "process.inspect".to_string()],
                permissions: vec!["sys:read".to_string(), "proc:read".to_string()],
                configuration: HashMap::new(),
                enabled: true,
            },
        );
        builtins.insert(
            "m4.filesystem".to_string(),
            SkillManifest {
                name: "m4.filesystem".to_string(),
                version: "1.0.0".to_string(),
                description: "Structured file manipulation, search, and validation".to_string(),
                capabilities: vec!["file_io".to_string()],
                tools: vec!["files.read".to_string(), "files.write".to_string(), "files.search".to_string()],
                permissions: vec!["fs:read".to_string(), "fs:write".to_string()],
                configuration: HashMap::new(),
                enabled: true,
            },
        );

        Arc::new(Self {
            skills: RwLock::new(builtins),
        })
    }

    pub async fn register(&self, manifest: SkillManifest) -> Result<(), String> {
        // Validation rules
        if manifest.name.trim().is_empty() {
            return Err("Skill name cannot be empty".to_string());
        }
        if manifest.version.trim().is_empty() {
            return Err("Skill version cannot be empty".to_string());
        }
        if manifest.tools.is_empty() {
            return Err("Skill must declare at least one tool".to_string());
        }

        let mut skills = self.skills.write().await;
        skills.insert(manifest.name.clone(), manifest);
        Ok(())
    }

    pub async fn list(&self) -> Vec<SkillManifest> {
        let skills = self.skills.read().await;
        skills.values().cloned().collect()
    }

    pub async fn get(&self, name: &str) -> Option<SkillManifest> {
        let skills = self.skills.read().await;
        skills.get(name).cloned()
    }
}
