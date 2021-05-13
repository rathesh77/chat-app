import Vue from 'vue'
import App from './App.vue'
import VueSocketIO from 'vue-socket.io'
import VueRouter from 'vue-router'
import routes from './router'
import './assets/tailwind.css'

Vue.config.productionTip = false

Vue.use(VueRouter)

Vue.use(new VueSocketIO({
  withCredentials: true,
  options: { autoConnect: false },
  connection: 'http://localhost:3000',
}))

new Vue({
  render: h => h(App),
  router: new VueRouter({
    routes

  }),

}).$mount('#app')