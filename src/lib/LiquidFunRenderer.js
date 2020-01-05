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
let shouldShowFluidOutline = false
let fountainWorld
let clock = new THREE.Clock()

const SVGLoader = require('three/examples/jsm/loaders/SVGLoader').SVGLoader

const svgLoader = new SVGLoader()
const bananoURL = require('../assets/bananos.svg')
let bananoGroup = null

async function loadBananoGroup() {
  return new Promise(((resolve) => {
    svgLoader.load(bananoURL, (data => {
      console.log(data.xml.attributes[6])
      const pathsGroup = new THREE.Group()
      const radius = 0.25
      pathsGroup.scale.multiplyScalar(radius / 87.5)

      for (let path of data.paths) {
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setStyle("#FBDD11"),
        })
        const shapes = path.toShapes(true)
        for (let j = 0; j < shapes.length; j++) {
          let shape = shapes[j]
          let geometry = new THREE.ShapeBufferGeometry(shape)
          let mesh = new THREE.Mesh(geometry, material)
          mesh.translateX(-87.5 / 2)
          mesh.translateY(-46 / 2)
          pathsGroup.add(mesh)
        }
      }
      resolve(pathsGroup)
    }))
  }))
}

function getHoveredObjects() {
  raycaster.setFromCamera(mouseVector3, camera)
  let intersectedObjects = raycaster.intersectObjects(scene.children)
  if (intersectedObjects.length === 0) {
    const childrensChildren = scene.children.map((child) => child.children).flat()
    intersectedObjects = raycaster.intersectObjects(childrensChildren)
    if (intersectedObjects.length === 0) {
      return null
    }
  }

  return intersectedObjects
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

function drawParticleSystems(hoveredObjects) {
  drawParticles(
    particlesFromParticleSystems(fountainWorld.particleSystems),
    hoveredObjects)
}

function createBasicMaterial({colorHex}) {
  return new THREE.MeshBasicMaterial({
    color: colorHex,
    opacity: 1.0
  })
}

function setColorOfBananoGroup(bananoGroup, particleInfo, hoveredObjects) {
  bananoGroup.children.forEach((mesh) => {
    if (!hoveredObjects) {
      const lightness = particleInfo.color.l
      mesh.material && mesh.material.color.setHSL(
        particleInfo.color.h,
        particleInfo.color.s,
        lightness,
      )
      return
    }
    for (let hoveredObject of hoveredObjects) {
      const lightness = mesh === (hoveredObject && hoveredObject.object) ? 0.8 : particleInfo.color.l
      mesh.material && mesh.material.color.setHSL(
        particleInfo.color.h,
        particleInfo.color.s,
        lightness,
      )
    }
  })
}

function createParticleMesh() {

  // return createBananoImage({X: 0, y: 0})

  const coreSphereMesh = createBananoImage({x: 0, y: 0})
  // new THREE.Mesh(
  // new THREE.SphereGeometry(0.008),
  // new THREE.MeshBasicMaterial({color: 0xf8f8f8}))

  const parentSphereMesh = createBananoImage({x: 0, y: 0}) //new THREE.Mesh(new THREE.SphereGeometry(glowingSphereRadius), new THREE.MeshBasicMaterial({
  //   transparent: true,
  //   colorWrite: false
  // }))
  // parentSphereMesh.scale.multiplyScalar(style.sphereScale)

  const coloredSphereMesh = createBananoImage({x: 0, y: 0}) // new THREE.Mesh(
  //   new THREE.SphereGeometry(glowingSphereRadius),
  //   createBasicMaterial({colorHex: "#ffaa44"}))
  // coloredSphereMesh.scale.multiplyScalar(style.sphereScale)

  parentSphereMesh.add(coreSphereMesh)
  parentSphereMesh.add(coloredSphereMesh)

  parentSphereMesh.userData.coreSphere = coreSphereMesh
  parentSphereMesh.userData.coloredSphereMesh = coloredSphereMesh
  parentSphereMesh.userData.spinParams = {
    rate: 10 * 2 * Math.PI, // 10 turns/s
    decay: 0.1,
    startTime: clock.getElapsedTime(),
    // [-1 or 1]
    directionFlag: Math.round(Math.random() * 2) - 1
  }

  const isBanano = true // FIXME
  parentSphereMesh.userData.setColor = isBanano ?
    (particleInfo, hoveredObjects) => {
      setColorOfBananoGroup(parentSphereMesh, particleInfo, hoveredObjects)
      setColorOfBananoGroup(coreSphereMesh, particleInfo, hoveredObjects)
      setColorOfBananoGroup(coloredSphereMesh, particleInfo, hoveredObjects)
    } : (particleInfo, hoveredObjects) => {
      // FIXME
      const lightness = coloredSphereMesh === (hoveredObjects && hoveredObjects.object) ? 0.8 : particleInfo.color.l
      coloredSphereMesh.material.color.setHSL(
        particleInfo.color.h,
        particleInfo.color.s,
        lightness,
      )
    }

  parentSphereMesh.userData.setTX = (tx) => {
    setTXOfBananoGroup(parentSphereMesh, tx)
    setTXOfBananoGroup(coloredSphereMesh, tx)
    setTXOfBananoGroup(coreSphereMesh, tx)
  }

  return parentSphereMesh
}

function setTXOfBananoGroup(bananoGroup, tx) {
  bananoGroup.children.forEach((mesh) => {
    mesh.userData.tx = tx
  })
}

function createParticleMeshes() {
  for (let i = 0; i < 15; ++i) {
    const particleMesh = createParticleMesh()
    particleMeshes.push(particleMesh)
    scene.add(particleMesh)
  }
}

function createBananoImage({x, y}) {
  if (!bananoGroup) {
    return null
  }
  let _bananoGroup = bananoGroup.clone(true)
  _bananoGroup.position.x = x
  _bananoGroup.position.y = y
  for (let child of bananoGroup.children) {
    child.material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setStyle("#FBDD11"),
    })
  }
  return _bananoGroup
}

