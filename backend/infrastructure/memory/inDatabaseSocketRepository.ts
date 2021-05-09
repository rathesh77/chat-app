import { Message } from '../../entities/Message'
import { SocketRepository } from '../../repositories'
import io from 'socket.io'

export class inDatabaseSocketRepository implements SocketRepository {
    onConnection(socket: io.Socket): void {
        throw new Error('Method not implemented.')
    }
    broadcastMessage(data: Message): void {
        throw new Error('Method not implemented.')
    }
    noticeThatAUserIsTyping(clientId: string, fullname: string): void {
        throw new Error('Method not implemented.')
    }
    noticeThatAUserIsNotTypingAnymore(clientId: string): void {
        throw new Error('Method not implemented.')
    }

}