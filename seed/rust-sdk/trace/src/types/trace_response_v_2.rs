use crate::submission_id::SubmissionId;
use crate::traced_file::TracedFile;
use crate::debug_variable_value::DebugVariableValue;
use crate::expression_location::ExpressionLocation;
use crate::stack_information::StackInformation;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TraceResponseV2 {
    #[serde(rename = "submissionId")]
    pub submission_id: SubmissionId,
    #[serde(rename = "lineNumber")]
    pub line_number: i32,
    pub file: TracedFile,
    #[serde(rename = "returnValue")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub return_value: Option<DebugVariableValue>,
    #[serde(rename = "expressionLocation")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expression_location: Option<ExpressionLocation>,
    pub stack: StackInformation,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stdout: Option<String>,
}