/*!
 * IOTA Fountain
 * Copyright(c) 2018 Peter Ryszkiewicz
 * MIT Licensed
 */

import UserDataIndexConverter from './UserDataIndexConverter'

window.world = null // FIXME: liquidfun.js:b2Body.prototype.CreateFixtureFromDef breaks if world is not defined globally
let world = null
let fountainWaterParticleSystem = null

const timeStep = 1.0 / 60.0
const velocityIterations = 8
const positionIterations = 3

// TODO: Optimize
function randn_bm() {
  let u = 0, v = 0
  while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )
  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) return randn_bm(); // resample between 0 and 1
  return num
}

// TODO: Optimize
function randomAngle() {
  const r = (randn_bm() - 0.5)
  return r
}

function createFountainLevel({ world, baseY, width }) {
  const bodyDef = new b2BodyDef()
  const ground = world.CreateBody(bodyDef)
  const flatLevelShape = new b2PolygonShape()
  const halfLevelHeight = 0.1
  flatLevelShape.SetAsBoxXYCenterAngle(width, halfLevelHeight, new b2Vec2(0, baseY), 0)

  const wingHeight = 0.1
  const wingWidth = 0.8

  const leftWingShape = new b2PolygonShape()
  leftWingShape.vertices.push(new b2Vec2(-width, baseY - halfLevelHeight))
  leftWingShape.vertices.push(new b2Vec2(-width - wingWidth, baseY + halfLevelHeight + wingHeight))
  leftWingShape.vertices.push(new b2Vec2(-width, baseY + halfLevelHeight))

  const rightWingShape = new b2PolygonShape()
  rightWingShape.vertices.push(new b2Vec2(width, baseY - halfLevelHeight))
  rightWingShape.vertices.push(new b2Vec2(width + wingWidth, baseY + halfLevelHeight + wingHeight))
  rightWingShape.vertices.push(new b2Vec2(width, baseY + halfLevelHeight))

  ground.CreateFixtureFromShape(flatLevelShape, 0)
  ground.CreateFixtureFromShape(leftWingShape, 0)
  ground.CreateFixtureFromShape(rightWingShape, 0)
}

function createFountainSpout({ world }) {
  const stemShape = new b2PolygonShape()
  stemShape.SetAsBoxXYCenterAngle(0.05, 0.15, new b2Vec2(0, 3), 0)
  const bodyDef = new b2BodyDef()
  const ground = world.CreateBody(bodyDef)
  ground.CreateFixtureFromShape(stemShape, 0)

  const arrow = new b2PolygonShape()
  const arrowWidth = 0.25
  const arrowHeight = 0.2
  const arrowBase = 3.15
  arrow.vertices.push(new b2Vec2(-arrowWidth/2, arrowBase))
  arrow.vertices.push(new b2Vec2(arrowWidth/2, arrowBase))
  arrow.vertices.push(new b2Vec2(0, arrowBase + arrowHeight))
  ground.CreateFixtureFromShape(arrow, 0)
}

function createNewTxFountainSpray({ userDataIndex }) {
  const particleGroupShape = new b2PolygonShape()
  particleGroupShape.SetAsBoxXYCenterAngle(0.04, 0.04, new b2Vec2(0.0, 3.5), randomAngle())

  const particleGroupDef = new b2ParticleGroupDef()
  particleGroupDef.shape = particleGroupShape
  particleGroupDef.linearVelocity = new b2Vec2(randomAngle(), 6.0 + randomAngle())
  particleGroupDef.color = UserDataIndexConverter.colorFromUserDataIndex({ userDataIndex })
  fountainWaterParticleSystem.CreateParticleGroup(particleGroupDef)

  // FIXME: uncomment
  // const particleDef = new b2ParticleDef()
  // particleDef.position.Set(0.0, 3.5)
  // particleDef.velocity = new b2Vec2(randomAngle(), 5.0 + randomAngle())
  // // particleDef.userData = 67
  // particleDef.lifetime = 1000
  // const pIndex = fountainWaterParticleSystem.CreateParticle(particleDef)
  // console.log(`pIndex: ${pIndex}`)
  // const pH = fountainWaterParticleSystem.GetParticleCount
}

function createFountain({ world }) {
  createFountainLevel({ world, width: 4, baseY: 0 })
  createFountainLevel({ world, width: 2.7, baseY: 1 })
  createFountainLevel({ world, width: 1.4, baseY: 2 })
  createFountainSpout({ world })
}

function ResetWorld() {
  if (world !== null) {
    while (world.joints.length > 0) {
      world.DestroyJoint(world.joints[0]);
    }

    while (world.bodies.length > 0) {
      world.DestroyBody(world.bodies[0]);
    }

    while (world.particleSystems.length > 0) {
      world.DestroyParticleSystem(world.particleSystems[0]);
    }
  }
}

function destroyParticlesOutOfBounds() {
  for (var i = 0, max = world.particleSystems.length; i < max; i++) {
    const undergroundShape = new b2PolygonShape()
    undergroundShape.SetAsBoxXYCenterAngle(10000, 100, new b2Vec2(0, -101), 0)
    const transform = new b2Transform()
    transform.SetIdentity()
    world.particleSystems[i].DestroyParticlesInShape(undergroundShape, transform)
  }
}

function step() {
  world.Step(timeStep, velocityIterations, positionIterations)
  destroyParticlesOutOfBounds()
}

function Testbed() {
  ResetWorld()
  world.SetGravity(new b2Vec2(0, -10))

  createFountain({ world })
}

function init() {
  const gravity = new b2Vec2(0, -10)
  world = window.world = new b2World(gravity)

  Testbed()

  const fountainWaterParticleSystemDef = new b2ParticleSystemDef()
  fountainWaterParticleSystemDef.radius = 0.05
  fountainWaterParticleSystemDef.dampingStrength = 0.1

  fountainWaterParticleSystem = world.CreateParticleSystem(fountainWaterParticleSystemDef)

  return world
}

export default {
  init,
  step,
  createNewTxFountainSpray
}
