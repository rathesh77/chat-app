import PostgresStore from '../PostgresStore'
import User from './User'
import { Channel } from './Channel'
import { Message } from './Message'
class UserChannel {


    static tableName: string

    static toSQLTable(): string {
        return `
            CREATE TABLE ${UserChannel.tableName} (
                id SERIAL PRIMARY KEY,
                id_user INTEGER REFERENCES ${User.tableName}(id) ON DELETE CASCADE,
                id_channel INTEGER REFERENCES ${Channel.tableName}(id) ON DELETE CASCADE,
                UNIQUE (id_user, id_channel)
            )
        `
    }
    static async create(channelId: String, userId: String) {

        const result = await PostgresStore.pgPool.query({
            text: `INSERT INTO ${UserChannel.tableName}
                    (id_user, id_channel)
                    VALUES ($1, $2) RETURNING *`,
            values: [
                userId, channelId
            ]
        })
        return result.rows[0]
    }

    // recuperer tous les messages dans les channels où l'utilisateur se trouve
    static async findByUserId(clientId: Number) {
        const result = await PostgresStore.pgPool.query({
            text: /*`SELECT c.name, c.author FROM ${UserChannel.tableName} as us INNER JOIN ${Channel.tableName} as c
                   ON us.id_channel = c.id
                   and us.id_user = $1
                `*/
                `SELECT c.id as channel_id, c.name, c.author as channel_author,u.name as  message_author_name , m.content, m.id_client as message_author

                    FROM ${UserChannel.tableName} as uc 
                    LEFT JOIN ${Channel.tableName} as c ON uc.id_channel = c.id
                    LEFT JOIN ${Message.tableName} as m on c.id = m.id_channel 
                    LEFT JOIN ${User.tableName} as u on m.id_client = u.id
                    and uc.id_user = $1;
                   `,
            values: [
                clientId
            ]
        })
        return result.rows
    }

    static async findByUserIdAndChannelId(userId: any, channelId: string) {
        const result = await PostgresStore.pgPool.query({
            text: `SELECT * FROM ${UserChannel.tableName}
                    where id_user = $1 and id_channel = $2
                   `,
            values: [
                userId, channelId
            ]
        })
        return result.rows[0]
    }
}

UserChannel.tableName = 'UserChannel'

export default UserChannel