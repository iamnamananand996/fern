// Code generated by Fern. DO NOT EDIT.

package client

import (
	core "github.com/content-type/fern/core"
	internal "github.com/content-type/fern/internal"
	option "github.com/content-type/fern/option"
	service "github.com/content-type/fern/service"
	http "net/http"
)

type Client struct {
	Service *service.Client

	baseURL string
	caller  *internal.Caller
	header  http.Header
}

func NewClient(opts ...option.RequestOption) *Client {
	options := core.NewRequestOptions(opts...)
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
