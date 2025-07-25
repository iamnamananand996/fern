// Code generated by Fern. DO NOT EDIT.

package client

import (
	core "github.com/cross-package-type-names/fern/core"
	client "github.com/cross-package-type-names/fern/foldera/client"
	folderdclient "github.com/cross-package-type-names/fern/folderd/client"
	foo "github.com/cross-package-type-names/fern/foo"
	internal "github.com/cross-package-type-names/fern/internal"
	option "github.com/cross-package-type-names/fern/option"
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
