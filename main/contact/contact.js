import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

let camera, scene, renderer, group, container, randomColor, mouseX, mouseY;

let composer, fxaaPass, afterimagePass;

const clock = new THREE.Clock();

init();
animate();

function init() {

  // select DOM element that will be used to render scene
  container = document.getElementById( 'container' );

  // create a camera using the container for dimensions & set its position
  camera = new THREE.PerspectiveCamera( 45, container.offsetWidth / container.offsetHeight, 1, 2000 );
  camera.position.set(0, 0, 300);

  // create a scene, no background, add fog - helps provide perspective
  scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.FogExp2( 0x000000, 0.005 );

  // create lighting
  const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444, 1 );
  hemiLight.position.set( 0, 1000, 0 );

  const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
  dirLight.position.set( - 3000, 1000, - 1000 );
  scene.add( dirLight, hemiLight );

  // create a group to store the generated three objects
  group = new THREE.Group();

  // create objects
  for ( let i = 0; i < 150; i ++ ) {

    // make cubes
    const geometry = new THREE.BoxGeometry( 2, 2, 2 );
    const material = new THREE.MeshStandardMaterial( { color: 0xffffff, flatShading: true } );
    const mesh = new THREE.Mesh( geometry, material );

    // random coordinates generated and positions set
    const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(200));
    mesh.position.set(x, y, z);
    mesh.rotation.set(x, y, z);

    // scale object
    mesh.scale.setScalar( Math.random() * 2 );
    
    // set colours
    mesh.material.color.setHex(0x7FFFD4);
    if (i % 5 == 0) {
      mesh.material.color.setHex(0xFF1493);
    }

    // add objects to the group
    group.add( mesh );

  }

  // add group to the scene
  scene.add( group );

  // create renderer
  renderer = new THREE.WebGLRenderer({alpha: true});
  renderer.setClearColor (0xff0000, 1);
  renderer.autoClear = false;
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( container.offsetWidth, container.offsetHeight );
  renderer.toneMapping = THREE.ReinhardToneMapping;
  container.appendChild( renderer.domElement );

  // set scene controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 25;
  controls.maxDistance = 450;
  controls.enableDamping = true;
  controls.enablePan = false;

  // post processing
  const renderPass = new RenderPass( scene, camera );
  renderPass.clearColor = new THREE.Color( 0, 0, 0 );
  renderPass.clearAlpha = 0;
  
  // after image - trail effect
  afterimagePass = new AfterimagePass();
  afterimagePass.uniforms[ 'damp' ].value = 0.95;

  // bloom
  const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
  bloomPass.threshold = 0;
  bloomPass.strength = 1.8;
  bloomPass.radius = 0.4;
  renderer.toneMappingExposure = 1.5;

  // FXAA
  fxaaPass = new ShaderPass( FXAAShader );
  const pixelRatio = renderer.getPixelRatio();

  fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( container.offsetWidth * pixelRatio );
	fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( container.offsetHeight * pixelRatio );

  // composers, pass on the post processing effects
  composer = new EffectComposer( renderer );
  composer.addPass( renderPass );
  composer.addPass( fxaaPass );
  composer.addPass( afterimagePass );
  composer.addPass( bloomPass );

  // event listeners for window resize and mouse movement
  window.addEventListener( 'resize', onWindowResize );
  document.addEventListener('mousemove', animateParticles);
}

// animation on mouse movement
function animateParticles(event) {
  mouseY = event.clientY;
  mouseX = event.clientX;
}

// window resize
function onWindowResize() {

  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( container.offsetWidth, container.offsetHeight );
  composer.setSize( container.offsetWidth, container.offsetHeight );

  const pixelRatio = renderer.getPixelRatio();

  fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( container.offsetWidth * pixelRatio );
  fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( container.offsetHeight * pixelRatio );
}

// random hex value generator
function generateRandomColor() {
  let letters = '0123456789ABCDEF';
  let color = '0x';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// animate the scene
function animate() {

  const elapsedTime = clock.getElapsedTime()

  requestAnimationFrame( animate );

  group.rotation.y += 0.0003;
  group.rotation.z += 0.0004;
  group.rotation.x += - 0.0001;

  if (mouseX > 0) {
    group.rotation.x = -mouseY * 0.0003;
    group.rotation.y = -mouseX * 0.0003;
  }

  composer.render();

}