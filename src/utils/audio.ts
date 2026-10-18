// Audio helper for arcade sounds and game music
class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {};
  private music: Record<string, HTMLAudioElement> = {};
  private muted: boolean = false;
  private currentMusicKey: string | null = null;

  constructor() {
    // Pre-register known sounds
    this.registerSound('click', '/click.mp3');
    this.registerSound('buy', '/buy.mp3');
    this.registerSound('fail', '/fail.mp3');
    this.registerSound('success', '/success.mp3');
    this.registerSound('slots_spin', '/slots_spin.mp3');
    this.registerSound('slots_win', '/slots_win.mp3');
    this.registerSound('unscrew', '/unscrew.mp3');
    this.registerSound('error', '/error.mp3');
    this.registerSound('damage', '/snd_damage.wav');
    this.registerSound('button', '/v91x2y.mp3');

    // Register music
    this.registerMusic('arcade_bg', '/background-music.mp3', 0.25, true);
    this.registerMusic('romanian_bg', '/bg-music.mp3', 0.3, true);
    this.registerMusic('undertale_menu', '/youtube_ivZ9wYvApRI_audio.mp3', 0.35, true);
    this.registerMusic('undertale_battle', '/youtube_GPL5Hkl11IQ_audio.mp3', 0.4, true);
  }

  private registerSound(name: string, url: string) {
    try {
      const audio = new Audio(url);
      audio.preload = 'auto';
      this.sounds[name] = audio;
    } catch {
      // Audio not supported in environment
    }
  }

  private registerMusic(name: string, url: string, volume: number = 0.3, loop: boolean = true) {
    try {
      const audio = new Audio(url);
      audio.preload = 'metadata';
      audio.loop = loop;
      audio.volume = volume;
      this.music[name] = audio;
    } catch {
      // Ignore
    }
  }

  public play(name: string, volume: number = 0.6) {
    if (this.muted) return;
    try {
      let sound = this.sounds[name];
      if (!sound) {
        sound = new Audio(`/${name}.mp3`);
        this.sounds[name] = sound;
      }
      sound.volume = volume;
      sound.currentTime = 0;
      sound.play().catch(() => {});
    } catch {
      // Ignore autoplay policy restriction
    }
  }

  public playMusic(key: string) {
    if (this.currentMusicKey === key && this.music[key] && !this.music[key].paused) {
      return;
    }
    this.stopMusic();
    const track = this.music[key];
    if (track && !this.muted) {
      this.currentMusicKey = key;
      track.currentTime = 0;
      track.play().catch(() => {});
    }
  }

  public stopMusic() {
    if (this.currentMusicKey && this.music[this.currentMusicKey]) {
      this.music[this.currentMusicKey].pause();
      this.music[this.currentMusicKey].currentTime = 0;
    }
    this.currentMusicKey = null;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      if (this.currentMusicKey && this.music[this.currentMusicKey]) {
        this.music[this.currentMusicKey].pause();
      }
    } else {
      if (this.currentMusicKey && this.music[this.currentMusicKey]) {
        this.music[this.currentMusicKey].play().catch(() => {});
      }
    }
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }
}

export const soundManager = new SoundManager();
