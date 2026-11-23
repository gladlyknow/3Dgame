import * as THREE from 'three';
import type { AudioManager } from '../../core/AudioManager';
import type { CameraPose, CampusWorld, StoryChoice, VehicleRig } from '../../core/types';
import type { Hud } from '../../ui/Hud';
import { animateWheels, setExpression } from '../../characters/Vehicles';

type Phase =
  | 'waiting'
  | 'arrival'
  | 'reveal'
  | 'yield'
  | 'raceApproach'
  | 'race'
  | 'corner'
  | 'emotion'
  | 'greeting'
  | 'choice'
  | 'ending'
  | 'complete';

export interface EpisodeRuntime {
  player: VehicleRig;
  bus: VehicleRig;
  raceCar: VehicleRig;
  poppy: VehicleRig;
  campus: CampusWorld;
  hud: Hud;
  audio: AudioManager;
  getSpeed: () => number;
  setSpeedLimit: (limit: number | null, safety?: boolean) => void;
  setDrivingLocked: (locked: boolean) => void;
  addCameraBump: (amount: number) => void;
  onComplete: () => void;
}

export class Episode01 {
  phase: Phase = 'waiting';
  target: THREE.Vector3 | null = null;
  cameraPose: CameraPose | null = null;
  private elapsed = 0;
  private greetingSpoken = false;
  private raceWarningSpoken = false;

  constructor(private readonly runtime: EpisodeRuntime) {
    runtime.bus.group.visible = false;
    runtime.raceCar.group.visible = false;
    runtime.poppy.group.visible = false;
    runtime.bus.group.position.set(-37, 0, -3);
    runtime.bus.group.rotation.y = Math.PI / 2;
    runtime.raceCar.group.position.set(39, 0, 10);
    runtime.raceCar.group.rotation.y = -Math.PI / 2;
    runtime.poppy.group.position.set(39, 0, 25.5);
    runtime.poppy.group.rotation.y = -Math.PI / 2;
  }

  start(): void {
    this.enter('arrival');
    this.runtime.hud.setObjective({
      step: 1,
      english: 'Follow the blue road to school',
      chinese: '沿着蓝色道路，慢慢开到学校',
      target: this.runtime.campus.arrivalTarget,
    });
    this.target = this.runtime.campus.arrivalTarget;
    this.runtime.hud.say('Eddy', 'My first day. Here I go!', '第一天上学，我出发啦！', 4.8);
    this.runtime.audio.speak('My first day. Here I go!');
  }

  update(delta: number): void {
    if (this.phase === 'waiting' || this.phase === 'complete') return;
    this.elapsed += delta;
    const position = this.runtime.player.group.position;

    switch (this.phase) {
      case 'arrival':
        if (position.z > -25.5) this.beginReveal();
        break;
      case 'reveal':
        this.updateReveal();
        break;
      case 'yield':
        this.updateBus(delta, position);
        break;
      case 'raceApproach':
        if (position.z > -10) this.beginRace();
        break;
      case 'race':
        this.updateRace(delta, position);
        break;
      case 'corner':
        this.updateCorner(position);
        break;
      case 'emotion':
        this.updateEmotion();
        break;
      case 'greeting':
        this.updateGreeting(delta);
        break;
      case 'choice':
        break;
      case 'ending':
        this.updateEnding();
        break;
      default:
        break;
    }
  }

  choose(choice: StoryChoice): void {
    if (this.phase !== 'choice') return;
    this.runtime.hud.hideChoice();
    setExpression(this.runtime.player, 'happy');
    const english = choice === 'intro' ? "Hello! I'm Eddy." : 'Hi, Poppy!';
    const chinese = choice === 'intro' ? '你好！我是艾迪。' : '嗨，波比！';
    this.runtime.hud.say('Eddy', english, chinese, 4.2);
    this.runtime.audio.speak(english);
    this.runtime.audio.cue('success');
    this.enter('ending');
  }

