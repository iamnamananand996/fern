public final class PlaylistClient: Sendable {
    private let httpClient: HTTPClient

    public init(config: ClientConfig) {
        self.httpClient = HTTPClient(config: config)
    }

    public func createPlaylist(serviceParam: String, datetime: Date, optionalDatetime: Date? = nil, request: PlaylistCreateRequest, requestOptions: RequestOptions? = nil) async throws -> Playlist {
        return try await httpClient.performRequest(
            method: .post,
            path: "/v2/playlist/\(serviceParam)/create",
            queryParams: [
                "datetime": .date(datetime), 
                "optionalDatetime": optionalDatetime.map { .date($0) }
            ],
            body: request,
            requestOptions: requestOptions,
            responseType: Playlist.self
        )
    }

    public func getPlaylists(serviceParam: String, limit: Int? = nil, otherField: String, multiLineDocs: String, optionalMultipleField: String? = nil, multipleField: String, requestOptions: RequestOptions? = nil) async throws -> [Playlist] {
        return try await httpClient.performRequest(
            method: .get,
            path: "/v2/playlist/\(serviceParam)/all",
            queryParams: [
                "limit": limit.map { .int($0) }, 
                "otherField": .string(otherField), 
                "multiLineDocs": .string(multiLineDocs), 
                "optionalMultipleField": optionalMultipleField.map { .string($0) }, 
                "multipleField": .string(multipleField)
            ],
            requestOptions: requestOptions,
            responseType: [Playlist].self
        )
    }

    public func getPlaylist(serviceParam: String, playlistId: String, requestOptions: RequestOptions? = nil) async throws -> Playlist {
        return try await httpClient.performRequest(
            method: .get,
            path: "/v2/playlist/\(serviceParam)/\(playlistId)",
            requestOptions: requestOptions,
            responseType: Playlist.self
        )
    }

    public func updatePlaylist(serviceParam: String, playlistId: String, request: UpdatePlaylistRequest?, requestOptions: RequestOptions? = nil) async throws -> Playlist? {
        return try await httpClient.performRequest(
            method: .put,
            path: "/v2/playlist/\(serviceParam)/\(playlistId)",
            body: request,
            requestOptions: requestOptions,
            responseType: Playlist?.self
        )
    }

    public func deletePlaylist(serviceParam: String, playlistId: String, requestOptions: RequestOptions? = nil) async throws -> Void {
        return try await httpClient.performRequest(
            method: .delete,
            path: "/v2/playlist/\(serviceParam)/\(playlistId)",
            requestOptions: requestOptions
        )
    }
}