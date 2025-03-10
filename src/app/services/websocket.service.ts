import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { NotificationService } from './notification.service';
import { MessageNotificationService } from './messsage-notification.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket | null = null;
  private messagesSubject = new Subject<any>();
  public messages$ = this.messagesSubject.asObservable();
  private actionQueue: any[] = [];

  constructor(private notificationService: NotificationService) {
    this.initializeWebSocketConnection();
  }

  private initializeWebSocketConnection(): void {
    const socket = new WebSocket('wss://your-websocket-server');

    socket.onmessage = (event) => {
      this.messagesSubject.next(event.data); // Pass message to observable
    };

    socket.onerror = (error) => console.error('WebSocket Error:', error);
    socket.onclose = () => console.log('WebSocket connection closed');
  }

  /**
   * 
   * @returns - flag indicating whether the socket is connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Establishes a WebSocket connection using the provided token and sender type.
   * @param token The authentication token.
   * @param senderType The type of the sender (e.g., user or vendor).
   */
  connect(token: string, senderType: string): void {
    if (!token || !senderType) {
      console.error(
        'Token and senderType are required to establish a WebSocket connection.'
      );
      return;
    }

    this.socket = new WebSocket(
      `ws://localhost:3000/ws/chat?token=${token}&senderType=${senderType}`
    );
    this.socket.onopen = this.handleOpen.bind(this);
    this.socket.onmessage = this.handleMessage.bind(this);
    this.socket.onerror = this.handleError.bind(this);
    this.socket.onclose = this.handleClose.bind(this);
  }

  /**
   * Handles the WebSocket onopen event.
   */
  private handleOpen(): void {
    console.log('WebSocket connection established.');
    this.getContacts();
    while (this.actionQueue.length > 0) {
      const action = this.actionQueue.shift();
      this.socket?.send(JSON.stringify(action));
    }
  }

  /**
   * Handles incoming WebSocket messages.
   * @param event The message event containing data from the server.
   */
  private handleMessage(event: MessageEvent): void {
    const data = JSON.parse(event.data);

    if (data.status === 'success') {
      this.messagesSubject.next(data);
      if (data.message) {
        const realTimeMessage = this.formatRealTimeMessage(data.message);
        console.log('New real-time message received:', realTimeMessage);
        console.log('Message history data:', data.message);
        
        this.notificationService.playNotificationSound();
      }
    } else {
      console.error('Error from server:', data.error);
    }
  }

  /**
   * Handles WebSocket errors.
   * @param error The error event.
   */
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
  }

  /**
   * Handles the WebSocket onclose event.
   * @param event The close event with details about the closure.
   */
  private handleClose(event: CloseEvent): void {
    console.log(
      `WebSocket connection closed: Code ${event.code}, Reason: ${event.reason}`
    );
  }

  /**
   * Formats a raw message into a structured real-time message object.
   * @param message The raw message from the server.
   * @returns A formatted real-time message object.
   */
  private formatRealTimeMessage(message: any): any {
    return {
      senderUserId: message.sender_user_id,
      senderAdminId: message.sender_admin_id,
      recipientUserId: message.recipient_user_id,
      recipientAdminId: message.recipient_admin_id,
      senderType: message.sender_type,
      content: message.message,
      timestamp: new Date(message.created_at).toLocaleString(),
    };
  }

  /**
   * Sends a message to the WebSocket server.
   * @param message The message object containing recipientId, recipientType, and message content.
   */
  sendMessage(message: {
    recipientId: string;
    recipientType: string;
    message: string;
  }): void {
    this.sendAction({ action: 'sendMessage', ...message });
  }

  /**
   * Requests the list of messages for a specific recipient.
   * @param recipientId The ID of the recipient whose messages are being fetched.
   */
  getMessages(recipientId: number): void {
    this.sendAction({
      action: 'getMessages',
      senderType: 'admin',
      recipientId,
      recipientType: 'user'
    });
  }

  /**
   * Requests the list of contacts from the WebSocket server.
   */
  getContacts(): void {
    this.sendAction({ action: 'getContacts' });
  }

  /**
   * Sends a general action to the WebSocket server.
   * @param payload The payload to be sent.
   */
  private sendAction(payload: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      console.warn('WebSocket not open. Queuing action:', payload);
      this.actionQueue.push(payload);
    }
  }

  /**
   * Closes the WebSocket connection.
   */
  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}