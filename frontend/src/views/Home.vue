<template>
  <div id="app" class="flex w-full h-full text-white">
    <Modal :message="modalMessage" />
    <div id="channels" class="p-3">
      <div id="create-channel">
        <input
          class="focus:outline-none bg-black mr-2"
          type="text"
          v-model="channelName"
          placeholder="Create a channel"
        />
        <button
          type="button"
          v-on:click="createChannel"
          class="py-0 px-2 border border-black"
        >
          +
        </button>
      </div>
      <div id="channels-list" class="list-none">
        <ul>
          <li
            v-for="(value, name, index) in channels"
            v-bind:key="value.author"
            v-on:click="switchChannel(index)"
          >
            {{ name.substring(0, name.indexOf(":")) }}
          </li>
        </ul>
      </div>
    </div>

    <div id="chatRoomContainer" class="flex flex-col h-full flex-grow">
      <div
        id="header"
        class="p-5 flex flex-row justify-between border-b border-black"
      >
        <div id="channel-name">{{ selectedChannelName }}</div>
        <div class="flex space-x-2">
          <div>
            <input
              class="text-xs mr-2 text-black focus:outline-none"
              type="email"
              id="email"
              v-model="personToInvite"
              placeholder="Invite a member @email"
            />
            <button
              type="button"
              v-on:click="invitePerson"
              class="py-0 px-2 border border-black"
              v-bind:disabled="selectedChannel == -1 || !this.personToInvite.length ? true : false"
            >
              +
            </button>
          </div>
          <div>
            <button
              type="button"
              class="py-0 px-2 border-2 border-black"
              v-on:click="leaveChannel"
              v-bind:disabled="Object.keys(channels).length == 0 || selectedChannel == -1 ? true : false"
            >
              leave channel
            </button>
          </div>
          <div>
            <button
              type="button"
              class="py-0 px-2 border-2 border-black"
              v-on:click="signOut"
            >
              sign out
            </button>
          </div>
        </div>
      </div>
      <div
        id="chatMessagesContainer"
        class="p-6 flex flex-col justify-between h-full w-full"
      >
        <div style="max-height: 80vh; overflow: auto" class="p-3" id="wrapper">
          <div v-if="selectedChannel>-1">
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
            <input
              class="flex-grow focus:outline-none"
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
                selectedChannel == -1 || !this.message.length
                  ? true
                  : false
              "
              class="py-0 px-2 border-2 border-black"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
    <div id="users" class="space-y-5 p-5 pt-10">
      <div>Members</div>
      <div id="users-list" class="list-none">
        <ul v-if="channels[Object.keys(channels)[selectedChannel]]">
          <li
            v-for="(value, name, index) in channels[
              Object.keys(channels)[selectedChannel]
            ].members"
            v-bind:key="index"
          >
            <span v-if="value.name">{{ value.name }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "../axios";
import Modal from "../components/Modal.vue";
export default {
  name: "App",
  components: { Modal },
  data() {
    return {
      user: null,
      message: "",
      channels: {},
      selectedChannel: -1,
      selectedChannelName: null,
      channelName: "",
      typingUsers: {},
      typingUsersNotification: "",
      personToInvite: "",
      modalMessage: [
        "Channel creation: a channel name must contain at least 5 characters and maximum 30 characters",
        "Invite a user to a channel: you must enter an email of an existing user",
      ],
    };
  },
  async created() {
    console.log("created");
    this.$socket.open();
    this.user = await axios.get("/me");
    this.user = this.user.data;
    if (Object.keys(this.channels).length == 0)
      this.$socket.emit("getChannelsAndMessages");
    window.addEventListener("beforeunload", () => {
      this.$socket.emit("userIsNotTypingAnymore", this.user.name);
    });
  },
  watch: {
    selectedChannel() {
      if (this.selectedChannel == -1){
        this.selectedChannelName = ''
        return
      }
      const currentSelectedChannelName = Object.keys(this.channels)[
        this.selectedChannel
      ];
      this.selectedChannelName = currentSelectedChannelName.substring(
        0,
        currentSelectedChannelName.indexOf(":")
      );
    }
  },
  methods: {
    async leaveChannel() {
      const currentChannel = this.channels[
        Object.keys(this.channels)[this.selectedChannel]
      ];
      this.$socket.emit("leaveChannel", currentChannel);
      if (currentChannel.channelAuthor == this.user.id) {
        await axios.post("/channel/delete", {
          name: this.selectedChannelName,
        });
      }
      delete this.channels[Object.keys(this.channels)[this.selectedChannel]];
      this.selectedChannel = Object.keys(this.channels).length
        ? Object.keys(this.channels).length - 1
        : -1;
      
      this.$forceUpdate();
    },
    async signOut() {
      this.user = {};
      this.$socket.disconnect();
      await axios.get("/logout");
      this.$router.push({ path: "/login" });
    },
    async invitePerson() {
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
      this.typingUsersNotification = "";
    },
    async createChannel() {
      if (!/^[a-zA-Z0-9 ]{5,30}$/.test(this.channelName)) {
        console.log("le format de channel est invalide");
        return;
      }
      if (this.channels[`${this.channelName}:${this.user.id}`]) {
        console.log('vous avez deja crée un channel portant ce nom')
        return
      }
      let newChannel = await axios.post("/channel", { name: this.channelName });
      newChannel = newChannel.data;
      this.$socket.emit("createChannel", newChannel);

      this.channels[`${this.channelName}:${this.user.id}`] = {
        channelAuthor: newChannel.author,
        channelId: newChannel.id,
        channelName: this.channelName,
        messages: [],
        members: [{ id: this.user.id, name: this.user.name }],
      };
      this.selectedChannel++
      this.channelName = "";
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
    userLeft({ userId, channelName }) {
      this.channels[channelName].members = this.channels[
        channelName
      ].members.filter((user) => user.id != userId);
      if ( this.channels[channelName].members.length == 1 && this.user.id != this.channels[channelName].channelAuthor) {
        delete this.channels[channelName]
         this.selectedChannel = Object.keys(this.channels).length
        ? Object.keys(this.channels).length - 1
        : -1;
      }
      this.$forceUpdate();
    },
    newMemberJoined({ userId, userName, completeChannelName }) {
      if (!this.channels[completeChannelName].members)
        this.channels[completeChannelName].members = [];
      this.channels[completeChannelName].members.push({
        id: userId,
        name: userName,
      });
      this.$forceUpdate();
    },
    async channelsList(userChannels) {
      this.user = await axios.get("/me");
      this.user = this.user.data;
      this.channels = {};
      for (let channel of userChannels) {
        const currentChannelName = `${channel.channel_name}:${channel.channel_author_id}`;
        if (!this.channels[currentChannelName]) {
          this.channels[currentChannelName] = {
            channelId: channel.channel_id,
            channelName: channel.channel_name,
            channelAuthor: channel.channel_author_id,
            members: channel.members,
            messages: [],
          };
        }
        this.channels[currentChannelName].messages.push({
          content: channel.content,
          authorId: channel.message_author_id,
          authorName: channel.message_author_name,
        });
      }
      this.$forceUpdate();
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
      if (this.user.email === data.recipient) {
        this.$socket.emit("acceptInvitation", data.channelId);
      }
    },
    newChannel({channelInvitedIn, messages}) {
      const currentChannelName = `${channelInvitedIn.name}:${channelInvitedIn.author}`;
      this.channels[currentChannelName] = {
        channelId: channelInvitedIn.id,
        channelName: channelInvitedIn.name,
        channelAuthor: channelInvitedIn.author,
        members: [{ id: this.user.id, name: this.user.name }],
        messages
      };
      this.$forceUpdate();
    },
  },
};
</script>

<style scoped>
#channels,
#users {
  background-color: #2c2f33;
}

#channels-list ul li:hover,
#users-list ul li:hover {
  cursor: pointer;
  background-color: #23272a;
}
#channels-list ul li,
#users-list ul li {
  padding: 10px;
  max-width: 220px;
  overflow: auto;
}

#userIsTyping {
  visibility: visible;
  font-style: italic;
  font-size: 14px;
}

.messageContainer .messageContent {
  border: 1px solid black;
  display: inline-block;
  padding: 5px 10px 5px 10px;
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

#message-input {
  padding: 6px !important;
  background-color: #2c2f33;
}
</style>
