declare module 'express-session' {
    export interface SessionData {
        user: { [key: string]: any };
    }
}
import cors from 'cors'
import io from 'socket.io'
import { SocketController } from './controllers'
import { inMemorySocketRepository } from './infrastructure'
import { MessageI } from './entities/Message'
import session from 'express-session'
import express from 'express'
import cookieParser from 'cookie-parser'
import sharedSession from 'express-socket.io-session'
import connectPgSession from 'connect-pg-simple'
import PostgresStore from './PostgresStore'
import { hasToBeAuthenticated, mustNotBeAuthenticated } from './middlewares'
import User from './entities/User'
import UserChannel from './entities/UserChannel'
import Channel from './entities/Channel'

let app = express()

PostgresStore.init()

let sessionMiddleware = session({
    store: new (connectPgSession(session))({
        pool: PostgresStore.pgPool,
        tableName: 'session'
    }),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
});


const server = app.listen(3000, function () {
    console.log('server is listening on port 3000');
})
app.use(sessionMiddleware)
app.use(cookieParser())
app.use(cors({
    credentials: true,
    origin: 'http://localhost:8080' // si votre port est différent, changez cette valeur !
}))
app.use(express.urlencoded())
app.use(express.json());
const socket: io.Server = io(server, { origins: '*:*' })

socket.use(sharedSession(sessionMiddleware, { autoSave: true }));

const socketController: SocketController = new SocketController(new inMemorySocketRepository())

socket.on('connection', async (client: io.Socket) => {
    client.emit('sendId', client.id)
    socketController.onConnection(client)

    console.log(client.handshake.session);
    if (client.handshake.session?.user) {
        let currentUser = client.handshake.session.user
        // on recupere la liste des channels du client
        let userChannels = await UserChannel.findByUserId(currentUser.id)
        // le client rejoint tous les channels où il est
        for (let channel of userChannels) {
            client.join(`${channel.name}:${channel.author}`)
        }

    }
    client.on('message', async (data: MessageI) => {
        //client.handshake.session!.user = { user: "rathesh" }
        //console.log(client.handshake.session?.user);

        //console.log(client.handshake.session?.user);
        //console.log(client.request.headers.cookie);
        //client.handshake.session?.save()
        console.log(client.handshake.session?.id);

        socketController.broadcastMessage(data)
    })
    client.on('signal', async (fullName: string) => {
        socketController.noticeThatAUserIsTyping(client.id, fullName)
    })
    client.on('userIsNotTypingAnymore', async () => {
        socketController.noticeThatAUserIsNotTypingAnymore(client.id)
    })
    client.on('deleteChannel', async (channelName: String) => {
        let channelToDelete = await Channel.findByNameAndAuthor(channelName, client.handshake.session?.user?.id)
        if (channelToDelete) {
            await Channel.deleteById(channelToDelete.id)
        }
    })
    client.on('disconnect', () => {
        console.log('client is disconnected')
    })
})

/*
app.get("/", function (req, res) {
      if (!req.session.user)
          req.session.user = { 'user': 'rathesh' }
      else
          console.log("session already exists");
  
    //console.log(req.session);
    //res.send('hello')
});*/

app.post('/register', mustNotBeAuthenticated, async function (req, res) {
    console.log(req.body);

    if (!req.body || !req.body.email || !req.body.password || !req.body.name) {
        res.status(403)
        res.send({
            message: 'you must provide valid email, password and name'
        })
        return
    }
    let userExists = await User.findByEmail(req.body.email)

    if (userExists != null) {
        res.status(403)
        res.send({
            message: 'this email is already used'
        })
        return
    }
    let user = req.body
    User.create(user)
    delete user.password
    req.session.user = user
    res.json(user)
})

app.post('/login', mustNotBeAuthenticated, async function (req, res) {
    if (!req.body || !req.body.email || !req.body.password) {
        res.status(403)
        res.send({
            message: 'you must provide valid email and password'
        })
        return
    }
    let userExists = await User.findByEmail(req.body.email)

    if (userExists == null || userExists.password != req.body.password) {
        res.status(403)
        res.send({
            message: 'invalid credentials'
        })
        return
    }
    let user = userExists
    delete user.password
    req.session.user = user
    res.json(user)
})

app.get('/logout', hasToBeAuthenticated, function (req, res) {
    req.session.destroy(() => { })
    res.json({ message: 'Déconnecté' })
})

app.get('/channels', hasToBeAuthenticated, async function (req, res) {

    let userChannels = await UserChannel.findByUserId(req.session?.user?.id)
    for (let channel of userChannels) {
        console.log(channel);

    }
    res.send("channels")
})