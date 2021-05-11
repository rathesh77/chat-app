<template>
  <div id="app">
    <div id="notification">Connected successfully to the server</div>
    <div id="channels">
    <div id="create-channel">
      <input type="text" id="channel-name" v-model="channelName"/>
      <button type="button" v-on:click="createChannel">Create channel</button>
      
    </div>
    <div id="channels-list">
      <div v-for="(value, name, index) in channels" v-bind:key="value.author">
        <li v-on:click="switchChannel(index)">{{name}}</li>
      </div>
    </div>

    </div>
    <div id="chatRoomContainer">
      <div id="details">
        <div id="lens"></div>
        <div id="edge"></div>
      </div>

      <div id="chatMessagesContainer">
        <div v-if="Object.keys(channels).length > 0">
          <div
            v-for="(message, index) in channels[
              Object.keys(channels)[selectedChannel]
            ]"
            v-bind:key="index"
            class="messageContainer"
          >
            <div v-if="message.authorId === user.id" class="sourceMessages">
              <div
                v-if="
                  !channels[Object.keys(channels)[selectedChannel]][
                    channels[Object.keys(channels)[selectedChannel]].indexOf(
                      message
                    ) - 1
                  ] ||
                  channels[Object.keys(channels)[selectedChannel]][
                    channels[Object.keys(channels)[selectedChannel]].indexOf(
                      message
                    ) - 1
                  ].authorId !== user.id
                "
                class="author"
              >
                {{ message.authorName }}
              </div>
              <div class="messageContent grayed">{{ message.content }}</div>
            </div>
            <div v-else class="destinationMessages">
              <div
                v-if="
                  !messages[messages.indexOf(message) - 1] ||
                  messages[messages.indexOf(message) - 1].authorId !==
                    message.authorId
                "
                class="author"
              >
                {{ message.channel_author_name }}
              </div>
              <div class="messageContent">{{ message.content }}</div>
            </div>
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
  </div>
</template>

<script>
import axios from "../axios";

export default {
  name: "App",
  components: {},
  data() {
    return {
      user: null,
      id: null,
      message: "",
      messages: [],
      channels: {},
      selectedChannel: 0,
      channelName: ""
    };
  },
  async created() {
    console.log('created')
    this.$socket.open();
    this.user = await axios.get("/me");
    this.user = this.user.data;
    this.$socket.on("connect_error", function () {
      let notification = document.getElementById("notification");

      notification.style.opacity = 1;
      notification.innerText = "Disconnected from the server";
      setTimeout(() => {
        notification.style.opacity = 0;
      }, 5000);
    });
    window.addEventListener("beforeunload", () => {
      this.$socket.emit("userIsNotTypingAnymore", this.user.name);
    });

  },

  methods: {
    switchChannel(index){
      this.selectedChannel = index 
    },
    async createChannel(){
      //let response = await axios.post('/channel',{name: this.channelName})
      //console.log((response.data))
      this.$socket.emit('createChannel', this.channelName)
      this.channels[`${this.channelName}:${this.user.id}`] = []
      this.$forceUpdate()
    },
    onSend() {
      if (this.message.length === 0 || /^ *$/.test(this.message)) return;
      this.$socket.emit("message", {
        fullName: this.user.name,
        content: this.message,
        id: this.id,
        channel: {
          id: "1",
          name: "test:1",
          author: this.user.id,
        },
      });
      
      this.message = "";

      document.getElementsByTagName("input")[0].focus();
    },

    sendSignal() {
      this.$socket.emit("signal", this.user.name);
    },
    userIsNotTypingAnymore() {
      this.$socket.emit("userIsNotTypingAnymore", this.user.name);
    },
  },
  sockets: {
    async channelsList(userChannels) {
      
      this.user = await axios.get("/me");
    this.user = this.user.data;
      for (let channel of userChannels) {
        if (!this.channels[`${channel.name}:${channel.channel_author}`]){
          this.channels[`${channel.name}:${channel.channel_author}`] = [{
            content: channel.content,
            authorId: channel.message_author,
            authorName: channel.message_author_name,
          }];
        }
        else
          this.channels[`${channel.name}:${channel.channel_author}`].push({
            content: channel.content,
            authorId: channel.message_author,
            authorName: channel.message_author_name,
          });
      }
      
      this.$forceUpdate();
      console.log("channel",this.channels);
    },
    messageReceived(data) {
      console.log("message received");
      let container = document.getElementById("chatMessagesContainer");
      if (!container) return;

      this.channels[Object.keys(this.channels)[this.selectedChannel]] = [
        ...this.channels[Object.keys(this.channels)[this.selectedChannel]],
        {
          authorId: this.user.id,
          content: data.content,
          authorName: this.user.name,
        },
      ];
      setTimeout(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
      }, 100);
      this.$forceUpdate();
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
