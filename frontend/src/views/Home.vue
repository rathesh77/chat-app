<template>
  <div id="app">
    <div id="notification">Connected successfully to the server</div>
    <div id="channels">
      <div id="create-channel">
        <input type="text" id="channel-name" v-model="channelName" />
        <button type="button" v-on:click="createChannel">Create channel</button>
      </div>
      <div id="channels-list">
        <div v-for="(value, name, index) in channels" v-bind:key="value.author">
          <li v-on:click="switchChannel(index)">
            {{ name.substring(0, name.indexOf(":")) }}
          </li>
        </div>
      </div>
      <input type="email" id="email" v-model="personToInvite" />
      <button type="button" v-on:click="invitePerson">
        inviter dans le channel actuel
      </button>
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
            ].messages"
            v-bind:key="index"
            class="messageContainer"
          >
            <div
              v-if="message.authorId === user.id && message.content != null"
              class="sourceMessages"
            >
              <div class="author">
                {{ message.authorName }}
              </div>
              <div class="messageContent grayed">{{ message.content }}</div>
            </div>
            <div
              v-else-if="message.content != null"
              class="destinationMessages"
            >
              <div class="author">
                {{ message.authorName }}
              </div>
              <div class="messageContent">{{ message.content }}</div>
            </div>
          </div>
        </div>
      </div>
      <div id="userIsTyping">{{ typingUsersNotification }}</div>
      <input
        type="text"
        v-model="message"
        @focus="userIsTyping"
        v-on:blur="userIsNotTypingAnymore"
      />
      <button id="sendMessageButton" v-on:click="onMessageSent()">Send</button>
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
      message: "",
      channels: {},
      selectedChannel: 0,
      channelName: "",
      typingUsers: {},
      typingUsersNotification: "",
      personToInvite: "",
    };
  },
  async created() {
    console.log("created");
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
    async invitePerson() {
      if (!/^[a-zA-Z0-9]{5,}@test.fr$/.test(this.personToInvite)) {
        console.log("regex failed");
        //return;
      }
      const channelId = this.channels[
        Object.keys(this.channels)[this.selectedChannel]
      ].channelId;
      try {
        await axios.post("/invitation", {
          recipient: this.personToInvite,
          channelId,
        });

        this.$socket.emit("invitation", {
          channelId,
          recipient: this.personToInvite,
        });
      } catch (err) {
        console.log(err);
      }
    },

    switchChannel(index) {
      this.selectedChannel = index;
      const currentSelectedChannelName = Object.keys(this.channels)[
        this.selectedChannel
      ];
      if (!this.typingUsers[currentSelectedChannelName]) return;
      if (this.typingUsers[currentSelectedChannelName].length > 1) {
        this.typingUsersNotification = "Many users are typing...";
      } else if (this.typingUsers[currentSelectedChannelName].length == 1) {
        this.typingUsersNotification = `${this.typingUsers[currentSelectedChannelName][0].user.name} is typing`;
      } else {
        this.typingUsersNotification = "";
      }
    },
    async createChannel() {
      this.$socket.emit("joinChannel", this.channelName);
      let newChannel = await axios.post("/channel", { name: this.channelName });
      newChannel = newChannel.data;
      this.channels[`${this.channelName}:${this.user.id}`] = {
        channelId: newChannel.id,
        channelName: this.channelName,
        messages: [],
      };

      this.$forceUpdate();
    },
    onMessageSent() {
      let channelName = Object.keys(this.channels)[this.selectedChannel];
      if (this.message.length === 0 || /^ *$/.test(this.message)) return;
      this.$socket.emit("message", {
        authorId: this.user.id,
        fullName: this.user.name,
        content: this.message,
        channel: {
          id: null,
          name: channelName,
          author: channelName.substring(channelName.indexOf(":") + 1),
        },
      });

      this.message = "";

      document.getElementsByTagName("input")[0].focus();
    },

    userIsTyping() {
      const currentSelectedChannelName = Object.keys(this.channels)[
        this.selectedChannel
      ];
      this.$socket.emit("userIsTyping", currentSelectedChannelName);
    },
    userIsNotTypingAnymore() {
      const currentSelectedChannelName = Object.keys(this.channels)[
        this.selectedChannel
      ];
      this.$socket.emit("userIsNotTypingAnymore", currentSelectedChannelName);
    },
  },
  sockets: {
    async channelsList(userChannels) {
      console.log(userChannels);
      this.user = await axios.get("/me");
      this.user = this.user.data;
      for (let channel of userChannels) {
        const currentChannelName = `${channel.channel_name}:${channel.channel_author_id}`;
        if (!this.channels[currentChannelName]) {
          this.channels[currentChannelName] = {
            channelId: channel.channel_id,
            channelName: channel.channel_name,
            messages: [],
          };
        }
        this.channels[currentChannelName].messages.push({
          content: channel.content,
          authorId: channel.message_author_id,
          authorName: channel.message_author_name,
        });
      }
      console.log(this.channels);
      this.$forceUpdate();
    },
    messageReceived(data) {
      let container = document.getElementById("chatMessagesContainer");
      if (!container) return;
      this.channels[data.channel.name].messages.push({
        authorId: data.authorId,
        content: data.content,
        authorName: data.fullName,
      }),
        setTimeout(() => {
          container.scrollTop = container.scrollHeight - container.clientHeight;
        }, 100);
      this.$forceUpdate();
    },

    userIsTyping({ channelName, user }) {
      if (!this.typingUsers[channelName]) {
        this.typingUsers[channelName] = [];
      }
      this.typingUsers[channelName].push(user);

      const currentSelectedChannelName = Object.keys(this.channels)[
        this.selectedChannel
      ];
      if (currentSelectedChannelName != channelName) return;
      if (this.typingUsers[channelName].length > 1) {
        this.typingUsersNotification = "Many users are typing...";
      } else {
        this.typingUsersNotification = `${this.typingUsers[channelName][0].name} is typing`;
      }
    },
    userIsNotTypingAnymore({ channelName, user }) {
      for (let i = 0; i < this.typingUsers[channelName].length; i++) {
        if (user.id == this.typingUsers[channelName][i].id) {
          this.typingUsers[channelName].splice(i, 1);
          break;
        }
      }
      const currentSelectedChannelName = Object.keys(this.channels)[
        this.selectedChannel
      ];
      if (currentSelectedChannelName != channelName) return;
      if (this.typingUsers[channelName].length > 1) {
        this.typingUsersNotification = "Many users are typing...";
      } else if (this.typingUsers[channelName].length == 1) {
        this.typingUsersNotification = `${this.typingUsers[channelName][0].name} is typing`;
      } else {
        this.typingUsersNotification = "";
      }
    },
    invitation(data) {
      if (this.user.email === data.recipient.email) {
        this.$socket.emit("joinChannel", data.channelName);
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
