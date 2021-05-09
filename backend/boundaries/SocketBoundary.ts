import { Message } from "../entities/Message";
import io from 'socket.io'
export interface SocketBoundary {
    onConnection(socket: io.Socket): Promise<any>
    broadcastMessage(data: Message): Promise<any> // emit message to every other users
    noticeThatAUserIsTyping(clientId: string, fullname: string): Promise<any> // user is typing ....
    noticeThatAUserIsNotTypingAnymore(clientId: string): Promise<any>
}