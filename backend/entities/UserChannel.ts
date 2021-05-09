import PostgresStore from '../PostgresStore'
import User from './User'
import Channel from './Channel'
class UserChannel {

    static tableName: string

    static toSQLTable(): string {
        return `
            CREATE TABLE ${UserChannel.tableName} (
                id SERIAL PRIMARY KEY,
                id_user INTEGER REFERENCES ${User.tableName}(id) ON DELETE CASCADE,
                id_channel INTEGER REFERENCES ${Channel.tableName}(id) ON DELETE CASCADE
            )
        `
    }
    static async create(userChannel: any) {

        const result = await PostgresStore.pgPool.query({
            text: `INSERT INTO ${UserChannel.tableName}
                    (id_user, id_channel)
                    VALUES ($1, $2) RETURNING *`,
            values: [
                userChannel.user, userChannel.channel
            ]
        })
        return result.rows[0]
    }


    static async findByUserId(clientId: Number) {
        const result = await PostgresStore.pgPool.query({
            text: `SELECT c.name, c.author FROM ${UserChannel.tableName} as us INNER JOIN ${Channel.tableName} as c
                   ON us.id_channel = c.id
                   and us.id_user = $1
                   `,
            values: [
                clientId
            ]
        })
        return result.rows
    }

}

UserChannel.tableName = 'UserChannel'

export default UserChannel