<template>
  <div id="app">
    <div id="channels" class="">
      <div id="create-channel">
        <input class="focus:outline-none bg-black mr-2" type="text" v-model="channelName" placeholder="Create a channel" />
        <button type="button" v-on:click="createChannel" class="py-0 px-2 border border-black">+</button>
      </div>
      <div id="channels-list">
        <ul> 
          <li v-for="(value, name, index) in channels" v-bind:key="value.author" v-on:click="switchChannel(index)">
            {{ name.substring(0, name.indexOf(":")) }}
          </li>
        </ul>
      </div>
      
     
    </div>

    <div id="chatRoomContainer" class="flex flex-col">
      <div id="header" class="p-5 flex flex-row justify-between border-b border-black">
        <div id="channel-name">{{selectedChannelName}}</div>
        <div class="flex space-x-2 ">
          <div>
             <input class="text-xs mr-2" type="email" id="email" v-model="personToInvite" placeholder="Invite a member @email" />
              <button type="button" v-on:click="invitePerson" class="py-0 px-2 border border-black">+</button>

          </div>
          <div> 
          <button type="button" class="py-0 px-2 border-2 border-black">Leave room</button>
        </div>
          <div> 
          <button type="button" class="py-0 px-2 border-2 border-black" v-on:click="disconnect">Disconnect</button>
        </div>
        </div>
        
        
      </div>
      <div id="chatMessagesContainer" class="p-6 flex flex-col justify-between">
        <div style="max-height:80vh;overflow:auto" class="p-3" id="wrapper">
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

        <div class="flex flex-col"> 
           <div id="userIsTyping">{{ typingUsersNotification }}</div>

        <div id="footer" class="flex">
      <input class="flex-grow focus:outline-none"
        type="text"
        v-model="message"
        @focus="userIsTyping"
        v-on:blur="userIsNotTypingAnymore"
        placeholder="Write a message"
        id="message-input"
      />
      <button
        id="sendMessageButton"
        v-on:click="onMessageSent()"
        v-bind:disabled="
          Object.keys(channels).length > 0 && message.length ? false : true
        "
        class="py-0 px-2 border-2 border-black"
      >
        Send
      </button>
        </div>
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
      selectedChannelName : null,
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
    this.$socket.emit('getChannelsAndMessages')
    window.addEventListener("beforeunload", () => {
      this.$socket.emit("userIsNotTypingAnymore", this.user.name);
    });
  },

  methods: {
    async disconnect(){
      this.user = {}
      await axios.get('/logout')
      this.$router.push({path:'/login'}) 
    },
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
      this.selectedChannelName = currentSelectedChannelName.substring(0,currentSelectedChannelName.indexOf(':') )
      if (!this.typingUsers[currentSelectedChannelName]) return;
      if (this.typingUsers[currentSelectedChannelName].length > 1) {
        this.typingUsersNotification = "Many users are typing...";
      } else if (this.typingUsers[currentSelectedChannelName].length == 1) {
        this.typingUsersNotification = `${this.typingUsers[currentSelectedChannelName][0].user.name} is typing...`;
      } else {
        this.typingUsersNotification = "";
      }
    },
    async createChannel() {
      if (!/^[a-zA-Z0-9 ]{5,}$/.test(this.channelName)) {
        console.log("le format de channel est invalide");
        return;
      }
      let newChannel = await axios.post("/channel", { name: this.channelName });
      newChannel = newChannel.data;
      this.$socket.emit("createChannel", newChannel);

      this.channels[`${this.channelName}:${this.user.id}`] = {
        channelId: newChannel.id,
        channelName: this.channelName,
        messages: [],
      };
      this.channelName = ""
      this.$forceUpdate();
    },
    onMessageSent() {
      let channelName = Object.keys(this.channels)[this.selectedChannel];

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
      if ( Object.keys(this.channels)[this.selectedChannel])
      this.selectedChannelName = Object.keys(this.channels)[this.selectedChannel].substring(0, Object.keys(this.channels)[this.selectedChannel].indexOf(':') )
    },
    messageReceived(data) {
      let container = document.getElementById("wrapper");
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
        this.typingUsersNotification = `${this.typingUsers[channelName][0].name} is typing...`;
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
        this.typingUsersNotification = `${this.typingUsers[channelName][0].name} is typing...`;
      } else {
        this.typingUsersNotification = "";
      }
    },
    invitation(data) {
      console.log("invitation recu");
      console.log(this.user, data.recipient);
      if (this.user.email === data.recipient) {
        console.log("invitation recu");
        console.log(data)
        this.$socket.emit("acceptInvitation", data.channelId);
        this.$forceUpdate();
      }
    },
  },
};
</script>

<style scoped>
#app {
  color: white !important;
}
#channels {
  background-color: #2c2f33;
    padding: 10px;

}

#channels-list {
  list-style: none;
}
#channels-list ul li:hover {
  cursor: pointer;
  background-color: #23272a;
}
#channels-list ul li {
  padding: 10px;
}
#app {
  display:flex;
  flex-direction: row;
  width: 100%;
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

#chatRoomContainer {
  height: 100%;
  /*padding: 70px 20px 70px 20px;*/
  flex-grow: 1;
}

#chatMessagesContainer {
    height: 100%;

  width: 100%;
}

.messageContainer .messageContent {
  border: 1px solid black;
  display: inline-block;
  padding : 5px 10px 5px 10px;
  font-weight: 500;
  max-width: 200px;
  word-wrap: break-word;
  margin-bottom: 5px;
  border-radius: 10px;
}

.messageContainer .sourceMessages {
  text-align: right;
}
.messageContainer .destinationMessages {
  text-align: left;
}

.grayed {
}
input {
    color:white !important
}
#message-input {
    padding: 6px  !important;
    background-color: #2C2F33;
}


</style>
