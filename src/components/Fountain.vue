<template>
  <div style="position: relative">
    <canvas ref="fountain-canvas" v-bind:class="{ clickable: isHoveredTxReal }" @click="canvasClicked"></canvas>
    <span style="position: absolute; left: 0; bottom: 4px; color: #e9b7ff; width: 100%; text-align: center; font-family: 'Menlo', 'Lucida Grande', Geneva, Helvetica, Arial, sans-serif; text-shadow: 0px 0px 3px #b819ff;">
      {{ hoveredTx && hoveredTx.hash || '' }}
    </span>
  </div>
</template>

<script>
  import EventEmitter from 'events'
  import LiquidFunRenderer from '../lib/LiquidFunRenderer'

  export default {
    name: 'Fountain',
    props: {
      txEmitter: EventEmitter,
      shouldMockFountain: Boolean,
      renderStyle: Object
    },
    watch: {
      renderStyle(newStyle) {
        LiquidFunRenderer.setStyle({ _style: newStyle })
      }
    },
    data() {
      return {
        hoveredTx: null
      }
    },
    computed: {
      isHoveredTxReal() {
        if(!this.hoveredTx) { return false }
        if(this.hoveredTx.hash === '') { return false }
        return true
      }
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
      canvasClicked() {
        if(!this.isHoveredTxReal) { return }
        window.open(`https://open-iota.prizziota.com/#/search/tx/${this.hoveredTx.hash}`, '_blank')
      }
    }
  }
</script>

<style scoped>
  .clickable {
    cursor: pointer;
  }
</style>
