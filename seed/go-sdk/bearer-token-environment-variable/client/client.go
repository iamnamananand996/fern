// Code generated by Fern. DO NOT EDIT.

package client

import (
	core "github.com/bearer-token-environment-variable/fern/core"
	internal "github.com/bearer-token-environment-variable/fern/internal"
	option "github.com/bearer-token-environment-variable/fern/option"
	service "github.com/bearer-token-environment-variable/fern/service"
	http "net/http"
	os "os"
)

type Client struct {
	Service *service.Client

	baseURL string
	caller  *internal.Caller
	header  http.Header
}

func NewClient(opts ...option.RequestOption) *Client {
	options := core.NewRequestOptions(opts...)
	if options.ApiKey == "" {
		options.ApiKey = os.Getenv("COURIER_API_KEY")
	}
	return &Client{
		Service: service.NewClient(opts...),
		baseURL: options.BaseURL,
		caller: internal.NewCaller(
			&internal.CallerParams{
				Client:      options.HTTPClient,
				MaxAttempts: options.MaxAttempts,
			},
		),
		header: options.ToHeader(),
	}
}
