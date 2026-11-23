import * as THREE from 'three';

export type DriveControl = 'forward' | 'back' | 'left' | 'right';

export interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
}

export type Expression = 'happy' | 'curious' | 'surprised' | 'worried' | 'shy';

export interface VehicleRig {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  pupils: THREE.Mesh[];
  eyebrows: THREE.Mesh[];
  mouth: THREE.Mesh;
  baseMouthY: number;
  expression: Expression;
}

export interface CampusWorld {
  root: THREE.Group;
  schoolFocus: THREE.Vector3;
  arrivalTarget: THREE.Vector3;
  crossingTarget: THREE.Vector3;
  tireCorner: THREE.Vector3;
  animated: THREE.Object3D[];
}

export interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov?: number;
}

export interface ObjectiveCopy {
  step: number;
  english: string;
  chinese: string;
  target?: THREE.Vector3;
}

export type StoryChoice = 'intro' | 'poppy';
