//! M4 Five OS — Zero-Trust Permission and Security Sandbox Layer
//!
//! Enforces capabilities, risk tiers, human confirmation for high-risk operations,
//! and non-repudiable audit logging.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum RiskTier {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionRule {
    pub capability: String,
    pub risk_tier: RiskTier,
    pub requires_user_confirmation: bool,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub caller_id: String,
    pub capability: String,
    pub risk_tier: RiskTier,
    pub approved: bool,
    pub rationale: String,
    pub details: serde_json::Value,
}

pub struct SecurityManager {
    rules: RwLock<HashMap<String, PermissionRule>>,
    audit_log: RwLock<Vec<AuditEntry>>,
    blocked_commands: Vec<String>,
}

impl SecurityManager {
    pub fn new() -> Arc<Self> {
        let mut default_rules = HashMap::new();
        default_rules.insert(
            "system.info".to_string(),
            PermissionRule {
                capability: "system.info".to_string(),
                risk_tier: RiskTier::Low,
                requires_user_confirmation: false,
                description: "Read kernel, CPU, and memory stats".to_string(),
            },
        );
        default_rules.insert(
            "process.list".to_string(),
            PermissionRule {
                capability: "process.list".to_string(),
                risk_tier: RiskTier::Low,
                requires_user_confirmation: false,
                description: "Enumerate active system processes".to_string(),
            },
        );
        default_rules.insert(
            "files.write".to_string(),
            PermissionRule {
                capability: "files.write".to_string(),
                risk_tier: RiskTier::High,
                requires_user_confirmation: true,
                description: "Write or modify disk files".to_string(),
            },
        );
        default_rules.insert(
            "terminal.execute".to_string(),
            PermissionRule {
                capability: "terminal.execute".to_string(),
                risk_tier: RiskTier::Critical,
                requires_user_confirmation: true,
                description: "Execute arbitrary commands via shell".to_string(),
            },
        );

        Arc::new(Self {
            rules: RwLock::new(default_rules),
            audit_log: RwLock::new(Vec::new()),
            blocked_commands: vec![
                "rm -rf /".to_string(),
                "mkfs".to_string(),
                ":(){ :|:& };:".to_string(),
                "dd if=/dev/zero".to_string(),
            ],
        })
    }

    pub async fn evaluate_capability(
        &self,
        caller_id: &str,
        capability: &str,
        payload_preview: &str,
    ) -> Result<bool, String> {
        // Enforce forbidden blacklisted commands immediately
        for blocked in &self.blocked_commands {
            if payload_preview.contains(blocked) {
                self.record_audit(
                    caller_id,
                    capability,
                    RiskTier::Critical,
                    false,
                    &format!("Blocked dangerous pattern: {}", blocked),
                    serde_json::json!({ "preview": payload_preview }),
                )
                .await;
                return Err(format!("SECURITY VIOLATION: Command contains blocked directive '{}'", blocked));
            }
        }

        let rules = self.rules.read().await;
        if let Some(rule) = rules.get(capability) {
            let approved = !rule.requires_user_confirmation;
            self.record_audit(
                caller_id,
                capability,
                rule.risk_tier,
                approved,
                if approved { "Auto-approved within policy" } else { "Pending user confirmation" },
                serde_json::json!({ "preview": payload_preview }),
            )
            .await;
            Ok(approved)
        } else {
            // Unknown capability is blocked by default zero-trust principle
            self.record_audit(
                caller_id,
                capability,
                RiskTier::Critical,
                false,
                "Unknown capability rejected by zero-trust default",
                serde_json::json!({ "preview": payload_preview }),
            )
            .await;
            Err(format!("Access Denied: Undeclared capability '{}'", capability))
        }
    }

    pub async fn record_audit(
        &self,
        caller: &str,
        capability: &str,
        risk: RiskTier,
        approved: bool,
        rationale: &str,
        details: serde_json::Value,
    ) {
        let mut log = self.audit_log.write().await;
        log.push(AuditEntry {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            caller_id: caller.to_string(),
            capability: capability.to_string(),
            risk_tier: risk,
            approved,
            rationale: rationale.to_string(),
            details,
        });
    }

    pub async fn get_audit_trail(&self, limit: usize) -> Vec<AuditEntry> {
        let log = self.audit_log.read().await;
        log.iter().rev().take(limit).cloned().collect()
    }
}