function drawParticles(particleInfos, hoveredObjects) {
  while (particleMeshes.length < particleInfos.length) {
    createParticleMeshes()
  }

  for (let i = 0; i < particleMeshes.length; ++i) {
    if (i >= particleInfos.length) {
      particleMeshes[i].visible = false
      continue
    }

    configureParticleMesh({
      particleMesh: particleMeshes[i],
      particleInfo: particleInfos[i],
      hoveredObjects
    })
  }

  if (shouldShowFluidOutline) {
    createFluidPlane(particleInfos)
  }
}

// x: [x0...x1]
// returns: [0...1]
function lerp1d(x0, x1, x) {
  return (x - x0) / (x1 - x0)
}

const cellTypeToPolyEdges = {
  // ..
  // ..
  0: [],

  // ..
  // #.
  1: ["W", "S"],

  // ..
  // .#
  2: ["E", "S"],

  // ..
  // ##
  3: ["W", "E"],

  // .#
  // ..
  4: ["N", "E"],

  // .#
  // #.
  5: ["N", "W", "S", "E"],

  // .#
  // .#
  6: ["N", "S"],

  // .#
  // ##
  7: ["N", "W"],

  // #.
  // ..
  8: ["N", "W"],

  // #.
  // #.
  9: ["N", "S"],

  // #.
  // .#
  10: ["N", "E", "S", "W"],

  // #.
  // ##
  11: ["N", "E"],

  // ##
  // ..
  12: ["E", "W"],

  // ##
  // #.
  13: ["E", "S"],

  // ##
  // .#
  14: ["S", "W"],

  // ##
  // ##
  15: []
}

function lineFromCoords(a, b, minX, minY, xStep, yStep) {
  /**
   * Given coordinate pairs in (row, col) format, draw a line on the canvas.
   */
  let x0 = a[1] * xStep + minX
  let y0 = a[0] * yStep + minY
  let x1 = b[1] * xStep + minX
  let y1 = b[0] * yStep + minY

  return {
    x0, y0, x1, y1
  }
}

