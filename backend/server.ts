declare module 'express-session' {
    export interface SessionData {
        user: { [key: string]: any };
    }
}
import cors from 'cors'
import io from 'socket.io'
import { SocketController } from './controllers'
import { inMemorySocketRepository } from './infrastructure'
import { Message, MessageI } from './entities/Message'
import session from 'express-session'
import express from 'express'
import cookieParser from 'cookie-parser'
import sharedSession from 'express-socket.io-session'
import connectPgSession from 'connect-pg-simple'
import PostgresStore from './PostgresStore'
import { hasToBeAuthenticated, mustNotBeAuthenticated } from './middlewares'
import User from './entities/User'
import UserChannel from './entities/UserChannel'
import { Channel, ChannelI } from './entities/Channel'

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
    origin: 'http://localhost:8080'
}))
app.use(express.urlencoded())
app.use(express.json());
const socket: io.Server = io(server, { origins: '*:*' })

socket.use(sharedSession(sessionMiddleware, { autoSave: true }));

const socketController: SocketController = new SocketController(new inMemorySocketRepository())

socket.on('connection', async (client: io.Socket) => {
    socketController.onConnection(client)

    if (client.handshake.session?.user) {
        let currentUser = client.handshake.session.user
        // on recupere la liste des channels du client
        let userChannels = await UserChannel.findByUserId(currentUser.id)
        // le client rejoint tous les channels où il etait precedemment
        let previousRoom = null
        for (let channel of userChannels) {
            if (previousRoom != `${channel.channel_name}:${channel.channel_author_id}`) {
                client.join(`${channel.channel_name}:${channel.channel_author_id}`)
                previousRoom = `${channel.channel_name}:${channel.channel_author_id}`
            }

        }

        client.emit('channelsList', userChannels)
    }
    client.on('message', async (data: MessageI) => {

        let channel = data.channel
        let message = data.content

        // recuperer le channel où le msg est sur le point d'être envoyé
        let currentChannelId = await Channel.findByNameAndAuthor(channel.name.substring(0, channel.name.indexOf(':')), channel.author);
        let currentChannel = await UserChannel.findByUserIdAndChannelId(client.handshake.session?.user?.id, currentChannelId.id)
        // tester si on est bien dans le channel 
        if (!currentChannel) {
            console.log('vous n"etes pas dans ce channel')
            return
        }
        channel.id = currentChannelId.id
        await Message.create(client.handshake.session?.user?.id, channel, message)
        socket.to(`${channel.name}`).emit('messageReceived', data)
    })
    client.on('createChannel', async (channelName: string) => {
        const userId = client.handshake.session?.user?.id
        let channelToCreate = await Channel.create(channelName, userId)
        await UserChannel.create(channelToCreate.id, userId)
        client.join(`${channelName}:${userId}`)

    })
    client.on('userIsTyping', async (channelName: string) => {
        client.to(channelName).emit('userIsTyping', { channelName, user: client.handshake.session?.user })
    })
    client.on('userIsNotTypingAnymore', async (channelName: string) => {
        client.to(channelName).emit('userIsNotTypingAnymore', { channelName, user: client.handshake.session?.user })

    })

    client.on('disconnect', () => {
        console.log('client is disconnected')
    })
})

app.post('/register', mustNotBeAuthenticated, async function (req, res) {

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
    let user = await User.create(req.body)
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
    res.json({ message: 'disconnected' })
})

app.post('/channel', hasToBeAuthenticated, async function (req, res) {

    let channelToCreate = await Channel.create(req.body.name, req.session.user?.id)
    await UserChannel.create(channelToCreate.id, req.session.user?.id)
    res.json(channelToCreate)
})
app.delete('/channel', async function (req, res) {
    if (!req.body.name) {
        res.status(401)
        res.send({
            message: 'no channel provided'
        })
        return
    }
    let channelToDelete = await Channel.findByNameAndAuthor(req.body.name, req.session.user?.id)
    if (!channelToDelete) {
        res.status(401)
        res.send({
            message: 'you must provide a valid channel'
        })
        return
    }
    await Channel.deleteById(channelToDelete.id)
    res.send('channel deleted')
})

app.get('/me', hasToBeAuthenticated, function (req, res) {

    res.json(req.session.user)
})