  private beginReveal(): void {
    this.enter('reveal');
    this.runtime.setDrivingLocked(true);
    this.runtime.setSpeedLimit(0);
    this.target = null;
    setExpression(this.runtime.player, 'curious');
    this.runtime.hud.setObjective({ step: 2, english: 'There it is — Tire Town School!', chinese: '看！轮胎镇学校到了' });
    this.runtime.hud.say('Eddy', "Wow... that's my new school!", '哇……这就是我的新学校！', 4.2);
    this.runtime.audio.cue('notice');
    this.runtime.audio.speak("Wow. That's my new school!");
  }

  private updateReveal(): void {
    const t = THREE.MathUtils.smoothstep(Math.min(this.elapsed / 2.7, 1), 0, 1);
    const playerPosition = this.runtime.player.group.position;
    this.cameraPose = {
      position: new THREE.Vector3().lerpVectors(
        new THREE.Vector3(playerPosition.x + 2.5, 5.2, playerPosition.z - 8),
        new THREE.Vector3(18, 11.5, -4),
        t,
      ),
      target: new THREE.Vector3().lerpVectors(
        new THREE.Vector3(playerPosition.x, 1.8, playerPosition.z + 4),
        this.runtime.campus.schoolFocus,
        t,
      ),
      fov: 48,
    };
    if (this.elapsed < 3.15) return;
    this.cameraPose = null;
    this.runtime.setDrivingLocked(false);
    this.runtime.setSpeedLimit(null);
    this.runtime.bus.group.visible = true;
    this.enter('yield');
    this.target = this.runtime.campus.crossingTarget;
    this.runtime.hud.setObjective({
      step: 3,
      english: 'Slow down. Let the long car pass',
      chinese: '慢下来，让长车先通过',
      target: this.runtime.campus.crossingTarget,
    });
    this.runtime.hud.say('Guide', 'Slow down. Look, then let it pass.', '慢下来，先观察，再让它通过。', 5);
    this.runtime.audio.speak('Slow down. Look, then let it pass.');
  }

  private updateBus(delta: number, playerPosition: THREE.Vector3): void {
    const bus = this.runtime.bus.group;
    const speed = 7.2;
    bus.position.x += speed * delta;
    animateWheels(this.runtime.bus, speed * delta);
    const busNearCrossing = Math.abs(bus.position.x) < 12;
    const playerNearCrossing = playerPosition.z > -17 && playerPosition.z < 5;
    if (busNearCrossing && playerNearCrossing) this.runtime.setSpeedLimit(0.7, true);
    else this.runtime.setSpeedLimit(null);

    if (bus.position.x < 34) return;
    this.runtime.setSpeedLimit(null);
    this.runtime.hud.showSafety(false);
    this.enter('raceApproach');
    this.target = new THREE.Vector3(0, 0, 2);
    this.runtime.hud.setObjective({
      step: 4,
      english: 'Look both ways, then roll forward',
      chinese: '左右看一看，再向前开',
      target: this.target,
    });
    this.runtime.hud.say('Eddy', 'Slow and safe. I can do that!', '慢慢来，注意安全。我做到了！', 4.2);
    this.runtime.audio.cue('success');
  }

  private beginRace(): void {
    this.enter('race');
    this.runtime.raceCar.group.visible = true;
    this.target = null;
    this.runtime.hud.setObjective({ step: 4, english: 'Look out — a fast car!', chinese: '小心——一辆快车！' });
    setExpression(this.runtime.player, 'surprised');
    this.runtime.setSpeedLimit(1.1, true);
  }

