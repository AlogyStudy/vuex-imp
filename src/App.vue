<template>
  <div id="app">
    {{this.$store.state.count}}
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'app',
  mounted () {
    console.log((<any>this).$store, 'this.$store')
  }
});
</script>

<style>
</style>
