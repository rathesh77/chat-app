import User from './User'
import PostgresStore from '../PostgresStore'

class Channel {


    static tableName: string

    static toSQLTable(): string {
        return `
            CREATE TABLE ${Channel.tableName} (
                id SERIAL PRIMARY KEY,
                name TEXT,
                author INTEGER REFERENCES ${User.tableName}(id)
            )
        `
    }

    static async findByNameAndAuthor(channelName: String, id: any) {
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
}

Channel.tableName = 'Channel'

export default Channel