import PostgresStore from './PostgresStore'
import Session from './entities/Session'
import User from './entities/User'
import {Channel} from './entities/Channel'
import { Message } from './entities/Message'
import UserChannel from './entities/UserChannel'

async function dropTables() {
    const result = await PostgresStore.pgPool.query(
        `select 'drop table if exists "' || tablename || '" cascade;' AS query
        from pg_tables where schemaname = 'public';`
    )

    for (const row of result.rows) {
        await PostgresStore.pgPool.query(row.query)
    }
}

async function createTables() {
    for (let table of [Session, User, Channel, UserChannel, Message])
        await PostgresStore.pgPool.query(table.toSQLTable())
}

async function main() {

    PostgresStore.init()
    console.log('connected to pg server');
    await dropTables()
    console.log('tables deleted')
    await createTables()
    console.log('tables created')
    await PostgresStore.pgPool.end()
    console.log('connection to pg ended')
}

main()