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
        let previousRoom = null
        for (let channel of userChannels) {
            if ( previousRoom != `${channel.name}:${channel.channel_author}`){
                client.join(`${channel.name}:${channel.channel_author}`)
                previousRoom = `${channel.name}:${channel.channel_author}`
            }

        }
        console.log(userChannels);
        
        client.emit('channelsList', userChannels)
    }
    client.on('message', async (data: MessageI) => {
        //client.handshake.session!.user = { user: "rathesh" }
        //console.log(client.handshake.session?.user);

        //console.log(client.handshake.session?.user);
        //console.log(client.request.headers.cookie);
        //client.handshake.session?.save()

        let channel = data.channel
        let message = data.content
        console.log(channel);
        
        // recuperer le channel où le msg est sur le point d'être envoyé
        let currentChannel = await UserChannel.findByUserIdAndChannelId(client.handshake.session?.user?.id, channel.name.substring(channel.name.indexOf(':') + 1))
        // tester si on est bien dans le channel 
        if (!currentChannel) {
            console.log('vous n"etes pas dans ce channel')
            return
        }
        let currentChannelId= await Channel.findByNameAndAuthor(channel.name.substring(0, channel.name.indexOf(':')), channel.author);
        console.log(currentChannelId);
        
        channel.id = currentChannelId.id
        //socketController.broadcastMessage(data)
        await Message.create(client.handshake.session?.user?.id, channel, message)
        socket.to(`${channel.name}`).emit('messageReceived', data)
    })
    client.on('createChannel', async (channelName: string) => {
        //socketController.noticeThatAUserIsTyping(client, client.handshake.session?.user?.name, channel)
        const userId = client.handshake.session?.user?.id
        let channelToCreate = await Channel.create(channelName, userId)
       let response =  await UserChannel.create(channelToCreate.id, userId)
        client.join(`${channelName}:${userId}`)

    })
    client.on('signal', async (channel: ChannelI) => {
        socketController.noticeThatAUserIsTyping(client, client.handshake.session?.user?.name, channel)
    })
    client.on('userIsNotTypingAnymore', async (channel: ChannelI) => {
        socketController.noticeThatAUserIsNotTypingAnymore(client, channel)
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
    console.log(req.session);

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
app.get('/channels', hasToBeAuthenticated, async function (req, res) {

    let userChannels = await UserChannel.findByUserId(req.session?.user?.id)
    for (let channel of userChannels) {
        console.log(channel);

    }
    res.send("channels")
})

app.get('/me', hasToBeAuthenticated, function (req, res) {

    res.json(req.session.user)
})