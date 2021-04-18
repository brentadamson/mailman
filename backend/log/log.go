// Package log handles logging
package log

import (
	"io/ioutil"
	"log"
	"os"
)

// https://forum.golangbridge.org/t/whats-so-bad-about-the-stdlibs-log-package/1435
// https://dave.cheney.net/2015/11/05/lets-talk-about-logging
var (
	Info  *log.Logger
	Debug *log.Logger
)

func setDefaults() {
	Info = log.New(os.Stdout, "INFO ", log.Ldate|log.Ltime|log.Lshortfile)
	Debug = log.New(ioutil.Discard, "DEBUG ", log.Ldate|log.Ltime|log.Llongfile)
}

func init() {
	setDefaults()
}
