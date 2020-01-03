<template>
  <div style="position: relative">
    <canvas ref="fountain-canvas"
            v-bind:class="{ clickable: isHoveredTxReal }"
            @click="canvasClicked">
    </canvas>
    <div style="color: #e9b7ff; width: 100%; text-align: center; font-family: 'Menlo', 'Lucida Grande', Geneva, Helvetica, Arial, sans-serif; text-shadow: 0px 0px 3px #b819ff;">
      hash: {{ hoveredTxHash }}
    </div>
    <div style="color: #e9b7ff; width: 100%; text-align: center; font-family: 'Menlo', 'Lucida Grande', Geneva, Helvetica, Arial, sans-serif; text-shadow: 0px 0px 3px #b819ff;">
      value: {{ hoveredTxValue }} {{ hoveredTxValue && hoveredTxValueUnits }}
    </div>
  </div>
</template>

<script>
  import EventEmitter from 'events'
  import LiquidFunRenderer from '../lib/LiquidFunRenderer'
  import {getExplorerURLForHash, getValueUnits} from '../Config'

  export default {
    name: 'Fountain',
    props: {
      txEmitter: EventEmitter,
      shouldMockFountain: Boolean,
      renderStyle: Object,
      useMoonGravity: Boolean,
      showFluidOutline: Boolean,
    },
    watch: {
      renderStyle(newStyle) {
        LiquidFunRenderer.setStyle({ _style: newStyle })
      },
      useMoonGravity(shouldUseMoonGravity) {
        if(shouldUseMoonGravity) {
          this.setGravity(0, -1.62)
        } else {
          this.setGravity(0, -9.806)
        }
      },
      showFluidOutline(shouldShowFluidOutline) {
        LiquidFunRenderer.showFluidOutline(shouldShowFluidOutline)
      }
    },
    data() {
      return {
        hoveredTx: null,
        accelerometer: null
      }
    },
    computed: {
      isHoveredTxReal() {
        if(!this.hoveredTx) { return false }
        if(this.hoveredTx.hash === '') { return false }
        return true
      },
      hoveredTxHash() {
        return this.hoveredTx && this.hoveredTx.hash || ''
      },
      hoveredTxValue() {
        return this.hoveredTx && this.hoveredTx.value || ''
      },
      hoveredTxValueUnits() {
        return getValueUnits()
      },
    },
    mounted() {
      LiquidFunRenderer.init({
        _canvas: this.$refs['fountain-canvas']
      }).then(() => {
        this.txEmitter.on('tx', (tx) => this.handleNewTx(tx))
      })

      LiquidFunRenderer.hoveredTxEmitter.on('tx', tx => {
        this.hoveredTx = tx
      })

      this.initAccelerometer().catch()

      setInterval(() => {
        if(!this.shouldMockFountain) { return }

        const randomNumber = Math.random()
        this.handleNewTx({
          hash: '',
          value: randomNumber < 0.33 ? 1 : randomNumber < 0.66 ? -1 : 0
        })
      }, 60)
    },
    methods: {
      handleNewTx(tx) {
        LiquidFunRenderer.createNewTxFountainSpray({ tx })
      },
      setGravity(x, y) {
        LiquidFunRenderer.setGravity(x, y)
      },
      canvasClicked() {
        if(!this.isHoveredTxReal) { return }
        window.open(getExplorerURLForHash(this.hoveredTx.hash), '_blank')
      },
      async initAccelerometer() {
        try {
          const permissionsResult = await navigator.permissions.query({name: "accelerometer"})
          if(permissionsResult.state === 'denied') {
            return
          }

          this.accelerometer = new Accelerometer({
            frequency: 60,
            referenceFrame: "screen"
          })
          this.accelerometer.addEventListener('reading', () => {
            this.setGravity(-this.accelerometer.x, -this.accelerometer.y)
          })
          this.accelerometer.start()
        } catch(error) {
          console.error(error)
        }
      }
    }
  }
</script>

<style scoped>
  .clickable {
    cursor: pointer;
  }
</style>
