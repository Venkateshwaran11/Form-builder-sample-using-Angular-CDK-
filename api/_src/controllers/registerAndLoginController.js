const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword, name });
        res.status(201).json({ message: "User created successfully", user });
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
        const token = jwt.sign({user:user._id},process.env.JWT_SECRET,{expiresIn:"1h"});
        res.status(200).json({message:"Login successful",token,user});
    }catch(err){
        console.error('Error logging in user:', err);
        res.status(500).json({ message: 'Failed to login user', error: err.message });
    }
}
