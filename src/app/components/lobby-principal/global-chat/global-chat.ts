import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocketService, MensajeChat } from '../../../services/socket.service';

@Component({
  selector: 'app-global-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-chat.html',
  styleUrls: ['./global-chat.css']
})
export class GlobalChatComponent implements OnInit, AfterViewChecked {
  ss = inject(SocketService);
  mensajes: MensajeChat[] = [];
  nuevoMensaje = '';
  private scrollPending = false;

  @ViewChild('chatMessages') private chatMessages!: ElementRef;

  constructor() {
    this.ss.onMensajeGlobal().pipe(takeUntilDestroyed()).subscribe(m => {
      this.mensajes.push(m);
      this.scrollPending = true;
    });
  }

  ngOnInit() {}

  ngAfterViewChecked() {
    if (this.scrollPending && this.chatMessages) {
      this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
      this.scrollPending = false;
    }
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim()) return;
    this.ss.enviarMensajeGlobal(this.nuevoMensaje.trim());
    this.nuevoMensaje = '';
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') this.enviarMensaje();
  }
}
