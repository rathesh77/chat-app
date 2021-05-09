import { MessageI } from "../entities/Message";
import io from 'socket.io'
export interface SocketRepository {
    onConnection(socket: io.Socket): void;
    broadcastMessage(data: MessageI): void; // emit message to every other users
    noticeThatAUserIsTyping(clientId: string, fullname: string): void; // user is typing ....
    noticeThatAUserIsNotTypingAnymore(clientId: string): void;
}