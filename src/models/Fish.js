import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export class Fish {
    constructor(scene) {
      loader.load('assets/fish/scene.gltf', (gltf) => {
        scene.add(gltf.scene);
        gltf.scene.scale.set(2, 2, 2);
        gltf.scene.position.set(0, 6, -5);
        gltf.scene.rotation.y = Math.PI / 2;
        this.fish = gltf.scene;
        this.fish.visible = false;
        this.isCaught = false;
      });
    }
  
    showFish() {
      if (this.fish) {
        this.fish.visible = true;
        this.fish.scale.set(0, 0, 0);
        // Animação de aumento de escala
        const animateFish = (scale, z) => {
          if (scale < 3) {
            this.fish.scale.set(scale, scale, scale);
            this.fish.position.z = z;
            requestAnimationFrame(() => animateFish(scale + 0.1, z + 0.1));
          }
        };
        animateFish(0, -10); // Inicia a animação a partir de -10
        console.log("Peixe visível na tela!");
      }
    }
  
    hideFish() {
      if (this.fish) {
        this.fish.visible = false;
        console.log("Peixe escondido na tela!");
      }
    }
  }