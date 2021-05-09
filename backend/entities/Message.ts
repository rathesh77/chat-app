
import Channel from './Channel'
import User from './User'

export interface MessageI {
    id: string,
    fullName: string,
    content: string,

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
}

Message.tableName = 'Message'

