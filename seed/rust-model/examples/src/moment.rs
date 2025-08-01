use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Moment {
    pub id: uuid::Uuid,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub date: chrono::NaiveDate,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub datetime: chrono::DateTime<chrono::Utc>,
}