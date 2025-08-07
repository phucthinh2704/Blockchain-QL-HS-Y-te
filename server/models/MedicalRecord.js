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
// medicalRecordSchema.post("save", async function (doc, next) {
// 	if (doc.isNew || !doc.blockchainHash) {
// 		try {
// 			const latestBlock = await Block.findOne().sort({ index: -1 });
// 			const previousHash = latestBlock ? latestBlock.hash : "0";
// 			const idHash = createCryptoHash(doc._id.toString());

// 			// QUAN TRỌNG: Populate để có đầy đủ thông tin
// 			await doc.populate([
// 				{ path: "patientId", select: "_id" },
// 				{ path: "doctorId", select: "_id" },
// 			]);

// 			const newBlock = new Block({
// 				index: latestBlock ? latestBlock.index + 1 : 0,
// 				timestamp: new Date(),
// 				data: {
// 					recordId: idHash,
// 					action: "create",
// 				},
// 				previousHash: previousHash,
// 			});

// 			newBlock.hash = Block.calculateHash(
// 				newBlock.index,
// 				newBlock.timestamp,
// 				newBlock.data,
// 				newBlock.previousHash
// 			);

// 			await newBlock.save();

// 			// Tính recordHash với cấu trúc nhất quán
// 			const recordData = {
// 				recordId: doc._id,
// 				patientId: doc.patientId._id, // Đảm bảo lấy _id
// 				doctorId: doc.doctorId._id, // Đảm bảo lấy _id
// 				diagnosis: doc.diagnosis,
// 				treatment: doc.treatment,
// 				medication: doc.medication,
// 				doctorNote: doc.doctorNote,
// 				dateBack: doc.dateBack,
// 				status: doc.status,
// 				action: "create",
// 			};

// 			const recordHash = Block.calculateHash(
// 				newBlock.index,
// 				newBlock.timestamp,
// 				recordData,
// 				newBlock.previousHash
// 			);

// 			console.log(
// 				`✅ Block ${newBlock.index} created for medical record ${doc._id}`
// 			);

