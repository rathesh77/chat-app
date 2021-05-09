import { SocketBoundary } from '../boundaries'
import { Message } from '../entities/Message'
import { SocketRepository } from '../repositories'
import io from 'socket.io'

export class SocketInteractor implements SocketBoundary {

    socketRepository: SocketRepository
    constructor(socketRepository: SocketRepository) {
        this.socketRepository = socketRepository
    }
    async onConnection(socket: io.Socket) {
        return await this.socketRepository.onConnection(socket)
    }
    async broadcastMessage(data: Message): Promise<any> {
        return await this.socketRepository.broadcastMessage(data)
    }
    async noticeThatAUserIsTyping(clientId: string, fullname: string): Promise<any> {
        return await this.socketRepository.noticeThatAUserIsTyping(clientId, fullname)
    }
    async noticeThatAUserIsNotTypingAnymore(clientId: string): Promise<any> {
        return await this.socketRepository.noticeThatAUserIsNotTypingAnymore(clientId)
    }
}
