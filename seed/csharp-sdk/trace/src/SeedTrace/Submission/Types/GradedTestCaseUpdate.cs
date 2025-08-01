using System.Text.Json;
using System.Text.Json.Serialization;
using SeedTrace.Core;

namespace SeedTrace;

[Serializable]
public record GradedTestCaseUpdate : IJsonOnDeserialized
{
    [JsonExtensionData]
    private readonly IDictionary<string, JsonElement> _extensionData =
        new Dictionary<string, JsonElement>();

    [JsonPropertyName("testCaseId")]
    public required string TestCaseId { get; set; }

    [JsonPropertyName("grade")]
    public required TestCaseGrade Grade { get; set; }

    [JsonIgnore]
    public ReadOnlyAdditionalProperties AdditionalProperties { get; private set; } = new();

    void IJsonOnDeserialized.OnDeserialized() =>
        AdditionalProperties.CopyFromExtensionData(_extensionData);

    /// <inheritdoc />
    public override string ToString()
    {
        return JsonUtils.Serialize(this);
    }
}
