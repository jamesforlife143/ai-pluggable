import { Injectable } from '@angular/core';

import type * as SpeechSDKTypes from 'microsoft-cognitiveservices-speech-sdk';

declare global {
  interface Window {
    SpeechSDK?: typeof SpeechSDKTypes;
  }
}

const getSpeechSdk = () =>
  window.SpeechSDK as unknown as typeof SpeechSDKTypes | undefined;

const speechSdkAssetPath =
  'assets/speech-sdk/microsoft.cognitiveservices.speech.sdk.bundle.js';

@Injectable({ providedIn: 'root' })
export class TtsService {
  private speechConfig: SpeechSDKTypes.SpeechConfig | null = null;
  private speechSdkLoad: Promise<typeof SpeechSDKTypes> | null = null;

  speak(text: string): Promise<ArrayBuffer> {
    return this.ensureSpeechConfig().then(({ SpeechSDK, speechConfig }) => {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);

        synthesizer.speakTextAsync(
          text,
          (result: SpeechSDKTypes.SpeechSynthesisResult) => {
            synthesizer.close();

            if (
              result.reason ===
              (SpeechSDK as any).ResultReason.SynthesizingAudioCompleted
            ) {
              resolve(result.audioData);
              return;
            }

            reject(result.errorDetails);
          },
          (err: string) => {
            synthesizer.close();
            reject(err);
          }
        );
      });
    });
  }

  private async ensureSpeechConfig(): Promise<{
    SpeechSDK: typeof SpeechSDKTypes;
    speechConfig: SpeechSDKTypes.SpeechConfig;
  }> {
    const SpeechSDK = await this.waitForSpeechSdk();

    if (!this.speechConfig) {
      this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        '5uE2FAFX7Ezy2xERQhRVIo7P6TpLsna8f3hcSJX9T13qGvxtgGFaJQQJ99CDACYeBjFXJ3w3AAAYACOGn0La',
        'eastus'
      );

      this.speechConfig.speechSynthesisVoiceName = 'en-IN-PrabhatNeural';

      this.speechConfig.speechSynthesisOutputFormat =
        SpeechSDK.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3;
    }

    return {
      SpeechSDK,
      speechConfig: this.speechConfig!
    };
  }

  private waitForSpeechSdk(): Promise<typeof SpeechSDKTypes> {
    if (!this.speechSdkLoad) {
      this.speechSdkLoad = new Promise((resolve, reject) => {
        const existing =
          document.querySelector('script[data-speech-sdk]') as HTMLScriptElement | null;

        if (getSpeechSdk()?.SpeechConfig) {
          resolve(getSpeechSdk() as unknown as typeof SpeechSDKTypes);
          return;
        }

        const script = existing ?? document.createElement('script');
        script.setAttribute('data-speech-sdk', 'true');

        script.onload = () => {
          const SpeechSDK = getSpeechSdk();

          if (SpeechSDK?.SpeechConfig) {
            resolve(SpeechSDK as unknown as typeof SpeechSDKTypes);
            return;
          }

          reject('Speech SDK script loaded, but window.SpeechSDK is missing.');
        };

        script.onerror = () => {
          reject(`Speech SDK failed to load from ${script.src}.`);
        };

        if (!existing) {
          script.src = new URL(speechSdkAssetPath, document.baseURI).toString();
          document.head.appendChild(script);
        }
      });
    }

    return this.speechSdkLoad;
  }
}
