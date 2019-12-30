/*!
 * IOTA Fountain
 * Copyright(c) 2018 Peter Ryszkiewicz
 * MIT Licensed
 */

// Modified from https://github.com/google/liquidfun
// TODO: Refactor

import Emitter from 'events'

import FountainSimulator from './FountainSimulator'
import UserDataIndexConverter from './UserDataIndexConverter'
import BufferedEmitter from './BufferedEmitter'
import Style from './Style'
import MobileDetect from 'mobile-detect'

const THREE = require('three')

const desktopAspectRatio = 16 / 9
const hoveredTxEmitter = new Emitter()
const mobileDetect = new MobileDetect(window.navigator.userAgent)

let canvas
let threeRenderer
let camera
let scene
let raycaster
let mouseVector3 = new THREE.Vector3(-1000, -1000, 50)
let hoveredObject
let style
let startedSimulation = false
let isRendering = false
let fountainWorld

// try metaball algo for water behavior https://github.com/stemkoski/stemkoski.github.com/blob/f5c7120af8488d04255b3e4492f4fb214d80b6ff/Three.js/Metaballs.html

function getHoveredObject() {
  raycaster.setFromCamera(mouseVector3, camera)
  const intersectedObjects = raycaster.intersectObjects(scene.children)
  if(intersectedObjects.length === 0) {
    return null
  }

  const closestIntersectedObject = intersectedObjects[0]
  return closestIntersectedObject
}

function getWindowWidth() {
  return window.innerWidth
}

function getCanvasWidth() {
  return 0.8 * getWindowWidth()
}

function getCanvasHeight() {
  return getCanvasWidth() / desktopAspectRatio
}

function getCanvasTop() {
  return canvas.getBoundingClientRect().top
}

function onWindowResize() {
  camera.aspect = desktopAspectRatio
  camera.updateProjectionMatrix()
  threeRenderer.setSize(getCanvasWidth(), getCanvasHeight())
}

function drawParticleSystems(hoveredObject) {
  drawParticles(
    particlesFromParticleSystems(fountainWorld.particleSystems),
    hoveredObject)
}

function createBasicMaterial({ colorHex }) {
  return new THREE.MeshBasicMaterial({
    color: colorHex,
    opacity: 1.0
  })
}

function createParticleMesh() {
  const coreSphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.008),
    new THREE.MeshBasicMaterial({ color: 0xf8f8f8 }))

  const parentSphereMesh = new THREE.Mesh(new THREE.SphereGeometry(glowingSphereRadius), new THREE.MeshBasicMaterial({
    transparent: true,
    colorWrite: false
  }))
  parentSphereMesh.scale.multiplyScalar(style.sphereScale)

  const coloredSphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(glowingSphereRadius),
    createBasicMaterial({colorHex: "#ffaa44"}))
  coloredSphereMesh.scale.multiplyScalar(style.sphereScale)

  parentSphereMesh.add(coreSphereMesh)
  parentSphereMesh.add(coloredSphereMesh)

  parentSphereMesh.userData.coreSphere = coreSphereMesh
  parentSphereMesh.userData.coloredSphereMesh = coloredSphereMesh

  return parentSphereMesh
}

function createParticleMeshes() {
  for(let i = 0; i < 15; ++i) {
    const particleMesh = createParticleMesh()
    particleMeshes.push(particleMesh)
    scene.add(particleMesh)
  }
}

function drawParticles(particleInfos, hoveredObject) {
  while(particleMeshes.length < particleInfos.length) {
    createParticleMeshes()
  }

  for (let i = 0; i < particleMeshes.length; ++i) {
    if(i >= particleInfos.length) {
      particleMeshes[i].visible = false
      continue
    }

    configureParticleMesh({
      particleMesh: particleMeshes[i],
      particleInfo: particleInfos[i],
      hoveredObject
    })
  }
}

function addPolygonToScene({ polygon, transform, scene }) {
  const vertices = polygon.vertices
  const vertexCount = vertices.length

  for(let i = 0; i < vertexCount; ++i) {
    const nextI = (i + 1) % vertexCount

    const transformedV1 = new b2Vec2()
    const transformedV2 = new b2Vec2()
    const v1 = vertices[i]
    const v2 = vertices[nextI]

    b2Vec2.Mul(transformedV1, transform, v1)
    b2Vec2.Mul(transformedV2, transform, v2)

    scene.add(createGlowingCylinderGroup({
      startV3: new THREE.Vector3(transformedV1.x, transformedV1.y, 0),
      endV3: new THREE.Vector3(transformedV2.x, transformedV2.y, 0)
    }))
  }
}

const particleMeshes = []
const glowingSphereRadius = 0.05

function particlesFromParticleSystems(particleSystems) {
  const particlesInfo = []
  particleSystems.forEach((system) => {
    const particleXYPositions = system.GetPositionBuffer()
    const particleCount = particleXYPositions.length / 2
    const particleColorBuffer = system.GetColorBuffer()
    for(let i = 0; i < particleCount; ++i) {
      const userDataIndex = UserDataIndexConverter.userDataIndexFromColorBuffer({ colorBuffer: particleColorBuffer, index: i })
      particlesInfo.push({
        x: particleXYPositions[2 * i],
        y: particleXYPositions[2 * i + 1],
        z: 0.0001 * i + 0.1,
        ...userData[userDataIndex]
      })
    }
  })
  return particlesInfo
}

