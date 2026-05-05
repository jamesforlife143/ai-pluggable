import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioStreamService {

  private ctx = new AudioContext();

  async play(buffer: ArrayBuffer): Promise<void> {

    // 🔥 decode full audio buffer
    const audioBuffer = await this.ctx.decodeAudioData(buffer.slice(0));

    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.ctx.destination);

    source.start();

    return new Promise<void>((resolve) => {
      source.onended = () => resolve();
    });
  }

  stop(): void {
    try {
      this.ctx.close();
    } catch {}

    // recreate fresh context
    this.ctx = new AudioContext();
  }
}