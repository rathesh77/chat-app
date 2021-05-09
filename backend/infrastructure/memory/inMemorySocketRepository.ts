import { MessageI } from '../../entities/Message'
import { SocketRepository } from '../../repositories'
import io from 'socket.io'

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
    noticeThatAUserIsTyping(clientId: string, fullname: string): void {
        this.membersTyping[clientId] = { id: clientId, fullName: fullname }
        this.clients.forEach((c) => {
            if (c.id != clientId)
                c.emit('receiveSignal', this.membersTyping)
        })

    }
    noticeThatAUserIsNotTypingAnymore(clientId: string): void {
        delete this.membersTyping[clientId]

        this.clients.forEach((c) => {
            if (c.id != clientId)
                c.emit('receiveSignal', this.membersTyping)
        })

    }


}