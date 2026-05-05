import { Component } from '@angular/core';
import { AiVideoTestComponent } from './ai-video-test/ai-video-test.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AiVideoTestComponent],
  template: `<ai-video-test></ai-video-test>`
})
export class AppComponent {}