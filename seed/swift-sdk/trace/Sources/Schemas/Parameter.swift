public struct Parameter: Codable, Hashable, Sendable {
    public let parameterId: ParameterId
    public let name: String
    public let variableType: VariableType
    public let additionalProperties: [String: JSONValue]

    public init(
        parameterId: ParameterId,
        name: String,
        variableType: VariableType,
        additionalProperties: [String: JSONValue] = .init()
    ) {
        self.parameterId = parameterId
        self.name = name
        self.variableType = variableType
        self.additionalProperties = additionalProperties
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.parameterId = try container.decode(ParameterId.self, forKey: .parameterId)
        self.name = try container.decode(String.self, forKey: .name)
        self.variableType = try container.decode(VariableType.self, forKey: .variableType)
        self.additionalProperties = try decoder.decodeAdditionalProperties(using: CodingKeys.self)
    }

    public func encode(to encoder: Encoder) throws -> Void {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try encoder.encodeAdditionalProperties(self.additionalProperties)
        try container.encode(self.parameterId, forKey: .parameterId)
        try container.encode(self.name, forKey: .name)
        try container.encode(self.variableType, forKey: .variableType)
    }

    enum CodingKeys: String, CodingKey, CaseIterable {
        case parameterId
        case name
        case variableType
    }
}