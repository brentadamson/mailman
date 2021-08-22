package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"mailman/log"
	"net/http"
	"net/url"
)

var (
	errUnauthorized         = fmt.Errorf("unauthorized")
	errInvalidEmail         = fmt.Errorf("invalid email address")
	errUnableToRegisterUser = fmt.Errorf("unable to register user")
)

func (cfg *Config) RegisterUserHandler(r *http.Request) (rsp *Response) {
	rsp = &Response{
		status:   http.StatusOK,
		template: "json",
	}

	user := struct {
		Email string `json:"email"`
		Key   string `json:"key"`
	}{}

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		log.Info.Println(err)
		rsp.status = http.StatusInternalServerError
		return rsp
	}

	if user.Key != cfg.Key {
		rsp.Error = errUnauthorized
		return rsp
	}

	// not even sure if this is needed but I guess doesn't hurt
	user.Email, err = url.QueryUnescape(user.Email)
	if user.Email == "" || err != nil {
		rsp.Error = errInvalidEmail
		return rsp
	}

	if err := cfg.Backender.registerUser(context.Background(), user.Email); err != nil {
		rsp.Error = errUnableToRegisterUser
		return rsp
	}

	return
}