  private updateRace(delta: number, playerPosition: THREE.Vector3): void {
    const raceCar = this.runtime.raceCar.group;
    const speed = 20;
    raceCar.position.x -= speed * delta;
    animateWheels(this.runtime.raceCar, speed * delta);
    const distance = raceCar.position.distanceTo(playerPosition);
    if (distance < 14 && !this.raceWarningSpoken) {
      this.raceWarningSpoken = true;
      this.runtime.hud.say('Eddy', 'Whoa! So fast!', '哇！好快！', 3.5);
      this.runtime.audio.speak('Whoa! So fast!');
      this.runtime.audio.cue('whoosh');
      this.runtime.addCameraBump(0.34);
    }
    if (raceCar.position.x > -37) return;
    this.runtime.setSpeedLimit(null);
    this.runtime.hud.showSafety(false);
    this.enter('corner');
    this.target = this.runtime.campus.tireCorner;
    this.runtime.hud.setObjective({
      step: 5,
      english: 'Find the quiet tire corner',
      chinese: '去安静的轮胎角落停一停',
      target: this.runtime.campus.tireCorner,
    });
  }

  private updateCorner(playerPosition: THREE.Vector3): void {
    const distance = playerPosition.distanceTo(this.runtime.campus.tireCorner);
    if (distance < 10) this.runtime.setSpeedLimit(1.35, true);
    if (distance >= 4.6 || Math.abs(this.runtime.getSpeed()) >= 0.55) return;
    this.runtime.setSpeedLimit(0);
    this.runtime.setDrivingLocked(true);
    this.target = null;
    this.enter('emotion');
    setExpression(this.runtime.player, 'worried');
    this.runtime.hud.say('Eddy', "Everyone is so fast. Maybe I don't fit in.", '大家都这么快……也许我不适合这里。', 5.2);
    this.runtime.audio.speak("Everyone is so fast. Maybe I don't fit in.");
  }

  private updateEmotion(): void {
    const playerPosition = this.runtime.player.group.position;
    this.cameraPose = {
      position: new THREE.Vector3(playerPosition.x - 6.8, 3.4, playerPosition.z - 5.8),
      target: new THREE.Vector3(playerPosition.x, 1.65, playerPosition.z + 0.4),
      fov: 45,
    };
    if (this.elapsed < 5.1) return;
    this.runtime.poppy.group.visible = true;
    this.enter('greeting');
    this.runtime.hud.setObjective({ step: 6, english: 'A new friend is coming', chinese: '一位新朋友过来了' });
  }

  private updateGreeting(delta: number): void {
    const poppy = this.runtime.poppy.group;
    if (poppy.position.x > 29.2) {
      const move = Math.min(3.6 * delta, poppy.position.x - 29.2);
      poppy.position.x -= move;
      animateWheels(this.runtime.poppy, move);
      this.cameraPose = {
        position: new THREE.Vector3(18.5, 5.2, 17.5),
        target: new THREE.Vector3(27, 1.7, 24.5),
        fov: 48,
      };
      return;
    }
    if (!this.greetingSpoken) {
      this.greetingSpoken = true;
      setExpression(this.runtime.poppy, 'happy');
      setExpression(this.runtime.player, 'curious');
      this.runtime.hud.say('Poppy', "Hi! I'm Poppy. Is this your first day?", '嗨！我是波比。今天是你第一天来吗？', 5.2);
      this.runtime.audio.speak("Hi! I'm Poppy. Is this your first day?", 'poppy');
    }
    if (this.elapsed < 4.7) return;
    this.enter('choice');
    this.runtime.hud.showChoice();
  }

  private updateEnding(): void {
    const midpoint = new THREE.Vector3().addVectors(this.runtime.player.group.position, this.runtime.poppy.group.position).multiplyScalar(0.5);
    this.cameraPose = {
      position: new THREE.Vector3(midpoint.x - 8.5, 5, midpoint.z - 7.5),
      target: midpoint.add(new THREE.Vector3(0, 1.8, 0)),
      fov: 47,
    };
    if (this.elapsed < 4.3) return;
    this.enter('complete');
    this.cameraPose = null;
    this.runtime.onComplete();
  }

  private enter(phase: Phase): void {
    this.phase = phase;
    this.elapsed = 0;
  }
}
