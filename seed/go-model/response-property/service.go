// Code generated by Fern. DO NOT EDIT.

package responseproperty

import (
	json "encoding/json"
	fmt "fmt"
	internal "github.com/response-property/fern/internal"
)

type WithDocs struct {
	Docs string `json:"docs" url:"docs"`

	extraProperties map[string]any
	rawJSON         json.RawMessage
}

func (w *WithDocs) GetDocs() string {
	if w == nil {
		return ""
	}
	return w.Docs
}

func (w *WithDocs) GetExtraProperties() map[string]any {
	if w == nil {
		return nil
	}
	return w.extraProperties
}

func (w *WithDocs) UnmarshalJSON(
	data []byte,
) error {
	type unmarshaler WithDocs
	var value unmarshaler
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	*w = WithDocs(value)
	extraProperties, err := internal.ExtractExtraProperties(data, *w)
	if err != nil {
		return err
	}
	w.extraProperties = extraProperties
	w.rawJSON = json.RawMessage(data)
	return nil
}

func (w *WithDocs) String() string {
	if len(w.rawJSON) > 0 {
		if value, err := internal.StringifyJSON(w.rawJSON); err == nil {
			return value
		}
	}
	if value, err := internal.StringifyJSON(w); err == nil {
		return value
	}
	return fmt.Sprintf("%#v", w)
}

type OptionalWithDocs = *WithDocs

type Movie struct {
	Id   string `json:"id" url:"id"`
	Name string `json:"name" url:"name"`

	extraProperties map[string]any
	rawJSON         json.RawMessage
}

func (m *Movie) GetId() string {
	if m == nil {
		return ""
	}
	return m.Id
}

func (m *Movie) GetName() string {
	if m == nil {
		return ""
	}
	return m.Name
}

func (m *Movie) GetExtraProperties() map[string]any {
	if m == nil {
		return nil
	}
	return m.extraProperties
}

func (m *Movie) UnmarshalJSON(
	data []byte,
) error {
	type unmarshaler Movie
	var value unmarshaler
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	*m = Movie(value)
	extraProperties, err := internal.ExtractExtraProperties(data, *m)
	if err != nil {
		return err
	}
	m.extraProperties = extraProperties
	m.rawJSON = json.RawMessage(data)
	return nil
}

func (m *Movie) String() string {
	if len(m.rawJSON) > 0 {
		if value, err := internal.StringifyJSON(m.rawJSON); err == nil {
			return value
		}
	}
	if value, err := internal.StringifyJSON(m); err == nil {
		return value
	}
	return fmt.Sprintf("%#v", m)
}

type Response struct {
	Metadata map[string]string `json:"metadata" url:"metadata"`
	Docs     string            `json:"docs" url:"docs"`
	Data     *Movie            `json:"data" url:"data"`

	extraProperties map[string]any
	rawJSON         json.RawMessage
}

func (r *Response) GetMetadata() map[string]string {
	if r == nil {
		return nil
	}
	return r.Metadata
}

func (r *Response) GetDocs() string {
	if r == nil {
		return ""
	}
	return r.Docs
}

func (r *Response) GetData() *Movie {
	if r == nil {
		return nil
	}
	return r.Data
}

func (r *Response) GetExtraProperties() map[string]any {
	if r == nil {
		return nil
	}
	return r.extraProperties
}

func (r *Response) UnmarshalJSON(
	data []byte,
) error {
	type unmarshaler Response
	var value unmarshaler
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	*r = Response(value)
	extraProperties, err := internal.ExtractExtraProperties(data, *r)
	if err != nil {
		return err
	}
	r.extraProperties = extraProperties
	r.rawJSON = json.RawMessage(data)
	return nil
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
