// All the  imports are here
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const path = require('path');
const cors = require('cors');

// Creating an Express application
const app = express();

app.use(cors({
    origin: 'https://polling-chat.vercel.app',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

// Serve static files from the 'public' directory and it is the frontend for me 
// app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

// Configurations
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'https://polling-chat.vercel.app',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true
    }
});

dotenv.config();

// Array to store poll data
let polls = [];



// Event listener for new client connections
io.on('connection', (socket) => {
    console.log('New client connected');

    // Send current polls to the new client
    socket.emit('currentPolls', polls);

    // Event listener for creating a new poll
    socket.on('createPoll', (poll) => {
        poll.votes = Array(poll.options.length).fill(0);
        polls.push(poll);
        io.emit('newPoll', poll);
    });

    // Event listener for voting on a poll
    socket.on('vote', (data) => {
        const poll = polls.find(p => p.id === data.pollId);
        if (poll) {
            poll.votes[data.optionIndex]++;
            io.emit('updatePoll', poll);
        } else {
            return; // Prevent errors when poll is not found
        }
    });

    // Event listener for sending a chat message
    socket.on('sendMessage', (message) => {
        io.emit('newMessage', message);
    });

    // Event listener for client disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start the server on the specified port
const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`Server is running on port ${port}`));
