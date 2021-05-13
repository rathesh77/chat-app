import User from './User'
import PostgresStore from '../PostgresStore'
import { Channel } from './Channel'

export interface InvitationI {
    id: string,
    name: string,
    author: string,
}
export class Invitation {



    static tableName: string

    static toSQLTable(): string {
        return `
            CREATE TABLE ${Invitation.tableName} (
                id SERIAL PRIMARY KEY,
                id_user INTEGER REFERENCES ${User.tableName}(id) ON DELETE CASCADE,
                id_channel INTEGER REFERENCES ${Channel.tableName}(id) ON DELETE CASCADE
            )
        `
    }

    static async create(userId: any, channelId: String,) {
        const result = await PostgresStore.pgPool.query({
            text: `INSERT INTO ${Invitation.tableName} 
                    (id_user,id_channel) values($1,$2)
                    RETURNING *
                   `,
            values: [
                userId, channelId
            ]
        })
        return result.rows[0]
    }
}

Invitation.tableName = 'Invitation'
