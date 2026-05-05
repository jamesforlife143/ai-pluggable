import { Injectable, signal } from '@angular/core';
import { EmotionType, EMOTION_VIDEO_MAP } from './emotion.model';
import { TtsService } from './tts.service';

@Injectable({ providedIn: 'root' })
export class SyncEngine {

  isPaused = signal(false);
  isStopped = signal(false);

  async play(
    sentences: string[],
    emotions: EmotionType[],
    tts: TtsService,
    switchVideo: (src?: string, stop?: boolean) => void,
    preload: (src: string) => void,
    emitText: (t: string) => void
  ) {

    for (let i = 0; i < sentences.length; i++) {

      if (this.isStopped()) {
        switchVideo('', true);
        break;
      }

      while (this.isPaused()) {
        await this.sleep(100);
      }

      const emotion = emotions[i] ?? 'EXPLAIN';
      const src = EMOTION_VIDEO_MAP[emotion];

      const nextEmotion = emotions[i + 1] ?? emotion;
      preload(EMOTION_VIDEO_MAP[nextEmotion]);

      // 🔊 generate audio first
      const audioBuffer = await tts.speak(sentences[i]);

      emitText(sentences[i]);

      // 🔊 decode
      const ctx = new AudioContext();
      const decoded = await ctx.decodeAudioData(audioBuffer.slice(0));

      const source = ctx.createBufferSource();
      source.buffer = decoded;
      source.connect(ctx.destination);

      // 🎬 start video slightly before audio
      switchVideo(src);

      await this.sleep(40); // sync tweak

      source.start();

      await new Promise<void>((res) => {
        source.onended = () => {
          ctx.close();
          res();
        };
      });
    }

    switchVideo('', true);
  }

  private sleep(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }
}