const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		email: { 
			type: String, 
			required: function() {
				return !this.walletAddress; // Email required only if no wallet
			}, 
			unique: true,
			sparse: true // Allow multiple null values for wallet users
		},
		password: { 
			type: String, 
			required: function() {
				return !this.walletAddress; // Password required only if no wallet
			}, 
			select: false 
		},
		name: { type: String, required: true },
		role: {
			type: String,
			enum: ["patient", "doctor", "admin"],
			required: true,
		},
		phoneNumber: String,
		dateOfBirth: Date,
		// New wallet fields
		walletAddress: { 
			type: String, 
			unique: true,
			sparse: true, // Allow multiple null values
			validate: {
				validator: function(v) {
					// Basic Ethereum address validation
					return !v || /^0x[a-fA-F0-9]{40}$/.test(v);
				},
				message: 'Invalid wallet address format'
			}
		},
		authMethod: {
			type: String,
			enum: ["traditional", "wallet"],
			default: "traditional"
		},
		isWalletVerified: {
			type: Boolean,
			default: false
		}
	},
	{ timestamps: true }
);

// Ensure either email or walletAddress is provided
userSchema.pre('save', function(next) {
	if (!this.email && !this.walletAddress) {
		next(new Error('Either email or wallet address is required'));
	} else {
		next();
	}
});

module.exports = mongoose.model("User", userSchema);