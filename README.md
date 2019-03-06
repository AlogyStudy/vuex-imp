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

## Vuex的modules实现

Vuex中间件 可以封装逻辑， subscirbe, registerModule, unregisterModule

构建模块递进关系:
```typescript
// 构建模块递进关系
class ModuleCollection {
    // 如何表示根元素，使用数组表示，如果是空数组，表示根。
    // 如果是一个元素，表示子元素，依次往复
    public root: {[key: string]: any} = {}
    constructor (options: IStore) { // vuex - [a, b]
        this.registrer([], options)
    }
    public registrer (path: Array<any>, rawModule: {[key: string]: any}) {
        // path 是一个空数组 
        // rawModule是一个对象
        let newModule = {
            _raw: rawModule, // 对象 当前有`state`, `getters`等属性的对象
            _children: {}, // 表示有子模块
            state: rawModule.state // 自己模块的状态
        }
        if (path.length === 0) {
            this.root = newModule // 根
        } else {
            // [a]
            // [a, b]
            let parent = path.slice(0, -1).reduce((root, current) => {
                return root._children[current]
            }, this.root)
            parent._children[path[path.length - 1]] = newModule // 子模块
        }
        if (rawModule.modules) { // 有子模块
            forEach(rawModule.modules, (childName: string, moduled: any) => {
                // [a, b, c]
                this.registrer(path.concat(childName), moduled)
            })
        }
    }
}
```
安装模块:
```typescript
/**
 * 安装模块
 * @param sotre  sotre的实例
 * @param rootState 当前根状态
 * @param path path
 * @param rootModule 当前根模块
 */
function installModule (store: any, rootState: any, path: Array<any>, rootModule: {[key: string]: any}) {

    // rootState.a = {count: 200}
    // rootState.a.b = { count: 20 }
    // rootModule.state = { count: 100 }
    // rootModule._children.a.state = {}

    // 处理状态
    if (path.length > 0) { // [a] 
        // 第二次  获取到的就是a对应的对象
        let parent = path.slice(0, -1).reduce((root, current) => {
            return root[current]
        }, rootState) // {_raw, _children, state}

        // 响应绑定
        Vue.set(parent, path[path.length - 1], rootModule.state)
    }

    if (rootModule._raw.getters) {
        forEach(rootModule._raw.getters, (getterName: string, getterFn: Function) => {
            Object.defineProperty(store.getters, getterName, {
                get: () => {
                    return getterFn(rootModule.state)
                }
            })
        })
    }

    if (rootModule._raw.actions) {
        forEach(rootModule._raw.actions, (actionsName: string, actionsFn: Function) => {
            let entry = store.actions[actionsName] || (store.actions[actionsName]  = [])
            entry.push(() => {
                actionsFn.call(store, store)
            })
        })
    }

    if (rootModule._raw.mutations) {
        forEach(rootModule._raw.mutations, (mutationsName: string, mutationsFn: Function) => {
            let entry = store.mutations[mutationsName] || (store.mutations[mutationsName]  = [])
            entry.push(() => {
                mutationsFn.call(store, rootModule.state)
            })
        })
    }

    // 递归
    forEach(rootModule._children, (childName: string, moduled: {[key: string]: any}) => {
        installModule(store, rootState, path.concat(childName), moduled)
    })
}
```

组件之间的通信：`props`, `emit`, `provide`, `inject`, `$attr`, `$listeners`, `eventbus`, `vuex`


## Vuex核心代码

