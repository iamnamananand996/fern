// Code generated by Fern. DO NOT EDIT.

package unknownasany

import (
	json "encoding/json"
	fmt "fmt"
	internal "github.com/unknown/fern/internal"
)

type MyAlias = any

type MyObject struct {
	Unknown any `json:"unknown" url:"unknown"`

	extraProperties map[string]any
	rawJSON         json.RawMessage
}

func (m *MyObject) GetUnknown() any {
	if m == nil {
		return nil
	}
	return m.Unknown
}

func (m *MyObject) GetExtraProperties() map[string]any {
	if m == nil {
		return nil
	}
	return m.extraProperties
}

func (m *MyObject) UnmarshalJSON(
	data []byte,
) error {
	type unmarshaler MyObject
	var value unmarshaler
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	*m = MyObject(value)
	extraProperties, err := internal.ExtractExtraProperties(data, *m)
	if err != nil {
		return err
	}
	m.extraProperties = extraProperties
	m.rawJSON = json.RawMessage(data)
	return nil
}

func (m *MyObject) String() string {
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
