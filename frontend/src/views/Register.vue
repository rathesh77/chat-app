<template>
  <div class="wrapper">
    <div id="content">
      <div
        class="bg-white shadow-md rounded px-32 py-16 flex flex-col rounded-r-sm"
      >
        <div class="mb-4">
          <label
            class="block text-grey-darker text-sm font-bold mb-2"
            for="name"
          >
            Name
          </label>
          <input
            class="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker"
            id="name"
            type="text"
            placeholder="name"
            v-model="name"
            required
          />
        </div>
        <div class="mb-4">
          <label
            class="block text-grey-darker text-sm font-bold mb-2"
            for="email"
          >
            Email
          </label>
          <input
            class="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker"
            id="email"
            type="email"
            placeholder="user@test.com"
            v-model="email"
          />
        </div>
        <div class="mb-6">
          <label
            class="block text-grey-darker text-sm font-bold mb-2"
            for="password"
          >
            Password
          </label>
          <input
            class="shadow appearance-none border border-red rounded w-full py-2 px-3 text-grey-darker mb-3"
            id="password"
            type="password"
            placeholder="password"
            v-model="password"
            required
          />
          <p class="text-red text-xs">
            Password must contain at least 8 characters including one letter and
            one number
          </p>
          <p class="text-red text-sm italic mt-8">
            Already have an account ? log in
            <button
              v-on:click="$router.push({ path: '/login' })"
              type="button"
              class="text-black font-bold"
            >
              here
            </button>
          </p>
        </div>
        <div class="mb-6">
          <div class="text-red-800 text-sm text-center">{{ errorMessage }}</div>
        </div>
        <div class="flex items-center justify-between">
          <button
            v-on:click="register"
            class="border-black py-1 px-4 border-2 inline-block font-bold m-auto"
            type="button"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "../axios";

export default {
  name: "Register",
  components: {},
  data() {
    return {
      email: "",
      password: "",
      name: "",
      errorMessage: "",
    };
  },
  created() {},
  methods: {
    async register() {
      try {
        await axios.post("/register", {
          email: this.email,
          password: this.password,
          name: this.name,
        });
        this.$router.push({ path: "/" });
      } catch (err) {
        //this.$router.push({path:'/'})
        this.errorMessage = err.response.data.message;
      }
    },
  },
};
</script>

<style scoped>
#content {
  border: 1px solid silver;
}
</style>