<template>
  <div>
    <form>
      <label for="email">email: </label>
      <input type="email" id="email" v-model="email" pattern=".+@[a-zA-Z].[a-zA-Z]"  required /><br />

      <label for="password">password: </label>
      <input type="password" id="password" v-model="password" required /> <br />

      <button type="submit" id="submit" v-on:click="login">submit</button>
    </form>
  </div>
</template>

<script>
import axios from "../axios";
export default {
  name: "Login",
  components: {},
  data() {
    return {
      email: "",
      password: "",
    };
  },
  created() {},
  methods: {
    async login() {
      try {
        await axios.post("/login", {
          email: this.email,
          password: this.password,
        });
        this.$router.push({path:'/'})

      } catch {
          //this.$router.push({path:'/'})
      }

    },
  },
};
</script>

<style scoped>
</style>