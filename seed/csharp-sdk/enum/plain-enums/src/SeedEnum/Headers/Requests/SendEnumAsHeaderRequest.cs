using System.Text.Json.Serialization;
using OneOf;
using SeedEnum.Core;

namespace SeedEnum;

[Serializable]
public record SendEnumAsHeaderRequest
{
    [JsonIgnore]
    public required Operand Operand { get; set; }

    [JsonIgnore]
    public Operand? MaybeOperand { get; set; }

    [JsonIgnore]
    public required OneOf<Color, Operand> OperandOrColor { get; set; }

    [JsonIgnore]
    public OneOf<Color, Operand>? MaybeOperandOrColor { get; set; }

    /// <inheritdoc />
    public override string ToString()
    {
        return JsonUtils.Serialize(this);
    }
}
