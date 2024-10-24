import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let cameraView = false;
let fishCount = 0;
const loader = new GLTFLoader();

export class Fishing {
    constructor(scene, fish) {
      loader.load('assets/fishing/scene.gltf', (gltf) => {
        // Criando um grupo para definir o pivô de rotação
        this.fishingGroup = new THREE.Group();
        scene.add(this.fishingGroup);
  
        // Adicionando a vara ao grupo
        this.fishing = gltf.scene;
        this.fishing.scale.set(0.01, 0.01, 0.01);
        this.fishing.position.set(0, 5, -12);
        this.fishing.rotation.y = Math.PI / 2;
        this.fishing.rotation.z = Math.PI / 8;
  
        this.fishingGroup.add(this.fishing);
  
        this.pullStrength = 0.03;
        this.maxRotationX = Math.PI / 180;
        this.maxTiltAngle = Math.PI / 12; // Ângulo máximo de 15 graus (para esquerda/direita)
        this.currentTiltAngle = 0;
        this.isFishing = false;
        this.fish = fish;
  
        this.setupRandomFishing();
        this.initKeyListener();
      });
    }
  
    setupRandomFishing() {
      const randomInterval = Math.random() * 3000 + 2000;
      setTimeout(() => {
        this.isFishing = true;
        setTimeout(() => {
          this.isFishing = false;
          this.setupRandomFishing();
        }, 2000);
      }, randomInterval);
    }
  
    catchFish() {
      if (this.isFishing) {
        console.log("Peixe capturado!");
        this.isFishing = false;
        this.fish.showFish();
  
        fishCount++;
        document.getElementById('fishCounter').innerText = `Peixes capturados: ${fishCount}`;
  
        setTimeout(() => {
          this.fish.hideFish();
        }, 1000);
      }
    }
  
    initKeyListener(camera) {
      window.addEventListener('keydown', (event) => {
        // Controle de pegar peixe (tecla para cima)
        if (event.key === 'ArrowUp') {
          this.catchFish();
        }
  
        // Controle de inclinação para a esquerda (tecla para esquerda)
        if (event.key === 'ArrowLeft') {
          if (this.currentTiltAngle > -this.maxTiltAngle) {
            this.fishingGroup.rotation.z += Math.PI / 180; // Inclina a ponta para a esquerda
            this.currentTiltAngle -= Math.PI / 180;
          }
        }
  
        // Controle de inclinação para a direita (tecla para direita)
        if (event.key === 'ArrowRight') {
          if (this.currentTiltAngle < this.maxTiltAngle) {
            this.fishingGroup.rotation.z -= Math.PI / 180; // Inclina a ponta para a direita
            this.currentTiltAngle += Math.PI / 180;
          }
        }
  
        if (event.key === ' ') {
          toggleCameraView(camera);
        }

      });
    }
  
    update() {
      if (this.fishing && this.isFishing) {
        if (this.fishing.rotation.x < this.maxRotationX) {
          this.fishing.rotation.x += this.pullStrength;
        } else {
          this.fishing.rotation.x -= this.pullStrength;
        }
      }
    }
}

function toggleCameraView(camera) {
    if (cameraView) {
      // Mudar para a primeira posição de câmera
      camera.position.set(0, 5, -3);  // Posição original (ou qualquer uma que você queira)
    } else {
      // Mudar para a segunda posição de câmera
      camera.position.set(0, 9, 22);
    }
    cameraView = !cameraView;
  };