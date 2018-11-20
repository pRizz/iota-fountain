<template>
  <div style="position: relative">
    <canvas ref="fountain-canvas" v-bind:class="{ clickable: !!hoveredTx }" @click="canvasClicked"></canvas>
    <span style="position: absolute; left: 0; bottom: 10px; color: #e9b7ff; width: 100%; text-align: center; font-family: 'Menlo', 'Lucida Grande', Geneva, Helvetica, Arial, sans-serif; text-shadow: 0px 0px 3px #b819ff;">
      {{ hoveredTx && hoveredTx.hash || '' }}
    </span>
  </div>
</template>

<script>
  import LiquidFunRenderer from '../lib/LiquidFunRenderer'
  import EventEmitter from 'events'

  export default {
    name: 'Fountain',
    props: {
      txEmitter: EventEmitter
    },
    data() {
      return {
        hoveredTx: null
      }
    },
    mounted() {
      LiquidFunRenderer.init({
        _canvas: this.$refs['fountain-canvas']
      }).then(() => {
        const mockTxEmitter = setInterval(() => {
          this.handleNewTx({
            value: Math.random() < 0.1 ? 5 : 0,
            hash: 'ABD328' + Math.random()
          })
        }, 100)
        this.txEmitter.on('tx', (tx) => this.handleNewTx(tx))
      })

      LiquidFunRenderer.hoveredTxEmitter.on('tx', tx => {
        this.hoveredTx = tx
      })
    },
    methods: {
      handleNewTx(tx) {
        LiquidFunRenderer.createNewTxFountainSpray({ tx })
      },
      canvasClicked() {
        if(!this.hoveredTx) {
          return
        }
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
