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
                `SELECT 
                subquery.channel_id as channel_id, 
                subquery.channel_name, 
                subquery.channel_author  as channel_author_id, 
                u.name as message_author_name, 
                m.content, 
                m.id_client as message_author_id,
                m.creation_date
              FROM 
                (
                  select 
                    c2.id as channel_id, 
                    c2.name as channel_name, 
                    c2.author as channel_author 
                  from 
                    ${User.tableName} as u2 
                    INNER JOIN ${UserChannel.tableName} as uc2 on uc2.id_user = u2.id 
                    INNER JOIN ${Channel.tableName} as c2 on c2.id = uc2.id_channel 
                    and u2.id = $1
                ) as subquery 
                LEFT OUTER JOIN ${Message.tableName} as m on subquery.channel_id = m.id_channel 
                LEFT OUTER JOIN ${User.tableName} as u on m.id_client = u.id 
                ORDER BY m.creation_date asc
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