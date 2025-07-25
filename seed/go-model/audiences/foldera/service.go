// Code generated by Fern. DO NOT EDIT.

package foldera

import (
	json "encoding/json"
	fmt "fmt"
	folderb "github.com/audiences/fern/folderb"
	internal "github.com/audiences/fern/internal"
)

type Response struct {
	Foo *folderb.Foo `json:"foo,omitempty" url:"foo,omitempty"`

	extraProperties map[string]any
	rawJSON         json.RawMessage
}

func (r *Response) GetFoo() *folderb.Foo {
	if r == nil {
		return nil
	}
	return r.Foo
}

func (r *Response) GetExtraProperties() map[string]any {
	if r == nil {
		return nil
	}
	return r.extraProperties
}

func (r *Response) String() string {
	if len(r.rawJSON) > 0 {
		if value, err := internal.StringifyJSON(r.rawJSON); err == nil {
			return value
		}
	}
	if value, err := internal.StringifyJSON(r); err == nil {
		return value
	}
	return fmt.Sprintf("%#v", r)
}
