import PostgresStore from '../PostgresStore'

class Session {


    static toSQLTable(): string {
        return `
        CREATE TABLE "session" (
            "sid" varchar NOT NULL COLLATE "default",
              "sess" json NOT NULL,
              "expire" timestamp(6) NOT NULL
          )
          WITH (OIDS=FALSE);
          
          ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
          
          CREATE INDEX "IDX_session_expire" ON "session" ("expire");
        `
    }

    static async findByEmail(recipient: string) {
        const result = await PostgresStore.pgPool.query({
            text: `
       SELECT sid from session where sess::text like $1

       `, values: [`%"email":"${recipient}"%`]
        })
        return result.rows[0]
    }
}


export default Session