const mongoose = require("mongoose");

// models/User.js
const userSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true, select: false }, // select: false để không trả về mặc định
		name: { type: String, required: true },
		role: {
			type: String,
			enum: ["patient", "doctor", "admin"],
			required: true,
		},
		phoneNumber: String,
		dateOfBirth: Date, 
	},
	{ timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
