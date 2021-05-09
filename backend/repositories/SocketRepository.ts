import { MessageI } from "../entities/Message";
import io, { Socket } from 'socket.io'
import { ChannelI } from '../entities/Channel'

export interface SocketRepository {
    onConnection(socket: io.Socket): void;
    broadcastMessage(data: MessageI): void; // emit message to every other users
    noticeThatAUserIsTyping(client: Socket, fullname: string, channel: ChannelI): void; // user is typing ....
    noticeThatAUserIsNotTypingAnymore(client: Socket, channel: ChannelI): void;
}