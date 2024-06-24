import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import HostPage from '../views/HostPage.vue'
import JoinPage from '../views/JoinPage.vue'
import QuizHost from '../views/QuizHost.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/credits',
      name: 'credits',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/CreditsView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    { path: '/host', component: HostPage },
    { path: '/join', component: JoinPage },
    { path: '/host/:quizId', name: 'QuizHost', component: QuizHost }
  ]
})

export default router
