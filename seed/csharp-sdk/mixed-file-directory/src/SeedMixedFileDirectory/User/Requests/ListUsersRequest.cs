using System.Text.Json.Serialization;
using SeedMixedFileDirectory.Core;

namespace SeedMixedFileDirectory;

[Serializable]
public record ListUsersRequest
{
    /// <summary>
    /// The maximum number of results to return.
    /// </summary>
    [JsonIgnore]
    public int? Limit { get; set; }

    /// <inheritdoc />
    public override string ToString()
    {
        return JsonUtils.Serialize(this);
    }
}
