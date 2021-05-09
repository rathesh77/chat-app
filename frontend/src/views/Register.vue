<template>
  <div>
    <div id="form">
      <label for="name">name: </label>
      <input type="text" id="name" v-model="name" required /><br />

      <label for="email">email: </label>
      <input
        type="email"
        id="email"
        v-model="email"
        pattern=".+@[a-zA-Z].[a-zA-Z]"
        required
      /><br />

      <label for="password">password: </label>
      <input type="password" id="password" v-model="password" required /> <br />

      <button type="button" id="submit" v-on:click="register">submit</button>
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
      } catch {
        //this.$router.push({path:'/'})
      }
    },
  },
};
</script>

<style scoped>
</style>