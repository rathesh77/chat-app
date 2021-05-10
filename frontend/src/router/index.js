import axios from "../axios";

async function isAuthenticated() {
    try {
        let res = await axios.get('/me')
        return res.data
    } catch {
        return false;
    }
}
export default [
    {
        path: "/",
        name: "Home",
        component: () => import('../views/Home.vue'),
        async beforeEnter(to, from, next) {
            let isAuth = await isAuthenticated();
            if (!isAuth) {
                next({ path: "/login" });
            } else {
                next();
            }
        },
    },
    {
        path: "/login",
        name: "Login",
        component: () =>
            import(/* webpackChunkName: "login" */ "../views/Login.vue"),
        async beforeEnter(to, from, next) {
            let isAuth = await isAuthenticated();
            if (isAuth) {
                next({ path: "/" });
            } else {
                next();
            }
        },
    },
    {
        path: "/register",
        name: "Register",
        component: () =>
            import(/* webpackChunkName: "register" */ "../views/Register.vue"),
        async beforeEnter(to, from, next) {
            let isAuth = await isAuthenticated();
            if (isAuth) {
                next({ path: "/" });
            } else {
                next();
            }
        },
    },
    {
        path: '*',
        name: 'Error404',
        component: () => import(/* webpackChunkName: "about" */ '../views/Error404.vue')
    },
    /* {
       path: "*",
       name: "/NotFound",
       component: () =>
         import("../components/notFound.vue"),
     },*/

];
