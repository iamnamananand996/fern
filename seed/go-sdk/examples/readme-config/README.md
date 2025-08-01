# Seed Go Library

![](https://www.fernapi.com)

[![fern shield](https://img.shields.io/badge/%F0%9F%8C%BF-Built%20with%20Fern-brightgreen)](https://buildwithfern.com?utm_source=github&utm_medium=github&utm_campaign=readme&utm_source=Seed%2FGo)

The Seed Go library provides convenient access to the Seed API from Go.

## Documentation

API reference documentation is available [here](https://www.docs.fernapi.com).

## Usage

Instantiate and use the client with the following:

```go
package example

import (
    client "github.com/examples/fern/client"
    option "github.com/examples/fern/option"
    context "context"
    fern "github.com/examples/fern"
    commons "github.com/examples/fern/commons"
    uuid "github.com/google/uuid"
)

func do() {
    client := client.New(
        option.WithToken(
            "<token>",
        ),
    )
    client.Service.CreateBigEntity(
        context.TODO(),
        &fern.BigEntity{
            CastMember: &fern.CastMember{
                Actor: &fern.Actor{
                    Name: "name",
                    Id: "id",
                },
            },
            ExtendedMovie: &fern.ExtendedMovie{
                Cast: []string{
                    "cast",
                    "cast",
                },
                Id: "id",
                Prequel: fern.String(
                    "prequel",
                ),
                Title: "title",
                From: "from",
                Rating: 1.1,
                Tag: "tag",
                Book: fern.String(
                    "book",
                ),
                Metadata: map[string]any{
                    "metadata": map[string]any{
                        "key": "value",
                    },
                },
                Revenue: 1000000,
            },
            Entity: &fern.Entity{
                Type: &fern.Type{
                    BasicType: fern.BasicTypePrimitive,
                },
                Name: "name",
            },
            Metadata: &fern.Metadata{
                Extra: map[string]string{
                    "extra": "extra",
                },
                Tags: []string{
                    "tags",
                },
            },
            CommonMetadata: &commons.Metadata{
                Id: "id",
                Data: map[string]string{
                    "data": "data",
                },
                JsonString: fern.String(
                    "jsonString",
                ),
            },
            EventInfo: &commons.EventInfo{
                Metadata: &commons.Metadata{
                    Id: "id",
                    Data: map[string]string{
                        "data": "data",
                    },
                    JsonString: fern.String(
                        "jsonString",
                    ),
                },
            },
            Data: &commons.Data{},
            Migration: &fern.Migration{
                Name: "name",
                Status: fern.MigrationStatusRunning,
            },
            Exception: &fern.Exception{
                Generic: &fern.ExceptionInfo{
                    ExceptionType: "exceptionType",
                    ExceptionMessage: "exceptionMessage",
                    ExceptionStacktrace: "exceptionStacktrace",
                },
            },
            Test: &fern.Test{},
            Node: &fern.Node{
                Name: "name",
                Nodes: []*fern.Node{
                    &fern.Node{
                        Name: "name",
                        Nodes: []*fern.Node{
                            &fern.Node{
                                Name: "name",
                                Nodes: []*fern.Node{},
                                Trees: []*fern.Tree{},
                            },
                            &fern.Node{
                                Name: "name",
                                Nodes: []*fern.Node{},
                                Trees: []*fern.Tree{},
                            },
                        },
                        Trees: []*fern.Tree{
                            &fern.Tree{
                                Nodes: []*fern.Node{},
                            },
                            &fern.Tree{
                                Nodes: []*fern.Node{},
                            },
                        },
                    },
                    &fern.Node{
                        Name: "name",
                        Nodes: []*fern.Node{
                            &fern.Node{
                                Name: "name",
                                Nodes: []*fern.Node{},
                                Trees: []*fern.Tree{},
                            },
                            &fern.Node{
                                Name: "name",
                                Nodes: []*fern.Node{},
                                Trees: []*fern.Tree{},
                            },
                        },
                        Trees: []*fern.Tree{
                            &fern.Tree{
                                Nodes: []*fern.Node{},
                            },
                            &fern.Tree{
                                Nodes: []*fern.Node{},
                            },
                        },
                    },
                },
                Trees: []*fern.Tree{
                    &fern.Tree{
                        Nodes: []*fern.Node{
                            &fern.Node{
                                Name: "name",
                                Nodes: []*fern.Node{},
                                Trees: []*fern.Tree{},
                            },
                            &fern.Node{
                                Name: "name",
                                Nodes: []*fern.Node{},
                                Trees: []*fern.Tree{},
                            },
                        },
                    },
                    &fern.Tree{
                        Nodes: []*fern.Node{
                            &fern.Node{
                                Name: "name",
                                Nodes: []*fern.Node{},
                                Trees: []*fern.Tree{},
                            },
                            &fern.Node{
                                Name: "name",
                                Nodes: []*fern.Node{},
                                Trees: []*fern.Tree{},
                            },
                        },
                    },
                },
            },
            Directory: &fern.Directory{
                Name: "name",
                Files: []*fern.File{
                    &fern.File{
                        Name: "name",
                        Contents: "contents",
                    },
                    &fern.File{
                        Name: "name",
                        Contents: "contents",
                    },
                },
                Directories: []*fern.Directory{
                    &fern.Directory{
                        Name: "name",
                        Files: []*fern.File{
                            &fern.File{
                                Name: "name",
                                Contents: "contents",
                            },
                            &fern.File{
                                Name: "name",
                                Contents: "contents",
                            },
                        },
                        Directories: []*fern.Directory{
                            &fern.Directory{
                                Name: "name",
                                Files: []*fern.File{},
                                Directories: []*fern.Directory{},
                            },
                            &fern.Directory{
                                Name: "name",
                                Files: []*fern.File{},
                                Directories: []*fern.Directory{},
                            },
                        },
                    },
                    &fern.Directory{
                        Name: "name",
                        Files: []*fern.File{
                            &fern.File{
                                Name: "name",
                                Contents: "contents",
                            },
                            &fern.File{
                                Name: "name",
                                Contents: "contents",
                            },
                        },
                        Directories: []*fern.Directory{
                            &fern.Directory{
                                Name: "name",
                                Files: []*fern.File{},
                                Directories: []*fern.Directory{},
                            },
                            &fern.Directory{
                                Name: "name",
                                Files: []*fern.File{},
                                Directories: []*fern.Directory{},
                            },
                        },
                    },
                },
            },
            Moment: &fern.Moment{
                Id: uuid.MustParse(
                    "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
                ),
                Date: fern.MustParseDateTime(
                    "2023-01-15",
                ),
                Datetime: fern.MustParseDateTime(
                    "2024-01-15T09:30:00Z",
                ),
            },
        },
    )
}
```

## Environments

You can choose between different environments by using the `option.WithBaseURL` option. You can configure any arbitrary base
URL, which is particularly useful in test environments.

```go
client := client.NewClient(
    option.WithBaseURL(examples.Environments.Production),
)
```

## Errors

Structured error types are returned from API calls that return non-success status codes. These errors are compatible
with the `errors.Is` and `errors.As` APIs, so you can access the error like so:

```go
response, err := client.Service.CreateBigEntity(...)
if err != nil {
    var apiError *core.APIError
    if errors.As(err, apiError) {
        // Do something with the API error ...
    }
    return err
}
```

## Request Options

A variety of request options are included to adapt the behavior of the library, which includes configuring
authorization tokens, or providing your own instrumented `*http.Client`.

These request options can either be
specified on the client so that they're applied on every request, or for an individual request, like so:

> Providing your own `*http.Client` is recommended. Otherwise, the `http.DefaultClient` will be used,
> and your client will wait indefinitely for a response (unless the per-request, context-based timeout
> is used).

```go
// Specify default options applied on every request.
client := client.NewClient(
    option.WithToken("<YOUR_API_KEY>"),
    option.WithHTTPClient(
        &http.Client{
            Timeout: 5 * time.Second,
        },
    ),
)

// Specify options for an individual request.
response, err := client.Service.CreateBigEntity(
    ...,
    option.WithToken("<YOUR_API_KEY>"),
)
```

## Advanced

### Response Headers

You can access the raw HTTP response data by using the `WithRawResponse` field on the client. This is useful
when you need to examine the response headers received from the API call.

```go
response, err := client.Service.WithRawResponse.CreateBigEntity(...)
if err != nil {
    return err
}
fmt.Printf("Got response headers: %v", response.Header)
```

### Retries

The SDK is instrumented with automatic retries with exponential backoff. A request will be retried as long
as the request is deemed retryable and the number of retry attempts has not grown larger than the configured
retry limit (default: 2).

A request is deemed retryable when any of the following HTTP status codes is returned:

- [408](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408) (Timeout)
- [429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429) (Too Many Requests)
- [5XX](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500) (Internal Server Errors)

Use the `option.WithMaxAttempts` option to configure this behavior for the entire client or an individual request:

```go
client := client.NewClient(
    option.WithMaxAttempts(1),
)

response, err := client.Service.CreateBigEntity(
    ...,
    option.WithMaxAttempts(1),
)
```

### Timeouts

Setting a timeout for each individual request is as simple as using the standard context library. Setting a one second timeout for an individual API call looks like the following:

```go
ctx, cancel := context.WithTimeout(ctx, time.Second)
defer cancel()

response, err := client.Service.GetMovie(ctx, ...)
```

```go
ctx, cancel := context.WithTimeout(ctx, time.Second)
defer cancel()

response, err := client.Service.CreateMovie(ctx, ...)
```

## Contributing

While we value open-source contributions to this SDK, this library is generated programmatically.
Additions made directly to this library would have to be moved over to our generation code,
otherwise they would be overwritten upon the next generated release. Feel free to open a PR as
a proof of concept, but know that we will not be able to merge it as-is. We suggest opening
an issue first to discuss with us!

On the other hand, contributions to the README are always very welcome!