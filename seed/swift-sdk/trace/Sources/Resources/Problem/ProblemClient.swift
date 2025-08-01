public final class ProblemClient: Sendable {
    private let httpClient: HTTPClient

    public init(config: ClientConfig) {
        self.httpClient = HTTPClient(config: config)
    }

    public func createProblem(request: CreateProblemRequest, requestOptions: RequestOptions? = nil) async throws -> CreateProblemResponse {
        return try await httpClient.performRequest(
            method: .post,
            path: "/problem-crud/create",
            body: request,
            requestOptions: requestOptions,
            responseType: CreateProblemResponse.self
        )
    }

    public func updateProblem(problemId: String, request: CreateProblemRequest, requestOptions: RequestOptions? = nil) async throws -> UpdateProblemResponse {
        return try await httpClient.performRequest(
            method: .post,
            path: "/problem-crud/update/\(problemId)",
            body: request,
            requestOptions: requestOptions,
            responseType: UpdateProblemResponse.self
        )
    }

    public func deleteProblem(problemId: String, requestOptions: RequestOptions? = nil) async throws -> Void {
        return try await httpClient.performRequest(
            method: .delete,
            path: "/problem-crud/delete/\(problemId)",
            requestOptions: requestOptions
        )
    }

    public func getDefaultStarterFiles(request: GetDefaultStarterFilesRequest, requestOptions: RequestOptions? = nil) async throws -> GetDefaultStarterFilesResponse {
        return try await httpClient.performRequest(
            method: .post,
            path: "/problem-crud/default-starter-files",
            body: request,
            requestOptions: requestOptions,
            responseType: GetDefaultStarterFilesResponse.self
        )
    }
}