import * as THREE from 'three';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';
import type { CameraPose } from '../core/types';
import { createCampus } from '../world/Campus';
import { animateWheels, createEddy, createLongBus, createPoppy, createRaceCar } from '../characters/Vehicles';
import { Episode01 } from '../episodes/episode01/Episode01';
import { Hud } from '../ui/Hud';

export class Game {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 260);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly clock = new THREE.Clock();
  private readonly hud = new Hud();
  private readonly input = new InputManager();
  private readonly audio = new AudioManager();
  private readonly campus = createCampus();
  private readonly player = createEddy();
  private readonly bus = createLongBus();
  private readonly raceCar = createRaceCar();
  private readonly poppy = createPoppy();
  private readonly episode: Episode01;
  private cameraLook = new THREE.Vector3(0, 1.8, -66);
  private heading = 0;
  private speed = 0;
  private speedLimit: number | null = null;
  private drivingLocked = false;
  private playing = false;
  private paused = false;
  private cameraBump = 0;
  private idleTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.setupRenderer();
    this.setupScene();

    this.player.group.position.set(0, 0, -72);
    this.player.group.rotation.y = this.heading;
    this.scene.add(this.player.group, this.bus.group, this.raceCar.group, this.poppy.group);

    this.episode = new Episode01({
      player: this.player,
      bus: this.bus,
      raceCar: this.raceCar,
      poppy: this.poppy,
      campus: this.campus,
      hud: this.hud,
      audio: this.audio,
      getSpeed: () => this.speed,
      setSpeedLimit: (limit, safety = false) => this.setSpeedLimit(limit, safety),
      setDrivingLocked: (locked) => {
        this.drivingLocked = locked;
        if (locked) this.input.reset();
      },
      addCameraBump: (amount) => {
        this.cameraBump = Math.max(this.cameraBump, amount);
      },
      onComplete: () => this.complete(),
    });

    this.bindUI();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.playing && !this.paused) this.setPaused(true);
    });
    this.resize();
    this.camera.position.set(-9, 5.4, -79);
    this.camera.lookAt(this.cameraLook);
    this.renderer.setAnimationLoop(() => this.frame());
    this.hud.setSoundState(this.audio.enabled);
    this.hud.ready();
  }

  private setupRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 800 ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  private setupScene(): void {
    this.scene.background = new THREE.Color(0xa8e4f4);
    this.scene.fog = new THREE.Fog(0xbce9ed, 78, 178);
    this.scene.add(this.campus.root);

    const hemisphere = new THREE.HemisphereLight(0xeaffff, 0x72a65f, 2.25);
    this.scene.add(hemisphere);
    const sun = new THREE.DirectionalLight(0xfff1d2, 3.45);
    sun.position.set(-30, 46, -34);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -62;
    sun.shadow.camera.right = 62;
    sun.shadow.camera.top = 70;
    sun.shadow.camera.bottom = -70;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 145;
    sun.shadow.bias = -0.00015;
    this.scene.add(sun);

    const warmFill = new THREE.DirectionalLight(0xffc98d, 0.62);
    warmFill.position.set(26, 17, -15);
    this.scene.add(warmFill);
  }

  private bindUI(): void {
    this.hud.onStart = () => {
      this.audio.unlock();
      this.playing = true;
      this.hud.begin();
      this.episode.start();
      this.clock.getDelta();
    };
    this.hud.onPause = () => this.setPaused(true);
    this.hud.onResume = () => this.setPaused(false);
    this.hud.onSound = () => this.audio.toggle();
    this.hud.onChoice = (choice) => this.episode.choose(choice);
    this.hud.onReplay = () => window.location.reload();
    this.input.onHorn = () => {
      if (!this.playing || this.paused) return;
      this.audio.cue('honk');
      this.player.group.position.y = 0.05;
    };
  }

  private frame(): void {
    const delta = Math.min(this.clock.getDelta(), 0.034);
    if (!this.paused) {
      this.updateWorld(delta);
      if (this.playing) {
        this.updateDriving(delta);
        this.episode.update(delta);
        this.updateCamera(delta, this.episode.cameraPose);
        this.updateDirection();
      } else {
        this.updateIdle(delta);
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  private updateDriving(delta: number): void {
    const controls = this.input.state;
    const absoluteSpeed = Math.abs(this.speed);
    if (this.drivingLocked) {
      this.speed = THREE.MathUtils.damp(this.speed, 0, 7.5, delta);
    } else if (controls.forward && !controls.back) {
      this.speed += 4.8 * delta;
    } else if (controls.back && !controls.forward) {
      if (this.speed > 0.2) this.speed -= 9 * delta;
      else this.speed -= 2.9 * delta;
    } else {
      this.speed = THREE.MathUtils.damp(this.speed, 0, 1.35, delta);
    }

    const maximum = this.speedLimit ?? 7.4;
    if (this.speed > maximum) this.speed = Math.max(maximum, this.speed - 12.5 * delta);
    this.speed = THREE.MathUtils.clamp(this.speed, -2.5, 7.4);
    if (Math.abs(this.speed) < 0.015) this.speed = 0;

    const steer = Number(controls.left) - Number(controls.right);
    if (!this.drivingLocked && Math.abs(this.speed) > 0.08) {
      const turnRate = (0.54 + Math.min(absoluteSpeed, 4.5) * 0.055) * Math.sign(this.speed);
      this.heading += steer * turnRate * delta;
    }
    const distance = this.speed * delta;
    this.player.group.position.x += Math.sin(this.heading) * distance;
    this.player.group.position.z += Math.cos(this.heading) * distance;
    this.player.group.position.x = THREE.MathUtils.clamp(this.player.group.position.x, -35.5, 35.5);
    this.player.group.position.z = THREE.MathUtils.clamp(this.player.group.position.z, -84, 34.2);
    this.player.group.rotation.y = this.heading;
    this.player.group.rotation.z = THREE.MathUtils.damp(this.player.group.rotation.z, steer * -0.045 * Math.min(absoluteSpeed, 2.5), 5, delta);
    this.player.group.position.y = THREE.MathUtils.damp(this.player.group.position.y, 0, 9, delta);
    animateWheels(this.player, distance);
  }

  private updateCamera(delta: number, cinematic: CameraPose | null): void {
    let desiredPosition: THREE.Vector3;
    let desiredTarget: THREE.Vector3;
    let desiredFov = 50;

    if (cinematic) {
      desiredPosition = cinematic.position;
      desiredTarget = cinematic.target;
      desiredFov = cinematic.fov ?? 48;
    } else {
      const offset = new THREE.Vector3(0, 4.15, -8.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading);
      const lookAhead = new THREE.Vector3(Math.sin(this.heading) * 4.4, 1.55, Math.cos(this.heading) * 4.4);
      desiredPosition = this.player.group.position.clone().add(offset);
      desiredTarget = this.player.group.position.clone().add(lookAhead);
    }

    const cameraEase = 1 - Math.exp(-delta * (cinematic ? 2.2 : 5.4));
    this.camera.position.lerp(desiredPosition, cameraEase);
    this.cameraLook.lerp(desiredTarget, cameraEase);
    this.cameraBump = THREE.MathUtils.damp(this.cameraBump, 0, 5.5, delta);
    if (this.cameraBump > 0.008) {
      this.camera.position.x += Math.sin(performance.now() * 0.034) * this.cameraBump;
      this.camera.position.y += Math.cos(performance.now() * 0.029) * this.cameraBump * 0.45;
    }
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, desiredFov, 4, delta);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.cameraLook);
  }

  private updateIdle(delta: number): void {
    this.idleTime += delta;
    const target = this.player.group.position.clone().add(new THREE.Vector3(0, 1.65, 0.6));
    const angle = -0.85 + Math.sin(this.idleTime * 0.16) * 0.12;
    const desired = target.clone().add(new THREE.Vector3(Math.sin(angle) * 10.2, 4.3, Math.cos(angle) * 10.2));
    this.camera.position.lerp(desired, 1 - Math.exp(-delta * 1.8));
    this.cameraLook.lerp(target, 1 - Math.exp(-delta * 2));
    this.camera.lookAt(this.cameraLook);
  }

  private updateWorld(delta: number): void {
    this.campus.animated.forEach((object) => {
      object.position.x += Number(object.userData.drift ?? 0.15) * delta;
      if (object.position.x > 58) object.position.x = -58;
    });
  }

  private updateDirection(): void {
    const target = this.episode.target;
    if (!target) return;
    const offset = target.clone().sub(this.player.group.position);
    const worldAngle = Math.atan2(offset.x, offset.z);
    let relative = worldAngle - this.heading;
    relative = Math.atan2(Math.sin(relative), Math.cos(relative));
    this.hud.setDirection(relative, offset.length());
  }

  private setSpeedLimit(limit: number | null, safety = false): void {
    this.speedLimit = limit;
    this.hud.showSafety(safety && limit !== null && this.speed > limit + 0.08);
  }

  private setPaused(paused: boolean): void {
    if (!this.playing) return;
    this.paused = paused;
    this.input.reset();
    this.hud.setPaused(paused);
    if (!paused) this.clock.getDelta();
  }

  private complete(): void {
    this.drivingLocked = true;
    this.input.reset();
    this.hud.complete();
    localStorage.setItem('tire-town-episode-01', 'complete');
  }

  private resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 800 ? 1.5 : 2));
  }
}
