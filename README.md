# Chat application
A chatting application to chat with your friends through text communication channels

## Features
- User authentication
- Create channels
- Join a channel automatically after invitation
- Send messages in a channel
- Leave a channel (automatic deletion if the channel was created by the current user)
- Invite people in a channel

# How to run the app on your local network
- You need to have docker installed and running on your machine
- Open a terminal window and clone the repo
- Run `docker compose up` in the root folder will pull the required images from docker hub and start the corresponding containers

The frontend app will be running on port 8080<\br>
The backend app will be running on port 3000<\br>
PostgreSQL database will be running on port 5432<\br>
