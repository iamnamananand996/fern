// Code generated by Fern. DO NOT EDIT.

package serversentevents

import (
	json "encoding/json"
	fmt "fmt"
	internal "github.com/server-sent-events/fern/internal"
)

type StreamedCompletion struct {
	Delta  string `json:"delta" url:"delta"`
	Tokens *int   `json:"tokens,omitempty" url:"tokens,omitempty"`

	extraProperties map[string]any
	rawJSON         json.RawMessage
}

func (s *StreamedCompletion) GetDelta() string {
	if s == nil {
		return ""
	}
	return s.Delta
}

func (s *StreamedCompletion) GetTokens() *int {
	if s == nil {
		return nil
	}
	return s.Tokens
}

func (s *StreamedCompletion) GetExtraProperties() map[string]any {
	if s == nil {
		return nil
	}
	return s.extraProperties
}

func (s *StreamedCompletion) String() string {
	if len(s.rawJSON) > 0 {
		if value, err := internal.StringifyJSON(s.rawJSON); err == nil {
			return value
		}
	}
	if value, err := internal.StringifyJSON(s); err == nil {
		return value
	}
	return fmt.Sprintf("%#v", s)
}
