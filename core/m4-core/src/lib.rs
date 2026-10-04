//! M4 Five OS — Core System Daemon and Lifecycle Manager
//!
//! Provides the primary OS supervisor, task scheduler, system heartbeat,
//! and component registry.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SystemState {
    Booting,
    Ready,
    Degraded,
    Maintenance,
    ShuttingDown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubsystemHealth {
    pub name: String,
    pub status: String,
    pub uptime_seconds: u64,
    pub last_heartbeat: DateTime<Utc>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemTelemetry {
    pub os_name: String,
    pub version: String,
    pub state: SystemState,
    pub uptime_seconds: u64,
    pub cpu_cores: usize,
    pub memory_total_mb: u64,
    pub memory_used_mb: u64,
    pub active_tasks: usize,
    pub security_mode: String,
}

pub struct M4CoreSupervisor {
    boot_time: DateTime<Utc>,
    state: RwLock<SystemState>,
    subsystems: RwLock<HashMap<String, SubsystemHealth>>,
}

impl M4CoreSupervisor {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            boot_time: Utc::now(),
            state: RwLock::new(SystemState::Booting),
            subsystems: RwLock::new(HashMap::new()),
        })
    }

    pub async fn initialize(&self) -> Result<(), String> {
        let mut state = self.state.write().await;
        *state = SystemState::Ready;
        
        let mut subs = self.subsystems.write().await;
        subs.insert(
            "ipc_bus".to_string(),
            SubsystemHealth {
                name: "ipc_bus".to_string(),
                status: "ONLINE".to_string(),
                uptime_seconds: 0,
                last_heartbeat: Utc::now(),
                metadata: HashMap::new(),
            },
        );
        subs.insert(
            "security_sandbox".to_string(),
            SubsystemHealth {
                name: "security_sandbox".to_string(),
                status: "ENFORCING".to_string(),
                uptime_seconds: 0,
                last_heartbeat: Utc::now(),
                metadata: HashMap::new(),
            },
        );
        subs.insert(
            "ai_runtime".to_string(),
            SubsystemHealth {
                name: "ai_runtime".to_string(),
                status: "ARMED".to_string(),
                uptime_seconds: 0,
                last_heartbeat: Utc::now(),
                metadata: HashMap::new(),
            },
        );
        
        Ok(())
    }

    pub async fn get_telemetry(&self) -> SystemTelemetry {
        let uptime = (Utc::now() - self.boot_time).num_seconds().max(0) as u64;
        let state = *self.state.read().await;
        let active_tasks = self.subsystems.read().await.len();

        SystemTelemetry {
            os_name: "M4 Five OS".to_string(),
            version: "5.0.0-release".to_string(),
            state,
            uptime_seconds: uptime,
            cpu_cores: 8,
            memory_total_mb: 16384,
            memory_used_mb: 3240,
            active_tasks,
            security_mode: "Strict Zero-Trust Sandbox".to_string(),
        }
    }

    pub async fn register_heartbeat(&self, subsystem: &str, status: &str) {
        let mut subs = self.subsystems.write().await;
        let uptime = (Utc::now() - self.boot_time).num_seconds().max(0) as u64;
        subs.insert(
            subsystem.to_string(),
            SubsystemHealth {
                name: subsystem.to_string(),
                status: status.to_string(),
                uptime_seconds: uptime,
                last_heartbeat: Utc::now(),
                metadata: HashMap::new(),
            },
        );
    }
}
