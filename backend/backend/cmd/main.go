package main

import (
	"database/sql"
	"fmt"
	"mailman/backend"
	"mailman/log"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
	"github.com/spf13/viper"
)

func main() {
	v := viper.New()
	v.SetEnvPrefix("mailman")
	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.SetTypeByDefaultValue(true)
	setDefaults(v)

	db, err := sql.Open("postgres",
		fmt.Sprintf(
			"user=%s password=%s host=%s database=%s port=%s sslmode=disable",
			v.GetString("postgresql.user"),
			v.GetString("postgresql.password"),
			v.GetString("postgresql.host"),
			v.GetString("postgresql.database"),
			v.GetString("postgresql.port"),
		),
	)
	if err != nil {
		log.Info.Fatalln(err)
	}

	defer db.Close()
	db.SetMaxOpenConns(950) // Should be lower than that found in /etc/postgresql/12/main/postgresql.conf
	db.SetMaxIdleConns(1)   // Should always be less than or equal to MaxOpenConns

	cfg := &backend.Config{
		Backender: &backend.PostgreSQL{DB: db},
		Key:       v.GetString("key"),
	}

	if err := cfg.Backender.Setup(); err != nil {
		log.Info.Fatalf("unable to setup database: %v\n", err)
	}

	router := mux.NewRouter().StrictSlash(true)
	router.NewRoute().Name("register_user").Methods("POST").Path("/user/register").Handler(
		backend.AppHandler(cfg.RegisterUserHandler),
	)

	var port = v.GetString("port")
	if port == "" {
		port = "8000"
	}

	s := &http.Server{
		Addr:    fmt.Sprintf(":%s", port),
		Handler: http.TimeoutHandler(router, 30*time.Second, "Timeout"),
	}

	log.Info.Printf("Listening at http://127.0.0.1%v", s.Addr)
	log.Info.Fatal(s.ListenAndServe())
}

func setDefaults(v *viper.Viper) {
	v.SetDefault("port", 8000)
}
