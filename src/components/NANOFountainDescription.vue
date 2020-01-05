<template>
  <div>
    <h1 class="heading title is-4" style="color: gray;">NANO Fountain</h1>
    <h1 class="subtitle is-6" style="color: gray;">A visualizer for new NANO transactions that utilizes particle physics
      to render a fountain. Displays new transactions as they are emitted by a NANO node.</h1>
    <h1 class="subtitle is-6" style="color: gray;">Stream data courtesy of <a target="_blank"
                                                                              href="https://nanocrawler.cc/">https://nanocrawler.cc/</a>
    </h1>
    <h1 class="subtitle is-6" style="color: gray;">Particle physics library adapted from <a target="_blank"
                                                                                            href="http://google.github.io/liquidfun/">Google's
      Liquid Fun library</a></h1>
    <!-- https://developers.facebook.com/docs/plugins/share-button/#configurator -->
    <div style="display: flex; align-items: center; justify-content: center; flex-direction: column;">
      <div class="fb-share-button" data-href="https://www.nano-fountain.com/" data-layout="button_count"
           data-size="large"><a target="_blank"
                                href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.nano-fountain.com%2F&amp;src=sdkpreparse"
                                class="fb-xfbml-parse-ignore">Share</a></div>
      <div style="height: 0.5em" />
      <a class="twitter-share-button"
         href="https://twitter.com/intent/tweet"
         data-size="large">
        Tweet</a>
    </div>
  </div>
</template>

<script>
  export default {
    name: "NANOFountainDescription"
  }
</script>

<style scoped>

</style>
