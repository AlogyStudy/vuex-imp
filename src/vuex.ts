import { VueConstructor } from 'vue'

let Vue: VueConstructor

export interface IStore {
    state?: {[key: string]: any}
    getters?: {[key: string]: any}
    mutations?: {[key: string]: any}
    actions?: {[key: string]: any}
}

class Store { // state getters mutations actions
    private _vm: any
    public constructor (options: IStore) {
        let s = options.state // { count: 100 }
        // 什么样的属性 可以实现双向
        // 具有`get`, `set`.
        // new Vue({data: {}})

        // vuex的核心就是借用了Vue实例， 因为Vue的实例数据变化，会刷新视图。
        this._vm = new Vue({
            data: {
                s
            }
        })
        let getters = options.getters // { newCount: fn }
    }
    get state () { // Object.definePrototype get
        return this._vm.s
    }
}

let install = (_Vue: VueConstructor) => {
    Vue = _Vue // 保留Vue实例
    Vue.mixin({
        beforeCreate () {
            // 需要把拿到根组件 store实例，给每个组件都增加一个$store的属性
            // 是否是根组件
            if (this.$options && (this.$options as any).store) {
                ;(this as any).$store = (this.$options as any).store
            } else { // 子组件 深度优先
                ;(this as any).$store = this.$parent && (this.$parent as any).$store
            }
        }
    })
}

export default {
    Store,
    install
}
