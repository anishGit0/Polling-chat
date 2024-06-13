// Initialize Socket.io connection
const socket = io('http://localhost:4000');

socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
  });

// DOM Elements
const pollList = document.getElementById('pollList');
const generatePollBtn = document.getElementById('generatePollBtn');
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');

// Array to store polls on the client side
let polls = [];

// Event Listeners
generatePollBtn.addEventListener('click', generatePoll); // Add event listener to generate a new poll when the button is clicked
sendMessageBtn.addEventListener('click', sendMessage); // Add event listener to send a chat message when the button is clicked

// Socket Event Handlers
socket.on('currentPolls', displayCurrentPolls);
socket.on('newPoll', addPollToList);
socket.on('updatePoll', updatePollVotes);
socket.on('newMessage', addMessageToList);

// Functions

// Display the current polls
function displayCurrentPolls(receivedPolls) {
    polls = receivedPolls;
    polls.forEach(poll => addPollToList(poll));
}

// Generate a new poll
function generatePoll() {
    const question = prompt("Enter the poll question:");
    if (!question) return;

    const options = [];
    for (let i = 0; i < 3; i++) {
        const option = prompt(`Enter option ${i + 1}:`); // Prompt user for each option
        if (!option) return;
        options.push(option);
    }

    const correctOptionIndex = parseInt(prompt("Enter the index of the correct option (1, 2, or 3):"), 10) - 1;  // Prompt user for the index of the correct option
    if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
        alert("Invalid index for the correct option."); // Alert user if index is invalid
        return;
    }

    const pollId = Date.now(); // Generate a unique poll ID using current timestamp
    const poll = {
        id: pollId,
        question: question,
        options: options,
        correctOptionIndex: correctOptionIndex,
        votes: Array(options.length).fill(0) // Initializing votes array with zeros
    };
    polls.push(poll); // Add the new poll to the client-side array
    socket.emit('createPoll', poll); // Emit event to create a new poll on the server
}

// Add a poll to the list
function addPollToList(poll) {
    const pollElement = document.createElement('div');
    pollElement.id = `poll-${poll.id}`; // Set the id of the poll element
    pollElement.className = 'poll'; // Set the class of the poll element

    const questionElement = document.createElement('h3');
    questionElement.textContent = poll.question;
    pollElement.appendChild(questionElement);

    poll.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'poll-option'; // Set the class of the option element

        const button = document.createElement('button'); // Create a new button element for the option
        button.textContent = option; 
        button.onclick = () => vote(poll.id, index); // Set the onclick event to vote for the option
        optionElement.appendChild(button);  

        const voteCount = document.createElement('span');
        voteCount.id = `poll-${poll.id}-option-${index}`; // Set the id of the vote count element
        voteCount.textContent = '0';
        optionElement.appendChild(voteCount); // Append the vote count element to the option element

        pollElement.appendChild(optionElement); // Append the option element to the poll element
    });

    const feedbackElement = document.createElement('div');
    feedbackElement.id = `poll-${poll.id}-feedback`;
    feedbackElement.className = 'feedback';
    pollElement.appendChild(feedbackElement);

    const showAnswerButton = document.createElement('button');
    showAnswerButton.textContent = 'Show Correct Answer';
    showAnswerButton.onclick = () => showCorrectAnswer(poll.id);
    pollElement.appendChild(showAnswerButton);

    const correctAnswerElement = document.createElement('div');
    correctAnswerElement.id = `poll-${poll.id}-correct`;  // Set the id of the correct answer element
    correctAnswerElement.className = 'correct-answer';  // Set the class of the correct answer element
    pollElement.appendChild(correctAnswerElement);

    pollList.appendChild(pollElement); // Append the poll element to the poll list
}

// Update the votes of a poll
function updatePollVotes(poll) {
    const existingPoll = polls.find(p => p.id === poll.id); // Find the existing poll in the polls array
    if (existingPoll) {
        existingPoll.votes = poll.votes;  // Update the votes of the existing poll
        poll.votes.forEach((voteCount, index) => {
            const voteElement = document.getElementById(`poll-${poll.id}-option-${index}`); // Get the vote count element
            if (voteElement) {
                voteElement.textContent = voteCount;
            }
        });
    }
}

// Vote for an option
function vote(pollId, optionIndex) {
    const poll = polls.find(p => p.id === pollId); // Find the poll in the polls array
    const feedbackElement = document.getElementById(`poll-${pollId}-feedback`);

    if (poll.correctOptionIndex === optionIndex) {
        feedbackElement.textContent = 'Correct!'; // Display "Correct!" message
        feedbackElement.style.color = 'green';
    } else {
        feedbackElement.textContent = 'It is a wrong answer';  // Display "It is a wrong answer" message
        feedbackElement.style.color = 'red';
    }

    socket.emit('vote', { pollId, optionIndex });  // Emit vote event to the server
}

// Show the correct answer for a poll
function showCorrectAnswer(pollId) {
  const poll = polls.find(p => p.id === pollId);
  const correctAnswerElement = document.getElementById(`poll-${pollId}-correct`); // Get the correct answer element
  if (poll && correctAnswerElement) {
      correctAnswerElement.textContent = `Correct Answer: ${poll.options[poll.correctOptionIndex]}`; // Display the correct answer
  }
}

// Send a chat message
function sendMessage() {
    const message = messageInput.value.trim(); // Get the message from the input field
    if (message !== '') {
        socket.emit('sendMessage', message);
        messageInput.value = ''; // Clear the input field
    }
}

// Add a chat message to the list
function addMessageToList(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = message;
    messages.appendChild(messageElement); // Append the message element to the messages list
    messages.scrollTop = messages.scrollHeight; // Scroll to the bottom of the messages list
}
