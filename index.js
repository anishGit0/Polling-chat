// All the  imports are here
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require("dotenv");
const path = require('path');

// Creating an Express application
const app = express();

// Configurations
const server = http.createServer(app);
const io = socketIo(server);
dotenv.config();

// Array to store poll data
let polls = [];

// Serve static files from the 'public' directory and it is the frontend for me 
// app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

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
const port = process.env.PORT;
server.listen(port, () => console.log(`Server is running on port ${port}`));