function linesForCellTypes(cellTypes, samples, threshold, minX, minY, xStep, yStep) {
  const lines = []
  for (let i = 0; i < cellTypes.length; i++) {
    for (let j = 0; j < cellTypes[i].length; j++) {
      let cellType = cellTypes[i][j]
      let polyCompassEdges = cellTypeToPolyEdges[cellType]

      // The samples at the 4 corners of the current cell
      let NWSample = samples[i][j]
      let NESample = samples[i][j + 1]
      let SWSample = samples[i + 1][j]
      let SESample = samples[i + 1][j + 1]

      // The offset from top or left that the line intersection should be.
      // iixx
      let N = (cellType & 4) === (cellType & 8) ? 0.5 : lerp1d(NWSample, NESample, threshold)
      // xiix
      let E = (cellType & 2) === (cellType & 4) ? 0.5 : lerp1d(NESample, SESample, threshold)
      // xxii
      let S = (cellType & 1) === (cellType & 2) ? 0.5 : lerp1d(SWSample, SESample, threshold)
      // ixxi
      let W = (cellType & 1) === (cellType & 8) ? 0.5 : lerp1d(NWSample, SWSample, threshold)

      // mixing indexes with lerps
      // these should probably all be from [0...1, 0...1]
      let compassCoords = {
        "N": [i, j + N],
        "W": [i + W, j],
        "E": [i + E, j + 1],
        "S": [i + 1, j + S],
      };

      if (polyCompassEdges.length === 2) {
        lines.push(
          lineFromCoords(
            compassCoords[polyCompassEdges[0]],
            compassCoords[polyCompassEdges[1]],
            minX,
            minY,
            xStep,
            yStep
          ))
      } else if (polyCompassEdges.length === 4) {
        lines.push(
          lineFromCoords(
            compassCoords[polyCompassEdges[0]],
            compassCoords[polyCompassEdges[1]],
            minX,
            minY,
            xStep,
            yStep
          ),
          lineFromCoords(
            compassCoords[polyCompassEdges[2]],
            compassCoords[polyCompassEdges[3]],
            minX,
            minY,
            xStep,
            yStep
          ))
      }
    }
  }
  return lines
}

/**
 * Sample an f(x, y) in a 2D grid.
 */
function sample(options) {
  let minX = options.minX;
  let maxX = options.maxX;
  let stepX = options.stepX;
  const xRange = maxX - minX

  let minY = options.minY;
  let maxY = options.maxY;
  let stepY = options.stepY;
  const yRange = maxY - minY

  let fn = options.fn;

  let numRows = Math.ceil(yRange / stepY);
  let numCols = Math.ceil(xRange / stepX);

  let samples = [];

  for (let row = 0; row <= numRows; row++) {
    let y = row * stepY + minY
    samples.push([])
    for (let col = 0; col <= numCols; col++) {
      let x = col * stepX + minX
      samples[row].push(fn(x, y))
    }
  }

  return samples
}

/**
 * Convert a grid of continuous values to a
 * grid of booleans.
 */
function threshold(grid, value) {
  let ret = []

  for (let i = 0; i < grid.length; i++) {
    ret.push([])
    for (let j = 0; j < grid[i].length; j++) {
      ret[i].push(grid[i][j] > value)
    }
  }

  return ret
}

function metaball(x, y, circles) {
  let sum = 0
  for (let circle of circles) {
    let dx = x - circle.x
    let dy = y - circle.y

    let d2 = dx * dx + dy * dy
    sum += circle.r2 / d2
  }

  return sum;
}

/**
 * Given a nxm grid of booleans, produce an (n-1)x(m-1) grid of square classifications
 * following the marching squares algorithm here:
 * http://en.wikipedia.org/wiki/Marching_squares
 * The input grid used as the values of the corners.
 *
 * The output grid is a 2D array of values 0-15
 */
function classifyCells(corners) {
  let ret = []

  for (let i = 0; i < corners.length - 1; i++) {
    ret.push([])
    for (let j = 0; j < corners[i].length - 1; j++) {
      let NW = corners[i][j]
      let NE = corners[i][j + 1]
      let SW = corners[i + 1][j]
      let SE = corners[i + 1][j + 1]

      ret[i].push(
        (SW << 0) +
        (SE << 1) +
        (NE << 2) +
        (NW << 3)
      )
    }
  }

  return ret
}

function recalculate(circles, thresholdValue, minX, maxX, stepX, minY, maxY, stepY) {
  const samples = sample({
    minX,
    maxX,
    stepX,
    minY,
    maxY,
    stepY,
    fn: (x, y) => {
      return metaball(x, y, circles)
    }
  })

  const thresholdedSamples = threshold(samples, thresholdValue)
  const cellTypes = classifyCells(thresholdedSamples)
  return {
    samples,
    thresholdedSamples,
    cellTypes
  }
}

