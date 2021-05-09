import { MessageI } from '../../entities/Message'
import { SocketRepository } from '../../repositories'
import io, { Socket } from 'socket.io'
import { ChannelI } from '../../entities/Channel'

export class inMemorySocketRepository implements SocketRepository {

    membersTyping: any = {}

    clients: io.Socket[] = []

    onConnection(socket: io.Socket): void {
        this.clients.push(socket)
        console.log("A new client is connected", socket.id)

    }
    broadcastMessage(data: MessageI): void {
        this.clients.forEach((c) => {
            c.emit('messageReceived', data)
        })

    }
    noticeThatAUserIsTyping(client: Socket, fullname: string, channel: ChannelI): void {
        if (!this.membersTyping[channel.name])
            this.membersTyping[channel.name] = {}
        this.membersTyping[channel.name][client.id] = { id: client.id, fullName: fullname }
        /*this.clients.forEach((c) => {
            if (c.id != clientId)
                c.emit('receiveSignal', this.membersTyping)
        })*/
        client.to(channel.name).emit('receiveSignal', this.membersTyping)

    }
    noticeThatAUserIsNotTypingAnymore(client: Socket, channel: ChannelI): void {
        if (!this.membersTyping[channel.name])
            this.membersTyping[channel.name] = {}
        delete this.membersTyping[channel.name][client.id]
        /*
            this.clients.forEach((c) => {
                if (c.id != clientId)
                    c.emit('receiveSignal', this.membersTyping)
            })*/
        client.to(channel.name).emit('receiveSignal', this.membersTyping)

    }


}