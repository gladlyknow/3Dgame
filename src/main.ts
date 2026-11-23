import './style.css';
import { Game } from './game/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('Game canvas is missing');

try {
  new Game(canvas);
} catch (error) {
  console.error('Unable to start the 3D game', error);
  const loading = document.querySelector<HTMLElement>('#loadingScreen');
  const title = loading?.querySelector<HTMLElement>('b');
  const message = loading?.querySelector<HTMLElement>('span');
  loading?.classList.add('webgl-error');
  if (title) title.textContent = '3D MODE NEEDS A GRAPHICS BROWSER';
  if (message) message.textContent = '请打开浏览器硬件加速后刷新页面 · Please enable hardware acceleration.';
}
