// Boat.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export class Boat {
    constructor(scene) {
        loader.load('assets/boat/scene.gltf', (gltf) => {
            scene.add(gltf.scene);
            gltf.scene.scale.set(3, 3, 3);
            gltf.scene.position.set(0, 0, 0);
            gltf.scene.rotation.y = Math.PI;
        });
    }
}
