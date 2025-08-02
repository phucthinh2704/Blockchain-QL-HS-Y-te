const crypto = require("crypto");

function createCryptoHash(data) {
	return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}
module.exports = createCryptoHash;
