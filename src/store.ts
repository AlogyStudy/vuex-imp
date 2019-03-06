import Vue from 'vue'
// import Vuex from 'vuex'
import Vuex from './vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: { // 状态， Vue 的数据
    count: 100
  },
  // getters: { // Vue的计算属性
  //   // newCount (state: any) {
  //   //   return state.count + 200
  //   // }
  // },
  mutations: {

  },
  actions: {

  }
})
