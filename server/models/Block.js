const mongoose = require("mongoose");
const crypto = require("crypto");

const blockSchema = new mongoose.Schema({
	index: Number,
	timestamp: {
		type: Date,
		default: Date.now,
	},
	data: {
		recordId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "MedicalRecord",
		},
		patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		diagnosis: String,
		treatment: String,
		action: {
			type: String,
			enum: ["create", "update", "delete"], // Thêm trường action để xác định loại giao dịch
			required: true,
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
});

blockSchema.statics.calculateHash = function (
	index,
	timestamp,
	data,
	previousHash
) {
	// XỬ LÝ TIMESTAMP THỐNG NHẤT
	let timestampStr;
	
	if (timestamp instanceof Date) {
		timestampStr = timestamp.toISOString();
	} else if (typeof timestamp === 'number') {
		// Nếu là Date.now() (number), convert sang Date rồi toISOString
		timestampStr = new Date(timestamp).toISOString();
	} else {
		// Fallback cho các trường hợp khác
		timestampStr = String(timestamp);
	}

	// SERIALIZE DATA THỐNG NHẤT
	const dataStr = JSON.stringify(data, null, 0); // Không có whitespace

	const inputString = index + timestampStr + dataStr + previousHash;
	const hash = crypto.createHash("sha256").update(inputString).digest("hex");
	
	return hash;
};

// Static method để lấy block cuối cùng
blockSchema.statics.getLatestBlock = async function () {
	return await this.findOne().sort({ index: -1 });
};

// Static method để lấy block tiếp theo index
blockSchema.statics.getNextIndex = async function () {
	const latestBlock = await this.getLatestBlock();
	return latestBlock ? latestBlock.index + 1 : 0;
};

module.exports = mongoose.model("Block", blockSchema);