const mongoose = require("mongoose");
const crypto = require("crypto");

const blockSchema = new mongoose.Schema(
	{
		index: {
			type: Number,
			required: true,
		},
		timestamp: {
			type: Date,
			default: Date.now,
		},
		data: {
			recordId: {
				type: String, // Hash của record ID
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

// Index cho hiệu suất
blockSchema.index({ "data.recordId": 1, index: 1 });
blockSchema.index({ index: 1 }); // Thêm index cho việc sort

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

	// QUAN TRỌNG: Chuẩn hóa data trước khi stringify
	const normalizedData = { ...data };

	// ✅ XỬ LÝ updatedBy một cách nhất quán
	if (normalizedData.updatedBy) {
		// Trường hợp 1: updatedBy là object đã populate (có _id)
		if (
			typeof normalizedData.updatedBy === "object" &&
			normalizedData.updatedBy._id
		) {
			normalizedData.updatedBy = normalizedData.updatedBy._id.toString();
		}
		// Trường hợp 2: updatedBy là ObjectId hoặc string
		else if (normalizedData.updatedBy.toString) {
			normalizedData.updatedBy = normalizedData.updatedBy.toString();
		}
		// Trường hợp 3: updatedBy đã là string
		else if (typeof normalizedData.updatedBy === "string") {
			// Giữ nguyên
		}
	}

	const dataStr = JSON.stringify(
		normalizedData,
		Object.keys(normalizedData).sort()
	);
	const inputString = index + timestampStr + dataStr + previousHash;
	const hash = crypto.createHash("sha256").update(inputString).digest("hex");

	console.log(`🔍 Hash calculation for block ${index}:`, {
		index,
		timestamp: timestampStr,
		normalizedData,
		dataStr,
		previousHash: previousHash.substring(0, 16) + "...",
		hash: hash.substring(0, 16) + "...",
	});

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
