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

function getHoveredObject() {
  raycaster.setFromCamera(mouseVector3, camera)
  const intersectedObjects = raycaster.intersectObjects(scene.children)
  if(intersectedObjects.length === 0) {
    return null
  }

  const closestIntersectedObject = intersectedObjects[0]
  return closestIntersectedObject
}

function highlightHoveredObject() {
  const newHoveredObject = getHoveredObject()
  if(newHoveredObject === hoveredObject) { return }

  resetHoveredObjectHighlight()

  if(!newHoveredObject) { return removeTxText() }

  hoveredObject = newHoveredObject.object

  if(!hoveredObject.userData.blueHoveredGlowingSphere) { return removeTxText() }

  const particleShouldBeGreen = shouldParticleBeGreen({ particle: hoveredObject })
  const particleShouldBeRed = shouldParticleBeRed({ particle: hoveredObject })
  hoveredObject.userData.blueHoveredGlowingSphere.visible = !particleShouldBeGreen && !particleShouldBeRed
  hoveredObject.userData.greenHoveredGlowingSphere.visible = particleShouldBeGreen
  hoveredObject.userData.redHoveredGlowingSphere.visible = particleShouldBeRed

  displayTxText({ tx: hoveredObject.userData.tx })
}

function resetHoveredObjectHighlight() {
  if(!hoveredObject) { return }
  if(!hoveredObject.userData.blueHoveredGlowingSphere) { return }
  hoveredObject.userData.blueHoveredGlowingSphere.visible = false
  hoveredObject.userData.greenHoveredGlowingSphere.visible = false
  hoveredObject.userData.redHoveredGlowingSphere.visible = false
}

function render() {
  FountainSimulator.step()
  drawParticleSystems()
  threeRenderer.render(scene, camera)
  highlightHoveredObject()

  requestAnimationFrame(render)
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

function drawParticleSystems() {
  drawParticles(particlesFromParticleSystems(fountainWorld.particleSystems))
}

function drawParticles(particles) {
  while(glowingCircles.length < particles.length) {
    createGlowingCircles()
  }

  for (let i = 0; i < glowingCircles.length; ++i) {
    if(i >= particles.length) {
      glowingCircles[i].visible = false
      continue
    }

    const particle = particles[i]
    glowingCircles[i].visible = true
    glowingCircles[i].userData.tx = particle.userData

    configureParticle({
      particle: glowingCircles[i],
      x: particle.x,
      y: particle.y,
      z: particle.z
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

const glowingCircles = []
const glowingSphereRadius = 0.05

function createGlowingCircles() {
  for(let i = 0; i < 15; ++i) {
    const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(0.008), new THREE.MeshBasicMaterial({ color: 0xf8f8f8 }))

    const parentSphere = new THREE.Mesh(new THREE.SphereGeometry(glowingSphereRadius), new THREE.MeshBasicMaterial({
      transparent: true,
      colorWrite: false
    }))
    parentSphere.scale.multiplyScalar(style.sphereScale)

    const blueGlowingSphere = new THREE.Mesh(new THREE.SphereGeometry(glowingSphereRadius), style.getBlueGlowingSphereMaterial())
    blueGlowingSphere.scale.multiplyScalar(style.sphereScale)
    blueGlowingSphere.visible = false

    const blueHoveredGlowingSphere = new THREE.Mesh(new THREE.SphereGeometry(glowingSphereRadius), style.getHoveredBlueGlowingSphereMaterial())
    blueHoveredGlowingSphere.scale.multiplyScalar(style.sphereScale)
    blueHoveredGlowingSphere.visible = false

    const greenGlowingSphere = new THREE.Mesh(new THREE.SphereGeometry(glowingSphereRadius), style.getGreenGlowingSphereMaterial())
    greenGlowingSphere.scale.multiplyScalar(style.sphereScale)
    greenGlowingSphere.visible = false

    const greenHoveredGlowingSphere = new THREE.Mesh(new THREE.SphereGeometry(glowingSphereRadius), style.getHoveredGreenGlowingSphereMaterial())
    greenHoveredGlowingSphere.scale.multiplyScalar(style.sphereScale)
    greenHoveredGlowingSphere.visible = false

    const redGlowingSphere = new THREE.Mesh(new THREE.SphereGeometry(glowingSphereRadius), style.getRedGlowingSphereMaterial())
    redGlowingSphere.scale.multiplyScalar(style.sphereScale)
    redGlowingSphere.visible = false

    const redHoveredGlowingSphere = new THREE.Mesh(new THREE.SphereGeometry(glowingSphereRadius), style.getHoveredRedGlowingSphereMaterial())
    redHoveredGlowingSphere.scale.multiplyScalar(style.sphereScale)
    redHoveredGlowingSphere.visible = false

    parentSphere.add(coreSphere)
    parentSphere.add(blueGlowingSphere)
    parentSphere.add(blueHoveredGlowingSphere)
    parentSphere.add(greenGlowingSphere)
    parentSphere.add(greenHoveredGlowingSphere)
    parentSphere.add(redGlowingSphere)
    parentSphere.add(redHoveredGlowingSphere)

    parentSphere.userData.coreSphere = coreSphere
    parentSphere.userData.blueGlowingSphere = blueGlowingSphere
    parentSphere.userData.blueHoveredGlowingSphere = blueHoveredGlowingSphere
    parentSphere.userData.greenGlowingSphere = greenGlowingSphere
    parentSphere.userData.greenHoveredGlowingSphere = greenHoveredGlowingSphere
    parentSphere.userData.redGlowingSphere = redGlowingSphere
    parentSphere.userData.redHoveredGlowingSphere = redHoveredGlowingSphere

    glowingCircles.push(parentSphere)

    scene.add(parentSphere)
  }
}

function particlesFromParticleSystems(particleSystems) {
  const particles = []
  particleSystems.forEach((system) => {
    const particleXYPositions = system.GetPositionBuffer()
    const particleCount = particleXYPositions.length / 2
    const particleColorBuffer = system.GetColorBuffer()
    for(let i = 0; i < particleCount; ++i) {
      const userDataIndex = UserDataIndexConverter.userDataIndexFromColorBuffer({ colorBuffer: particleColorBuffer, index: i })
      particles.push({
        x: particleXYPositions[2 * i],
        y: particleXYPositions[2 * i + 1],
        z: 0.0001 * i + 0.1,
        userData: userData[userDataIndex]
      })
    }
  })
  return particles
}

function shouldParticleBeGreen({ particle }) {
  return particle.userData.tx.value > 0
}

function shouldParticleBeRed({ particle }) {
  return particle.userData.tx.value < 0
}

function configureParticle({ particle, x, y, z }) {
  particle.userData.blueGlowingSphere.visible = !shouldParticleBeGreen({ particle }) && !shouldParticleBeRed({ particle })
  particle.userData.greenGlowingSphere.visible = shouldParticleBeGreen({ particle })
  particle.userData.redGlowingSphere.visible = shouldParticleBeRed({ particle })
  particle.position.set(x, y, z)
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
  raycaster = new THREE.Raycaster(camera.position.clone(), new THREE.Vector3(0, 0, 0), 0, 200)

  style = _style || (isOnMobile() ? Style.basicStyle : Style.shaderStyle)

  glowingCircles.splice(0, glowingCircles.length)

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
  event.preventDefault()
  calculateMouseVector3({ mouseEvent })
}

const userData = []
function nextUserDataIndex({ tx }) {
  userData.push(tx)
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

export default {
  init,
  createNewTxFountainSpray,
  setGravity,
  hoveredTxEmitter,
  setStyle
}
