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

// from https://github.com/stemkoski/stemkoski.github.com/blob/f5c7120af8488d04255b3e4492f4fb214d80b6ff/Three.js/js/MarchingCubesData.js

THREE.edgeTable = new Int32Array([
  0x0, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
  0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
  0x190, 0x99, 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
  0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
  0x230, 0x339, 0x33, 0x13a, 0x636, 0x73f, 0x435, 0x53c,
  0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
  0x3a0, 0x2a9, 0x1a3, 0xaa, 0x7a6, 0x6af, 0x5a5, 0x4ac,
  0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
  0x460, 0x569, 0x663, 0x76a, 0x66, 0x16f, 0x265, 0x36c,
  0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
  0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff, 0x3f5, 0x2fc,
  0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
  0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55, 0x15c,
  0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
  0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc,
  0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
  0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
  0xcc, 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
  0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
  0x15c, 0x55, 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
  0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
  0x2fc, 0x3f5, 0xff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
  0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
  0x36c, 0x265, 0x16f, 0x66, 0x76a, 0x663, 0x569, 0x460,
  0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
  0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa, 0x1a3, 0x2a9, 0x3a0,
  0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
  0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33, 0x339, 0x230,
  0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
  0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99, 0x190,
  0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
  0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0])
THREE.triTable = new Int32Array([
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1,
  3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1,
  3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1,
  3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1,
  9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1,
  1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1,
  9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1,
  2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1,
  8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1,
  9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
  4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1,
  3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1,
  1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1,
  4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1,
  4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1,
  9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1,
  1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1,
  5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1,
  2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1,
  9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1,
  0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
  2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1,
  10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1,
  4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1,
  5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1, -1, -1, -1,
  5, 4, 8, 5, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1,
  9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1,
  0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1,
  1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1,
  10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1,
  8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1,
  2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1,
  7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1,
  9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1,
  2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1,
  11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1,
  9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1,
  5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1,
  11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1,
  11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1,
  1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1,
  9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1,
  5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1,
  2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
  0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1,
  5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1,
  6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1,
  3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1,
  6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1,
  5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1,
  1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1,
  10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1,
  6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1,
  1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1,
  8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1,
  7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1,
  3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
  5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1,
  0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1,
  9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1,
  8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1,
  5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1,
  0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1,
  6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1,
  10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1,
  10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1,
  8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1,
  1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1,
  3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1,
  0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1,
  10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1,
  3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1,
  6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1,
  9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1,
  8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1,
  3, 11, 6, 3, 6, 0, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1,
  6, 4, 8, 11, 6, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  7, 10, 6, 7, 8, 10, 8, 9, 10, -1, -1, -1, -1, -1, -1, -1,
  0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1, -1, -1, -1,
  10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1, -1, -1, -1,
  10, 6, 7, 10, 7, 1, 1, 7, 3, -1, -1, -1, -1, -1, -1, -1,
  1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1, -1, -1, -1,
  2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1,
  7, 8, 0, 7, 0, 6, 6, 0, 2, -1, -1, -1, -1, -1, -1, -1,
  7, 3, 2, 6, 7, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1, -1, -1, -1,
  2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1,
  1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1,
  11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1, -1, -1, -1,
  8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1,
  0, 9, 1, 11, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1, -1, -1, -1,
  7, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  3, 0, 8, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 1, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  8, 1, 9, 8, 3, 1, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
  10, 1, 2, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 2, 10, 3, 0, 8, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1,
  2, 9, 0, 2, 10, 9, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1,
  6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1, -1, -1, -1,
  7, 2, 3, 6, 2, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  7, 0, 8, 7, 6, 0, 6, 2, 0, -1, -1, -1, -1, -1, -1, -1,
  2, 7, 6, 2, 3, 7, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1,
  1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1, -1, -1, -1,
  10, 7, 6, 10, 1, 7, 1, 3, 7, -1, -1, -1, -1, -1, -1, -1,
  10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1, -1, -1, -1,
  0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1, -1, -1, -1,
  7, 6, 10, 7, 10, 8, 8, 10, 9, -1, -1, -1, -1, -1, -1, -1,
  6, 8, 4, 11, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  3, 6, 11, 3, 0, 6, 0, 4, 6, -1, -1, -1, -1, -1, -1, -1,
  8, 6, 11, 8, 4, 6, 9, 0, 1, -1, -1, -1, -1, -1, -1, -1,
  9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1, -1, -1, -1,
  6, 8, 4, 6, 11, 8, 2, 10, 1, -1, -1, -1, -1, -1, -1, -1,
  1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1, -1, -1, -1,
  4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1, -1, -1, -1,
  10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1,
  8, 2, 3, 8, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1,
  0, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1, -1, -1, -1,
  1, 9, 4, 1, 4, 2, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1,
  8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1, -1, -1, -1,
  10, 1, 0, 10, 0, 6, 6, 0, 4, -1, -1, -1, -1, -1, -1, -1,
  4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1,
  10, 9, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  4, 9, 5, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 4, 9, 5, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
  5, 0, 1, 5, 4, 0, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1,
  11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1, -1, -1, -1,
  9, 5, 4, 10, 1, 2, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1,
  6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1, -1, -1, -1,
  7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1, -1, -1, -1,
  3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1,
  7, 2, 3, 7, 6, 2, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1,
  9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1, -1, -1, -1,
  3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1, -1, -1, -1,
  6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1,
  9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1, -1, -1, -1,
  1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1,
  4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1,
  7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1, -1, -1, -1,
  6, 9, 5, 6, 11, 9, 11, 8, 9, -1, -1, -1, -1, -1, -1, -1,
  3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1, -1, -1, -1,
  0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1, -1, -1, -1,
  6, 11, 3, 6, 3, 5, 5, 3, 1, -1, -1, -1, -1, -1, -1, -1,
  1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1, -1, -1, -1,
  0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1,
  11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1,
  6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1, -1, -1, -1,
  5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1, -1, -1, -1,
  9, 5, 6, 9, 6, 0, 0, 6, 2, -1, -1, -1, -1, -1, -1, -1,
  1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1,
  1, 5, 6, 2, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1,
  10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1, -1, -1, -1,
  0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  10, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  11, 5, 10, 7, 5, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  11, 5, 10, 11, 7, 5, 8, 3, 0, -1, -1, -1, -1, -1, -1, -1,
  5, 11, 7, 5, 10, 11, 1, 9, 0, -1, -1, -1, -1, -1, -1, -1,
  10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1, -1, -1, -1,
  11, 1, 2, 11, 7, 1, 7, 5, 1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1, -1, -1, -1,
  9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1, -1, -1, -1,
  7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1,
  2, 5, 10, 2, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1,
  8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1, -1, -1, -1,
  9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1, -1, -1, -1,
  9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1,
  1, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 7, 0, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1,
  9, 0, 3, 9, 3, 5, 5, 3, 7, -1, -1, -1, -1, -1, -1, -1,
  9, 8, 7, 5, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  5, 8, 4, 5, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1,
  5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1, -1, -1, -1,
  0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1, -1, -1, -1,
  10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1,
  2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1, -1, -1, -1,
  0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1,
  0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1,
  9, 4, 5, 2, 11, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1, -1, -1, -1,
  5, 10, 2, 5, 2, 4, 4, 2, 0, -1, -1, -1, -1, -1, -1, -1,
  3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1,
  5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1, -1, -1, -1,
  8, 4, 5, 8, 5, 3, 3, 5, 1, -1, -1, -1, -1, -1, -1, -1,
  0, 4, 5, 1, 0, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1, -1, -1, -1,
  9, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  4, 11, 7, 4, 9, 11, 9, 10, 11, -1, -1, -1, -1, -1, -1, -1,
  0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1, -1, -1, -1,
  1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1,
  3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1,
  4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1, -1, -1, -1,
  9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1,
  11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1,
  11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1, -1, -1, -1,
  2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1, -1, -1, -1,
  9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1,
  3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1,
  1, 10, 2, 8, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  4, 9, 1, 4, 1, 7, 7, 1, 3, -1, -1, -1, -1, -1, -1, -1,
  4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1, -1, -1, -1,
  4, 0, 3, 7, 4, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  4, 8, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  9, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  3, 0, 9, 3, 9, 11, 11, 9, 10, -1, -1, -1, -1, -1, -1, -1,
  0, 1, 10, 0, 10, 8, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1,
  3, 1, 10, 11, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 2, 11, 1, 11, 9, 9, 11, 8, -1, -1, -1, -1, -1, -1, -1,
  3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1, -1, -1, -1,
  0, 2, 11, 8, 0, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  2, 3, 8, 2, 8, 10, 10, 8, 9, -1, -1, -1, -1, -1, -1, -1,
  9, 10, 2, 0, 9, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1, -1, -1, -1,
  1, 10, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  1, 3, 8, 9, 1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 9, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]);

