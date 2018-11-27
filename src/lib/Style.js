const THREE = require('three')

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

function createBasicMaterial({ colorHex }) {
  return new THREE.MeshBasicMaterial({
    color: colorHex,
    opacity: 1.0
  })
}

function getCameraPosition() {
  return new THREE.Vector3(0, 2.5, 9)
}

const shaderMaterials = {
  blueGlowingSphereMaterial:         createGlowMaterial({ c: '0.1', p: '4.5', colorHex: 0x0022ee, position: getCameraPosition() }),
  hoveredBlueGlowingSphereMaterial:  createGlowMaterial({ c: '0.1', p: '4.5', colorHex: 0x33bbff, position: getCameraPosition() }),
  greenGlowingSphereMaterial:        createGlowMaterial({ c: '0.1', p: '4.5', colorHex: 0x00ee22, position: getCameraPosition() }),
  hoveredGreenGlowingSphereMaterial: createGlowMaterial({ c: '0.1', p: '4.5', colorHex: 0x33ffbb, position: getCameraPosition() }),
  redGlowingSphereMaterial:          createGlowMaterial({ c: '0.1', p: '4.5', colorHex: 0xee2222, position: getCameraPosition() }),
  hoveredRedGlowingSphereMaterial:   createGlowMaterial({ c: '0.1', p: '4.5', colorHex: 0xffbbbb, position: getCameraPosition() }),
  glowingCylinderMaterial:           createGlowMaterial({ c: '0.1', p: '4.5', colorHex: 0xb819ff, position: getCameraPosition() })
}

const basicMaterials = {
  blueGlowingSphereMaterial:         createBasicMaterial({ colorHex: 0x0022ee }),
  hoveredBlueGlowingSphereMaterial:  createBasicMaterial({ colorHex: 0x3355ff }),
  greenGlowingSphereMaterial:        createBasicMaterial({ colorHex: 0x00ff11 }),
  hoveredGreenGlowingSphereMaterial: createBasicMaterial({ colorHex: 0x88ffcc }),
  redGlowingSphereMaterial:          createBasicMaterial({ colorHex: 0xee2222 }),
  hoveredRedGlowingSphereMaterial:   createBasicMaterial({ colorHex: 0xffbbbb }),
  glowingCylinderMaterial:           createBasicMaterial({ colorHex: 0xb819ff })
}

const shaderStyle = {
  getBlueGlowingSphereMaterial()         { return shaderMaterials.blueGlowingSphereMaterial.clone() },
  getHoveredBlueGlowingSphereMaterial()  { return shaderMaterials.hoveredBlueGlowingSphereMaterial.clone() },
  getGreenGlowingSphereMaterial()        { return shaderMaterials.greenGlowingSphereMaterial.clone() },
  getHoveredGreenGlowingSphereMaterial() { return shaderMaterials.hoveredGreenGlowingSphereMaterial.clone() },
  getRedGlowingSphereMaterial()          { return shaderMaterials.redGlowingSphereMaterial.clone() },
  getHoveredRedGlowingSphereMaterial()   { return shaderMaterials.hoveredRedGlowingSphereMaterial.clone() },
  getGlowingCylinderMaterial()           { return shaderMaterials.glowingCylinderMaterial.clone() },

  sphereScale: 1.5,
  glowingCylinderRadius: 0.1
}

const basicStyle = {
  getBlueGlowingSphereMaterial()         { return basicMaterials.blueGlowingSphereMaterial.clone() },
  getHoveredBlueGlowingSphereMaterial()  { return basicMaterials.hoveredBlueGlowingSphereMaterial.clone() },
  getGreenGlowingSphereMaterial()        { return basicMaterials.greenGlowingSphereMaterial.clone() },
  getHoveredGreenGlowingSphereMaterial() { return basicMaterials.hoveredGreenGlowingSphereMaterial.clone() },
  getRedGlowingSphereMaterial()          { return basicMaterials.redGlowingSphereMaterial.clone() },
  getHoveredRedGlowingSphereMaterial()   { return basicMaterials.hoveredRedGlowingSphereMaterial.clone() },
  getGlowingCylinderMaterial()           { return basicMaterials.glowingCylinderMaterial.clone() },

  sphereScale: 1.0,
  glowingCylinderRadius: 0.0175
}

export default {
  shaderStyle,
  basicStyle
}