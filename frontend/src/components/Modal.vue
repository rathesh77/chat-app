<template>
  <div v-if="opened" class="modal flex justify-center items-center">
    <div id="message-wrapper" class="bg-white text-black p-5 space-y-5">
      <div id="message-header" class="border-b border-gray-200 py-2 text-2xl">Warning</div>
      <div id="message-body" class="text-xl">
        <div v-for="(msg, index) in message" v-bind:key="index">
          {{ msg }}
        </div>
      </div>
      <div id="message-footer" class="">
          <button class="py-0 px-2 border border-black" type="button" v-on:click="opened = false">close</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Modal",
  props: {
    message: Array,
  },
  components: {},
  data() {
    return {
        opened :true
    };
  },
  methods: {},
};
</script>

<style scoped>
.modal {
  position: absolute;
  height: 100vh;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}
#message-footer {
    margin-left:90%
}
</style>