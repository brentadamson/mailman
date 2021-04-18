package crypto

import (
	"bytes"
	"crypto/rand"
	"errors"
	"testing"
)

func TestEncryptDecryptGCM(t *testing.T) {
	randomKey, err := createRandomEncryptionKey()
	if err != nil {
		t.Fatal(err)
	}

	for _, c := range []struct {
		name      string
		aes       *AES
		plainText []byte
		wantErr   error
	}{
		{
			name: "encrypts and decrypts",
			aes: &AES{
				EncryptionKey: randomKey,
			},
			plainText: []byte("Hello, world!"),
			wantErr:   nil,
		},
		{
			name:      "no encryption key should fail to encrypt",
			aes:       &AES{},
			plainText: []byte("Hello, world!"),
			wantErr:   errInvalidEncryptionKey,
		},
	} {
		t.Run(c.name, func(t *testing.T) {
			cipherText, err := c.aes.Encrypt(c.plainText)
			if !errors.Is(err, c.wantErr) {
				t.Fatalf("got error %v; want %v", err, c.wantErr)
			}

			if c.wantErr != nil {
				return
			}

			gotPlainText, err := c.aes.Decrypt(cipherText)
			if err != nil {
				t.Fatal(err)
			}

			if !bytes.Equal(gotPlainText, c.plainText) {
				t.Errorf("got %q plainText; want %q", gotPlainText, c.plainText)
			}

			// change the decrypted text should not work
			var ct []byte
			ct = append(ct, cipherText...)
			ct[0] ^= 0xff
			gotPlainText, err = c.aes.Decrypt(ct)
			if err == nil {
				t.Errorf("gcmOpen should not have worked, but did")
			}

			// decrypting with another key should not work
			var originalKey [32]byte
			copy(originalKey[:], c.aes.EncryptionKey[:])
			c.aes.EncryptionKey, err = createRandomEncryptionKey()
			if err != nil {
				t.Fatal(err)
			}

			gotPlainText, err = c.aes.Decrypt(cipherText)
			if err == nil {
				t.Errorf("decrypting with another key should not have worked, but did")
			}

			// one more time for good measure
			copy(c.aes.EncryptionKey[:], originalKey[:])
			gotPlainText, err = c.aes.Decrypt(cipherText)
			if err != nil {
				t.Fatal(err)
			}

			if !bytes.Equal(gotPlainText, c.plainText) {
				t.Errorf("got %q plainText; want %q", gotPlainText, c.plainText)
			}
		})
	}
}

func createRandomEncryptionKey() (encryptionKey [32]byte, err error) {
	randomKey := make([]byte, 32)
	_, err = rand.Read(randomKey)
	if err != nil {
		return
	}

	copy(encryptionKey[:], randomKey)
	return
}
