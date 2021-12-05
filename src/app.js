import './style.scss'
import * as THREE from 'three'
import {Pane} from 'tweakpane';

import vertexShader from './shaders/vert.glsl'

import fragmentShader1 from './shaders/frag1.glsl'


import fragmentShader2 from './shaders/frag2.glsl'

import fragmentShader from './shaders/frag.glsl'


import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const canvas = document.querySelector('canvas.webgl')

const scene = new THREE.Scene()

import  * as faceFilter from './jeelizFaceFilter.module.js'

const neuralNetworkModel = require('./NN_DEFAULT.json')



const webcamElement = document.getElementById('webcam')

const webcamCanvas = document.getElementById('webcamCanvas')

let shaderArr = [fragmentShader, fragmentShader1, fragmentShader2]
let selected = 0


let scaleMutiply = 2.3

function setupWebcam() {
  return new Promise((resolve, reject) => {
    const navigatorAny = navigator
    navigator.getUserMedia = navigator.getUserMedia ||
            navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
            navigatorAny.msGetUserMedia
    if (navigator.getUserMedia) {
      navigator.getUserMedia({ video: true },
        stream => {
          webcamElement.srcObject = stream
          webcamElement.addEventListener('loadeddata', () => {

            resolve()


            faceFilter.init({
              canvasId: 'webcamCanvas',
              NNC: neuralNetworkModel, // instead of NNCPath
              callbackReady: function(errCode, spec){
                if (errCode){
                  console.log('AN ERROR HAPPENS. ERR =', errCode);
                  return;
                }

                console.log('INFO: JEELIZFACEFILTER IS READY');

              },
              callbackTrack: function(detectState){
                console.log
                maskM.position.x = detectState.x
                maskM.position.y = detectState.y

                maskM.rotation.x = detectState.rx
                maskM.rotation.y = detectState.ry
                maskM.rotation.z = detectState.rz
                if((detectState.detected > .2)){

                maskM.scale.set(  detectState.s * scaleMutiply,  detectState.s * scaleMutiply,  detectState.s * scaleMutiply)
              }

              // Render your scene here
              // [... do something with detectState]
              } //end callbackTrack
              // ... other init parameters
            })
          } , false)
        },
        error => reject())
    } else {
      reject()
    }
  })
}

setupWebcam()




const maskMaterial  = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: true,
  uniforms: {
    uTime: { value: 0},
    uResolution: { type: 'v2', value: new THREE.Vector2() },
    uMouse: {
      value: {x: 0.5, y: 0.5}
    },
    uA: {value: .03},
    uB: {value: 3.0},
    uC: {value: .2},
    uD: {value: 1.0}
  },
  vertexShader: vertexShader,
  fragmentShader: shaderArr[selected],
  side: THREE.DoubleSide
})


function change(){
  if(selected < shaderArr.length-1){
    selected ++
  } else if(selected === shaderArr.length-1){
    selected ++

    // mask = sceneGroup
    scene.remove(maskM)
    scene.add(sceneGroup)
    maskM = sceneGroup
    scaleMutiply = 4.6
  } else{
    selected = 0
    scene.remove(sceneGroup)
    maskM = mask
    scene.add(maskM)
    scaleMutiply = 0.6
  }
  maskMaterial.needsUpdate = true
  maskMaterial.fragmentShader = shaderArr[selected]
}


document.querySelector('#change').addEventListener('click', (e) => {
  change()

})

document.querySelector('#change2').addEventListener('click', (e) => {
  change()

})




const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () =>{



  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2 ))

})


/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 15
scene.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true
})
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor( 0x000000, 0. )
const mouse = new THREE.Vector2()


var geometry = new THREE.SphereGeometry(4, 64, 64, 0, 3, )


let mask = new THREE.Mesh(geometry, maskMaterial)

let maskM = mask

scene.add(maskM)

const light = new THREE.AmbientLight( 0x404040 ) // soft white light
scene.add( light )

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1.25 )
scene.add( directionalLight )


const gtlfLoader = new GLTFLoader()

let sceneGroup


gtlfLoader.load(
  'duck.glb',
  (gltf) => {


    sceneGroup = gltf.scene
    sceneGroup.needsUpdate = true
    sceneGroup.position.y = 2


  }
)

const PARAMS = {
  uA: 0.03,
  uB: 3.,
  uC: 0.2,
  uD: 1.

}
const pane = new Pane()

const inputA = pane.addInput(
  PARAMS, 'uA',
  {min: 0.03, max: 1, step: 0.01}
)

inputA.on('change', function(ev) {
  maskMaterial.uniforms.uA.value = ev.value
})

const inputB = pane.addInput(
  PARAMS, 'uB',
  {min: 3., max: 10., step: 1.}
)

inputB.on('change', function(ev) {
  maskMaterial.uniforms.uB.value = ev.value
})

const inputC = pane.addInput(
  PARAMS, 'uC',
  {min: 0.2, max: 1, step: 0.05}
)

inputC.on('change', function(ev) {
  maskMaterial.uniforms.uC.value = ev.value
})


const inputD = pane.addInput(
  PARAMS, 'uD',
  {min: 0.1, max: 3, step: 0.1}
)

inputD.on('change', function(ev) {
  maskMaterial.uniforms.uD.value = ev.value
})


const clock = new THREE.Clock()

const tick = () =>{

  const elapsedTime = clock.getElapsedTime()

  maskMaterial.uniforms.uTime.value = elapsedTime

  // Update controls
  // controls.update()
  maskMaterial.needsUpdate = true


  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()



let settings;

const newSettings = () => {
  settings = new Array(4).fill().map(_ => new Array(3).fill().map(_ => Math.random()));
};

newSettings();

const pal = (
  t = 0,
  a = [0.5, 0.5, 0.5],
  b = [0.5, 0.5, 0.5],
  c = [1.0, 1.0, 1.0],
  d = [0.00, 0.33, 0.67]
) => c.map(
  (cc, i) =>
    Math.cos(
      cc * t + d[i] * 6.28318 * maskMaterial.uniforms.uD.value
    ) * b[i] + a[i]
);

let t = 0;

function draw() {
  t += .5;
  const c = new Array(100).fill().map((_,i) => `rgb(${pal(
    ((i + t) / 100) * (Math.PI * 2),
    settings[0], settings[1], settings[2], settings[3]
  ).map(e => e * 255).join(',')})`).map((rgb,i) => `${rgb} ${i/100 * 100}% ${(i+1)/100 * 100}%`).join(',');
  document.getElementById('body').style.background = `linear-gradient(${c})`;

  const d = new Array(30 ).fill().map((_,i) => `rgb(${pal(
    ((i + t) / 100) * (Math.PI * 2),
    settings[1], settings[0], settings[3], settings[2]
  ).map(e => e * 255).join(',')})`).map((rgb,i) => `${rgb} ${i/30 * 100}% ${(i+1)/30 * 100}%`).join(',');

  document.getElementById('webcam').style.background = `linear-gradient(${d})`;

  requestAnimationFrame(draw)
}

draw()
