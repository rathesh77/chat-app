<template>
  <div id="app" class="dark">
    <router-view />
  </div>
</template>

<script>
//import axios from "../axios";

export default {
  name: "App",
  components: {},
  data() {
    return {};
  },
  created() {
    //this.$socket.open();
  },
  methods: {},
};
</script>

<style>
:root {
  font-size: 18px;
}
#app {
  font-family: Inter var, ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans,
    sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol,
    Noto Color Emoji;
  height: 100%;
}

.wrapper {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

input {
  padding: 7px !important;
  border-radius: 7px;
}

.dark {
  background-color: #23272a;
}

::-webkit-scrollbar {
  width: 10px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #f1f1f1;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #888;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
