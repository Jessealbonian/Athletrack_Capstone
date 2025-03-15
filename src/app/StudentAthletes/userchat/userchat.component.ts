import { MessageNotificationService } from './../../services/messsage-notification.service';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { WebsocketUserService } from '../../services/websocket-user.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { NotificationService } from '../../services/notification.service';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, SidenavComponent, NavbarComponent],
  templateUrl: './userchat.component.html',
  styleUrl: './userchat.component.css'
})
export class ChatComponent {
  isNavOpen = true;
  currentUserId: number | null = null;

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  showContacts = false;
  isLargeScreen = false;
  contacts: { id: number; username: string; type: 'user' | 'admin' }[] = [];
  selectedContact: { id: number; username: string; type: 'user' | 'admin' } | null = null;

  messages: { senderType: string; content: string; timestamp: string; senderName?: string, isCurrentUser?: boolean }[] = [];

  newMessage = '';
  hasNewMessage = false;

  constructor(
    private messageNotificationService: MessageNotificationService,
    private websocketUserService: WebsocketUserService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.checkScreenSize();
    this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.currentUserId = user.id;
      }
    });
  }

  /**
   * Lifecycle hook to initialize the component.
   * Establishes a WebSocket connection if a token is available.
   */
  ngOnInit(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.error('Unable to connect: No token found.');
      return;
    }
  
    this.websocketUserService.connect(token, 'user');
    this.websocketUserService.messages$.subscribe({
      next: (data) => this.handleWebSocketData(data),
      error: (error) => console.error('WebSocket error:', error)
    });
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
    this.websocketUserService.connect(token, senderType);
    this.websocketUserService.messages$.subscribe((data) =>
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
  private updateContacts(contacts: any[]): void {
    // Map the server response to the expected structure for the `contacts` array
    this.contacts = contacts.map((contact) => ({
      id: contact.contact_id,
      username: contact.contact_name,
      type: contact.contact_type as 'user' | 'admin', // Cast to the expected type
    }));
  }
  

  /**
   * Updates the message history for the selected contact.
   * @param messages - The messages received from the WebSocket server.
   */
  private updateMessageHistory(messages: any[]): void {
    this.messages = messages.map((msg) => ({
      senderType: msg.sender_type,
      senderId: msg.sender_user_id,
      content: msg.message,
      timestamp: new Date(msg.created_at).toLocaleString(),
      isCurrentUser: msg.sender_user_id === this.currentUserId
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
        senderId: message.sender_user_id,
        content: message.message,
        senderName: message.sender_name,
        timestamp: new Date(message.created_at).toLocaleString(),
        isCurrentUser: message.sender_user_id === this.currentUserId
    };

    if (this.isMessageRelevantToSelectedContact(message)) {
        this.messages = [...this.messages, newMessage];
    } else if (message.sender_user_id || message.sender_admin_id) {
        // Play sound for new messages from others
        if (!newMessage.isCurrentUser) {
            this.notificationService.playNotificationSound();
        }
        
        // Set notification for message from unselected contact
        const senderId = message.sender_user_id || message.sender_admin_id;
        this.messageNotificationService.setUnreadMessage(senderId, true);
    }
}

// Add a method to reset the ping animation
resetNewMessageFlag(): void {
    this.messageNotificationService.resetNewMessageNotification();
    this.hasNewMessage = false; // Reset the animation flag
}
  


  /**
   * Checks if a message is relevant to the currently selected contact.
   * @param message - The message object to check.
   * @returns True if the message is relevant, false otherwise.
   */
  private isMessageRelevantToSelectedContact(message: any): boolean {
    if (!this.selectedContact) return false;
    
    const contactId = this.selectedContact.id;
    const contactType = this.selectedContact.type;
    
    return (
      (contactType === 'user' && 
       (message.recipient_user_id === contactId || message.sender_user_id === contactId)) ||
      (contactType === 'admin' && 
       (message.recipient_admin_id === contactId || message.sender_admin_id === contactId))
    );
  }

  /**
   * Sends a new message to the selected contact through the WebSocket service.
   */
  sendMessage(): void {
    if (this.newMessage.trim() && this.selectedContact) {
      this.websocketUserService.sendMessage({
        recipientId: this.selectedContact.id.toString(),
        recipientType: this.selectedContact.type,
        message: this.newMessage,
      });
  
      // Add local message with correct isCurrentUser flag
      this.messages.push({
        senderType: 'user',
        content: this.newMessage,
        timestamp: new Date().toLocaleString(),
        isCurrentUser: true // This ensures your messages are aligned right
      });
      
      this.newMessage = '';
      this.scrollToBottom();
    }
  }


  /**
   * Adds a new message to the local chat messages list.
   * @param content - The content of the message to add.
   */
  private addLocalMessage(content: string): void {
    this.messages.push({
      senderType: 'user',
      content,
      timestamp: new Date().toLocaleString(),
    });
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
  selectContact(contact: { id: number; username: string; type: 'user' | 'admin' }): void {
    this.selectedContact = contact;
    this.websocketUserService.getMessages(contact.id, contact.type);
    // Clear notification when selecting contact
    this.messageNotificationService.clearUnreadMessage(contact.id);
    this.hasNewMessage = false;
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
  getInitials(name: string): string {
    if (!name) return '';
    const words = name.split(' ');
    return words
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 1);
  }

  /**
   * Checks for unread messages.
   * @param contactId - The ID of the contact to check.
   * @returns True if the contact has unread messages, false otherwise.
   */
  hasUnreadMessage(contactId: number): boolean {
    return this.messageNotificationService.hasUnreadMessage(contactId);
  }

}