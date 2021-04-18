package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/dgrijalva/jwt-go"
	"github.com/dgrijalva/jwt-go/request"
)

var (
	errEmailAddressNotFound      = fmt.Errorf("email address not found")
	errUnableToUpsertUser        = fmt.Errorf("unable to upsert user")
	errInvalidJWT                = fmt.Errorf("invalid JSON Web Token")
	errUnableToRetrieveTemplates = fmt.Errorf("unable to retrieve templates")
	errUnableToSaveTemplates     = fmt.Errorf("unable to save templates")
)

func (cfg *Config) emailFromJWT(r *http.Request) (email string, err error) {
	// decode the JWT and make sure the signature is valid
	token, err := request.ParseFromRequestWithClaims(r, request.AuthorizationHeaderExtractor, jwt.MapClaims{}, func(token *jwt.Token) (interface{}, error) {
		// a workaround for https://github.com/dgrijalva/jwt-go/issues/314
		mapClaims := token.Claims.(jwt.MapClaims)
		delete(mapClaims, "iat")
		return []byte(cfg.JWTSecret), nil
	})
	if token == nil || err != nil { // this also validates the signature and timestamp
		err = errInvalidJWT
		return
	}

	claims := token.Claims.(jwt.MapClaims)
	val, ok := claims["email"]
	if !ok {
		err = errInvalidJWT
		return
	}
	switch v := val.(type) {
	case string:
		email = v
	default:
		err = errInvalidJWT
		return
	}

	return
}

// GetHandler returns a user's Templates
// curl 'http://127.0.0.1:8000/get?google_key=my_key'
func (cfg *Config) GetHandler(r *http.Request) (rsp *Response) {
	rsp = &Response{
		status:   http.StatusOK,
		template: "json",
	}

	var user = &User{}
	user.Email, rsp.Error = cfg.emailFromJWT(r)
	if rsp.Error != nil {
		rsp.Error = errUnableToRetrieveTemplates
		return
	}

	// make sure the user exists
	if rsp.Error = cfg.Backender.upsertUser(context.Background(), user.Email); rsp.Error != nil {
		rsp.Error = errUnableToUpsertUser
		return rsp
	}

	rsp.Response, rsp.Error = cfg.getTemplates(user)
	if rsp.Error != nil {
		return
	}

	return
}

func (cfg *Config) getTemplates(user *User) (*User, error) {
	encryptedTemplates, err := cfg.Backender.getTemplates(context.Background(), user.Email)
	if err != nil {
		err = errUnableToRetrieveTemplates
		return user, err
	}

	var decryptedTemplates []byte
	decryptedTemplates, err = cfg.Decrypt(encryptedTemplates)
	if err != nil {
		return user, err
	}

	if err = json.Unmarshal(decryptedTemplates, &user.Templates); err != nil {
		fmt.Println("##########1", err)

		err = errUnableToRetrieveTemplates
		return user, err
	}

	return user, err
}

// SaveHandler saves a user's templates
// curl -XPOST 'http://127.0.0.1:8000/save' -d '{"templates":[{"subject":"template subject","body":"template body"}]}'
func (cfg *Config) SaveHandler(r *http.Request) (rsp *Response) {
	rsp = &Response{
		status:   http.StatusOK,
		template: "json",
	}

	var user *User
	rsp.Error = json.NewDecoder(r.Body).Decode(&user)
	if rsp.Error != nil {
		rsp.Error = errUnableToSaveTemplates
		return
	}

	user.Email, rsp.Error = cfg.emailFromJWT(r)
	if rsp.Error != nil {
		rsp.Error = errUnableToSaveTemplates
		return
	}

	// make sure the user exists
	if rsp.Error = cfg.Backender.upsertUser(context.Background(), user.Email); rsp.Error != nil {
		rsp.Error = errUnableToUpsertUser
		return rsp
	}

	var templatesBytes []byte
	templatesBytes, rsp.Error = json.Marshal(user.Templates)
	if rsp.Error != nil {
		rsp.Error = errUnableToSaveTemplates
		return
	}

	var encryptedTemplates []byte
	encryptedTemplates, rsp.Error = cfg.Encrypt(templatesBytes)
	if rsp.Error != nil {
		return rsp
	}

	if rsp.Error = cfg.Backender.saveTemplates(context.Background(), user.Email, encryptedTemplates); rsp.Error != nil {
		rsp.Error = errUnableToSaveTemplates
		return rsp
	}

	// Maybe we don't have to return their templates? Probably not a big deal.
	// We could probably just return the templates passed in but good to double-ensure everything works, I guess.
	rsp.Response, rsp.Error = cfg.getTemplates(user)
	if rsp.Error != nil {
		return rsp
	}

	return
}
