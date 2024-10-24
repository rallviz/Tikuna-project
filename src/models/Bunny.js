import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export class Bunny {
    constructor(scene) {
      loader.load('assets/bunny/scene.gltf', (gltf) => {
        scene.add(gltf.scene);
        gltf.scene.scale.set(1, 1, 1);
        gltf.scene.position.set(0, 4, -2);
        gltf.scene.rotation.y = Math.PI;
      });
    }
  }