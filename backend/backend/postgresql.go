package backend

import (
	"context"
	"database/sql"
	"fmt"
)

const (
	userTable = "users"
)

// PostgreSQL holds settings for a PostgreSQL database
type PostgreSQL struct {
	*sql.DB
}

func (p *PostgreSQL) upsertUser(ctx context.Context, email string) (err error) {
	_, err = p.DB.ExecContext(ctx, fmt.Sprintf(`INSERT INTO %s (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`, userTable), email)
	return
}

func (p *PostgreSQL) getTemplates(ctx context.Context, email string) (encryptedTemplates []byte, err error) {
	err = p.DB.QueryRowContext(ctx, fmt.Sprintf(`SELECT templates FROM %s WHERE email=$1 LIMIT 1`, userTable), email).Scan(&encryptedTemplates)
	switch err {
	case sql.ErrNoRows:
		err = errEmailAddressNotFound
	case nil:
	default:
	}

	return
}

func (p *PostgreSQL) saveTemplates(ctx context.Context, email string, encryptedTemplates []byte) (err error) {
	result, err := p.DB.ExecContext(ctx, fmt.Sprintf(`UPDATE %s SET templates=$1 WHERE email=$2`, userTable), encryptedTemplates, email)
	if err != nil {
		return
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return
	}

	if rows != 1 {
		err = errEmailAddressNotFound
	}

	return
}

// Setup creates our tables
func (p *PostgreSQL) Setup() (err error) {
	stmt := fmt.Sprintf(`CREATE TABLE IF NOT EXISTS %s (pk serial PRIMARY KEY, email TEXT NOT NULL, templates BYTEA, UNIQUE(email))`, userTable)
	_, err = p.DB.Exec(stmt)
	return
}
