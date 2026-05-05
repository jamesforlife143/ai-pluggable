import {
  Component, ElementRef, ViewChild,
  input, output, signal, effect
} from '@angular/core';

import { EmotionService } from './emotion.service';
import { TtsService } from './tts.service';
import { SyncEngine } from './sync-engine.service';

@Component({
  selector: 'ai-video-agent',
  standalone: true,
  templateUrl: './ai-video-agent.component.html',
  styleUrls: ['./ai-video-agent.component.scss']
})
export class AiVideoAgentComponent {

  text = input<string>('');
  pause = input<boolean>(false);
  stop = input<boolean>(false);
  width = input<string>('100%');
  height = input<string>('300px');

  transcript = output<string>();

  @ViewChild('videoA', { static: true }) videoA!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoB', { static: true }) videoB!: ElementRef<HTMLVideoElement>;

  private active = signal<'A' | 'B'>('A');
  private isRunning = false;

  constructor(
    private emotion: EmotionService,
    private tts: TtsService,
    private sync: SyncEngine
  ) {

    effect(() => {
      this.sync.isPaused.set(this.pause());
      this.sync.isStopped.set(this.stop());
    });

    effect(() => {
      if (this.text()) {
        this.start(this.text());
      }
    });
  }

  // 🔥 RESET videos completely
  resetVideos() {

    const videos = [
      this.videoA.nativeElement,
      this.videoB.nativeElement
    ];

    videos.forEach(v => {
      v.pause();
      v.removeAttribute('src');
      v.load();
      v.style.opacity = '0';
    });

    this.active.set('A');
  }

  preload(src: string) {
    const v = document.createElement('video');
    v.src = src;
    v.preload = 'auto';
  }

  // 🔥 Robust switching
  switchVideo(src?: string, stop: boolean = false) {

    const current = this.active() === 'A'
      ? this.videoA.nativeElement
      : this.videoB.nativeElement;

    const next = this.active() === 'A'
      ? this.videoB.nativeElement
      : this.videoA.nativeElement;

    if (stop) {
      current.pause();
      current.style.opacity = '0';
      return;
    }

    if (!src) return;

    // 🔥 HARD RESET next video
    next.pause();
    next.removeAttribute('src');
    next.load();

    next.src = src;
    next.currentTime = 0;

    next.onloadeddata = () => {
      next.play().then(() => {
        next.style.opacity = '1';
        current.style.opacity = '0';
        this.active.set(this.active() === 'A' ? 'B' : 'A');
      }).catch(err => console.error('Video play error:', err));
    };

    next.onerror = (e) => {
      console.error('Video load failed:', src, e);
    };
  }

  async start(text: string) {

    // 🔥 stop previous run
    this.sync.isStopped.set(true);

    await new Promise(r => setTimeout(r, 50));

    this.sync.isStopped.set(false);

    // 🔥 reset videos before new run
    this.resetVideos();

    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const emotions = await this.emotion.analyze(text);

      await this.sync.play(
        sentences,
        emotions,
        this.tts,
        this.switchVideo.bind(this),
        this.preload.bind(this),
        (t: string) => this.transcript.emit(t)
      );

    } finally {
      this.isRunning = false;
    }
  }
}