import { File, GeneratorNotificationService } from "@fern-api/base-generator";
import { AbstractRustGeneratorCli } from "@fern-api/rust-base";
import { RustCodeGenerator } from "@fern-api/rust-ast";
import { RelativeFilePath } from "@fern-api/fs-utils";

import { FernGeneratorExec } from "@fern-fern/generator-exec-sdk";
import { IntermediateRepresentation } from "@fern-fern/ir-sdk/api";

import { RustSdkCustomConfig } from "./RustSdkCustomConfig";
import { RustSdkGeneratorContext } from "./RustSdkGeneratorContext";

export class RustSdkGeneratorCli extends AbstractRustGeneratorCli<
    RustSdkCustomConfig,
    RustSdkGeneratorContext
> {
    protected constructContext({
        ir,
        customConfig,
        generatorConfig,
        generatorNotificationService
    }: {
        ir: IntermediateRepresentation;
        customConfig: RustSdkCustomConfig;
        generatorConfig: FernGeneratorExec.GeneratorConfig;
        generatorNotificationService: GeneratorNotificationService;
    }): RustSdkGeneratorContext {
        return new RustSdkGeneratorContext(
            ir,
            generatorConfig,
            customConfig,
            generatorNotificationService
        );
    }

    protected parseCustomConfigOrThrow(customConfig: unknown): RustSdkCustomConfig {
        return (customConfig as RustSdkCustomConfig) || {};
    }

    protected async publishPackage(context: RustSdkGeneratorContext): Promise<void> {
        throw new Error("Method not implemented.");
    }

    protected async writeForGithub(context: RustSdkGeneratorContext): Promise<void> {
        await this.generate(context);
    }

    protected async writeForDownload(context: RustSdkGeneratorContext): Promise<void> {
        await this.generate(context);
    }

    private async generate(context: RustSdkGeneratorContext): Promise<void> {
        context.logger.info("Starting Rust SDK generation...");
        
        // Generate basic Rust SDK structure
        const generator = new RustCodeGenerator();
        
        // Generate lib.rs
        const libContent = this.generateLibRs(context);
        await context.project.addFile({
            path: RelativeFilePath.of("src/lib.rs"),
            contents: libContent
        });
        
        // Generate client.rs
        const clientContent = this.generateClientRs(context);
        await context.project.addFile({
            path: RelativeFilePath.of("src/client.rs"),
            contents: clientContent
        });
        
        // Generate types.rs
        const typesContent = this.generateTypesRs(context);
        await context.project.addFile({
            path: RelativeFilePath.of("src/types.rs"),
            contents: typesContent
        });
        
        // Generate errors.rs
        const errorsContent = this.generateErrorsRs(context);
        await context.project.addFile({
            path: RelativeFilePath.of("src/errors.rs"),
            contents: errorsContent
        });
        
        // Generate Cargo.toml
        const cargoContent = this.generateCargoToml(context);
        await context.project.addFile({
            path: RelativeFilePath.of("Cargo.toml"),
            contents: cargoContent
        });
        
        // Generate README.md
        const readmeContent = this.generateReadme(context);
        await context.project.addFile({
            path: RelativeFilePath.of("README.md"),
            contents: readmeContent
        });
        
        await context.project.persist();
        context.logger.info("Rust SDK generation complete!");
    }

    private generateLibRs(context: RustSdkGeneratorContext): string {
        const apiName = context.ir.apiName.pascalCase.safeName;
        return `//! ${apiName} SDK
//!
//! This is a generated SDK for the ${apiName} API.
//! 
//! ## Usage
//! 
//! \`\`\`rust
//! use ${context.ir.apiName.snakeCase.safeName}::Client;
//! 
//! #[tokio::main]
//! async fn main() {
//!     let client = Client::new("https://api.example.com");
//!     // Use the client...
//! }
//! \`\`\`

pub mod client;
pub mod types;
pub mod errors;

pub use client::Client;
pub use errors::*;
`;
    }

    private generateClientRs(context: RustSdkGeneratorContext): string {
        const apiName = context.ir.apiName.pascalCase.safeName;
        return `use reqwest;
use serde::{Deserialize, Serialize};
use crate::errors::${apiName}Error;

/// The main client for the ${apiName} API
#[derive(Debug, Clone)]
pub struct Client {
    base_url: String,
    client: reqwest::Client,
}

impl Client {
    /// Create a new client with the specified base URL
    pub fn new(base_url: &str) -> Self {
        Self {
            base_url: base_url.to_string(),
            client: reqwest::Client::new(),
        }
    }
    
    /// Make a GET request to the specified path
    pub async fn get<T>(&self, path: &str) -> Result<T, ${apiName}Error>
    where
        T: for<'de> Deserialize<'de>,
    {
        let url = format!("{}{}", self.base_url, path);
        let response = self.client.get(&url).send().await?;
        
        if response.status().is_success() {
            let data = response.json().await?;
            Ok(data)
        } else {
            Err(${apiName}Error::HttpError(response.status()))
        }
    }
    
    /// Make a POST request to the specified path
    pub async fn post<T, U>(&self, path: &str, body: &T) -> Result<U, ${apiName}Error>
    where
        T: Serialize,
        U: for<'de> Deserialize<'de>,
    {
        let url = format!("{}{}", self.base_url, path);
        let response = self.client.post(&url).json(body).send().await?;
        
        if response.status().is_success() {
            let data = response.json().await?;
            Ok(data)
        } else {
            Err(${apiName}Error::HttpError(response.status()))
        }
    }
}
`;
    }

    private generateTypesRs(context: RustSdkGeneratorContext): string {
        return `//! Common types used throughout the SDK

use serde::{Deserialize, Serialize};

/// A generic response wrapper
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Response<T> {
    pub data: T,
}

/// A generic error response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
}
`;
    }

    private generateErrorsRs(context: RustSdkGeneratorContext): string {
        const apiName = context.ir.apiName.pascalCase.safeName;
        return `//! Error types for the ${apiName} SDK

use std::fmt;

/// Main error type for the ${apiName} SDK
#[derive(Debug)]
pub enum ${apiName}Error {
    /// HTTP request error
    HttpError(reqwest::StatusCode),
    /// Network error
    NetworkError(reqwest::Error),
    /// JSON parsing error
    JsonError(reqwest::Error),
    /// Custom API error
    ApiError(String),
}

impl fmt::Display for ${apiName}Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ${apiName}Error::HttpError(status) => write!(f, "HTTP error: {}", status),
            ${apiName}Error::NetworkError(err) => write!(f, "Network error: {}", err),
            ${apiName}Error::JsonError(err) => write!(f, "JSON error: {}", err),
            ${apiName}Error::ApiError(msg) => write!(f, "API error: {}", msg),
        }
    }
}

impl std::error::Error for ${apiName}Error {}

impl From<reqwest::Error> for ${apiName}Error {
    fn from(err: reqwest::Error) -> Self {
        if err.is_request() {
            ${apiName}Error::NetworkError(err)
        } else {
            ${apiName}Error::JsonError(err)
        }
    }
}
`;
    }

    private generateCargoToml(context: RustSdkGeneratorContext): string {
        const packageName = context.customConfig.packageName || context.ir.apiName.snakeCase.safeName;
        const version = context.customConfig.version || "0.1.0";
        const description = context.customConfig.description || `Generated SDK for ${context.ir.apiName.pascalCase.safeName} API`;
        
        return `[package]
name = "${packageName}"
version = "${version}"
edition = "2021"
description = "${description}"
authors = ["${context.customConfig.author || "Fern"}"]
license = "MIT"
repository = "https://github.com/your-org/your-repo"

[dependencies]
reqwest = { version = "0.11", features = ["json"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }

[dev-dependencies]
tokio-test = "0.4"
`;
    }

    private generateReadme(context: RustSdkGeneratorContext): string {
        const apiName = context.ir.apiName.pascalCase.safeName;
        const packageName = context.customConfig.packageName || context.ir.apiName.snakeCase.safeName;
        
        return `# ${apiName} SDK

This is a generated Rust SDK for the ${apiName} API.

## Installation

Add this to your \`Cargo.toml\`:

\`\`\`toml
[dependencies]
${packageName} = "0.1.0"
\`\`\`

## Usage

\`\`\`rust
use ${packageName}::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new("https://api.example.com");
    
    // Make API calls...
    
    Ok(())
}
\`\`\`

## Features

- Async/await support with tokio
- Strongly typed request and response models
- Built-in error handling
- JSON serialization/deserialization

## Generated by Fern

This SDK was generated by [Fern](https://buildwithfern.com/).
`;
    }
} 