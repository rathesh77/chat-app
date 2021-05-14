
import {Channel, ChannelI} from './Channel'
import User from './User'
import PostgresStore from '../PostgresStore'

export interface MessageI {
    authorId: string,
    fullName: string,
    content: string,
    channel: ChannelI // name:authorId

}

export class Message {
    

    static tableName: string

    static toSQLTable(): string {
        return `
            CREATE TABLE ${Message.tableName} (
                id SERIAL PRIMARY KEY,
                content TEXT,
                id_channel INTEGER REFERENCES ${Channel.tableName}(id) ON DELETE CASCADE,
                id_client INTEGER REFERENCES ${User.tableName}(id) ON DELETE CASCADE,
                creation_date TIMESTAMPTZ
            )
        `
    }
    static async create(userId: string, channel: ChannelI, message: string) {
        const result = await PostgresStore.pgPool.query({
            text: `INSERT INTO ${Message.tableName} 
                    (content,id_channel,id_client, creation_date) values($1,$2,$3,$4)
                    RETURNING *
                   `,
            values: [
                message, channel.id, userId, new Date()
            ]
        })
        return result.rows[0]
    }
    static async findByChannelId(channelId: string) {
        
        const result = await PostgresStore.pgPool.query({
            text: `select content, id_client as "authorId", u.name as "authorName" from ${Message.tableName} as m 
                    INNER JOIN ${User.tableName} as u on u.id =  m.id_client
                    where id_channel = $1
                   `,
            values: [
                channelId
            ]
        })
        return result.rows
    }
}

Message.tableName = 'Message'

