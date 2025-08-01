using System.Text.Json.Serialization;
using SeedOauthClientCredentialsEnvironmentVariables.Core;

namespace SeedOauthClientCredentialsEnvironmentVariables;

[Serializable]
public record GetTokenRequest
{
    [JsonPropertyName("client_id")]
    public required string ClientId { get; set; }

    [JsonPropertyName("client_secret")]
    public required string ClientSecret { get; set; }

    [JsonPropertyName("audience")]
    public string Audience { get; set; } = "https://api.example.com";

    [JsonPropertyName("grant_type")]
    public string GrantType { get; set; } = "client_credentials";

    [JsonPropertyName("scope")]
    public string? Scope { get; set; }

    /// <inheritdoc />
    public override string ToString()
    {
        return JsonUtils.Serialize(this);
    }
}
