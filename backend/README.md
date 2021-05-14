# chat-app backend

## Project setup
```
npm install
```

## Start the server (follow the next steps carefully)
### Create the tables in POSTGRES database

- There must be a POSTGRESQL database instance running before you run this server.
  - POSTGRES_USER=postgres
  - POSTGRES_PASSWORD=superaccount
  - POSTGRES_DB=bdd
- run the initDb.ts file using the command `ts-node initDb.ts`

### Run the server
`npm start`
