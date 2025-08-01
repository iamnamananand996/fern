public struct LangServerResponse: Codable, Hashable, Sendable {
    public let response: JSONValue
    public let additionalProperties: [String: JSONValue]

    public init(
        response: JSONValue,
        additionalProperties: [String: JSONValue] = .init()
    ) {
        self.response = response
        self.additionalProperties = additionalProperties
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.response = try container.decode(JSONValue.self, forKey: .response)
        self.additionalProperties = try decoder.decodeAdditionalProperties(using: CodingKeys.self)
    }

    public func encode(to encoder: Encoder) throws -> Void {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try encoder.encodeAdditionalProperties(self.additionalProperties)
        try container.encode(self.response, forKey: .response)
    }

    enum CodingKeys: String, CodingKey, CaseIterable {
        case response
    }
}