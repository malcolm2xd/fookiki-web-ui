import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '@/config/firebase';
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';

// Lazy load components
const LoginView = () => import('@/views/LoginView.vue');
const GameBoard = () => import('@/views/GameBoard.vue');
const GameConfig = () => import('@/views/GameConfig.vue');

// Auth guard - only allow authenticated users
function requireAuth(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    unsubscribe();
    if (user) {
      next();
    } else {
      next('/login');
    }
  });
}

// Redirect authenticated users away from login
function redirectIfAuthenticated(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    unsubscribe();
    if (user) {
      next('/lobby');
    } else {
      next();
    }
  });
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/lobby'
    },
    {
      path: '/game/:gameId',
      name: 'game',
      component: GameBoard,
      beforeEnter: requireAuth
    },
    {
      path: '/lobby',
      name: 'lobby',
      component: GameConfig,
      beforeEnter: requireAuth
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      beforeEnter: redirectIfAuthenticated
    }
  ]
});

export default router;
