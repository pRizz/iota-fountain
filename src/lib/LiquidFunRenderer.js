/*!
 * IOTA Fountain
 * Copyright(c) 2018 Peter Ryszkiewicz
 * MIT Licensed
 */

// Modified from https://github.com/google/liquidfun
// TODO: Refactor

import FountainSimulator from './FountainSimulator' // FIXME: consider altering placement of import; does this belong in the renderer?
import UserDataIndexConverter from './UserDataIndexConverter'
import BufferedEmitter from './BufferedEmitter'
import Emitter from 'events'

const THREE = require('three')

const desktopAspectRatio = 16 / 9
const hoveredTxEmitter = new Emitter()

let canvas
let threeRenderer
let renderer
let camera
let scene
let raycaster
let mouseVector3 = new THREE.Vector3(-1000, -1000, 50)
let hoveredObject

// modified from https://stemkoski.github.io/Three.js/Shader-Glow.html
const glowVertexShaderText = `
  uniform vec3 viewVector;
  uniform float c;
  uniform float p;
  varying float intensity;
  void main() {
    vec3 vNormal = normalize( normalMatrix * normal );
    vec3 vNormel = normalize( normalMatrix * viewVector );
    intensity = pow( c - dot(vNormal, vNormel), p );

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`

// modified from https://stemkoski.github.io/Three.js/Shader-Glow.html
const glowFragmentShaderText = `
  uniform vec3 glowColor;
  varying float intensity;
  void main()
  {
    vec3 glow = glowColor * intensity;
    gl_FragColor = vec4( glow, 1.0 );
  }
`

let glowMaterial
let hoveredGlowingSphereMaterial
let greenGlowingSphereMaterial
let hoveredGreenGlowingSphereMaterial
let redGlowingSphereMaterial
let hoveredRedGlowingSphereMaterial
let glowingCylinderMaterial

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

  if(!hoveredObject.userData.hoveredGlowingSphere) { return removeTxText() }

  const particleShouldBeGreen = shouldParticleBeGreen({ particle: hoveredObject })
  const particleShouldBeRed = shouldParticleBeRed({ particle: hoveredObject })
  hoveredObject.userData.hoveredGlowingSphere.visible = !particleShouldBeGreen && !particleShouldBeRed
  hoveredObject.userData.greenHoveredGlowingSphere.visible = particleShouldBeGreen
  hoveredObject.userData.redHoveredGlowingSphere.visible = particleShouldBeRed

  displayTxText({ tx: hoveredObject.userData.tx })
}

function resetHoveredObjectHighlight() {
  if(!hoveredObject) { return }
  if(!hoveredObject.userData.hoveredGlowingSphere) { return }
  hoveredObject.userData.hoveredGlowingSphere.visible = false
  hoveredObject.userData.greenHoveredGlowingSphere.visible = false
  hoveredObject.userData.redHoveredGlowingSphere.visible = false
}

function render() {
  renderer.currentVertex = 0
  FountainSimulator.step()
  renderer.draw()
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

// TODO: Optimize, cleanup legacy code
function Renderer({ world }) {
  this.world = world
}

Renderer.prototype.draw = function() {
  for (let i = 0, max = world.particleSystems.length; i < max; i++) {
    drawParticleSystem(world.particleSystems[i])
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

function createGlowingCircles() {
  for(let i = 0; i < 50; ++i) {
    const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(0.01), new THREE.MeshBasicMaterial({ color: 0xf8f8f8 }))

    const glowingSphere = new THREE.Mesh(new THREE.SphereGeometry(0.075), glowMaterial.clone())
    glowingSphere.scale.multiplyScalar(1.3)

    const hoveredGlowingSphere = new THREE.Mesh(new THREE.SphereGeometry(0.075), hoveredGlowingSphereMaterial.clone())
    hoveredGlowingSphere.scale.multiplyScalar(1.3)
    hoveredGlowingSphere.visible = false

    const greenGlowingSphere = new THREE.Mesh(new THREE.SphereGeometry(0.075), greenGlowingSphereMaterial.clone())
    greenGlowingSphere.scale.multiplyScalar(1.3)
    greenGlowingSphere.visible = false

    const greenHoveredGlowingSphere = new THREE.Mesh(new THREE.SphereGeometry(0.075), hoveredGreenGlowingSphereMaterial.clone())
    greenHoveredGlowingSphere.scale.multiplyScalar(1.3)
    greenHoveredGlowingSphere.visible = false

    const redGlowingSphere = new THREE.Mesh(new THREE.SphereGeometry(0.075), redGlowingSphereMaterial.clone())
    redGlowingSphere.scale.multiplyScalar(1.3)
    redGlowingSphere.visible = false

    const redHoveredGlowingSphere = new THREE.Mesh(new THREE.SphereGeometry(0.075), hoveredRedGlowingSphereMaterial.clone())
    redHoveredGlowingSphere.scale.multiplyScalar(1.3)
    redHoveredGlowingSphere.visible = false

    glowingSphere.add(coreSphere)
    glowingSphere.add(hoveredGlowingSphere)
    glowingSphere.add(greenGlowingSphere)
    glowingSphere.add(greenHoveredGlowingSphere)
    glowingSphere.add(redGlowingSphere)
    glowingSphere.add(redHoveredGlowingSphere)

    glowingSphere.userData.coreSphere = coreSphere
    glowingSphere.userData.hoveredGlowingSphere = hoveredGlowingSphere
    glowingSphere.userData.greenGlowingSphere = greenGlowingSphere
    glowingSphere.userData.greenHoveredGlowingSphere = greenHoveredGlowingSphere
    glowingSphere.userData.redGlowingSphere = redGlowingSphere
    glowingSphere.userData.redHoveredGlowingSphere = redHoveredGlowingSphere

    glowingCircles.push(glowingSphere)

    scene.add(glowingSphere)
  }
}

function drawParticleSystem(system) {
  const particleXYPositions = system.GetPositionBuffer()
  const particleColorBuffer = system.GetColorBuffer()
  const maxParticleCoordinates = particleXYPositions.length / 2
  const transform = new b2Transform()
  transform.SetIdentity()

  while(glowingCircles.length < maxParticleCoordinates) {
    createGlowingCircles()
  }

  for (let i = 0; i < glowingCircles.length; ++i) {
    if(i >= maxParticleCoordinates) {
      glowingCircles[i].visible = false
      continue
    }

    glowingCircles[i].visible = true

    const userDataIndex = UserDataIndexConverter.userDataIndexFromColorBuffer({ colorBuffer: particleColorBuffer, index: i })
    glowingCircles[i].userData.tx = userData[userDataIndex]

    configureParticle({
      particle: glowingCircles[i],
      x: particleXYPositions[2 * i],
      y: particleXYPositions[2 * i + 1],
      z: 0.0001 * i + 0.1
    })
  }
}

function shouldParticleBeGreen({ particle }) {
  return particle.userData.tx.value > 0
}

function shouldParticleBeRed({ particle }) {
  return particle.userData.tx.value < 0
}

function configureParticle({ particle, x, y, z }) {
  particle.userData.greenGlowingSphere.visible = shouldParticleBeGreen({ particle })
  particle.userData.redGlowingSphere.visible = shouldParticleBeRed({ particle })
  particle.position.set(x, y, z)
}

function createGlowMaterial({ c, p, colorHex, position }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      'c': {
        type: 'f',
        value: c
      },
      'p': {
        type: 'f',
        value: p
      },
      glowColor: {
        type: 'c',
        value: new THREE.Color(colorHex)
      },
      viewVector: {
        type: 'v3',
        value: position
      }
    },
    vertexShader: glowVertexShaderText,
    fragmentShader: glowFragmentShaderText,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  })
}

