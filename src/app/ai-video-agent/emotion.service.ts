import { Injectable } from '@angular/core';
import { EmotionType } from './emotion.model';

@Injectable({ providedIn: 'root' })
export class EmotionService {

  async analyze(text: string): Promise<EmotionType[]> {

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    const prompt = `
Return ONLY JSON array like:
["EXPLAIN","APPROVE","ATTENTION"]

Text:
${sentences.join('\n')}
`;

    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama3',
        prompt,
        stream: false
      })
    });

    const data = await res.json();
    const raw = data.response.trim();

    const match = raw.match(/\[.*\]/s);

    if (!match) {
      return sentences.map(() => 'EXPLAIN');
    }

    try {
      return JSON.parse(match[0]).map((e: any) => {
        const val = String(e).trim().toUpperCase();
        if (val === 'APPROVE') return 'APPROVE';
        if (val === 'ATTENTION') return 'ATTENTION';
        return 'EXPLAIN';
      });
    } catch {
      return sentences.map(() => 'EXPLAIN');
    }
  }
}