function configureParticleMesh({ particleMesh, particleInfo, hoveredObject }) {
  particleMesh.visible = true
  particleMesh.position.set(particleInfo.x, particleInfo.y, particleInfo.z)
  particleMesh.userData.tx = particleInfo.tx
  const lightness = particleMesh === (hoveredObject && hoveredObject.object) ? 0.8 : particleInfo.color.l
  particleMesh.userData.coloredSphereMesh.material.color.setHSL(
    particleInfo.color.h,
    particleInfo.color.s,
    lightness,
  )
}

function initCamera() {
  const camera = new THREE.OrthographicCamera(-6, 6, 5.5, -0.5, 1, 10)
  camera.position.x = 0
  camera.position.y = 2.5
  camera.position.z = 9
  camera.lookAt(new THREE.Vector3(0, 0, 0))
  return camera
}

function createGlowingCylinderGroup({ startV3, endV3 }) {
  const solidCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01), new THREE.MeshBasicMaterial({ color: 0xe9b7ff }))
  const glowingCylinder = new THREE.Mesh(new THREE.CylinderGeometry(style.glowingCylinderRadius, style.glowingCylinderRadius), style.getGlowingCylinderMaterial())
  const cylinderGroup = new THREE.Group()
  cylinderGroup.add(solidCylinder)
  cylinderGroup.add(glowingCylinder)

  const length = startV3.distanceTo(endV3)
  const scaleY = length
  const scaleMatrix4 = new THREE.Matrix4()
  scaleMatrix4.makeScale(1, scaleY, 1)
  cylinderGroup.applyMatrix(scaleMatrix4)

  const middleV3 = new THREE.Vector3().addVectors(startV3, endV3).divideScalar(2)
  cylinderGroup.translateX(middleV3.x)
  cylinderGroup.translateY(middleV3.y)

  const delta = new THREE.Vector3().subVectors(endV3, startV3)
  const cylinderStartingParallel = new THREE.Vector3(0, 1, 0)
  const angle = cylinderStartingParallel.angleTo(delta) * -(Math.sign(delta.x) || 1)
  const unitZVector = new THREE.Vector3(0, 0, 1)
  cylinderGroup.rotateOnAxis(unitZVector, angle)

  return cylinderGroup
}

async function init({ _canvas, _style }) {
  canvas = _canvas
  scene = new THREE.Scene()
  camera = initCamera()
  raycaster = new THREE.Raycaster(
    camera.position.clone(),
    new THREE.Vector3(0, 0, 0),
    0, 200)

  style = _style || (isOnMobile() ? Style.basicStyle : Style.shaderStyle)

  particleMeshes.splice(0, particleMeshes.length)

  if(!startedSimulation) {
    startedSimulation = true
    fountainWorld = FountainSimulator.init()
  }

  for (let i = 0, max = fountainWorld.bodies.length; i < max; ++i) {
    const body = fountainWorld.bodies[i]
    const maxFixtures = body.fixtures.length
    const transform = body.GetTransform()
    for (let j = 0; j < maxFixtures; ++j) {
      addPolygonToScene({ polygon: body.fixtures[j].shape, transform, scene })
    }
  }

  try {
    threeRenderer = new THREE.WebGLRenderer({ antialias: true, canvas })
  } catch(error) {
    console.error(`Error while initializing three renderer`)
    return
  }

  threeRenderer.setClearColor(0x111111)
  threeRenderer.setSize(getCanvasWidth(), getCanvasHeight())
  threeRenderer.setPixelRatio(window.devicePixelRatio || 1)

  if(!isRendering) {
    isRendering = true

    render()

    window.addEventListener('resize', onWindowResize, false)
    document.addEventListener('mousemove', onMouseMove, false)

    BufferedEmitter.emitter.on('item', userDataIndex => {
      FountainSimulator.createNewTxFountainSpray({ userDataIndex })
    })
  }
}

function calculateMouseVector3({ mouseEvent }) {
  mouseVector3.set(
    2 / getCanvasWidth() * mouseEvent.clientX - getWindowWidth() / getCanvasWidth(),
    -(2 / getCanvasHeight() * mouseEvent.clientY - 1 - 2 * getCanvasTop() / getCanvasHeight()),
    50
  )
}

function onMouseMove(mouseEvent) {
  mouseEvent.preventDefault()
  calculateMouseVector3({ mouseEvent })
}

const userData = []
function nextUserDataIndex({ tx }) {
  userData.push({
    tx,
    color: {
      h: Math.random(),
      s: 0.3 * Math.random() + 0.7,
      l: 0.1 * Math.random() + 0.45,
    },
  })
  return userData.length - 1
}

function createNewTxFountainSpray({ tx }) {
  const userDataIndex = nextUserDataIndex({ tx })
  BufferedEmitter.itemReceived(userDataIndex)
}

function removeTxText() {
  displayTxText({ tx: null })
}

function displayTxText({ tx }) {
  hoveredTxEmitter.emit('tx', tx)
}

function setStyle({ _style }) {
  init({ _canvas: canvas, _style }).then()
}

function isOnMobile() {
  return !!mobileDetect.mobile()
}

function setGravity(x, y) {
  FountainSimulator.setGravity(x, y)
}

function displayHoveredInfo(hoveredObject) {
  if(!hoveredObject) { return removeTxText() }

  hoveredObject = hoveredObject.object

  displayTxText({ tx: hoveredObject.userData.tx })
}

function render() {
  FountainSimulator.step()
  const newHoveredObject = getHoveredObject()
  drawParticleSystems(newHoveredObject)
  threeRenderer.render(scene, camera)
  displayHoveredInfo(newHoveredObject)

  requestAnimationFrame(render)
}

export default {
  init,
  createNewTxFountainSpray,
  setGravity,
  hoveredTxEmitter,
  setStyle
}
