import { MessageI } from '../entities/Message'
import io, { Socket } from 'socket.io'
import { SocketRepository } from '../repositories'
import { ChannelI } from '../entities/Channel'

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
    noticeThatAUserIsTyping(client: Socket, fullname: string, channel: ChannelI): void {
        this.socketRepository.noticeThatAUserIsTyping(client, fullname, channel)
    }
    noticeThatAUserIsNotTypingAnymore(client: Socket, channel: ChannelI): void {
        this.socketRepository.noticeThatAUserIsNotTypingAnymore(client, channel)
    }
}