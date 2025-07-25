// Code generated by Fern. DO NOT EDIT.

package union

import (
	context "context"
	undiscriminated "github.com/fern-api/undiscriminated-go"
	core "github.com/fern-api/undiscriminated-go/core"
	internal "github.com/fern-api/undiscriminated-go/internal"
	option "github.com/fern-api/undiscriminated-go/option"
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

func (c *Client) Get(
	ctx context.Context,
	request *undiscriminated.MyUnion,
	opts ...option.RequestOption,
) (*undiscriminated.MyUnion, error) {
	response, err := c.WithRawResponse.Get(
		ctx,
		request,
		opts...,
	)
	if err != nil {
		return nil, err
	}
	return response.Body, nil
}

func (c *Client) GetMetadata(
	ctx context.Context,
	opts ...option.RequestOption,
) (undiscriminated.Metadata, error) {
	response, err := c.WithRawResponse.GetMetadata(
		ctx,
		opts...,
	)
	if err != nil {
		return nil, err
	}
	return response.Body, nil
}

func (c *Client) UpdateMetadata(
	ctx context.Context,
	request *undiscriminated.MetadataUnion,
	opts ...option.RequestOption,
) (bool, error) {
	response, err := c.WithRawResponse.UpdateMetadata(
		ctx,
		request,
		opts...,
	)
	if err != nil {
		return false, err
	}
	return response.Body, nil
}

func (c *Client) Call(
	ctx context.Context,
	request *undiscriminated.Request,
	opts ...option.RequestOption,
) (bool, error) {
	response, err := c.WithRawResponse.Call(
		ctx,
		request,
		opts...,
	)
	if err != nil {
		return false, err
	}
	return response.Body, nil
}

func (c *Client) DuplicateTypesUnion(
	ctx context.Context,
	request *undiscriminated.UnionWithDuplicateTypes,
	opts ...option.RequestOption,
) (*undiscriminated.UnionWithDuplicateTypes, error) {
	response, err := c.WithRawResponse.DuplicateTypesUnion(
		ctx,
		request,
		opts...,
	)
	if err != nil {
		return nil, err
	}
	return response.Body, nil
}

func (c *Client) NestedUnions(
	ctx context.Context,
	request *undiscriminated.NestedUnionRoot,
	opts ...option.RequestOption,
) (string, error) {
	response, err := c.WithRawResponse.NestedUnions(
		ctx,
		request,
		opts...,
	)
	if err != nil {
		return "", err
	}
	return response.Body, nil
}