function testMarchingSquares() {
  const circles = [
    {
      x: 1, y: 1, r2: 2
    }
  ]

  const size = 4 // FIXME

  const xMin = 0
  const xMax = 5
  const xRange = xMax - xMin
  const stepX = xRange / size // 1.25
  const yMin = 0
  const yMax = 5
  const yRange = yMax - yMin
  const stepY = yRange / size

  const threshold = 1

  const {samples, thresholdedSamples, cellTypes} = recalculate(
    circles,
    threshold,
    xMin,
    xMax,
    stepX,
    yMin,
    yMax,
    stepY)

  console.log(`test marching squares`)
  console.log(samples)
  console.log(thresholdedSamples)
  console.log(cellTypes)

  const lines = linesForCellTypes(
    cellTypes,
    samples,
    threshold,
    xMin,
    yMin,
    stepX,
    stepY
  )

  for (let line of lines) {
    console.log(line)
    const geometry = new THREE.Geometry()
    geometry.vertices.push(new THREE.Vector3(line.x0, line.y0, 0))
    geometry.vertices.push(new THREE.Vector3(line.x1, line.y1, 0))
    const lineMaterial = new THREE.LineBasicMaterial({color: 0x00ff00});

    const lineMesh = new THREE.Line(geometry, lineMaterial);
    scene.add(lineMesh)
  }
  return lines
}

const fluidPlaneLines = []

function createFluidPlane(particleInfos) {
  // determines the fidelity of the mesh; the higher, the smoother the mesh
  const size = 30

  const xMin = -3
  const xMax = 3
  const xRange = xMax - xMin
  const stepX = xRange / size
  const yMin = 2
  const yMax = 5.5
  const yRange = yMax - yMin
  const stepY = yRange / size

  const threshold = 20

  const circles = particleInfos.map(particleInfo => {
    return {
      x: particleInfo.x,
      y: particleInfo.y,
      radius: 0.25,
      r2: 0.25
    }
  })
  const {samples, _, cellTypes} = recalculate(
    circles,
    threshold,
    xMin,
    xMax,
    stepX,
    yMin,
    yMax,
    stepY)

  const lines = linesForCellTypes(
    cellTypes,
    samples,
    threshold,
    xMin,
    yMin,
    stepX,
    stepY
  )

  scene.remove(...fluidPlaneLines.splice(0, fluidPlaneLines.length))

  for (let line of lines) {
    const geometry = new THREE.Geometry()
    geometry.vertices.push(new THREE.Vector3(line.x0, line.y0, 0))
    geometry.vertices.push(new THREE.Vector3(line.x1, line.y1, 0))
    const lineMaterial = new THREE.LineBasicMaterial({color: 0x00ff66,/* doesn't work linewidth: 0.3*/});

    const lineMesh = new THREE.Line(geometry, lineMaterial);
    fluidPlaneLines.push(lineMesh)
    scene.add(lineMesh)
  }
}

function addPolygonToScene({polygon, transform, scene}) {
  const vertices = polygon.vertices
  const vertexCount = vertices.length

  for (let i = 0; i < vertexCount; ++i) {
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
    for (let i = 0; i < particleCount; ++i) {
      const userDataIndex = UserDataIndexConverter.userDataIndexFromColorBuffer({
        colorBuffer: particleColorBuffer,
        index: i
      })
      particlesInfo.push({
        x: particleXYPositions[2 * i],
        y: particleXYPositions[2 * i + 1],
        z: 0.0001 * i + 0.1,
        startTime: clock.getElapsedTime(),
        ...userData[userDataIndex]
      })
    }
  })
  return particlesInfo
}


// exponential decay,
// f(0) = fast spin; 1 rot/s +-
// f(10) = slow; 0.5 rot/s +-
// f(t) = a*e^(bt)
// f(0) = ae^0 = a = fast
// f(10) = 0.5 = slow = ae(10b)
// slow / a = e^10b
// ln(slow/a) = 10b =>
// b = 1/10 * ln(slow/fast)

