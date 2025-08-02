const mongoose = require("mongoose");
const crypto = require("crypto");

const blockSchema = new mongoose.Schema(
	{
		index: Number,
		timestamp: {
			type: Date,
			default: Date.now,
		},
		data: {
			recordId: {
				type: String, // JWT token
				required: true,
			},
			action: {
				type: String,
				enum: ["create", "update", "delete"],
				required: true,
			},
			updatedBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				required: function () {
					return this.data && this.data.action === "update";
				},
			},
		},
		previousHash: {
			type: String,
			required: true,
		},
		hash: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

// QUAN TRỌNG: Thêm index cho hiệu suất
blockSchema.index({ "data.recordIdHash": 1, index: 1 });

blockSchema.statics.calculateHash = function (
	index,
	timestamp,
	data,
	previousHash
) {
	let timestampStr;
	if (timestamp instanceof Date) {
		timestampStr = timestamp.toISOString();
	} else if (typeof timestamp === "number") {
		timestampStr = new Date(timestamp).toISOString();
	} else {
		timestampStr = String(timestamp);
	}

	const dataStr = JSON.stringify(data, null, 0);
	const inputString = index + timestampStr + dataStr + previousHash;
	const hash = crypto.createHash("sha256").update(inputString).digest("hex");

	return hash;
};

blockSchema.statics.getLatestBlock = async function () {
	return await this.findOne().sort({ index: -1 });
};

blockSchema.statics.getNextIndex = async function () {
	const latestBlock = await this.getLatestBlock();
	return latestBlock ? latestBlock.index + 1 : 0;
};

module.exports = mongoose.model("Block", blockSchema);
