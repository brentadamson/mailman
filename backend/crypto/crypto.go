package crypto

// Encryptor is a function that encrypts data
type Encryptor func(plaintext []byte) (ciphertext []byte, err error)

// Decryptor is a function that decrypts data
type Decryptor func(ciphertext []byte) (plaintext []byte, err error)
