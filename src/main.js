import './style.css';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Boat } from './models/Boat';
import { Fish } from './models/Fish';
import { Bunny } from './models/Bunny';
import { Fishing } from './models/Fishing';

let camera, scene, renderer, water, sun, renderTarget, pmremGenerator;
scene = new THREE.Scene();
const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const sceneEnv = new THREE.Scene();
let parameters = { elevation: 6, azimuth: 200 };
const sky = new Sky();
const minElevation = -2;
camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 20000);
camera.position.set(0, 5, -3);  // Posição original (ou qualquer uma que você queira)

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
  sun = new THREE.Vector3();

  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
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

  sky.scale.setScalar(300);
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
// Função para animação
function animate() {
  //updateSun();
  requestAnimationFrame(animate);
  if (fishing) {
    fishing.update();
  }

  render();
}

// Função de renderização
function render() {
  water.material.uniforms['time'].value += 0.008 / 60.0;
  renderer.render(scene, camera);
}

// Instanciar o barco, o peixe e a vara de pescar
const boat = new Boat(scene); // Passa a cena aqui
const bunny = new Bunny(scene);
const fish = new Fish(scene);
const fishing = new Fishing(scene, fish);
fishing.initKeyListener(camera);

init();
animate();