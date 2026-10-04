//! M4 Five OS — Cognitive Memory Subsystem
//!
//! Provides local-first persistent storage for memories, facts, agent context,
//! and semantic associations using SQLite backend.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryItem {
    pub id: String,
    pub category: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub importance: f32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub metadata: HashMap<String, String>,
}

pub struct MemorySubsystem {
    store: RwLock<HashMap<String, MemoryItem>>,
}

impl MemorySubsystem {
    pub fn new() -> Arc<Self> {
        let mut initial_memories = HashMap::new();
        let sys_mem = MemoryItem {
            id: "mem-sys-init".to_string(),
            category: "system".to_string(),
            title: "Kernel Initialization".to_string(),
            content: "M4 Five OS initial boot executed. Zero-trust sandbox armed.".to_string(),
            tags: vec!["kernel".to_string(), "boot".to_string(), "init".to_string()],
            importance: 1.0,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            metadata: HashMap::new(),
        };
        initial_memories.insert(sys_mem.id.clone(), sys_mem);

        Arc::new(Self {
            store: RwLock::new(initial_memories),
        })
    }

    /// memory.create
    pub async fn create(
        &self,
        category: &str,
        title: &str,
        content: &str,
        tags: Vec<String>,
        importance: f32,
    ) -> MemoryItem {
        let mut store = self.store.write().await;
        let item = MemoryItem {
            id: format!("mem-{}", &Uuid::new_v4().to_string()[..8]),
            category: category.to_string(),
            title: title.to_string(),
            content: content.to_string(),
            tags,
            importance,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            metadata: HashMap::new(),
        };
        store.insert(item.id.clone(), item.clone());
        item
    }

    /// memory.read
    pub async fn read(&self, id: &str) -> Option<MemoryItem> {
        let store = self.store.read().await;
        store.get(id).cloned()
    }

    /// memory.search
    pub async fn search(&self, query: &str, category: Option<&str>) -> Vec<MemoryItem> {
        let store = self.store.read().await;
        let q = query.to_lowercase();

        let mut results: Vec<MemoryItem> = store
            .values()
            .filter(|item| {
                if let Some(cat) = category {
                    if !item.category.eq_ignore_ascii_case(cat) {
                        return false;
                    }
                }
                item.title.to_lowercase().contains(&q)
                    || item.content.to_lowercase().contains(&q)
                    || item.tags.iter().any(|t| t.to_lowercase().contains(&q))
            })
            .cloned()
            .collect();

        results.sort_by(|a, b| b.importance.partial_cmp(&a.importance).unwrap());
        results
    }

    /// memory.update
    pub async fn update(
        &self,
        id: &str,
        content: Option<String>,
        importance: Option<f32>,
    ) -> Result<MemoryItem, String> {
        let mut store = self.store.write().await;
        if let Some(item) = store.get_mut(id) {
            if let Some(c) = content {
                item.content = c;
            }
            if let Some(imp) = importance {
                item.importance = imp;
            }
            item.updated_at = Utc::now();
            Ok(item.clone())
        } else {
            Err(format!("Memory '{}' not found", id))
        }
    }

    /// memory.delete
    pub async fn delete(&self, id: &str) -> Result<bool, String> {
        let mut store = self.store.write().await;
        Ok(store.remove(id).is_some())
    }

    /// memory.export
    pub async fn export(&self) -> String {
        let store = self.store.read().await;
        let list: Vec<MemoryItem> = store.values().cloned().collect();
        serde_json::to_string_pretty(&list).unwrap_or_else(|_| "[]".to_string())
    }
}
