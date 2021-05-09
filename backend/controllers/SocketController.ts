import { MessageI } from '../entities/Message'
import io from 'socket.io'
import { SocketRepository } from '../repositories'

export class SocketController {
    socketRepository: SocketRepository
    constructor(socketRepository: SocketRepository) {
        this.socketRepository = socketRepository
    }
    onConnection(socket: io.Socket): void {
        this.socketRepository.onConnection(socket)
    }
    broadcastMessage(data: MessageI): void {
        this.socketRepository.broadcastMessage(data)
    }
    noticeThatAUserIsTyping(clientId: string, fullname: string): void {
        this.socketRepository.noticeThatAUserIsTyping(clientId, fullname)
    }
    noticeThatAUserIsNotTypingAnymore(clientId: string): void {
        this.socketRepository.noticeThatAUserIsNotTypingAnymore(clientId)
    }
}