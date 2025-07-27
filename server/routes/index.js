const authRoutes = require("./auth.route");
const userRoutes = require("./users.route");
const medicalRoutes = require("./medical.route");
const blockchainRoutes = require("./blockchain.route");
// const adminRoutes = require("./admin.route");
const { notFound, errorHandler } = require("../middlewares/errorHandler");

const initRoutes = (app) => {
	app.get("/api", (req, res) => {
		res.send("Welcome to the Medical Records Blockchain API");
	});
	app.use("/api/auth", authRoutes);
	app.use("/api/users", userRoutes);
	app.use("/api/medical", medicalRoutes);
	app.use("/api/blockchain", blockchainRoutes);
	// app.use("/api/admin", adminRoutes);

	app.use(notFound);
	app.use(errorHandler);
};

module.exports = initRoutes;
