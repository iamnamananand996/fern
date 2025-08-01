// Code generated by Fern. DO NOT EDIT.

package user

import (
	context "context"
	fern "github.com/extra-properties/fern"
	core "github.com/extra-properties/fern/core"
	internal "github.com/extra-properties/fern/internal"
	option "github.com/extra-properties/fern/option"
	http "net/http"
)

type Client struct {
	WithRawResponse *RawClient

	baseURL string
	caller  *internal.Caller
	header  http.Header
}

func NewClient(opts ...option.RequestOption) *Client {
	options := core.NewRequestOptions(opts...)
	return &Client{
		WithRawResponse: NewRawClient(options),
		baseURL:         options.BaseURL,
		caller: internal.NewCaller(
			&internal.CallerParams{
				Client:      options.HTTPClient,
				MaxAttempts: options.MaxAttempts,
			},
		),
		header: options.ToHeader(),
	}
}

func (c *Client) CreateUser(
	ctx context.Context,
	request *fern.CreateUserRequest,
	opts ...option.RequestOption,
) (*fern.User, error) {
	response, err := c.WithRawResponse.CreateUser(
		ctx,
		request,
		opts...,
	)
	if err != nil {
		return nil, err
	}
	return response.Body, nil
}
