<template>
  <div>
    <h1 class="heading title is-4" style="color: gray;">IOTA Fountain</h1>
    <h1 class="subtitle is-6" style="color: gray;">A visualizer for an <a target="_blank" href="https://www.npmjs.com/package/iota-transaction-stream"></a> IOTA Transaction Stream that utilizes particle physics to render a fountain. Displays new transactions as they are emitted by an IOTA node.</h1>
    <h1 class="subtitle is-6" style="color: gray;"><span style="color: #22cc33">Green</span> particles represent positive value transactions; <span style="color: #dd3333">red</span> are negative value transactions; <span style="color: #2233ee">blue</span> have 0 value and contain data or are spam.</h1>
    <h1 class="subtitle is-6" style="color: gray;">Particle physics library adapted from <a target="_blank" href="http://google.github.io/liquidfun/">Google's Liquid Fun library</a></h1>
  </div>
</template>

<script>
  export default {
    name: "IOTAFountainDescription"
  }
</script>

<style scoped>

</style>