function initCamera() {
  const camera = new THREE.OrthographicCamera(-6, 6, 5.5, -0.5, 1, 10)
  camera.position.x = 0
  camera.position.y = 2
  camera.position.z = 9
  camera.lookAt(new THREE.Vector3(0, 0, 0))
  return camera
}

function createGlowingCylinderGroup({ startV3, endV3 }) {
  const solidCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01), new THREE.MeshBasicMaterial({ color: 0xe9b7ff }))
  const glowingCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1), glowingCylinderMaterial.clone())
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

async function init({ _canvas }) {
  canvas = _canvas
  scene = new THREE.Scene()
  camera = initCamera()
  raycaster = new THREE.Raycaster(camera.position.clone(), new THREE.Vector3(0, 0, 0), 0, 200)
  glowMaterial = createGlowMaterial({ c: '0.1', p: '4.5', colorHex: 0x0022ee, position: camera.position.clone() })
  hoveredGlowingSphereMaterial = createGlowMaterial({ c: '0.1', p: '4.5', colorHex: 0x33bbff, position: camera.position.clone() })
  greenGlowingSphereMaterial = createGlowMaterial({ c: '0.1', p: '4.5', colorHex: 0x00ee22, position: camera.position.clone() })
  hoveredGreenGlowingSphereMaterial = createGlowMaterial({ c: '0.1', p: '4.5', colorHex: 0x33ffbb, position: camera.position.clone() })
  redGlowingSphereMaterial = createGlowMaterial({ c: '0.1', p: '4.5', colorHex: 0xee2222, position: camera.position.clone() })
  hoveredRedGlowingSphereMaterial = createGlowMaterial({ c: '0.1', p: '4.5', colorHex: 0xffbbbb, position: camera.position.clone() })
  glowingCylinderMaterial = createGlowMaterial({ c: '0.1', p: '4.5', colorHex: 0xb819ff, position: camera.position.clone() })

  const fountainWorld = FountainSimulator.init()

  for (let i = 0, max = fountainWorld.bodies.length; i < max; ++i) {
    const body = fountainWorld.bodies[i]
    const maxFixtures = body.fixtures.length
    const transform = body.GetTransform()
    for (let j = 0; j < maxFixtures; ++j) {
      addPolygonToScene({ polygon: body.fixtures[j].shape, transform, scene })
    }
  }

  createGlowingCircles()

  try {
    threeRenderer = new THREE.WebGLRenderer({ antialias: true, canvas })
  } catch(error) {
    console.error(`Error while initializing three renderer`)
    return
  }

  threeRenderer.setClearColor(0x111111)
  threeRenderer.setSize(getCanvasWidth(), getCanvasHeight())
  threeRenderer.setPixelRatio(window.devicePixelRatio || 1)

  renderer = new Renderer({ world: fountainWorld })

  render()

  window.addEventListener('resize', onWindowResize, false)
  document.addEventListener('mousemove', onMouseMove, false)

  BufferedEmitter.emitter.on('item', userDataIndex => {
    FountainSimulator.createNewTxFountainSpray({ userDataIndex })
  })
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

export default {
  init,
  createNewTxFountainSpray,
  hoveredTxEmitter
}
