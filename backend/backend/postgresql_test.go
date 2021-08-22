package backend

import (
	"context"
	"database/sql"
	"fmt"
	"testing"

	_ "github.com/lib/pq"
	"gopkg.in/DATA-DOG/go-sqlmock.v2"
)

func TestRegisterUser(t *testing.T) {
	for _, tt := range []struct {
		name  string
		email string
	}{
		{
			name:  "inserts a new user",
			email: "a@b.com",
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			p, mock, err := mockConnection()
			if err != nil {
				t.Fatal(err)
			}

			defer p.DB.Close()

			rows1 := sqlmock.NewRows([]string{"email"}).AddRow(tt.email)
			mock.ExpectExec(fmt.Sprintf("INSERT INTO %s", userTable)).WithArgs(tt.email).WillReturnResult(sqlmock.NewResult(1, 1))
			mock.ExpectQuery(fmt.Sprintf("SELECT email FROM %s", userTable)).WithArgs(tt.email).WillReturnRows(rows1)

			if err := p.registerUser(context.Background(), tt.email); err != nil {
				t.Fatal(err)
			}

			var got1 string
			if err = p.DB.QueryRow(fmt.Sprintf(`SELECT email FROM %s WHERE email=$1`, userTable), tt.email).Scan(&got1); err != nil {
				t.Fatal(err)
			}

			if got1 != tt.email {
				t.Fatalf("got %+v, want %+v", got1, tt.email)
			}

			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}
func TestSetup(t *testing.T) {
	p, mock, err := mockConnection()
	if err != nil {
		t.Fatal(err)
	}

	defer p.DB.Close()

	mock.ExpectExec(fmt.Sprintf("CREATE TABLE IF NOT EXISTS %s", userTable)).WillReturnResult(sqlmock.NewResult(1, 1))
	if err = p.Setup(); err != nil {
		t.Fatal(err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func mockConnection() (p *PostgreSQL, mock sqlmock.Sqlmock, err error) {
	var db *sql.DB
	db, mock, err = sqlmock.New()
	if err != nil {
		return
	}

	p = &PostgreSQL{
		DB: db,
	}

	return
}
