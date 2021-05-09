<template>
  <div id="app">
    <div id="notification">Connected successfully to the server</div>
    <div v-if="showChatRoom" id="chatRoomContainer">
      <div id="details">
        <div id="lens"></div>
        <div id="edge"></div>
      </div>

      <div id="chatMessagesContainer">
        <div
          v-for="(message, index) in messages"
          v-bind:key="index"
          class="messageContainer"
        >
          <div v-if="message.id === id" class="sourceMessages">
            <div
              v-if="
                !messages[messages.indexOf(message) - 1] ||
                messages[messages.indexOf(message) - 1].id !== id
              "
              class="author"
            >
              {{ message.fullName }}
            </div>
            <div class="messageContent grayed">{{ message.content }}</div>
          </div>
          <div v-else class="destinationMessages">
            <div
              v-if="
                !messages[messages.indexOf(message) - 1] ||
                messages[messages.indexOf(message) - 1].id !== message.id
              "
              class="author"
            >
              {{ message.fullName }}
            </div>
            <div class="messageContent">{{ message.content }}</div>
          </div>
        </div>
      </div>
      <div id="userIsTyping"></div>
      <input
        type="text"
        v-model="message"
        @focus="sendSignal"
        v-on:blur="userIsNotTypingAnymore"
      />
      <button id="sendMessageButton" v-on:click="onSend()">Send</button>
      <div>
        <div class="buttons">
          <div class="icons" id="triangle"></div>
          <div class="icons" id="circle"></div>
          <div class="icons" id="square"></div>
        </div>
      </div>
    </div>
    <div v-else id="fullNameForm">
      <label for="fullnameInput">Fullname</label>
      <input v-model="fullName" type="text" id="fullnameInput" />

      <button v-on:click="onFormSubmit()">Log in</button>
    </div>
  </div>
</template>

<script>
import axios from "../axios";

export default {
  name: "App",
  components: {},
  data() {
    return {
      id: null,
      showChatRoom: false,
      fullName: "",
      message: "",
      messages: [],
    };
  },
  created() {
    
    this.$socket.open()
    axios.get("/").then((response) => {
      console.log(response);
    });
    this.$socket.on("connect_error", function () {
      let notification = document.getElementById("notification");

      notification.style.opacity = 1;
      notification.innerText = "Disconnected from the server";
      setTimeout(() => {
        notification.style.opacity = 0;
      }, 5000);
    });
    window.addEventListener("beforeunload", () => {
      this.$socket.emit("userIsNotTypingAnymore", this.fullName);
    });
  },

  methods: {
    onSend() {
      axios.get("/").then((response) => {
      console.log(response);
    });
      if (this.message.length === 0 || /^ *$/.test(this.message)) return;
      this.$socket.emit("message", {
        fullName: this.fullName,
        content: this.message,
        id: this.id,
      });
      this.message = "";
      document.getElementsByTagName("input")[0].focus();
      
    },
    onFormSubmit() {
      this.fullName = this.fullName.trim();
      if (/^ *$/.test(this.fullName)) return;
      this.showChatRoom = true;
      let notification = document.getElementById("notification");
      notification.style.opacity = 1;
      setTimeout(() => {
        let interval = setInterval(() => {
          notification.style.opacity -= 0.1;
          if (notification.style.opacity <= 0) {
            clearInterval(interval);
          }
        }, 250);
      }, 2500);
    },
    sendSignal() {
      this.$socket.emit("signal", this.fullName);
    },
    userIsNotTypingAnymore() {
      this.$socket.emit("userIsNotTypingAnymore", this.fullName);
    },
  },
  sockets: {
    messageReceived(data) {
      let container = document.getElementById("chatMessagesContainer");
      if (!container) return;
      const { fullName, content, id } = data;
      this.messages = [
        ...this.messages,
        {
          fullName,
          content,
          id,
        },
      ];
      setTimeout(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
      }, 100);
    },
    sendId(data) {
      this.id = data;
    },
    receiveSignal(data) {
      let userIsTyping = document.getElementById("userIsTyping");
      if (!userIsTyping) return;
      let clone = data;
      delete clone[this.$socket.id];
      if (Object.keys(clone).length > 1) {
        userIsTyping.innerHTML = "Many users are typing...";
      } else if (clone[Object.keys(clone)[0]]) {
        userIsTyping.innerHTML =
          clone[Object.keys(clone)[0]].fullName + " is typing...";
      } else {
        userIsTyping.innerHTML = "";
      }
    },
  },
};
</script>

<style scoped>
#app {
  font-family: Arial, Helvetica, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
#notification {
  position: absolute;
  right: 50px;
  top: 50px;
  padding: 10px;
  border: 1px solid black;
  opacity: 0;
}
#userIsTyping {
  visibility: visible;
  font-style: italic;
  max-width: 300px;
  overflow-x: auto;
  font-size: 14px;
}
#fullNameForm {
  display: flex;
  flex-direction: column;
}
#fullNameForm button {
  margin-top: 5px;
}
#fullNameForm label {
  margin-bottom: 5px;
}
#chatRoomContainer {
  border: 1px solid black;
  border-radius: 50px;
  padding: 70px 20px 70px 20px;
}

#sendMessageButton {
}
#details {
  margin-bottom: 20px;
}
#lens {
  width: 15px;
  height: 15px;
  border: 1px solid silver;
  border-radius: 50%;
  margin-left: 35px;
  display: inline-block;
}
#edge {
  width: 105px;
  height: 10px;
  border: 1px solid silver;
  border-radius: 50px;
  margin-left: 45px;
  margin-bottom: 5px;
  display: inline-block;
}

#chatMessagesContainer {
  height: 450px;
  width: 270px;
  border: 1px solid black;
  padding: 10px;
  overflow: auto;
}
.messageContainer .author {
  font-size: 12px;
}
.messageContainer .messageContent {
  border: 1px solid silver;
  border-radius: 10px;
  display: inline-block;
  padding: 7px;
  font-weight: 500;
  max-width: 200px;
  word-wrap: break-word;
  margin-bottom: 5px;
}

.messageContainer .sourceMessages {
  text-align: right;
}
.messageContainer .destinationMessages {
  text-align: left;
}
.grayed {
  background-color: lightgray;
}
.buttons {
  display: flex;
  justify-content: space-around;
  padding: 10px 0px 10px 0px;
  border: 1px solid black;
}
.buttons .icons {
  width: 0;
  height: 0;
}
#triangle {
  border-top: 10px solid transparent;
  border-right: 15px solid grey;
  border-bottom: 10px solid transparent;
}
#square {
  width: 15px;
  height: 15px;
  background: grey;
}
#circle {
  width: 15px;
  height: 15px;
  background: grey;
  border-radius: 50%;
}
</style>
