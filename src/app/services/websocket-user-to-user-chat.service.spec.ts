import { TestBed } from '@angular/core/testing';

import { WebsocketUserToUserChatService } from './websocket-user-to-user-chat.service';

describe('WebsocketUserToUserChatService', () => {
  let service: WebsocketUserToUserChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebsocketUserToUserChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
