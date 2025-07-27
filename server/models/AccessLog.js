const mongoose = require("mongoose");

const accessLogSchema = new mongoose.Schema({
	recordId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "MedicalRecord",
		required: true,
	},
	accessedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	action: {
		type: String,
		enum: ["view", "create", "update", "share", "revoke_access"],
		required: true,
	},
	ipAddress: {
		type: String,
	},
	userAgent: {
		type: String,
	},
	success: {
		type: Boolean,
		default: true,
	},
	errorMessage: {
		type: String,
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
});

accessLogSchema.index({ recordId: 1, timestamp: -1 });
accessLogSchema.index({ accessedBy: 1, timestamp: -1 });

module.exports = mongoose.model("AccessLog", accessLogSchema);