// from fast of 1 to slow of 0.5, after 10 seconds
// b = 1/10 * ln(0.5 / 1)


// after 10 seconds, go from fast rot/s to slow rot/s
function spinRadFromTime(fast, slow, time, directionMultiplier) {
  return fast * directionMultiplier * Math.exp(1 / 10 * Math.log(slow / fast) * time)
}

// assume 60fps
function spinRadPerFrame(rotPerSec) {
  return Math.PI * rotPerSec / 30
}

function configureParticleMesh({particleMesh, particleInfo, hoveredObjects}) {
  particleMesh.visible = true
  particleMesh.position.set(particleInfo.x, particleInfo.y, particleInfo.z)

  const elapsedTime = clock.getElapsedTime() - particleInfo.startTime
  const directionMultiplier = particleMesh.userData.spinParams.directionFlag

  const fastRate = spinRadPerFrame(Math.random() * 5 + 1)
  const slowRate = spinRadPerFrame(Math.random())

  const rotation = spinRadFromTime(fastRate, slowRate, elapsedTime, directionMultiplier)
  particleMesh.rotateZ(rotation)
  particleMesh.userData.tx = particleInfo.tx
  // TODO set color from a setColor userData method that each mesh must implement
  particleMesh.userData.setColor(particleInfo, hoveredObjects)
  particleMesh.userData.setTX(particleInfo.tx)
  // const lightness = particleMesh === (hoveredObject && hoveredObject.object) ? 0.8 : particleInfo.color.l
  // particleMesh.userData.coloredSphereMesh.material.color.setHSL(
  //   particleInfo.color.h,
  //   particleInfo.color.s,
  //   lightness,
  // )
}

function initCamera() {
  const camera = new THREE.OrthographicCamera(-6, 6, 5.5, -0.5, 1, 10)
  camera.position.x = 0
  camera.position.y = 2.5
  camera.position.z = 5
  camera.lookAt(new THREE.Vector3(0, 0, 0))
  return camera
}

function createGlowingCylinderGroup({startV3, endV3}) {
  const solidCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01), new THREE.MeshBasicMaterial({color: 0xe9b7ff}))
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

function getShape() {
  const shape = new THREE.Shape()
  shape.setFromPoints([
    new THREE.Vector2(5, 0),
    new THREE.Vector2(0, 5),
    new THREE.Vector2(-5, 2),
    new THREE.Vector2(2, 2),
  ])
  const geometry = new THREE.ShapeGeometry(shape)

  return new THREE.Mesh(geometry, new THREE.MeshPhongMaterial());
}

async function init({_canvas, _style}) {
  canvas = _canvas
  scene = new THREE.Scene()
  camera = initCamera()
  raycaster = new THREE.Raycaster(
    camera.position.clone(),
    new THREE.Vector3(0, 0, 0),
    0, 200)

  const light = new THREE.PointLight(0x55aaff);
  light.position.set(0, 0, 10);
  scene.add(light);

  // scene.add(getShape())
  // testMarchingSquares()

  style = _style || (isOnMobile() ? Style.basicStyle : Style.shaderStyle)

  particleMeshes.splice(0, particleMeshes.length)

  if (!startedSimulation) {
    startedSimulation = true
    fountainWorld = FountainSimulator.init()
  }

  for (let i = 0, max = fountainWorld.bodies.length; i < max; ++i) {
    const body = fountainWorld.bodies[i]
    const maxFixtures = body.fixtures.length
    const transform = body.GetTransform()
    for (let j = 0; j < maxFixtures; ++j) {
      addPolygonToScene({polygon: body.fixtures[j].shape, transform, scene})
    }
  }

  bananoGroup = await loadBananoGroup()

  // drawCirlce(0, 0)
  // drawCirlce(0, 1)
  // drawCirlce(1, 0)
  // drawCirlce(1, 1)

  try {
    threeRenderer = new THREE.WebGLRenderer({antialias: true, canvas})
  } catch (error) {
    console.error(`Error while initializing three renderer`)
    return
  }

  threeRenderer.setClearColor(0x111111)
  threeRenderer.setSize(getCanvasWidth(), getCanvasHeight())
  threeRenderer.setPixelRatio(window.devicePixelRatio || 1)

  if (!isRendering) {
    isRendering = true

    render()

    window.addEventListener('resize', onWindowResize, false)
    document.addEventListener('mousemove', onMouseMove, false)

    BufferedEmitter.emitter.on('item', userDataIndex => {
      FountainSimulator.createNewTxFountainSpray({userDataIndex})
    })
  }
}

