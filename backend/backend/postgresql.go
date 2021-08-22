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

func (p *PostgreSQL) registerUser(ctx context.Context, email string) (err error) {
	_, err = p.DB.ExecContext(ctx, fmt.Sprintf(`INSERT INTO %s (email, registered, last_seen) VALUES ($1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT (email) DO UPDATE set last_seen=CURRENT_TIMESTAMP`, userTable), email)
	return
}

// Setup creates our tables
func (p *PostgreSQL) Setup() (err error) {
	stmt := fmt.Sprintf(`CREATE TABLE IF NOT EXISTS %s (pk serial PRIMARY KEY, email TEXT NOT NULL, registered TIMESTAMP WITH TIME ZONE, last_seen TIMESTAMP WITH TIME ZONE, UNIQUE(email))`, userTable)
	_, err = p.DB.Exec(stmt)

	for _, idx := range []string{"registered", "last_seen"} {
		stmt = fmt.Sprintf(`CREATE INDEX IF NOT EXISTS %s_%s_idx ON %s (%s)`, userTable, idx, userTable, idx)
		_, err = p.DB.Exec(stmt)
		if err != nil {
			return err
		}
	}

	return
}
