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
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.resetPasswordToken;
        delete userObj.resetPasswordExpires;
        res.status(200).json({message:"Login successful",token,user: userObj});
    }catch(err){
        console.error('Error logging in user:', err);
        res.status(500).json({ message: 'Failed to login user', error: err.message });
    }
}

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user?.user || req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: Invalid user identification" });
        }

        const user = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpires');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ success: true, user });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ message: 'Failed to fetch user profile', error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user?.user || req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: Invalid user identification" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const {
            username,
            email,
            profileImage,
            bio,
            phone,
            designation,
            department,
            organization,
            location,
            customFields,
            currentPassword,
            newPassword
        } = req.body;

        // Check and update email if changed
        if (email && email.trim().toLowerCase() !== user.email) {
            const normalizedEmail = email.trim().toLowerCase();
            const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: "Email is already registered by another account" });
            }
            user.email = normalizedEmail;
        }

        if (username && username.trim()) {
            user.username = username.trim();
        }

        if (profileImage !== undefined) {
            user.profileImage = profileImage;
        }

        if (bio !== undefined) user.bio = bio;
        if (phone !== undefined) user.phone = phone;
        if (designation !== undefined) user.designation = designation;
        if (department !== undefined) user.department = department;
        if (organization !== undefined) user.organization = organization;
        if (location !== undefined) user.location = location;

        // Process custom additional fields
        if (Array.isArray(customFields)) {
            user.customFields = customFields
                .filter(cf => cf && typeof cf === 'object' && cf.label && cf.label.trim())
                .map(cf => ({
                    id: cf.id || ('cf_' + Math.random().toString(36).substring(2, 9)),
                    label: cf.label.trim(),
                    key: cf.key && cf.key.trim()
                        ? cf.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
                        : cf.label.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                    value: cf.value !== undefined && cf.value !== null ? String(cf.value) : '',
                    type: cf.type || 'text'
                }));
        }

        // Process password change if requested
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required to change password" });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Incorrect current password" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: "New password must be at least 6 characters long" });
            }
            user.password = await bcrypt.hash(newPassword, 10);
        }

        await user.save();

        const sanitizedUser = user.toObject();
        delete sanitizedUser.password;
        delete sanitizedUser.resetPasswordToken;
        delete sanitizedUser.resetPasswordExpires;

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: sanitizedUser
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Failed to update profile', error: err.message });
    }
};
