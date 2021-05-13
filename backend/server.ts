declare module 'express-session' {
    export interface SessionData {
        user: { [key: string]: any };
    }
}
import cors from 'cors'
import io from 'socket.io'
import { Message, MessageI } from './entities/Message'
import session from 'express-session'
import express from 'express'
import cookieParser from 'cookie-parser'
import sharedSession from 'express-socket.io-session'
import connectPgSession from 'connect-pg-simple'
import PostgresStore from './PostgresStore'
import User from './entities/User'
import UserChannel from './entities/UserChannel'
import { Channel, ChannelI } from './entities/Channel'

import {authRouter, channelRouter, invitationRouter} from './routes'
let app = express()

PostgresStore.init()

let sessionMiddleware = session({
    store: new (connectPgSession(session))({
        pool: PostgresStore.pgPool,
        tableName: 'session'
    }),
    secret: 'jT6aR1yH3iE9lE9 gD2bF0',
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
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use('/', authRouter)
app.use('/', channelRouter)
app.use('/', invitationRouter)

const socket: io.Server = io(server, { origins: 'http://localhost:8080' })

socket.use(sharedSession(sessionMiddleware, { autoSave: true }));
socket.use((socket, next) => {
    if (socket.handshake.session?.user) {
      next();
    } else {
      next(new Error("You must be authenticated"));
    }
  });

socket.on('connection', async (client: io.Socket) => {
    console.log("A new client is connected", client.id)

    if (client.handshake.session?.user) {
        let currentUser = client.handshake.session.user
        // on recupere la liste des channels du client
        let userChannels = await UserChannel.findByUserId(currentUser.id)
        // le client rejoint tous les channels où il etait precedemment
        let previousRoom = null
        for (let channel of userChannels) {
            let members = await UserChannel.findMembersByChannelId(channel.channel_id)
            //console.log(members)
            channel.members = members
            const currentChannelName = `${channel.channel_name}:${channel.channel_author_id}`
            if (previousRoom != currentChannelName) {
                client.join(currentChannelName)
                previousRoom = currentChannelName
            }

        }
        console.log(userChannels)

        client.emit('channelsList', userChannels)
    }
    client.on('getChannelsAndMessages', async ()=>{
        let currentUser = client.handshake.session?.user
        // on recupere la liste des channels du client
        let userChannels = await UserChannel.findByUserId(currentUser?.id)
        // le client rejoint tous les channels où il etait precedemment
        let previousRoom = null
        for (let channel of userChannels) {
            let members = await UserChannel.findMembersByChannelId(channel.channel_id)
            //console.log(members)
            channel.members = members
            const currentChannelName = `${channel.channel_name}:${channel.channel_author_id}`
            if (previousRoom != currentChannelName) {
                client.join(currentChannelName)
                previousRoom = currentChannelName
            }

        }

        client.emit('channelsList', userChannels)
    })
    client.on('message', async (data: MessageI) => {

        let channel = data.channel
        let message = data.content

        // recuperer le channel où le msg est sur le point d'être envoyé
        let currentChannelId = await Channel.findByNameAndAuthor(channel.name.substring(0, channel.name.indexOf(':')), channel.author);
        let currentChannel = await UserChannel.findByUserIdAndChannelId(client.handshake.session?.user?.id, currentChannelId.id)
        // tester si on est bien dans le channel 
        if (!currentChannel) {
            console.log('You are not part of this channel')
            return
        }
        channel.id = currentChannelId.id
        await Message.create(client.handshake.session?.user?.id, channel, message)
        socket.to(`${channel.name}`).emit('messageReceived', data)
    })
    client.on('invitation', async (data: any) => {
        const {channelId, recipient}= data
        await UserChannel.create(channelId, (await User.findByEmail(recipient)).id)       
        //client.join(`${channelName}:${userId}`)
        socket.emit('invitation', data)

    })
    client.on('createChannel', async ({name}) => {
        const userId = client.handshake.session?.user?.id
        client.join(`${name}:${userId}`)
        let userChannels = await UserChannel.findByUserId(userId)
        client.emit('channelsList', userChannels)

    })
    client.on('leaveChannel', async (channel: any) => {
        const userId = client.handshake.session?.user?.id
        const {channelId, channelName, channelAuthor} = channel
        console.log(channelId, channelName, channelAuthor)
        console.log(channel)

        client.leave(`${channel.channelName}:${channelAuthor}`)
        let userChannels = await UserChannel.deleteByUserIdAndChannelId(userId, channelId)
        //client.emit('channelsList', userChannels)

    })
    client.on('acceptInvitation', async (channelId: string) => {
        const userId = client.handshake.session?.user?.id
        const userName = client.handshake.session?.user?.name
        let channelInvitedIn = await Channel.findById(channelId)
        const completeChannelName = `${channelInvitedIn.name}:${channelInvitedIn.author}`
        client.join(completeChannelName)
        client.to(completeChannelName).emit('newMemberJoined',{userName, completeChannelName})
        let userChannels = await UserChannel.findByUserId(userId)
        client.emit('channelsList', userChannels)

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