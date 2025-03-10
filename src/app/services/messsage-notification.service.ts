import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageNotificationService {
  private unreadMessagesMap = new Map<number, boolean>();
  private unreadMessagesSource = new BehaviorSubject<Map<number, boolean>>(new Map());
  unreadMessages$ = this.unreadMessagesSource.asObservable();

  private newMessageSource = new BehaviorSubject<boolean>(false);
  newMessage$ = this.newMessageSource.asObservable();

  setUnreadMessage(userId: number, value: boolean): void {
    this.unreadMessagesMap.set(userId, value);
    this.unreadMessagesSource.next(new Map(this.unreadMessagesMap));
    this.newMessageSource.next(true);
  }

  hasUnreadMessage(userId: number): boolean {
    return this.unreadMessagesMap.get(userId) || false;
  }

  clearUnreadMessage(userId: number): void {
    this.unreadMessagesMap.delete(userId);
    this.unreadMessagesSource.next(new Map(this.unreadMessagesMap));
    if (this.unreadMessagesMap.size === 0) {
      this.newMessageSource.next(false);
    }
  }

  resetNewMessageNotification(): void {
    this.newMessageSource.next(false);
  }
}
