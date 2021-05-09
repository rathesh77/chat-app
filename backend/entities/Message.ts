
import {Channel, ChannelI} from './Channel'
import User from './User'
import PostgresStore from '../PostgresStore'

export interface MessageI {
    id: string,
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
                id_channel INTEGER REFERENCES ${Channel.tableName}(id),
                id_client INTEGER REFERENCES ${User.tableName}(id)
            )
        `
    }
    static async create(userId: string, channel: ChannelI, message: string) {
        const result = await PostgresStore.pgPool.query({
            text: `INSERT INTO ${Message.tableName} 
                    (content,id_channel,id_client) values($1,$2,$3)
                    RETURNING *
                   `,
            values: [
                message, channel.id, userId
            ]
        })
        return result.rows[0]
    }
}

Message.tableName = 'Message'