// try metaball algo for water behavior https://github.com/stemkoski/stemkoski.github.com/blob/f5c7120af8488d04255b3e4492f4fb214d80b6ff/Three.js/Metaballs.html

function getHoveredObject() {
  raycaster.setFromCamera(mouseVector3, camera)
  const intersectedObjects = raycaster.intersectObjects(scene.children)
  if (intersectedObjects.length === 0) {
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

function createBasicMaterial({colorHex}) {
  return new THREE.MeshBasicMaterial({
    color: colorHex,
    opacity: 1.0
  })
}

function createParticleMesh() {
  const coreSphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.008),
    new THREE.MeshBasicMaterial({color: 0xf8f8f8}))

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
  for (let i = 0; i < 15; ++i) {
    const particleMesh = createParticleMesh()
    particleMeshes.push(particleMesh)
    scene.add(particleMesh)
  }
}

function drawParticles(particleInfos, hoveredObject) {
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
      hoveredObject
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
        ...userData[userDataIndex]
      })
    }
  })
  return particlesInfo
}

function configureParticleMesh({particleMesh, particleInfo, hoveredObject}) {
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

function displayHoveredInfo(hoveredObject) {
  if (!hoveredObject) {
    return removeTxText()
  }

  hoveredObject = hoveredObject.object

  displayTxText({tx: hoveredObject.userData.tx})
}

function render() {
  FountainSimulator.step()
  const newHoveredObject = getHoveredObject()
  drawParticleSystems(newHoveredObject)
  threeRenderer.render(scene, camera)
  displayHoveredInfo(newHoveredObject)

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
