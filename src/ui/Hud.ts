import type { ObjectiveCopy, StoryChoice } from '../core/types';

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing UI element: ${selector}`);
  return element;
}

export class Hud {
  readonly app = required<HTMLElement>('#app');
  private readonly hud = required<HTMLElement>('#gameHud');
  private readonly intro = required<HTMLElement>('#introScreen');
  private readonly loading = required<HTMLElement>('#loadingScreen');
  private readonly objectiveEn = required<HTMLElement>('#objectiveEnglish');
  private readonly objectiveZh = required<HTMLElement>('#objectiveChinese');
  private readonly chapter = required<HTMLElement>('#chapterLabel');
  private readonly direction = required<HTMLElement>('#directionArrow');
  private readonly subtitle = required<HTMLElement>('#subtitleBar');
  private readonly subtitleEn = required<HTMLElement>('#subtitleEnglish');
  private readonly subtitleZh = required<HTMLElement>('#subtitleChinese');
  private readonly speaker = required<HTMLElement>('#speakerName');
  private readonly speakerBadge = required<HTMLElement>('#speakerBadge');
  private readonly safety = required<HTMLElement>('#safetyHint');
  private readonly pausePanel = required<HTMLElement>('#pausePanel');
  private readonly choicePanel = required<HTMLElement>('#choicePanel');
  private readonly completePanel = required<HTMLElement>('#completePanel');
  private readonly soundButton = required<HTMLButtonElement>('#soundButton');
  private subtitleTimer = 0;

  onStart: () => void = () => undefined;
  onPause: () => void = () => undefined;
  onResume: () => void = () => undefined;
  onSound: () => boolean = () => true;
  onChoice: (choice: StoryChoice) => void = () => undefined;
  onReplay: () => void = () => undefined;

  constructor() {
    required('#startButton').addEventListener('click', () => this.onStart());
    required('#pauseButton').addEventListener('click', () => this.onPause());
    required('#resumeButton').addEventListener('click', () => this.onResume());
    required('#replayButton').addEventListener('click', () => this.onReplay());
    this.soundButton.addEventListener('click', () => this.setSoundState(this.onSound()));
    this.choicePanel.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((button) => {
      button.addEventListener('click', () => this.onChoice(button.dataset.choice as StoryChoice));
    });
  }

  ready(): void {
    window.setTimeout(() => this.loading.classList.add('hidden'), 320);
  }

  begin(): void {
    this.intro.classList.add('hidden');
    this.hud.setAttribute('aria-hidden', 'false');
    this.app.classList.add('is-playing');
  }

  setObjective(copy: ObjectiveCopy): void {
    this.chapter.textContent = `FIRST DAY · ${String(copy.step).padStart(2, '0')} / 06`;
    this.objectiveEn.textContent = copy.english;
    this.objectiveZh.textContent = copy.chinese;
    this.direction.classList.toggle('hidden', !copy.target);
    const card = this.objectiveEn.closest('.objective-card');
    card?.classList.remove('objective-pop');
    requestAnimationFrame(() => card?.classList.add('objective-pop'));
  }

  setDirection(radians: number, distance: number): void {
    this.direction.style.transform = `rotate(${radians}rad)`;
    this.direction.style.opacity = distance < 4 ? '0.28' : '1';
  }

  say(name: string, english: string, chinese: string, duration = 4.6): void {
    window.clearTimeout(this.subtitleTimer);
    this.speaker.textContent = name.toUpperCase();
    this.speakerBadge.textContent = name.slice(0, 1).toUpperCase();
    this.speakerBadge.dataset.speaker = name.toLowerCase();
    this.subtitleEn.textContent = english;
    this.subtitleZh.textContent = chinese;
    this.subtitle.classList.add('visible');
    this.subtitleTimer = window.setTimeout(() => this.subtitle.classList.remove('visible'), duration * 1000);
  }

  showSafety(show: boolean): void {
    this.safety.classList.toggle('visible', show);
  }

  showChoice(): void {
    this.choicePanel.classList.add('visible');
    this.choicePanel.setAttribute('aria-hidden', 'false');
  }

  hideChoice(): void {
    this.choicePanel.classList.remove('visible');
    this.choicePanel.setAttribute('aria-hidden', 'true');
  }

  setPaused(paused: boolean): void {
    this.pausePanel.classList.toggle('visible', paused);
    this.pausePanel.setAttribute('aria-hidden', String(!paused));
  }

  complete(): void {
    this.hud.setAttribute('aria-hidden', 'true');
    this.completePanel.classList.add('visible');
    this.completePanel.setAttribute('aria-hidden', 'false');
  }

  setSoundState(enabled: boolean): void {
    this.soundButton.classList.toggle('muted', !enabled);
    this.soundButton.setAttribute('aria-label', enabled ? '关闭声音' : '打开声音');
  }
}
