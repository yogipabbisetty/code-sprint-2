const express = require("express");
// Import the Message model
const User = require("../Models/User"); // Import the User model
const jwt = require("jsonwebtoken");
const reminderrouter = express.Router();
const Reminder = require("../Models/Reminder");
const dayjs = require('dayjs');
const cron = require("node-cron");
const mongoose = require('mongoose');
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    secure: true,
    host: "smtp.gmail.com",
    auth: {
        user: process.env.OTP_EMAIL,
        pass: process.env.OTP_EMAIL_PASSWORD,
    },
    port: 465,
});

const sendEmailNotification = (email, subject, message) => {
    const mailOptions = {
      from: process.env.OTP_EMAIL,
      to: email, // Join emails by comma to send to multiple recipients
      subject: subject,
      text: message,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(`Error while sending email: ${error}`);
      }
      console.log(`Email sent to ${email}: ${info.response}`);
    });
  };

  const scheduleReminder = (reminder) => {
    const reminderDate = dayjs(reminder.dateTime); // Parse reminder's date & time
    let cronExpression
    if(reminder.recurring){
       cronExpression = `${reminderDate.minute()} ${reminderDate.hour()} ${reminderDate.date()} * *`;
    }else{
      cronExpression = `${reminderDate.minute()} ${reminderDate.hour()} ${reminderDate.date()} ${reminderDate.month() + 1} *`; // minute hour day month
    }
    
    
    console.log(`Scheduled cron expression: ${cronExpression}`);
  
    cron.schedule(
      cronExpression,
      () => {
        sendEmailNotification(
          reminder.email,                     // Array of emails
          `Reminder: ${reminder.title}`,        // Subject
          `Don't forget! ${reminder.description}` // Message
        );
      },
      {
        scheduled: true,
        timezone: "America/New_York", // Optional timezone
      }
    );
  
    console.log(`Reminder scheduled for: ${reminderDate.format("DD/MM/YYYY HH:mm")}`);
  };

const authenticateToken = (req, res, next) => {
  // Get the Authorization heade
  console.log(req.headers);
  const authHeader = req.headers["authorization"];

  console.log(authHeader);
  // Check if the Authorization header is present and starts with 'Bearer'
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token is missing" });
  }

  // Verify the token using your secret keß
  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decodedToken) => {
    if (err) {
      return res.status(403).json({ error: "Token is invalid" });
    }

    const user = await User.findById(decodedToken.id);
    // Extract user ID from the token and attach it to the request object
    req.userId = user.id;

    // Call the next middleware or route handler
    next();
  });
};

reminderrouter.post("/addreminder", authenticateToken, async (req, res) => {
    try {
      const userId = req.userId;
      const { _id, dateTime, title, description,recurring } = req.body; // Include an `id` field in the request to check for existing expenses
       console.log(req.body)
      if (!dateTime || !title || !description  ) {
        return res.status(400).json({
          status: false, 
          error: "Please provide all required fields."
        });
      }
  
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(400).json({
          status: false, 
          error: "Invalid user ID."
        });
      }
  
      if (_id) {
        // If an ID is provided, attempt to update the existing expense
        const expense = await Reminder.findOneAndUpdate(
          { _id: _id, user: userId }, // Ensure the expense belongs to the user
          { dateTime, title,description,recurring },
          { new: true } // Return the updated document
        );
  
        if (!expense) {
          return res.status(404).json({
            status: false, 
            error: "Expense not found."
          });
        }
  
        return res.status(200).json({
          status: true,
          message: "Expense updated successfully",
          expense: expense
        });
      } else {
        // No ID provided, create a new expense
        const newExpense = new Reminder({
          dateTime, 
          title, 
          description,
          user: userId,
          recurring:recurring
        });
        await newExpense.save();
        const email = userExists.m
        const newReminder = {
            title,
            description,
            dateTime,
            email,
            recurring
          };
        await scheduleReminder(newReminder);
        return res.status(201).json({
          status: true,
          message: "Reminder added successfully",
          expense: newExpense
        });
      }
    } catch (error) {
      console.error("Error processing expense request:", error);
      return res.status(500).json({
        status: false, 
        error: "Internal server error"
      });
    }
  });


