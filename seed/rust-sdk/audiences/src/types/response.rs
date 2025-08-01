use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Response {
    pub foo: String,
}   #[serde(skip_serializing_if = "Option::is_none")]
    pub foo: Option<Foo>,
}