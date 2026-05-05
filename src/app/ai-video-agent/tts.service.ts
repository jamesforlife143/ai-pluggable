import { Injectable } from '@angular/core';
declare var SpeechSDK: any;

@Injectable({ providedIn: 'root' })
export class TtsService {

  private speechConfig: any;

  constructor() {
    this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      '5uE2FAFX7Ezy2xERQhRVIo7P6TpLsna8f3hcSJX9T13qGvxtgGFaJQQJ99CDACYeBjFXJ3w3AAAYACOGn0La',
      'eastus'
    );

    this.speechConfig.speechSynthesisVoiceName = 'en-US-AriaNeural';
  }

  speak(text: string): Promise<ArrayBuffer> {

    const synthesizer = new SpeechSDK.SpeechSynthesizer(
      this.speechConfig,
      null
    );

    return new Promise((resolve, reject) => {

      synthesizer.speakTextAsync(
        text,
        (result: any) => {
          resolve(result.audioData); // full buffer
        },
        (err: any) => reject(err)
      );

    });
  }
}