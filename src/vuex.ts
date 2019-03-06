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
    public getters: {[key: string]: any} = {}
    public mutations: {[key: string]: any} = {}
    public actions: {[key: string]: any} = {}
    public constructor (options: IStore) {
        let state = options.state // { count: 100 }
        // 什么样的属性 可以实现双向
        // 具有`get`, `set`.
        // new Vue({data: {}})

        // vuex的核心就是借用了Vue实例， 因为Vue的实例数据变化，会刷新视图。
        this._vm = new Vue({
            data: {
                state
            }
        })
        if (options.getters) {
            let getters = options.getters // { newCount: fn }
            forEach(getters, (getterName: string, getterFn: Function) => {
                Object.defineProperty(this.getters, getterName, {
                    get: () => {
                        // vue.computed() 实现
                        return getterFn(state)
                    }
                })
            })
        }
        let mutations = options.mutations
        forEach(mutations, (mutationsName: string, mutationsFn: Function) => {
            // this.mutations.change = () => { change(state) }
            this.mutations[mutationsName] = () => {
                mutationsFn.call(this, this)
            }
        })
        let actions = options.actions
        forEach(actions, (actionsName: string, actionsFn: Function) => {
            this.actions[actionsName] = () => {
                actionsFn.call(this, this)
            }
        })

        // 在class中，异步调用commit，导致this，是undefined。
        // 先保存原本的 this中的commit, dispatch后重新定义再调用刚才保存的方法。
        let { commit, dispatch } = this
        this.commit = (type) => {
            commit.call(this, type)
        }
        this.dispatch = (type) => {
            dispatch.call(this, type)
        }
    }
    get state () { // Object.definePrototype get
        return this._vm.state
    }
    public commit (type: string) {
        // this undefined
        this.mutations[type]()
    }
    public dispatch (type: string) {
        this.actions[type]()
    }
}

function forEach (getters: any, callback: Function) {
    Object.keys(getters).forEach(item => callback(item, getters[item]))
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
