public struct NestedUser: Codable, Hashable, Sendable {
    public let name: String
    public let nestedUser: User
    public let additionalProperties: [String: JSONValue]

    public init(
        name: String,
        nestedUser: User,
        additionalProperties: [String: JSONValue] = .init()
    ) {
        self.name = name
        self.nestedUser = nestedUser
        self.additionalProperties = additionalProperties
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.name = try container.decode(String.self, forKey: .name)
        self.nestedUser = try container.decode(User.self, forKey: .nestedUser)
        self.additionalProperties = try decoder.decodeAdditionalProperties(using: CodingKeys.self)
    }

    public func encode(to encoder: Encoder) throws -> Void {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try encoder.encodeAdditionalProperties(self.additionalProperties)
        try container.encode(self.name, forKey: .name)
        try container.encode(self.nestedUser, forKey: .nestedUser)
    }

    enum CodingKeys: String, CodingKey, CaseIterable {
        case name = "Name"
        case nestedUser = "NestedUser"
    }
}