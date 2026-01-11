import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    email: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null/undefined emails (for phone-only users)
    },
    phone: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String, // Hashed password
        select: false // Don't return by default
    },
    image: {
        type: String,
    },
    provider: {
        type: String,
        default: 'credentials' // 'google' or 'credentials'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
