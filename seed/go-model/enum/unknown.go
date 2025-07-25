// Code generated by Fern. DO NOT EDIT.

package enum

import (
	fmt "fmt"
)

type Status string

const (
	StatusKnown   = "Known"
	StatusUnknown = "Unknown"
)

func NewStatusFromString(s string) (Status, error) {
	switch s {
	case "Known":
		return StatusKnown, nil
	case "Unknown":
		return StatusUnknown, nil
	}
	var t Status
	return "", fmt.Errorf("%s is not a valid %T", s, t)
}

func (s Status) Ptr() *Status {
	return &s
}
