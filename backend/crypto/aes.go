package crypto

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"fmt"
	"io"
)

var (
	errInvalidEncryptionKey = fmt.Errorf("invalid AES encryption key")
	ErrMalformedCiphertext  = fmt.Errorf("malformed ciphertext")
)

// AES encrypts and decrypts data using AES encryption
type AES struct {
	EncryptionKey [32]byte
}

// Encrypt encrypts data using AES encryption
// slightly modified from original: https://github.com/gtank/cryptopasta/blob/master/encrypt.go
func (a *AES) Encrypt(plaintext []byte) (ciphertext []byte, err error) {
	if bytes.Equal(a.EncryptionKey[:], make([]byte, 32)) {
		err = errInvalidEncryptionKey
		return
	}

	block, err := aes.NewCipher(a.EncryptionKey[:])
	if err != nil {
		err = errInvalidEncryptionKey
		return
	}

	aes, err := cipher.NewGCM(block)
	if err != nil {
		return
	}

	nonce := make([]byte, aes.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return
	}

	return aes.Seal(nonce, nonce, plaintext, nil), nil
}

// Decrypt decrypts AES-encoded data
// slightly modified from original: https://github.com/gtank/cryptopasta/blob/master/encrypt.go
func (a *AES) Decrypt(ciphertext []byte) (plaintext []byte, err error) {
	block, err := aes.NewCipher(a.EncryptionKey[:])
	if err != nil {
		err = errInvalidEncryptionKey
		return
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return
	}

	if len(ciphertext) < gcm.NonceSize() {
		err = ErrMalformedCiphertext
		return
	}

	return gcm.Open(nil, ciphertext[:gcm.NonceSize()], ciphertext[gcm.NonceSize():], nil)
}