```typescript
import { VueConstructor } from 'vue'

let Vue: VueConstructor

export interface IStore {
    modules?: {[key: string]: any}
    state?: {[key: string]: any}
    getters?: {[key: string]: any}
    mutations?: {[key: string]: any}
    actions?: {[key: string]: any}
}

// 构建模块递进关系
class ModuleCollection {
    // 如何表示根元素，使用数组表示，如果是空数组，表示根。
    // 如果是一个元素，表示子元素，依次往复
    public root: {[key: string]: any} = {}
    constructor (options: IStore) { // vuex - [a, b]
        this.registrer([], options)
    }
    public registrer (path: Array<any>, rawModule: {[key: string]: any}) {
        // path 是一个空数组 
        // rawModule是一个对象
        let newModule = {
            _raw: rawModule, // 对象 当前有`state`, `getters`等属性的对象
            _children: {}, // 表示有子模块
            state: rawModule.state // 自己模块的状态
        }
        if (path.length === 0) {
            this.root = newModule // 根
        } else {
            // [a]
            // [a, b]
            let parent = path.slice(0, -1).reduce((root, current) => {
                return root._children[current]
            }, this.root)
            parent._children[path[path.length - 1]] = newModule // 子模块
        }
        if (rawModule.modules) { // 有子模块
            forEach(rawModule.modules, (childName: string, moduled: any) => {
                // [a, b, c]
                this.registrer(path.concat(childName), moduled)
            })
        }
    }
}

/**
 * 安装模块
 * @param sotre  sotre的实例
 * @param rootState 当前根状态
 * @param path path
 * @param rootModule 当前根模块
 */
function installModule (store: any, rootState: any, path: Array<any>, rootModule: {[key: string]: any}) {

    // rootState.a = {count: 200}
    // rootState.a.b = { count: 20 }
    // rootModule.state = { count: 100 }
    // rootModule._children.a.state = {}

    // 处理状态
    if (path.length > 0) { // [a] 
        // 第二次  获取到的就是a对应的对象
        let parent = path.slice(0, -1).reduce((root, current) => {
            return root[current]
        }, rootState) // {_raw, _children, state}

        // 响应绑定
        Vue.set(parent, path[path.length - 1], rootModule.state)
    }

    if (rootModule._raw.getters) {
        forEach(rootModule._raw.getters, (getterName: string, getterFn: Function) => {
            Object.defineProperty(store.getters, getterName, {
                get: () => {
                    return getterFn(rootModule.state)
                }
            })
        })
    }

    if (rootModule._raw.actions) {
        forEach(rootModule._raw.actions, (actionsName: string, actionsFn: Function) => {
            let entry = store.actions[actionsName] || (store.actions[actionsName]  = [])
            entry.push(() => {
                actionsFn.call(store, store)
            })
        })
    }

    if (rootModule._raw.mutations) {
        forEach(rootModule._raw.mutations, (mutationsName: string, mutationsFn: Function) => {
            let entry = store.mutations[mutationsName] || (store.mutations[mutationsName]  = [])
            entry.push(() => {
                mutationsFn.call(store, rootModule.state)
            })
        })
    }

    // 递归
    forEach(rootModule._children, (childName: string, moduled: {[key: string]: any}) => {
        installModule(store, rootState, path.concat(childName), moduled)
    })
}

class Store { // state getters mutations actions
    private _vm: any
    public getters: {[key: string]: any} = {}
    public mutations: {[key: string]: any} = {}
    public actions: {[key: string]: any} = {}
    public modules: {[key: string]: any} = {}
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

        // 模块直接的关系进行整理 // 根据用户传入的参数维护了一个对象
        // root._children => a._children => b
        this.modules = new ModuleCollection(options)

        // 无论是子模块 还是 孙子模块 所有的`motations`都是根上的
        // this -> sotre的实例, [] -> path, this.modules.root -> 当前根模块
        installModule(this, state, [], this.modules.root) // {_raw, _children, state}

        // if (options.getters) {
        //     let getters = options.getters // { newCount: fn }
        //     forEach(getters, (getterName: string, getterFn: Function) => {
        //         Object.defineProperty(this.getters, getterName, {
        //             get: () => {
        //                 // vue.computed() 实现
        //                 return getterFn(state)
        //             }
        //         })
        //     })
        // }
        // let mutations = options.mutations
        // forEach(mutations, (mutationsName: string, mutationsFn: Function) => {
        //     // this.mutations.change = () => { change(state) }
        //     this.mutations[mutationsName] = () => {
        //         mutationsFn.call(this, this.state)
        //     }
        // })
        // let actions = options.actions
        // forEach(actions, (actionsName: string, actionsFn: Function) => {
        //     this.actions[actionsName] = () => {
        //         actionsFn.call(this, this)
        //     }
        // })

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
        // this.mutations[type]()
        this.mutations[type].forEach((fn: Function) => fn())
    }
    public dispatch (type: string) {
        // this.actions[type]()
        this.actions[type].forEach((fn: Function) => fn())
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
