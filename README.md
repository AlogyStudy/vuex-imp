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

1. 在`Vue.install`中，处理`$sotre`
2. 在`getter`中返回`state`
3. `vuex`的核心就是**借用了Vue实例**

