import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/Register.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/NoteList.vue'),
      meta: { auth: true },
    },
    {
      path: '/note/new',
      name: 'note-create',
      component: () => import('@/views/NoteEditor.vue'),
      meta: { auth: true },
    },
    {
      path: '/note/:id',
      name: 'note-edit',
      component: () => import('@/views/NoteEditor.vue'),
      meta: { auth: true },
    },
  ],
});

// Navigation guard
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('notes-token');

  if (to.meta.auth && !token) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.meta.guest && token) {
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router;
