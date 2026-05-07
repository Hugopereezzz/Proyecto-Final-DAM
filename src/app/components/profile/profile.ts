import { Component, inject, computed, Output, EventEmitter, signal } from '@angular/core';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent {
  public authService = inject(AuthService);

  @Output() back = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  
  stats = computed(() => this.authService.currentUserStats());
  
  // Local state for editing
  editDisplayName = signal<string>('');
  editAvatarBase64 = signal<string>('');
  isSaving = signal(false);

  // Cálculos de progreso para las barras (ajustar según niveles max, max=5)
  // Example max stats is 5
  maxLevel = 5;
  healthProgress = computed(() => Math.min(100, ((this.stats()?.healthLevel || 0) / this.maxLevel) * 100));
  ammoProgress   = computed(() => Math.min(100, ((this.stats()?.ammoLevel || 0) / this.maxLevel) * 100));
  speedProgress  = computed(() => Math.min(100, ((this.stats()?.speedLevel || 0) / this.maxLevel) * 100));

  ngOnInit() {
    this.resetForm();
  }

  resetForm() {
    const s = this.stats();
    if (s) {
      this.editDisplayName.set(s.displayName || s.username);
      this.editAvatarBase64.set(s.avatarBase64 || '');
    }
  }

  updateDisplayName(e: Event) {
    this.editDisplayName.set((e.target as HTMLInputElement).value);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editAvatarBase64.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async saveChanges() {
    const username = this.stats()?.username;
    if (!username) return;
    this.isSaving.set(true);
    await this.authService.updateProfile(username, this.editDisplayName(), this.editAvatarBase64());
    this.isSaving.set(false);
  }

  get fallbackLetter() {
    const s = this.stats();
    if (s && s.displayName && s.displayName.length > 0) return s.displayName[0].toUpperCase();
    if (s && s.username && s.username.length > 0) return s.username[0].toUpperCase();
    return 'A';
  }
}