// 			await doc.updateOne({
// 				blockchainHash: newBlock.hash,
// 				blockIndex: newBlock.index,
// 				idHash,
// 				recordHash: recordHash,
// 			});
// 		} catch (err) {
// 			console.error("Lỗi khi tạo block:", err);
// 		}
// 	}
// 	next();
// });
// ============= FIX CHO MIDDLEWARE TẠO BLOCK BAN ĐẦU =============
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
					// ✅ FIX: Không thêm updatedBy cho action "create"
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

			// ✅ FIX: Tính recordHash với cấu trúc nhất quán - KHÔNG có updatedBy cho create
			const recordData = {
				recordId: doc._id,
				patientId: doc.patientId._id,
				doctorId: doc.doctorId._id,
				diagnosis: doc.diagnosis,
				treatment: doc.treatment,
				medication: doc.medication,
				doctorNote: doc.doctorNote,
				dateBack: doc.dateBack,
				status: doc.status,
				action: "create",
				// ✅ KHÔNG thêm updatedBy cho action "create"
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
// medicalRecordSchema.statics.verifyBlockchain = async function () {
// 	try {
// 		const blocks = await Block.find().sort({ index: 1 });

// 		if (blocks.length === 0) {
// 			return {
// 				valid: true,
// 				message: "No blocks to verify",
// 				totalBlocks: 0,
// 			};
// 		}

// 		for (let i = 0; i < blocks.length; i++) {
// 			const currentBlock = blocks[i];

// 			const calculatedHash = Block.calculateHash(
// 				currentBlock.index,
// 				currentBlock.timestamp,
// 				currentBlock.data,
// 				currentBlock.previousHash
// 			);

// 			if (currentBlock.hash !== calculatedHash) {
// 				return {
// 					valid: false,
// 					message: `Block ${currentBlock.index} has invalid hash`,
// 					storedHash: currentBlock.hash,
// 					calculatedHash: calculatedHash,
// 				};
// 			}

// 			if (i > 0) {
// 				const previousBlock = blocks[i - 1];
// 				if (currentBlock.previousHash !== previousBlock.hash) {
// 					return {
// 						valid: false,
// 						message: `Block ${currentBlock.index} has invalid previous hash`,
// 						expectedPreviousHash: previousBlock.hash,
// 						actualPreviousHash: currentBlock.previousHash,
// 					};
// 				}
// 			}
// 		}

// 		return {
// 			valid: true,
// 			message: "Blockchain is valid",
// 			totalBlocks: blocks.length,
// 		};
// 	} catch (err) {
// 		return {
// 			valid: false,
// 			message: "Error verifying blockchain: " + err.message,
// 		};
// 	}
// };
medicalRecordSchema.statics.verifyBlockchain = async function () {
	try {
		const blocks = await Block.find()
			.populate("data.updatedBy", "_id") // Chỉ populate _id
			.sort({ index: 1 });

		if (blocks.length === 0) {
			return {
				valid: true,
				message: "No blocks to verify",
				totalBlocks: 0,
			};
		}

		let invalidBlocks = [];

		for (let i = 0; i < blocks.length; i++) {
			const currentBlock = blocks[i];

			// Chuẩn hóa data giống như trong calculateHash
			const originalData = {
				recordId: currentBlock.data.recordId,
				action: currentBlock.data.action
			};

			if (currentBlock.data.updatedBy) {
				originalData.updatedBy = currentBlock.data.updatedBy._id || currentBlock.data.updatedBy;
				if (originalData.updatedBy.toString) {
					originalData.updatedBy = originalData.updatedBy.toString();
				}
			}

			const calculatedHash = Block.calculateHash(
				currentBlock.index,
				currentBlock.timestamp,
				originalData,
				currentBlock.previousHash
			);

			if (currentBlock.hash !== calculatedHash) {
				invalidBlocks.push({
					index: currentBlock.index,
					storedHash: currentBlock.hash,
					calculatedHash: calculatedHash,
					data: originalData
				});
			}

			// Check previous hash linkage
			if (i > 0) {
				const previousBlock = blocks[i - 1];
				if (currentBlock.previousHash !== previousBlock.hash) {
					invalidBlocks.push({
						index: currentBlock.index,
						issue: "Invalid previous hash",
						expectedPreviousHash: previousBlock.hash,
						actualPreviousHash: currentBlock.previousHash,
					});
				}
			}
		}

		if (invalidBlocks.length > 0) {
			return {
				valid: false,
				message: `Found ${invalidBlocks.length} invalid blocks`,
				invalidBlocks: invalidBlocks,
				totalBlocks: blocks.length,
				integrityPercentage: ((blocks.length - invalidBlocks.length) / blocks.length * 100).toFixed(2)
			};
		}

		return {
			valid: true,
			message: `All ${blocks.length} block${blocks.length === 1 ? "" : "s"} are valid`,
			totalBlocks: blocks.length,
			integrityPercentage: 100
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
// medicalRecordSchema.methods.updateWithBlockchain = async function (updateData, updatedBy) {
// 	try {
// 		console.log(`🔄 Starting blockchain update for record ${this._id}`);
		
// 		// 1. Update record TRƯỚC - chỉ update trong memory
// 		Object.assign(this, updateData);
		
// 		// 2. Đảm bảo populate đầy đủ thông tin TRƯỚC khi tạo block
// 		if (!this.populated('patientId')) {
// 			await this.populate('patientId', '_id');
// 		}
// 		if (!this.populated('doctorId')) {
// 			await this.populate('doctorId', '_id');
// 		}

// 		// 3. Tạo block mới
// 		const latestBlock = await Block.findOne().sort({ index: -1 });
// 		const previousHash = latestBlock ? latestBlock.hash : "0";
// 		const idHash = createCryptoHash(this._id.toString());

// 		const newBlock = new Block({
// 			index: latestBlock ? latestBlock.index + 1 : 0,
// 			timestamp: new Date(),
// 			data: {
// 				recordId: idHash,
// 				action: "update",
// 				updatedBy: updatedBy,
// 			},
// 			previousHash: previousHash,
// 		});

// 		// 4. Tính hash cho block
// 		newBlock.hash = Block.calculateHash(
// 			newBlock.index,
// 			newBlock.timestamp,
// 			newBlock.data,
// 			newBlock.previousHash
// 		);

// 		// 5. Save block trước
// 		await newBlock.save();
// 		console.log(`✅ Block ${newBlock.index} created for update`);

// 		// 6. Tính recordHash với cấu trúc CHÍNH XÁC như trong verification
// 		const recordData = {
// 			recordId: this._id,
// 			patientId: this.patientId._id || this.patientId, // Handle both populated and non-populated
// 			doctorId: this.doctorId._id || this.doctorId,   // Handle both populated and non-populated
// 			diagnosis: this.diagnosis,
// 			treatment: this.treatment,
// 			medication: this.medication,
// 			doctorNote: this.doctorNote,
// 			dateBack: this.dateBack,
// 			status: this.status,
// 			action: "update",
// 			updatedBy: updatedBy, // QUAN TRỌNG: Phải có updatedBy trong recordData
// 		};

// 		const recordHash = Block.calculateHash(
// 			newBlock.index,
// 			newBlock.timestamp,
// 			recordData,
// 			newBlock.previousHash
// 		);

// 		// 7. Update record với blockchain info và save
// 		this.blockchainHash = newBlock.hash;
// 		this.blockIndex = newBlock.index;
// 		this.idHash = idHash;
// 		this.recordHash = recordHash;

// 		// 8. Save record với tất cả thông tin mới
// 		await this.save();
		
// 		console.log(`✅ Record ${this._id} updated with blockchain info`);
// 		console.log(`📋 Record hash: ${recordHash.substring(0, 16)}...`);
// 		console.log(`🔗 Block hash: ${newBlock.hash.substring(0, 16)}...`);
		
// 		return this;
// 	} catch (err) {
// 		console.error("❌ Error updating with blockchain:", err);
// 		throw err;
// 	}
// };
medicalRecordSchema.methods.updateWithBlockchain = async function (updateData, updatedBy) {
	try {
		console.log(`🔄 Starting blockchain update for record ${this._id}`);
		
		// 1. Update record TRƯỚC - chỉ update trong memory
		Object.assign(this, updateData);
		
		// 2. Đảm bảo populate đầy đủ thông tin TRƯỚC khi tạo block
		if (!this.populated('patientId')) {
			await this.populate('patientId', '_id');
		}
		if (!this.populated('doctorId')) {
			await this.populate('doctorId', '_id');
		}

		// 3. Tạo block mới
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

		// 4. Tính hash cho block
		newBlock.hash = Block.calculateHash(
			newBlock.index,
			newBlock.timestamp,
			newBlock.data,
			newBlock.previousHash
		);

		// 5. Save block trước
		await newBlock.save();
		console.log(`✅ Block ${newBlock.index} created for update`);

		// 6. ⭐ FIX: Tính recordHash với cấu trúc CHÍNH XÁC như trong verification
		const recordData = {
			recordId: this._id,
			patientId: this.patientId._id || this.patientId,
			doctorId: this.doctorId._id || this.doctorId,
			diagnosis: this.diagnosis,
			treatment: this.treatment,
			medication: this.medication,
			doctorNote: this.doctorNote,
			dateBack: this.dateBack,
			status: this.status,
			action: "update",
			// ✅ QUAN TRỌNG: Thêm updatedBy vào recordData
			updatedBy: updatedBy
		};

		const recordHash = Block.calculateHash(
			newBlock.index,
			newBlock.timestamp,
			recordData,
			newBlock.previousHash
		);

		// 7. Update record với blockchain info và save
		this.blockchainHash = newBlock.hash;
		this.blockIndex = newBlock.index;
		this.idHash = idHash;
		this.recordHash = recordHash;

		// 8. Save record với tất cả thông tin mới
		await this.save();
		
		console.log(`✅ Record ${this._id} updated with blockchain info`);
		console.log(`📋 Record hash: ${recordHash.substring(0, 16)}...`);
		console.log(`🔗 Block hash: ${newBlock.hash.substring(0, 16)}...`);
		
		return this;
	} catch (err) {
		console.error("❌ Error updating with blockchain:", err);
		throw err;
	}
};

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
