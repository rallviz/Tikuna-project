import './style.css';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer, water, sun, renderTarget, pmremGenerator;
const loader = new GLTFLoader();
const sceneEnv = new THREE.Scene();
let parameters = { elevation: 15, azimuth: 200 };
const minElevation = -2; // Elevação mínima
const sky = new Sky();

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

// Classe para carregar a vara de pescar
class Fishing {
  constructor() {
    loader.load('assets/fishing/scene.gltf', (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(0.01, 0.01, 0.01);
      gltf.scene.position.set(0, 4, -13);
      gltf.scene.rotation.y = Math.PI / 2;
      gltf.scene.rotation.z = Math.PI / 8;

      this.fishing = gltf.scene
      this.speed = {
        vel: 0,
        rot: 0
      };
      // Novos parâmetros de animação
      this.pullStrength = 0.03;  // Força do puxão
      this.maxRotationX = Math.PI / 180; // Limite de inclinação
    });
  }

  stop() {
    this.speed.vel = 0
    this.speed.rot = 0
  }
  update() {
    if (this.fishing) {
      // Inclinação da vara simulando o puxão do peixe (limite em maxRotationX)
      if (this.fishing.rotation.x < this.maxRotationX) {
        this.fishing.rotation.x += this.pullStrength;
      } else {
        // Se atingir o limite, faz com que a vara volte à posição inicial
        this.fishing.rotation.x -= this.pullStrength;
      }
    }
  }
}

// Instanciar o barco e a vara de pescar
const boat = new Boat();
const fishing = new Fishing();

init();
animate();

function init() {
  // Configuração do renderizador
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

  // Criação da geometria da água
  const waterGeometry = new THREE.PlaneGeometry(1000, 1000);

  // Criação da água
  water = new Water(
    waterGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('assets/waternormals.jpg', (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined
    }
  );

  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  // Criação do céu
  sky.scale.setScalar(50);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 2;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;

  updateSun();

  window.addEventListener('resize', onWindowResize);

  window.addEventListener('keydown', function (e) {
    if (e.key == "ArrowUp") {
      fishing.speed.vel = -0.03
    }
    if(e.key == "ArrowDown"){
      fishing.speed.vel = 0.03
    }
    if(e.key == "ArrowRigth"){
      fishing.speed.rot = -0.03
    }
    if(e.key == "ArrowLeft"){
      fishing.speed.rot = 0.03
    }
  })

  window.addEventListener('keyup', function(e){
    fishing.stop()
  })
}

function updateSun() {

  if (parameters.elevation > minElevation) {
    parameters.elevation -= 0.01; // Diminui a elevação do sol
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

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  fishing.update();
  requestAnimationFrame(animate);
  render();
  camera.position.set(0, 5, 0);
}

function render() {
  water.material.uniforms['time'].value += 0.008 / 60.0;
  renderer.render(scene, camera);
}