reminderrouter.get("/reminders",authenticateToken,async (req, res) => {
  try {
      const userId = req.userId;
      // const { month, year } = req.query;
     
      // Validate user existence
      const userExists = await User.findById(userId);
      if (!userExists) {
          return res.status(400).json({ status: false, error: "Invalid user ID." });
      }

      // Construct the start and end dates for the month
      // const startDate = `${year}-${month.padStart(2, '0')}-01`;
      // const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD');

      // Fetch expenses within the month
      const expenses = await Reminder.find({
          user: userId
      });


      return res.status(200).json({
          status: true,
          message: "Reminder retrieved successfully",
          reminders: expenses,
        
      });
  } catch (error) {
      console.error("Error fetching reminders for user:", error);
      return res.status(500).json({ status: false, error: "Internal server error" });
  }
});

// write a route to fetch data of particular month and year
 // Assuming model import

reminderrouter.get("/expenses", authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { month, year } = req.query;
       
        // Validate user existence
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(400).json({ status: false, error: "Invalid user ID." });
        }

        // Construct the start and end dates for the month
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD');

        // Fetch expenses within the month
        const expenses = await Reminder.find({
            user: userId,
            date: { $gte: startDate, $lte: endDate }
        });

        // Calculate total budget for the month
        const totalBudget = await Reminder.aggregate([
            { $match: { 
                user: mongoose.Types.ObjectId(userId), 
                date: { $gte: startDate, $lte: endDate }
            }},
            { $group: { _id: null, total: { $sum: "$amount" } }}
        ]);

        const total = totalBudget.length > 0 ? totalBudget[0].total : 0;

        // Handle no expenses found
        if (!expenses.length) {
            return res.status(200).json({
                status: true,
                message: "No expenses found for this user.",
                expenses: [],
                totalBudget: total
            });
        }

        return res.status(200).json({
            status: true,
            message: "Reminder retrieved successfully",
            expenses: expenses,
            totalBudget: total
        });
    } catch (error) {
        console.error("Error fetching expenses for user:", error);
        return res.status(500).json({ status: false, error: "Internal server error" });
    }
});

reminderrouter.get("/expenses/date", authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { date } = req.query; // Expecting 'date' in the format 'YYYY-MM-DD'

        // Validate user existence
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(400).json({ status: false, error: "Invalid user ID." });
        }

        // Fetch expenses on the specific date
        const expenses = await Reminder.find({
            user: userId,
            date: date  // Filters directly by the provided date
        });

        // Calculate total budget for the specific date
        const totalBudget = await Reminder.aggregate([
            { $match: { 
                user: mongoose.Types.ObjectId(userId), 
                date: date
            }},
            { $group: { _id: null, total: { $sum: "$amount" } }}
        ]);

        const total = totalBudget.length > 0 ? totalBudget[0].total : 0;

        // Handle no expenses found
        if (!expenses.length) {
            return res.status(200).json({
                status: true,
                message: "No expenses found for this user on the specified date.",
                expenses: [],
                totalBudget: total
            });
        }

        return res.status(200).json({
            status: true,
            message: "Reminder retrieved successfully for the specified date",
            expenses: expenses,
            totalBudget: total
        });
    } catch (error) {
        console.error("Error fetching expenses for user:", error);
        return res.status(500).json({ status: false, error: "Internal server error" });
    }
});
//delete expense by id

reminderrouter.delete("/reminder/:id", authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        // Validate user existence
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(400).json({ status: false, error: "Invalid user ID." });
        }


        // Find the expense by ID and user
        const expense = await Reminder.findOneAndDelete({
            _id: id,
            user: userId
        });

        // Handle no expense found

        if (!expense) {
            return res.status(404).json({
                status: true,
                message: "No Reminder found for this user with the specified ID."
            });
        }

        return res.status(200).json({
            status: true,
            message: "Reminder deleted successfully",
            expense: expense
        });

    } catch (error) {
        console.error("Error deleting expense:", error);
        return res.status(500).json({ status: false, error: "Internal server error" });
    }
});



module.exports = reminderrouter;
