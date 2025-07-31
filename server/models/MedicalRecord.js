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
		medication: String, // Thêm trường medication
		doctorNote: String, // Thêm trường ghi chú của bác sĩ
		treatment: String,
		dateBack: Date, // Ngày hẹn tái khám
		// shareWith: [
		// 	{
		// 		type: mongoose.Schema.Types.ObjectId,
		// 		ref: "User",
		// 	},
		// ],
		status: {
			type: String,
			enum: ["completed", "ongoing"],
			default: "ongoing",
		},
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

			// Tạo block với tất cả các trường mới
			const newBlock = new Block({
				index: latestBlock ? latestBlock.index + 1 : 0,
				timestamp: new Date(),
				data: {
					recordId: doc._id,
					patientId: doc.patientId,
					doctorId: doc.doctorId,
					diagnosis: doc.diagnosis,
					treatment: doc.treatment,
					medication: doc.medication, // Thêm medication vào block data
					doctorNote: doc.doctorNote, // Thêm doctorNote vào block data
					dateBack: doc.dateBack, // Thêm dateBack vào block data
					status: doc.status, // Thêm status vào block data
					action: "create",
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
				blockIndex: newBlock.index,
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
					calculatedHash: calculatedHash,
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
						actualPreviousHash: currentBlock.previousHash,
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
		}).sort({ index: 1 }).populate("data.updatedBy", "name email").populate("data.patientId", "name email").populate("data.doctorId", "name email");
		
		return blocks.map((block) => ({
			blockIndex: block.index,
			timestamp: block.timestamp,
			hash: block.hash,
			action: block.data.action || "UNKNOWN",
			data: block.data,
			updatedBy: block.data.updatedBy
				? {
						_id: block.data.updatedBy._id,
						name: block.data.updatedBy.name,
						email: block.data.updatedBy.email,
				  }
				: null,
		}));
	} catch (err) {
		console.error("Error getting blockchain history:", err);
		return [];
	}
};

// Method để lấy các hẹn tái khám sắp tới
medicalRecordSchema.statics.getUpcomingAppointments = async function (
	doctorId = null
) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const query = {
		dateBack: { $gte: today },
	};

	if (doctorId) {
		query.doctorId = doctorId;
	}

	return this.find(query)
		.populate("patientId", "name email phoneNumber")
		.populate("doctorId", "name email")
		.sort({ dateBack: 1 });
};

// Virtual để check xem có hẹn tái khám hay không
medicalRecordSchema.virtual("hasFollowUp").get(function () {
	return this.dateBack && this.dateBack > new Date();
});

// Ensure virtual fields are serialized
medicalRecordSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
