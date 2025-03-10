import { Notification } from './../services/notification.service';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { Component ,ElementRef, HostListener, ViewChild } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../auth.service';
import { SharedService } from '../../services/sharedservice.service';

import { OnInit } from '@angular/core';
import { MessageNotificationService } from '../../services/messsage-notification.service';
import { NotificationService } from '../../services/notification.service';

interface ChatMessage {
  senderType: string;
  content: string;
  timestamp: string;
}

@Component({
  selector: 'app-communications',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, SidenavComponent, NavbarComponent],
  templateUrl: './communications.component.html',
  styleUrl: './communications.component.css'
})
export class CommunicationsComponent {
  isNavOpen = true;

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  showContacts = false;
  isLargeScreen = false;
  contacts: { user_id: number; username: string }[] = [];
  selectedContact: { user_id: number; username: string } | null = null;
  messages: { senderType: string; content: string; timestamp: string }[] = [];
  newMessage = '';
  hasNewMessage = false;

  constructor(

    private websocketService: WebsocketService,
    private authService: AuthService,
    private messageNotificationService: MessageNotificationService,
    private notificationService: NotificationService
  ) {
    this.checkScreenSize();
  }

  /**
   * Lifecycle hook to initialize the component.
   * Establishes a WebSocket connection if a token is available.
   */
  ngOnInit(): void {
    const token = this.authService.getToken();
    const senderType = 'admin';

    if (token) {
      this.initializeWebSocket(token, senderType);
    } else {
      console.error('Unable to connect: No token found.');
    }
  }

  

  /**
   * Lifecycle hook to handle actions after the view has been checked.
   * Scrolls the chat container to the bottom if a contact is selected.
   */
  ngAfterViewChecked(): void {
    if (this.selectedContact) {
      this.scrollToBottom();
    }
  }

  /**
   * Initializes the WebSocket connection and subscribes to incoming messages.
   * @param token - The authentication token for the WebSocket connection.
   * @param senderType - The type of the sender (e.g., 'user').
   */
  private initializeWebSocket(token: string, senderType: string): void {
    this.websocketService.connect(token, senderType);
    this.websocketService.messages$.subscribe((data) =>
      this.handleWebSocketData(data)
    );
  }

  /**
   * Handles incoming WebSocket data, including contacts, message history, and real-time messages.
   * @param data - The data received from the WebSocket server.
   */
  private handleWebSocketData(data: any): void {
    if (data.contacts) {
      this.updateContacts(data.contacts);
    } else if (data.messages && this.selectedContact) {
      this.updateMessageHistory(data.messages);
    } else if (data.message) {
      this.processRealTimeMessage(data.message);
    }
  }

  /**
   * Updates the list of contacts.
   * @param contacts - The contacts received from the WebSocket server.
   */
  private updateContacts(contacts: { user_id: number; username: string }[]): void {
    this.contacts = contacts;
  }

  /**
   * Updates the message history for the selected contact.
   * @param messages - The messages received from the WebSocket server.
   */
  private updateMessageHistory(messages: any[]): void {
    this.messages = messages.map((msg) => ({
      senderType: msg.sender_type,
      content: msg.message,
      timestamp: new Date(msg.created_at).toLocaleString(),
    }));
    this.scrollToBottom();
  }

  /**
   * Processes a real-time message received from the WebSocket server.
   * @param message - The real-time message object.
   */
  private processRealTimeMessage(message: any): void {
    const newMessage = {
      senderType: message.sender_type,
      content: message.message,
      timestamp: new Date(message.created_at).toLocaleString(),
    };

    if (
      this.selectedContact && 
      (this.isMessageRelevantToSelectedContact(message) || message.sender_type === 'admin')
    ) {
      this.messages = [...this.messages, newMessage];
      setTimeout(() => this.scrollToBottom(), 0);
    } else if (message.sender_user_id) {
      if (message.sender_type === 'user' && !message.recipient_admin_id) {
        this.notificationService.playNotificationSound();
      }
      this.messageNotificationService.setUnreadMessage(message.sender_user_id, true);
    }
  }
  hasUnreadMessage(userId: number): boolean {
    return this.messageNotificationService.hasUnreadMessage(userId);
  }
  /**
   * Checks if a message is relevant to the currently selected contact.
   * @param message - The message object to check.
   * @returns True if the message is relevant, false otherwise.
   */
  private isMessageRelevantToSelectedContact(message: any) {
    return (
      this.selectedContact &&
      (message.recipient_user_id === this.selectedContact.user_id ||
        message.sender_user_id === this.selectedContact.user_id)
    );
  }

  /**
   * Sends a new message to the selected contact through the WebSocket service.
   */
  sendMessage(): void {
    if (this.newMessage.trim() && this.selectedContact) {
      this.websocketService.sendMessage({
        recipientId: this.selectedContact.user_id.toString(),
        recipientType: 'user',
        message: this.newMessage,
      });

      this.newMessage = '';
    } else {
      console.error('No message or contact selected.');
    }
  }

  /**
   * Toggles the visibility of the contacts list.
   */
  toggleContacts(): void {
    this.showContacts = !this.showContacts;
  }

  /**
   * Selects a contact and fetches the chat history for the selected contact.
   * @param contact - The contact to select.
   */
  selectContact(contact: { user_id: number; username: string }): void {
    this.selectedContact = contact;
    this.websocketService.getMessages(contact.user_id);
    // Clear notification when selecting contact
    this.messageNotificationService.clearUnreadMessage(contact.user_id);
    setTimeout(() => this.scrollToBottom(), 0);
  }

  /**
   * Checks the screen size and adjusts the visibility of the contacts list accordingly.
   */
  @HostListener('window:resize', [])
  checkScreenSize(): void {
    this.isLargeScreen = window.innerWidth >= 1024;
    this.showContacts = this.isLargeScreen;
  }

  /**
   * Scrolls the messages container to the bottom.
   */
  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  /**
   * Extracts the initials from a given name.
   * @param name - The full name to extract initials from.
   * @returns A string containing the initials.
   */
  getInitials(username: string): string {
    if (!username) return '';
    const words = username.split(' ');
    return words
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 1);
  }


}