const mongoose = require("mongoose");
const Block = require("./Block"); // Import block model

const medicalRecordSchema = new mongoose.Schema(
	{
		patientId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		doctorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		diagnosis: {
			type: String,
			required: true,
		},
		treatment: String,
		blockchainHash: {
			type: String,
			required: false, // sẽ gán trong middleware
		},
		blockIndex: {
			type: Number,
			required: false, // sẽ gán trong middleware, lưu index của block để dễ tham chiếu
		},
	},
	{ timestamps: true }
);

// MIDDLEWARE tạo block sau khi thêm MedicalRecord
medicalRecordSchema.post("save", async function (doc, next) {
	if (doc.isNew || !doc.blockchainHash) {
		try {
			const latestBlock = await Block.findOne().sort({ index: -1 });
			const previousHash = latestBlock ? latestBlock.hash : "0";

			// SỬ DỤNG Date OBJECT THAY VÌ Date.now()
			const newBlock = new Block({
				index: latestBlock ? latestBlock.index + 1 : 0,
				timestamp: new Date(), // ✅ Sử dụng Date object
				data: {
					recordId: doc._id,
					patientId: doc.patientId,
					doctorId: doc.doctorId,
					diagnosis: doc.diagnosis,
					treatment: doc.treatment,
					action: "create", // Thêm trường action để xác định loại giao dịch
				},
				previousHash: previousHash,
			});
			
			newBlock.hash = Block.calculateHash(
				newBlock.index,
				newBlock.timestamp,
				newBlock.data,
				newBlock.previousHash
			);
			
			await newBlock.save();

			console.log(
				`✅ Block ${newBlock.index} created for medical record ${doc._id}`
			);
			
			await doc.updateOne({ 
				blockchainHash: newBlock.hash, 
				blockIndex: newBlock.index 
			});
		} catch (err) {
			console.error("Lỗi khi tạo block:", err);
		}
	}
	next();
});

// Method để verify blockchain integrity
medicalRecordSchema.statics.verifyBlockchain = async function () {
	try {
		const blocks = await Block.find().sort({ index: 1 });

		if (blocks.length === 0) {
			return {
				valid: true,
				message: "No blocks to verify",
				totalBlocks: 0,
			};
		}

		for (let i = 0; i < blocks.length; i++) {
			const currentBlock = blocks[i];

			// Kiểm tra hash của block hiện tại
			const calculatedHash = Block.calculateHash(
				currentBlock.index,
				currentBlock.timestamp,
				currentBlock.data,
				currentBlock.previousHash
			);

			if (currentBlock.hash !== calculatedHash) {
				
				return {
					valid: false,
					message: `Block ${currentBlock.index} has invalid hash`,
					storedHash: currentBlock.hash,
					calculatedHash: calculatedHash
				};
			}

			// Kiểm tra liên kết với block trước (bỏ qua block đầu tiên)
			if (i > 0) {
				const previousBlock = blocks[i - 1];
				if (currentBlock.previousHash !== previousBlock.hash) {
					return {
						valid: false,
						message: `Block ${currentBlock.index} has invalid previous hash`,
						expectedPreviousHash: previousBlock.hash,
						actualPreviousHash: currentBlock.previousHash
					};
				}
			}
		}

		return {
			valid: true,
			message: "Blockchain is valid",
			totalBlocks: blocks.length,
		};
	} catch (err) {
		return {
			valid: false,
			message: "Error verifying blockchain: " + err.message,
		};
	}
};

// Method để lấy lịch sử của một medical record
medicalRecordSchema.methods.getBlockchainHistory = async function () {
	try {
		const blocks = await Block.find({
			"data.recordId": this._id,
		}).sort({ index: 1 });

		return blocks.map((block) => ({
			blockIndex: block.index,
			timestamp: block.timestamp,
			hash: block.hash,
			action: block.data.action || "UNKNOWN",
			data: block.data,
		}));
	} catch (err) {
		console.error("Error getting blockchain history:", err);
		return [];
	}
};

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);