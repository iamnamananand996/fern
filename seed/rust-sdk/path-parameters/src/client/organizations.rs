use crate::{ClientConfig, ClientError, HttpClient, RequestOptions};
use reqwest::{Method};
use crate::{types::*};

pub struct OrganizationsClient {
    pub http_client: HttpClient,
}

impl OrganizationsClient {
    pub fn new(config: ClientConfig) -> Result<Self, ClientError> {
        let http_client = HttpClient::new(config)?;
        Ok(Self { http_client })
    }

    pub async fn get_organization(&self, tenant_id: &String, organization_id: &String, options: Option<RequestOptions>) -> Result<Organization, ClientError> {
        self.http_client.execute_request(
            Method::GET,
            &format!("/{}{}", tenant_id, organization_id),
            None,
            options,
        ).await
    }

    pub async fn get_organization_user(&self, tenant_id: &String, organization_id: &String, user_id: &String, options: Option<RequestOptions>) -> Result<User, ClientError> {
        self.http_client.execute_request(
            Method::GET,
            &format!("/{}{}{}", tenant_id, organization_id, user_id),
            None,
            options,
        ).await
    }

    pub async fn search_organizations(&self, tenant_id: &String, organization_id: &String, limit: Option<&Option<i32>>, options: Option<RequestOptions>) -> Result<Vec<Organization>, ClientError> {
        self.http_client.execute_request(
            Method::GET,
            &format!("/{}{}", tenant_id, organization_id),
            None,
            options,
        ).await
    }

}

