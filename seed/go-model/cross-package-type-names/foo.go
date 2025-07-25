// Code generated by Fern. DO NOT EDIT.

package crosspackagetypenames

import (
	json "encoding/json"
	fmt "fmt"
	internal "github.com/cross-package-type-names/fern/internal"
)

type ImportingType struct {
	Imported Imported `json:"imported" url:"imported"`

	extraProperties map[string]any
	rawJSON         json.RawMessage
}

func (i *ImportingType) GetImported() Imported {
	if i == nil {
		return ""
	}
	return i.Imported
}

func (i *ImportingType) GetExtraProperties() map[string]any {
	if i == nil {
		return nil
	}
	return i.extraProperties
}

func (i *ImportingType) String() string {
	if len(i.rawJSON) > 0 {
		if value, err := internal.StringifyJSON(i.rawJSON); err == nil {
			return value
		}
	}
	if value, err := internal.StringifyJSON(i); err == nil {
		return value
	}
	return fmt.Sprintf("%#v", i)
}

type OptionalString = *string
