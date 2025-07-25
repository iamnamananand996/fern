// Code generated by Fern. DO NOT EDIT.

package client

import (
	core "github.com/audiences/fern/core"
	client "github.com/audiences/fern/foldera/client"
	folderdclient "github.com/audiences/fern/folderd/client"
	foo "github.com/audiences/fern/foo"
	internal "github.com/audiences/fern/internal"
	option "github.com/audiences/fern/option"
	http "net/http"
)

type Client struct {
	FolderA *client.Client
	FolderD *folderdclient.Client
	Foo     *foo.Client

	baseURL string
	caller  *internal.Caller
	header  http.Header
}

func NewClient(opts ...option.RequestOption) *Client {
	options := core.NewRequestOptions(opts...)
	return &Client{
		FolderA: client.NewClient(opts...),
		FolderD: folderdclient.NewClient(opts...),
		Foo:     foo.NewClient(opts...),
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
