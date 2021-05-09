import pg from 'pg'
import config from './server.config'

class PostgresStore {
    pgPool !: pg.Pool
    init() {
        this.pgPool = new pg.Pool({
            ...config.postgres,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        })

        this.pgPool.connect((err, client, release) => {
            if (err) {
                return console.error('Error acquiring client', err.stack)
            }
            client.query('SELECT NOW()', (err, result) => {
                release()
                if (err) {
                    return console.error('Error executing query', err.stack)
                }
                console.log(result.rows)
            })
        })
    }

}

export default new PostgresStore()