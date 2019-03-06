<template>
  <div id="app">
    {{this.$store.state.count}}
    {{this.$store.getters.newCount}}
    <button @click="addCount">add</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'app',
  methods: {
    addCount () {
      ((this as any).$store as any).commit('change')
      // ((this as any).$store as any).dispatch('change')
    }
  },
  mounted () {
    console.log((this as any).$store, 'this.$store - mounted')
  }
});
</script>

<style>
</style>
