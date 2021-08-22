package backend

import (
	"context"
)

// Config holds configuration settings for the api
type Config struct {
	Backender
	Key string
}

// Backender outlines methods to store and retrieve saved commands
type Backender interface {
	registerUser(ctx context.Context, email string) (err error)
	Setup() (err error)
}

// Response is the http response to a request
type Response struct {
	status      int
	template    string
	Response    interface{} `json:"response,omitempty"`
	Error       error       `json:"-"`
	ErrorString string      `json:"error,omitempty"`
}
