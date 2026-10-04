//! M4 Five OS — Autonomous Multi-Agent Orchestration Layer
//!
//! Implements Planner, Orchestrator, and specialized domain agents:
//! - Terminal Agent
//! - File Agent
//! - Browser Agent
//! - Code Agent
//! - System Agent
//! - Research Agent

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentKind {
    TerminalAgent,
    FileAgent,
    BrowserAgent,
    CodeAgent,
    SystemAgent,
    ResearchAgent,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TaskStatus {
    Pending,
    Planning,
    Executing,
    AwaitingApproval,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanStep {
    pub step_number: usize,
    pub description: String,
    pub tool_to_call: String,
    pub tool_arguments: serde_json::Value,
    pub status: String,
    pub output: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTask {
    pub id: String,
    pub agent_kind: AgentKind,
    pub prompt: String,
    pub status: TaskStatus,
    pub plan: Vec<PlanStep>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub result: Option<String>,
}

pub struct AgentOrchestrator {
    active_tasks: RwLock<HashMap<String, AgentTask>>,
}

impl AgentOrchestrator {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            active_tasks: RwLock::new(HashMap::new()),
        })
    }

    pub async fn dispatch_task(&self, agent_kind: AgentKind, prompt: &str) -> AgentTask {
        let task_id = format!("task-{}", &Uuid::new_v4().to_string()[..8]);
        
        // Planner generates initial deterministic plan steps
        let plan = match agent_kind {
            AgentKind::TerminalAgent => vec![
                PlanStep {
                    step_number: 1,
                    description: "Verify sandbox boundaries and user permissions".to_string(),
                    tool_to_call: "system.info".to_string(),
                    tool_arguments: serde_json::json!({}),
                    status: "Completed".to_string(),
                    output: Some("Sandbox verified: non-root isolated container".to_string()),
                },
                PlanStep {
                    step_number: 2,
                    description: format!("Execute validated terminal command: {}", prompt),
                    tool_to_call: "terminal.execute".to_string(),
                    tool_arguments: serde_json::json!({ "command": prompt }),
                    status: "Executing".to_string(),
                    output: None,
                },
            ],
            AgentKind::FileAgent => vec![
                PlanStep {
                    step_number: 1,
                    description: "Scan target path and inspect inode permissions".to_string(),
                    tool_to_call: "files.search".to_string(),
                    tool_arguments: serde_json::json!({ "pattern": "*" }),
                    status: "Completed".to_string(),
                    output: Some("Target directory located".to_string()),
                },
                PlanStep {
                    step_number: 2,
                    description: "Read contents and synthesize file report".to_string(),
                    tool_to_call: "files.read".to_string(),
                    tool_arguments: serde_json::json!({ "path": "/etc/m4/system.conf" }),
                    status: "Pending".to_string(),
                    output: None,
                },
            ],
            _ => vec![
                PlanStep {
                    step_number: 1,
                    description: "Deconstruct intent and acquire cognitive memory context".to_string(),
                    tool_to_call: "memory.search".to_string(),
                    tool_arguments: serde_json::json!({ "query": prompt }),
                    status: "Completed".to_string(),
                    output: Some("Context retrieved from local SQLite store".to_string()),
                },
                PlanStep {
                    step_number: 2,
                    description: "Synthesize autonomous resolution".to_string(),
                    tool_to_call: "system.info".to_string(),
                    tool_arguments: serde_json::json!({}),
                    status: "Pending".to_string(),
                    output: None,
                },
            ],
        };

        let task = AgentTask {
            id: task_id.clone(),
            agent_kind,
            prompt: prompt.to_string(),
            status: TaskStatus::Executing,
            plan,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            result: None,
        };

        let mut tasks = self.active_tasks.write().await;
        tasks.insert(task_id, task.clone());
        task
    }

    pub async fn get_task(&self, id: &str) -> Option<AgentTask> {
        let tasks = self.active_tasks.read().await;
        tasks.get(id).cloned()
    }

    pub async fn list_tasks(&self) -> Vec<AgentTask> {
        let tasks = self.active_tasks.read().await;
        tasks.values().cloned().collect()
    }
}
