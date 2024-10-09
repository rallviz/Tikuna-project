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
      gltf.scene.scale.set(3, 3, 3); // Define a escala do barco
      gltf.scene.position.set(0, 0, 0); // Coloca o barco na origem
      gltf.scene.rotation.y = Math.PI; // Rotaciona o barco 180 graus
    });
  }
}

// Classe para carregar a vara de pescar
class Fishing {
  constructor() {
    loader.load('assets/fishing/scene.gltf', (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(0.01, 0.01, 0.01); // Define a escala da vara de pescar
      gltf.scene.position.set(0, 4, -13); // Posição da vara de pescar
      gltf.scene.rotation.y = Math.PI / 2; // Rotaciona a vara de pescar 90 graus
      gltf.scene.rotation.z = Math.PI / 8; // Rotaciona a vara de pescar um pouco
    });
  }
}

// Instanciar o barco e a vara de pescar
const boat = new Boat();
const fishing = new Fishing();

init(); // Chama a função de inicialização
animate(); // Inicia a animação

function init() {
  // Configuração do renderizador
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  document.body.appendChild(renderer.domElement);

  // Criação da cena
  scene = new THREE.Scene();

  // Configuração da câmera
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
  const sky = new Sky();
  sky.scale.setScalar(50); // Escala do céu
  sky.frustumCulled = true; // Limita a renderização ao campo de visão
  scene.add(sky); // Adiciona o céu à cena

  const skyUniforms = sky.material.uniforms;

  // Configurações do céu
  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 2;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;

  const parameters = {
    elevation: 2,
    azimuth: 180
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const sceneEnv = new THREE.Scene();
  let renderTarget;

  // Função para atualizar a posição do sol
  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    if (renderTarget !== undefined) renderTarget.dispose();

    sceneEnv.add(sky);
    renderTarget = pmremGenerator.fromScene(sceneEnv);
    scene.add(sky);
    scene.environment = renderTarget.texture; // Configura o ambiente da cena
  }

  updateSun(); // Chama a função para atualizar o sol

  const waterUniforms = water.material.uniforms;

  // Evento de resize da janela
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  // Atualiza a câmera e o renderizador quando a janela é redimensionada
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate); // Chama a função de animação
  render(); // Renderiza a cena
  camera.position.set(0, 5, 0); // Define a posição da câmera
}

function render() {
  water.material.uniforms['time'].value += 0.008 / 60.0; // Atualiza o tempo da água
  renderer.render(scene, camera); // Renderiza a cena
}