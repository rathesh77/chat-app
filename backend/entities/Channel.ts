import User from './User'
import PostgresStore from '../PostgresStore'

export interface ChannelI {
    id: string,
    name: string,
    author: string,
}
export class Channel {
    


    static tableName: string

    static toSQLTable(): string {
        return `
            CREATE TABLE ${Channel.tableName} (
                id SERIAL PRIMARY KEY,
                name TEXT,
                author INTEGER REFERENCES ${User.tableName}(id) ON DELETE CASCADE
            )
        `
    }

    static async findByNameAndAuthor(channelName: String, id: any): Promise<ChannelI> {
        const result = await PostgresStore.pgPool.query({
            text: `SELECT * from ${Channel.tableName} 
                    where name = $1
                    and author = $2
                   `,
            values: [
                channelName, id
            ]
        })
        return result.rows[0]
    }
    static async findById(channelId: String): Promise<ChannelI> {
        const result = await PostgresStore.pgPool.query({
            text: `SELECT * from ${Channel.tableName} 
                    where id = $1
                   `,
            values: [
                channelId
            ]
        })
        return result.rows[0]
    }
    static async deleteById(channelId: any) {
        await PostgresStore.pgPool.query({
            text: `DELETE  from ${Channel.tableName} 
                    where id=$1
                   `,
            values: [
                channelId
            ]
        })
    }
    static async create(channelName: String, userId: any) {
        const result = await PostgresStore.pgPool.query({
            text: `INSERT INTO ${Channel.tableName} 
                    (name,author) values($1,$2)
                    RETURNING *
                   `,
            values: [
                channelName, userId
            ]
        })
        return result.rows[0]
    }
}

Channel.tableName = 'Channel'