function calculateMouseVector3({mouseEvent}) {
  mouseVector3.set(
    2 / getCanvasWidth() * mouseEvent.clientX - getWindowWidth() / getCanvasWidth(),
    -(2 / getCanvasHeight() * mouseEvent.clientY - 1 - 2 * getCanvasTop() / getCanvasHeight()),
    50
  )
}

function onMouseMove(mouseEvent) {
  mouseEvent.preventDefault()
  calculateMouseVector3({mouseEvent})
}

const userData = []

const baseHue = Math.random()

function nextUserDataIndex({tx}) {
  userData.push({
    tx,
    color: {
      h: baseHue + 0.12 * Math.random(),
      s: 0.3 * Math.random() + 0.7,
      l: 0.1 * Math.random() + 0.45,
    },
  })
  return userData.length - 1
}

function createNewTxFountainSpray({tx}) {
  const userDataIndex = nextUserDataIndex({tx})
  BufferedEmitter.itemReceived(userDataIndex)
}

function removeTxText() {
  displayTxText({tx: null})
}

function displayTxText({tx}) {
  hoveredTxEmitter.emit('tx', tx)
}

function setStyle({_style}) {
  init({_canvas: canvas, _style}).then()
}

function isOnMobile() {
  return !!mobileDetect.mobile()
}

function setGravity(x, y) {
  FountainSimulator.setGravity(x, y)
}

// FIXME
function displayHoveredInfo(hoveredObjects) {
  if (!hoveredObjects) {
    return removeTxText()
  }

  if (hoveredObjects.object) {
    hoveredObject = hoveredObject.object

    displayTxText({tx: hoveredObject.userData.tx})
    return
  }

  for (let hoveredObject of hoveredObjects) {
    hoveredObject = hoveredObject.object
    if (hoveredObject.userData && hoveredObject.userData.tx) {
      displayTxText({tx: hoveredObject.userData.tx})
    }
  }
}

function drawCirlce(x, y) {
  let geometry = new THREE.CircleGeometry(0.01, 10);
  let material = new THREE.MeshBasicMaterial({color: 0xffff00});
  let circle = new THREE.Mesh(geometry, material);
  circle.position.x = x
  circle.position.y = y
  scene.add(circle)
}

function render() {
  FountainSimulator.step()
  const newHoveredObjects = getHoveredObjects()
  drawParticleSystems(newHoveredObjects)
  threeRenderer.render(scene, camera)
  displayHoveredInfo(newHoveredObjects)

  // drawBananos()
  // rotate once every 3 seconds: 1 rot/3 s = 1/3 rot/s
  // 60f/s
  // how many angle/frame
  // rot/frame => 1/3 / 60 = 1/180 rot/frame
  // 1 rot = 2 pi rad => 2pi rad/rot
  // rad/frame => 2pi / 180 rad / frame

  // a quick spin would be like 10 rot/s => omega rot/s
  // 60f/s
  // rot/frame => omega / 60
  // 2pi rad/rot
  // rad/frame => 2pi * omega / 60 rad/rot * rot/frame = pi*omega/30 rad/frame
  //

  // exponential decay,
  // f(0) = fast spin; 5rot/s +-
  // f(10) = slow; 0.25 rot/s +-
  // f(t) = a*e^(bt)
  // f(0) = ae^0 = a = fast
  // f(10) = 0.25 = slow = ae(10b)
  // slow / a = e^10b
  // ln(slow/a) = 10b =>
  // b = 1/10 * ln(slow/a)
  // testBanano.rotateZ(Math.PI * 0.1 / 30)
  requestAnimationFrame(render)
}

function showFluidOutline(_shouldShowFluidOutline) {
  scene.remove(...fluidPlaneLines.splice(0, fluidPlaneLines.length))
  shouldShowFluidOutline = _shouldShowFluidOutline
}

export default {
  init,
  createNewTxFountainSpray,
  setGravity,
  showFluidOutline,
  hoveredTxEmitter,
  setStyle
}
