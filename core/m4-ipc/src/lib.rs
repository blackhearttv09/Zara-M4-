//! M4 Five OS — Fast IPC Service Bus and Message Framing Layer

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessagePriority {
    Low,
    Normal,
    High,
    Urgent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpcMessage {
    pub id: String,
    pub channel: String,
    pub sender: String,
    pub recipient: Option<String>,
    pub payload: serde_json::Value,
    pub priority: MessagePriority,
    pub timestamp: DateTime<Utc>,
}

impl IpcMessage {
    pub fn new(channel: &str, sender: &str, payload: serde_json::Value) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            channel: channel.to_string(),
            sender: sender.to_string(),
            recipient: None,
            payload,
            priority: MessagePriority::Normal,
            timestamp: Utc::now(),
        }
    }
}

pub struct IpcBroker {
    sender: broadcast::Sender<IpcMessage>,
    history: RwLock<Vec<IpcMessage>>,
}

impl IpcBroker {
    pub fn new(capacity: usize) -> Arc<Self> {
        let (sender, _) = broadcast::channel(capacity);
        Arc::new(Self {
            sender,
            history: RwLock::new(Vec::with_capacity(1000)),
        })
    }

    pub async fn publish(&self, message: IpcMessage) -> Result<usize, String> {
        let mut hist = self.history.write().await;
        if hist.len() > 2000 {
            hist.remove(0);
        }
        hist.push(message.clone());

        self.sender
            .send(message)
            .map_err(|e| format!("Failed to dispatch IPC message: {}", e))
    }

    pub fn subscribe(&self) -> broadcast::Receiver<IpcMessage> {
        self.sender.subscribe()
    }

    pub async fn recent_events(&self, count: usize) -> Vec<IpcMessage> {
        let hist = self.history.read().await;
        hist.iter().rev().take(count).cloned().collect()
    }
}
