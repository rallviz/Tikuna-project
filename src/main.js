import './style.css';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer, water, sun, renderTarget, pmremGenerator;
const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
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

// Classe para carregar a vara de pescar
class Fishing {
  constructor(fish) {
    loader.load('assets/fishing/scene.gltf', (gltf) => {
      // Criando um grupo para definir o pivô de rotação
      this.fishingGroup = new THREE.Group();
      scene.add(this.fishingGroup);

      // Adicionando a vara ao grupo
      this.fishing = gltf.scene;
      this.fishing.scale.set(0.01, 0.01, 0.01);
      this.fishing.position.set(0, 4, -13);
      this.fishing.rotation.y = Math.PI / 2;
      this.fishing.rotation.z = Math.PI / 8;

      this.fishingGroup.add(this.fishing);

      this.pullStrength = 0.03;
      this.maxRotationX = Math.PI / 180;
      this.maxTiltAngle = Math.PI / 6; // Ângulo máximo de 15 graus (para esquerda/direita)
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

  initKeyListener() {
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

// Função para inicializar a cena
function init() {
  renderer = new THREE.WebGLRenderer(); //renderizar a cena 3D usando a API WebGL
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  document.body.appendChild(renderer.domElement);

  pmremGenerator = new THREE.PMREMGenerator(renderer); //reflexos realistas
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 20000);
  sun = new THREE.Vector3();

  const waterGeometry = new THREE.PlaneGeometry(400, 1000);
  water = new Water(waterGeometry, {
    textureWidth: 80,
    textureHeight: 80,
    waterNormals: textureLoader.load('assets/waternormals.jpg', (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }),
    sunDirection: new THREE.Vector3(), //vetor tridimensional
    sunColor: 0xff0000,
    waterColor: 0x1FB899,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
  });

  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  sky.scale.setScalar(20);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = 6; //turvação 
  skyUniforms['rayleigh'].value = 2; //dispersão 
  skyUniforms['mieCoefficient'].value = 0.005; //dispersão 
  skyUniforms['mieDirectionalG'].value = 0.8; //direção da dispersão

  updateSun();
  window.addEventListener('resize', onWindowResize);
}

// Função para atualizar a posição do sol
function updateSun() {
  if (parameters.elevation > minElevation) {
    parameters.elevation -= 0.0018;
  }

  const phi = THREE.MathUtils.degToRad(90 - parameters.elevation); //elevação do sol acima do horizonte
  const theta = THREE.MathUtils.degToRad(parameters.azimuth); //sol no plano horizontal

  sun.setFromSphericalCoords(1, phi, theta); //converter as coordenadas esféricas em coordenadas cartesianas
  sky.material.uniforms['sunPosition'].value.copy(sun);
  water.material.uniforms['sunDirection'].value.copy(sun).normalize();

  if (renderTarget !== undefined) renderTarget.dispose();

  const sunsetMessage = document.getElementById('sunsetMessage');
  if (parameters.elevation <= -2) {
    sunsetMessage.style.display = 'block'; // Mostra a mensagem
  }

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
  requestAnimationFrame(animate);
  updateSun();
  if (fishing) {
    fishing.update();
  }
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