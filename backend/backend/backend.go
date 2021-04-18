package backend

import (
	"context"
	"mailman/crypto"
)

// Config holds configuration settings for the api
type Config struct {
	Backender
	Encrypt   crypto.Encryptor
	Decrypt   crypto.Decryptor
	JWTSecret string
}

// Backender outlines methods to store and retrieve saved commands
type Backender interface {
	upsertUser(ctx context.Context, email string) (err error)
	getTemplates(ctx context.Context, email string) (encryptedTemplates []byte, err error)
	saveTemplates(ctx context.Context, email string, encryptedTemplates []byte) (err error)
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

// User is a registered user
type User struct {
	Email     string     `json:"email"`
	Templates []Template `json:"templates"`
}

// A Template is an email template
type Template struct {
	Subject string      `json:"subject"`
	Body    interface{} `json:"body"`
}
