import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface RoomPlayer {
  id: string;
  name: string;
  cityId: number;
  continentIndex: number;
  isBot?: boolean;
  avatarBase64?: string;
}

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket!: WebSocket;
  
  roomUpdate$ = new Subject<RoomPlayer[]>();
  gameStarted$ = new Subject<any>();
  missileLaunched$ = new Subject<any>();
  defenseLaunched$ = new Subject<any>();
  turnAdvanced$ = new Subject<any>();
  skillRoulette$ = new Subject<any>();
  gameOver$ = new Subject<any>();
  playerBecameBot$ = new Subject<{cityId: number}>();
  worldEvent$ = new Subject<any>();
  emojiReceived$ = new Subject<any>();

  private createRoomResolve?: (res: any) => void;
  private joinRoomResolve?: (res: any) => void;

  publicRooms = signal<any[]>([]);
  globalChat = signal<any[]>([]);

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }

  connect() {
    this.socket = new WebSocket('ws://localhost:8080/game');

    this.socket.onclose = () => {
      setTimeout(() => this.connect(), 2000); // Auto reconnect if backend restarts
    };

    this.socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (!payload.type) return;

      switch (payload.type) {
        case 'public-rooms-update':
          this.publicRooms.set(payload.data);
          break;
        case 'global-chat-message':
          this.globalChat.update(chat => {
            const newChat = [...chat, payload.data];
            return newChat.length > 50 ? newChat.slice(-50) : newChat;
          });
          break;
        case 'room-created':
          if (this.createRoomResolve) {
            this.createRoomResolve(payload.data);
            this.createRoomResolve = undefined;
          }
          break;
        case 'room-joined':
        case 'join-error':
          if (this.joinRoomResolve) {
            this.joinRoomResolve(payload.data);
            this.joinRoomResolve = undefined;
          }
          break;
        case 'room-update':
          this.roomUpdate$.next(payload.data);
          break;
        case 'game-started':
          this.gameStarted$.next(payload.data);
          break;
        case 'missile-launched':
          this.missileLaunched$.next(payload.data);
          break;
        case 'defense-launched':
          this.defenseLaunched$.next(payload.data);
          break;
        case 'turn-advanced':
          this.turnAdvanced$.next(payload.data);
          break;
        case 'skill-roulette':
          this.skillRoulette$.next(payload.data);
          break;
        case 'game-over':
          this.gameOver$.next(payload.data);
          break;
        case 'player-became-bot':
          this.playerBecameBot$.next(payload.data);
          break;
        case 'world-event':
          this.worldEvent$.next(payload.data);
          break;
        case 'emoji-received':
          this.emojiReceived$.next(payload.data);
          break;
      }
    };
  }

  requestPublicRooms() {
    this.send('get-public-rooms', {});
  }

  sendGlobalChat(playerName: string, text: string) {
    this.send('global-chat', { playerName, text });
  }

  createRoom(playerName: string, avatarBase64: string | undefined, missileSkin: string = 'default', isPublic: boolean = false): Promise<any> {
    return new Promise((resolve) => {
      this.createRoomResolve = resolve;
      this.send('create-room', { playerName, avatarBase64, missileSkin, isPublic });
    });
  }

  joinRoom(roomId: string, playerName: string, avatarBase64: string | undefined, missileSkin: string = 'default'): Promise<any> {
    return new Promise((resolve) => {
      this.joinRoomResolve = resolve;
      this.send('join-room', { roomId, playerName, avatarBase64, missileSkin });
    });
  }

  startGame(roomId: string) {
    this.send('start-game', { roomId });
  }

  launchMissile(roomId: string, fromCityId: number, targetX: number, targetY: number) {
    this.send('launch-missile', { roomId, fromCityId, targetX, targetY });
  }

  launchDefense(roomId: string, fromCityId: number, targetMissileId: number) {
    this.send('launch-defense', { roomId, fromCityId, targetMissileId });
  }

  advanceTurn(roomId: string, nextPlayerIndex: number, nextCityId: number) {
    this.send('advance-turn', { roomId, nextPlayerIndex, nextCityId });
  }

  chooseContinent(roomId: string, continentIndex: number) {
    this.send('choose-continent', { roomId, continentIndex });
  }

  reportVictory(roomId: string, winnerName: string) {
    this.send('report-victory', { roomId, winnerName });
  }

  convertToBot(roomId: string, cityId: number) {
    this.send('convert-to-bot', { roomId, cityId });
  }

  sendEmoji(roomId: string, cityId: number, emoji: string) {
    this.send('send-emoji', { roomId, cityId, emoji });
  }

  private send(type: string, data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    } else {
      setTimeout(() => this.send(type, data), 100);
    }
  }

  getLatency(): number {
    return 0; // Simple placeholder for sync logic
  }
}
