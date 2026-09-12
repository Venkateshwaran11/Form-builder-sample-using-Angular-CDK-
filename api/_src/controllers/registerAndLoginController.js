const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

exports.registerUser = async (req, res) => {
    try {
        const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
        const password = req.body.password;
        const username = (req.body.username || req.body.name || '').trim();

        if (!email || !password || !username) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ 
            email, 
            password: hashedPassword, 
            username,
            lastLogin: new Date(),
            isActive: true
        });

        // Send credentials email to the newly registered user
        let emailResult = { success: false };
        try {
            emailResult = await emailService.sendCredentialsEmail({
                to: user.email,
                username: user.username,
                password: password // send plain password provided during signup
            });
        } catch (mailErr) {
            console.error('Failed to send credentials email:', mailErr.message);
            emailResult = { success: false, error: mailErr.message };
        }

        res.status(201).json({
            message: "User registered successfully! Credentials have been sent to your email.",
            emailSent: emailResult.success,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ message: 'Failed to register user', error: err.message });
    }
}

exports.loginUser = async (req,res) => {
    try{
        const {email,password} = req.body;
        if(!email ||!password){
            return res.status(400).json({message:"All fields are required"});
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"User not found"});
        }
        const isPasswordValid = await bcrypt.compare(password,user.password);
        if(!isPasswordValid){
            return res.status(400).json({message:"Invalid password"});
        }

        // Update lastLogin and reactivate account if it was inactive
        user.lastLogin = new Date();
        user.isActive = true;
        await user.save();

        const token = jwt.sign({user:user._id},process.env.JWT_SECRET,{expiresIn:"1h"});
        res.status(200).json({message:"Login successful",token,user});
    }catch(err){
        console.error('Error logging in user:', err);
        res.status(500).json({ message: 'Failed to login user', error: err.message });
    }
}
