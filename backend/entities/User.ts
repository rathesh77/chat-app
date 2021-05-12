import PostgresStore from '../PostgresStore'
import bcrypt from 'bcrypt'

class User {
    static tableName: string

    static toSQLTable(): string {
        return `
            CREATE TABLE ${User.tableName} (
                id SERIAL PRIMARY KEY,
                name TEXT,
                email TEXT,
                password TEXT
            )
        `
    }
    static async create(client: any) {
        const hashedPw = await bcrypt.hash(client.password,10)
        const result = await PostgresStore.pgPool.query({
            text: `INSERT INTO ${User.tableName}
                    (name, email, password)
                    VALUES ($1, $2, $3) RETURNING *`,
            values: [
                client.name, client.email, hashedPw
            ]
        })
        return result.rows[0]
    }
    static async findByEmail(email: String) {

        const result = await PostgresStore.pgPool.query({
            text: `SELECT * FROM ${User.tableName}
            WHERE email=$1`,
            values : [email]
        })
        return result.rows[0]
    }

}

User.tableName = 'User1'

export default User