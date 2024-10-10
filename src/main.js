import './style.css';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let water, sun;

const loader = new GLTFLoader();

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
    });
  }
}

// Instanciar o barco e a vara de pescar
const boat = new Boat();
const fishing = new Fishing();
let parameters = {
  elevation: 15,
  azimuth: 224
};
const sky = new Sky();
let renderTarget;
const sceneEnv = new THREE.Scene();
let pmremGenerator;// = new THREE.PMREMGenerator(renderer);

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
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // Configura o wrap do texture
      }),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined
    }
  );

  water.rotation.x = -Math.PI / 2; // Rotaciona a água
  water.frustumCulled = true; // Limita a renderização ao campo de visão
  scene.add(water); // Adiciona a água à cena

  // Criação do céu
  sky.scale.setScalar(50); // Escala do céu
  sky.frustumCulled = true; // Limita a renderização ao campo de visão
  scene.add(sky); // Adiciona o céu à cena

  const skyUniforms = sky.material.uniforms;

  // Configurações do céu
  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 2;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;
  
  /*let parameters = {
    elevation: 0,
    azimuth: 224
    };*/
    

  // Função para atualizar a posição do sol
  /*function updateSun() {
    parameters.elevation+= 1;
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
    scene.environment = renderTarget.texture; // Configura o ambiente da cena
  }*/

  updateSun(sky, renderTarget, sceneEnv, pmremGenerator); // Chama a função para atualizar o sol

  const waterUniforms = water.material.uniforms;

  // Evento de resize da janela
  window.addEventListener('resize', onWindowResize);
}

function updateSun(sky, renderTarget, sceneEnv, pmremGenerator) {
  parameters.elevation+= 0.5;
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
  scene.environment = renderTarget.texture; // Configura o ambiente da cena
}

function onWindowResize() {
  // Atualiza a câmera e o renderizador quando a janela é redimensionada
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  //updateSun();
    updateSun(sky, renderTarget, sceneEnv, pmremGenerator); // Chama a função para atualizar o sol
  requestAnimationFrame(animate); // Chama a função de animação
  render(); // Renderiza a cena
  camera.position.set(0, 5, 0); // Define a posição da câmera
}

function render() {
  water.material.uniforms['time'].value += 0.008 / 60.0; // Atualiza o tempo da água
  renderer.render(scene, camera); // Renderiza a cena
}