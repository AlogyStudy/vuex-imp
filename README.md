## vuex-imp
vuex 相关


## Vuex应用
`Vuex`是一个专为`Vue.js`应用程序开发的状态管理模式


## 组件加载顺序
通过先序深度优先遍历


根组件 -> 子组件 -> 孙子组件, 如果有依赖组件，依赖组件加载完成后再通过先序深度加载。

> 为每个组件都添加`$sotre`

```typescript
let install = (_Vue: VueConstructor) => {
    Vue = _Vue // 保留Vue实例
    Vue.mixin({
        beforeCreate () {
            // 需要把拿到根组件 store实例，给每个组件都增加一个$store的属性
            // 是否是根组件
            if (this.$options && this.$options.store) {
                this.$store = this.$options.store
            } else { // 子组件 深度优先
                this.$store = this.$parent && this.$parent.$store
            }
        }
    })
}
```

## Vuex构成

1. 在`Vue.install`中，处理`$sotre`。
2. 在`getter`中返回`state`。
3. `Vuex`的核心就是**借用了Vue实例**, `state`绑定在`Vue`实例的`data`属性中。
4. `Vuex`中的`getters`，寻找到传递的方法名和方法体，定义属性的`getter`,`Object.defineProptype()`。
5. `Vuex`中的`mutations`。`getters`状态有了，需要更新状态，同步使用`mutations`, 使用`commit`方法来更新数据。
6. `Vuex`中的`actions`, 可以放异步操作，通过`dispatch`实现调用`mutations`中的`commit`。

基本方法：`state`, `getters`, `mutations`, `actions`的实现
```typescript
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
```
