import Vue from 'vue'
// import Vuex from 'vuex'
import Vuex from './vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: { // 可以给状态划分模块 // 递归
    a: {
      state: {
        count: 200
      },
      mutations: {
        // @ts-ignore
        change ({state}) {
          console.log('-----')
        }
      },
      modules: {
        b: {
          state: {
            count: 2
          }
        }
      }
    }
  },
  state: { // 状态， Vue 的数据
    count: 100
  },
  getters: { // Vue的计算属性
    newCount (state: any) {
      return state.count + 200
    }
  },
  mutations: {
    // @ts-ignore
    change (state) {
      state.count += 10
      console.log('xxxxxxxxx')
    }
  },
  actions: {
    // @ts-ignore
    change ({commit}) {
      setTimeout(() => {
        commit('change')
      }, 1000)
    }
  }
})
