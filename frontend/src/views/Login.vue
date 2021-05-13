<template>
  <div class="wrapper">
    <div id="content">
      <div class="bg-white shadow-md rounded px-32 py-16 flex flex-col rounded-r-sm">
    <div class="mb-4">
      <label class="block text-grey-darker text-sm font-bold mb-2" for="username">
        Email
      </label>
      <input class="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker" id="email" type="email" placeholder="Email" v-model="email" >
    </div>
    <div class="mb-6">
      <label class="block text-grey-darker text-sm font-bold mb-2" for="password">
        Password
      </label>
      <input class="shadow appearance-none border border-red rounded w-full py-2 px-3 text-grey-darker mb-3" id="password" type="password" placeholder="password" v-model="password" required>
      <p class="text-red text-sm italic">No account ? create an account <button v-on:click="$router.push({path:'/register'})" type="button" class="text-black font-bold">here</button></p>
    </div>
    <div class="flex items-center justify-between">
      <button v-on:click="login" class="border-black py-1 px-4 border-2 inline-block font-bold m-auto" type="button">
        Sign In
      </button>
      
    </div>
</div>
    </div>


  
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

#content {
 border: 1px solid silver;
}

</style>