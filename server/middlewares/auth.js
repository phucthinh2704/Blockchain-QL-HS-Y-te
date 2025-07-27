const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const authenticateToken = (req, res, next) => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		return res.status(401).json({ error: "Access token required" });
	}

	jwt.verify(token, JWT_SECRET, (err, user) => {
		if (err) {
			console.error("Token verification error:", err);
			return res.status(403).json({ error: "Invalid or expired token" });
		}
		req.user = user;
		next();
	});
};

const authorize = (roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ error: "Authentication required" });
		}

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({ 
				error: "Insufficient permissions",
				required: roles,
				current: req.user.role
			});
		}
		next();
	};
};

module.exports = {
	authenticateToken,
	authorize,
};