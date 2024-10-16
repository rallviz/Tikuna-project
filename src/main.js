import './style.css';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer, water, sun, renderTarget, pmremGenerator;
const loader = new GLTFLoader();
const sceneEnv = new THREE.Scene();
let parameters = { elevation: 6, azimuth: 200 };
const minElevation = -2;
const sky = new Sky();
let fishCount = 0;

// Classe para carregar o barco
class Boat {
  constructor() {
    loader.load('assets/boat/scene.gltf', (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(3, 3, 3);
      gltf.scene.position.set(0, 0, 0);
      gltf.scene.rotation.y = Math.PI;
    });
  }
}

// Classe para carregar e animar o peixe
class Fish {
  constructor() {
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
        this.fish.visible = true; // Torna o peixe visível
        this.fish.scale.set(0, 0, 0); // Inicia com escala 0
        // Animação de aumento de escala
        const animateFish = (scale, z) => {
            if (scale < 3) { // Alvo da escala
                this.fish.scale.set(scale, scale, scale);
                this.fish.position.z = z; // Atualiza a posição Z do peixe
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
      this.isCaught = false;
      console.log("Peixe escondido na tela!");
    }
  }
}

// Classe para carregar a vara de pescar
class Fishing {
  constructor(fish) {
    loader.load('assets/fishing/scene.gltf', (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(0.01, 0.01, 0.01);
      gltf.scene.position.set(0, 4, -13);
      gltf.scene.rotation.y = Math.PI / 2;
      gltf.scene.rotation.z = Math.PI / 8;

      this.fishing = gltf.scene;
      this.pullStrength = 0.03;
      this.maxRotationX = Math.PI / 180;
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

  initKeyListener() {
    window.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowUp') {
        this.catchFish();
      }
    });
  }

  stop() {
    this.isFishing = false;
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

// Função para inicializar a cena
function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  document.body.appendChild(renderer.domElement);

  pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 20000);
  sun = new THREE.Vector3();

  const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load('assets/waternormals.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xff0000,
    waterColor: 0x1FB899,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
  });

  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  sky.scale.setScalar(50);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 2;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;

  updateSun();
  window.addEventListener('resize', onWindowResize);
}

// Função para atualizar a posição do sol
function updateSun() {
  if (parameters.elevation > minElevation) {
      parameters.elevation -= 0.006;
  }

  const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
  const theta = THREE.MathUtils.degToRad(parameters.azimuth);

  sun.setFromSphericalCoords(1, phi, theta);
  sky.material.uniforms['sunPosition'].value.copy(sun);
  water.material.uniforms['sunDirection'].value.copy(sun).normalize();

  if (renderTarget !== undefined) renderTarget.dispose();

  sceneEnv.add(sky);
  renderTarget = pmremGenerator.fromScene(sceneEnv);
  scene.remove(sky);
  scene.add(sky);
  scene.environment = renderTarget.texture;
}

// Função para tratar o redimensionamento da janela
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Função para animação
function animate() {
  updateSun();
  if (fishing) {
    fishing.update();
  }

  requestAnimationFrame(animate);
  render();
  camera.position.set(0, 5, 0);
}

// Função de renderização
function render() {
  water.material.uniforms['time'].value += 0.008 / 60.0;
  renderer.render(scene, camera);
}

// Instanciar o barco, o peixe e a vara de pescar
const boat = new Boat();
const fish = new Fish();
const fishing = new Fishing(fish);

init();
animate();