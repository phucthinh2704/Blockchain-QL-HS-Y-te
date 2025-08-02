const mongoose = require("mongoose");
const Block = require("./Block");
require("dotenv").config();
const createCryptoHash = require("../utils/createCryptoHash");

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
		medication: String,
		doctorNote: String,
		treatment: String,
		dateBack: Date,
		status: {
			type: String,
			enum: ["completed", "ongoing"],
			default: "ongoing",
		},
		blockchainHash: {
			type: String,
			required: false,
		},
		blockIndex: {
			type: Number,
			required: false,
		},
		idHash: {
			type: String,
			required: false,
		},
		recordHash: {
			type: String,
			required: false,
		},
	},
	{ timestamps: true }
);

// ============= MIDDLEWARE CẬP NHẬT =============
medicalRecordSchema.post("save", async function (doc, next) {
	if (doc.isNew || !doc.blockchainHash) {
		try {
			const latestBlock = await Block.findOne().sort({ index: -1 });
			const previousHash = latestBlock ? latestBlock.hash : "0";
			const idHash = createCryptoHash(doc._id.toString());

			// QUAN TRỌNG: Populate để có đầy đủ thông tin
			await doc.populate([
				{ path: "patientId", select: "_id" },
				{ path: "doctorId", select: "_id" },
			]);

			const newBlock = new Block({
				index: latestBlock ? latestBlock.index + 1 : 0,
				timestamp: new Date(),
				data: {
					recordId: idHash,
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

			// Tính recordHash với cấu trúc nhất quán
			const recordData = {
				recordId: doc._id,
				patientId: doc.patientId._id, // Đảm bảo lấy _id
				doctorId: doc.doctorId._id, // Đảm bảo lấy _id
				diagnosis: doc.diagnosis,
				treatment: doc.treatment,
				medication: doc.medication,
				doctorNote: doc.doctorNote,
				dateBack: doc.dateBack,
				status: doc.status,
				action: "create",
			};

			const recordHash = Block.calculateHash(
				newBlock.index,
				newBlock.timestamp,
				recordData,
				newBlock.previousHash
			);

			console.log(
				`✅ Block ${newBlock.index} created for medical record ${doc._id}`
			);

			await doc.updateOne({
				blockchainHash: newBlock.hash,
				blockIndex: newBlock.index,
				idHash,
				recordHash: recordHash,
			});
		} catch (err) {
			console.error("Lỗi khi tạo block:", err);
		}
	}
	next();
});

// ============= HÀM GETBLOCKCHAINHISTORY TỐI ƯU =============
medicalRecordSchema.methods.getBlockchainHistory = async function () {
	try {
		const recordId = this._id.toString();
		const idHash = createCryptoHash(recordId);

		// Query bằng hash (nhanh hơn query string dài)
		const blocks = await Block.find({
			"data.recordId": idHash,
		})
			.sort({ index: 1 })
			.populate("data.updatedBy", "name email")
			.select("index timestamp hash data") // Chỉ select fields cần thiết
			.lean();

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

// ============= CÁC METHODS KHÁC GIỮ NGUYÊN =============
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

medicalRecordSchema.virtual("hasFollowUp").get(function () {
	return this.dateBack && this.dateBack > new Date();
});

medicalRecordSchema.set("toJSON", { virtuals: true });

// ============= BONUS: METHOD UPDATE RECORD =============
// Thêm method để update record và tạo block mới
medicalRecordSchema.methods.updateWithBlockchain = async function (
	updateData,
	updatedBy
) {
	try {
		// Update record TRƯỚC
		Object.assign(this, updateData);
		await this.save();

		// QUAN TRỌNG: Populate để đảm bảo có đầy đủ thông tin
		await this.populate([
			{ path: "patientId", select: "_id" },
			{ path: "doctorId", select: "_id" },
		]);

		// Tạo block cho update
		const latestBlock = await Block.findOne().sort({ index: -1 });
		const previousHash = latestBlock ? latestBlock.hash : "0";
		const idHash = createCryptoHash(this._id.toString());

		const newBlock = new Block({
			index: latestBlock ? latestBlock.index + 1 : 0,
			timestamp: new Date(),
			data: {
				recordId: idHash,
				action: "update",
				updatedBy: updatedBy,
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

		// Tính recordHash với cấu trúc GIỐNG HỆT như trong verify route
		const recordData = {
			recordId: this._id,
			patientId: this.patientId._id, // Đảm bảo lấy _id
			doctorId: this.doctorId._id, // Đảm bảo lấy _id
			diagnosis: this.diagnosis,
			treatment: this.treatment,
			medication: this.medication,
			doctorNote: this.doctorNote,
			dateBack: this.dateBack,
			status: this.status,
			action: "update",
			updatedBy: updatedBy, // Thêm updatedBy vào data
		};

		const recordHash = Block.calculateHash(
			newBlock.index,
			newBlock.timestamp,
			recordData,
			newBlock.previousHash
		);

		console.log(
			`✅ Update block ${newBlock.index} created for medical record ${this._id}`
		);

		// Update record với hash mới
		await this.updateOne({
			blockchainHash: newBlock.hash,
			blockIndex: newBlock.index,
			idHash: idHash,
			recordHash: recordHash,
		});

		// Update giá trị trong memory để đồng bộ
		this.blockchainHash = newBlock.hash;
		this.blockIndex = newBlock.index;
		this.idHash = idHash;
		this.recordHash = recordHash;

		return this;
	} catch (err) {
		console.error("Error updating with blockchain:", err);
		throw err;
	}
};

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
