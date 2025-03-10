import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebsocketUserToUserChatService {
  private socket: WebSocket | null = null;
  private messagesSubject = new Subject<any>();
  public messages$ = this.messagesSubject.asObservable();
  private actionQueue: any[] = [];

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  connect(token: string, senderType: string): void {
    if (!token || !senderType) {
      console.error('Token and senderType are required to establish a WebSocket connection.');
      return;
    }

    this.socket = new WebSocket(
      `ws://localhost:4000/ws/chat?token=${token}&senderType=${senderType}`
    );

    this.socket.onopen = this.handleOpen.bind(this);
    this.socket.onmessage = this.handleMessage.bind(this);
    this.socket.onerror = this.handleError.bind(this);
    this.socket.onclose = this.handleClose.bind(this);
  }

  private handleOpen(): void {
    console.log('WebSocket (User to User) connection established.');
    while (this.actionQueue.length > 0) {
      const action = this.actionQueue.shift();
      this.socket?.send(JSON.stringify(action));
    }
  }

  private handleMessage(event: MessageEvent): void {
    const data = JSON.parse(event.data);

    if (data.status === 'success') {
      this.messagesSubject.next(data);
    } else {
      console.error('Error from user-to-user server:', data.error);
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error (User to User):', error);
  }

  private handleClose(event: CloseEvent): void {
    console.log(
      `WebSocket (User to User) connection closed: Code ${event.code}, Reason: ${event.reason}`
    );
  }

  sendMessage(message: { recipientId: string; message: string }): void {
    this.sendAction({ action: 'sendMessage', ...message });
  }

  getMessages(recipientId: string): void {
    this.sendAction({ action: 'getMessages', recipientId });
  }

  private sendAction(payload: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      console.warn('WebSocket not open. Queuing action:', payload);
      this.actionQueue.push(payload);
    }
  }

  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
