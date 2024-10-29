const express = require('express');
const Chat = require('../Models/chat') // Import the Chat model
const Message = require('../Models/message'); // Import the Message model
const User = require('../Models/User'); // Import the User model
const jwt = require("jsonwebtoken");
const Chatrouter = express.Router();
const multer = require('multer');
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

const s3 = new AWS.S3();
const upload = multer({ storage: multer.memoryStorage() });
const authenticateToken = (req, res, next) => {
    // Get the Authorization heade
    console.log(req.headers)
    const authHeader = req.headers['authorization'];
    
    console.log(authHeader)
    // Check if the Authorization header is present and starts with 'Bearer'
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ error: 'Token is missing' });
    }
  
    // Verify the token using your secret key
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decodedToken) => {
      if (err) {
        return res.status(403).json({ error: 'Token is invalid' });
      }

      const user = await User.findById(decodedToken.id);
      // Extract user ID from the token and attach it to the request object
      req.userId = user.id;
  
      // Call the next middleware or route handler
      next();
    });
  };

// POST route to create a new chat for a single user and optionally add an initial message
Chatrouter.post('/chat',authenticateToken,async (req, res) => {
  try {
    const userId = req.userId;
    // Extract userId, chat name, and optional message data from the request body

    // Validate userId and name are provided
    if (!userId ) {
      return res.status(400).json({ status:false, error: 'Please provide both userId and chat name.' });
    }

    // Validate the userId exists in the User collection
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(400).json({status:false, error: 'Invalid user ID.' });
    }

    // Create the new chat
    const newChat = new Chat({
      user: userId,  // Single user in the chat
        // Name of the chat
    });

    // Save the chat
    await newChat.save();

    // Check if there's an initial message to add

    // Return the created chat with its messages
    return res.status(201).json({
      status:true,
      message: 'Chat created successfully',
      chat: newChat,
    });
  } catch (error) {
    console.error('Error creating new chat:', error);
    return res.status(500).json({ status:false,error: 'Internal server error' });
  }
});

Chatrouter.get('/chats', authenticateToken,async (req, res) => {
    try {
      // Extract userId from the request parameters
      const userId = req.userId;
  
      // Find all chats where the user is the specified userId
       const userChats = await Chat.find({ user: userId }).sort({ createdAt: -1 });
        // Optionally populate the messages

  
      // If no chats are found, return an empty array
      if (!userChats || userChats.length === 0) {
        return res.status(200).json({
        status:true,
          message: 'No chats found for this user.',
          chats: [],
        });
      }
  
      // Return the list of chats
      return res.status(200).json({
        status:true,
        message: 'Chats retrieved successfully',
        chats: userChats,
      });
    } catch (error) {

      console.error('Error fetching chats for user:', error);
      return res.status(500).json({ status:false,error: 'Internal server error' });
    }
});
Chatrouter.get('/chats/:chatId/messages', authenticateToken,async (req, res) => {
    try {
      // Extract chatId from the request parameters
      const { chatId } = req.params;
  
      // Find the chat by the provided chatId and populate its messages
      const chat = await Chat.findById(chatId)
        .populate('messages')  // Populate the messages field with actual message data
        .exec();
  
      // If no chat is found, return an error
      if (!chat) {
        return res.status(404).json({
            status:false,
          error: 'Chat not found.',
        });
      }
  
      // Return the list of messages in the chat
      return res.status(200).json({
        status:true,
        message: 'Messages retrieved successfully',
        messages: chat.messages,
      });
    } catch (error) {
      console.error('Error fetching messages for chat:', error);
      return res.status(500).json({status:false, error: 'Internal server error' });
    }
  });

Chatrouter.post('/chats/:chatId/messages',authenticateToken,upload.single('file'),async (req, res) => {
  try {
    // Extract chatId from the request parameters
    const { chatId } = req.params;

    console.log(req)

    // Extract the message details from the request body
    const { sender, text } = req.body;

    // Validate that the required fields are provided
    if (!sender || (!text && !req.file)) {
      return res.status(400).json({
        status:false,
        error: 'Please provide sender and at least text or file for the message.',
      });
    }

    // Find the chat by chatId
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        status:false,
        error: 'Chat not found.',
      });
    }
    let fileUrl = '';
    if (req.file) {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME, // Your S3 bucket name
          Key: `${Date.now()}_${req.file.originalname}`, // Unique file name
          Body: req.file.buffer, // File content from the buffer
          ContentType: req.file.mimetype, // File mime type (e.g., image/jpeg)
           // Optional: Make the file publicly readable
        };
  
        const uploadResult = await s3.upload(params).promise();
        fileUrl = uploadResult.Location; // S3 URL of the uploaded image
      }

    // Create the new message
    const newMessage = new Message({
      sender: sender,
      text: text || '', 
      fileUrl:{
        name: req.file ? req.file.originalname : '',
        url: fileUrl,
      }// Default to empty string if text is not provided
       // Default to empty string if imageUrl is not provided
    });

    // Save the new message to the database
    await newMessage.save();
   
    const botMessage = new Message({
      sender: 'bot',
      text: 'Hello, I am a bot. How can I help you today?',
    });
    
    await botMessage.save();

    // Add the new message to the chat's messages array
    chat.messages.push(newMessage._id);
    chat.messages.push(botMessage._id);

    // Save the updated chat document
    await chat.save();

    // Return the newly created message
    setTimeout(() => {
        return res.status(201).json({
            status: true,
            message: 'Message added successfully',
            newMessage: botMessage,
        });
    }, 5000);
  } catch (error) {
    status:false,
    console.error('Error adding new message to chat:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = Chatrouter;