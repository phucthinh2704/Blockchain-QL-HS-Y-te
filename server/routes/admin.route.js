const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorize } = require('../middlewares/auth');

/**
 * @route GET /api/admin/users
 * @desc Get all users with pagination
 */
router.get('/users', 
    authenticateToken, 
    authorize(['admin']), 
    adminController.getAllUsers
);

/**
 * @route PUT /api/admin/users/:userId/status
 * @desc Activate/Deactivate user
 */
router.put('/users/:userId/status', 
    authenticateToken, 
    authorize(['admin']),
    adminController.updateUserStatus
);

/**
 * @route GET /api/admin/records/stats
 * @desc Get medical records statistics
 */
router.get('/records/stats', 
    authenticateToken, 
    authorize(['admin']), 
    adminController.getRecordsStats
);

/**
 * @route GET /api/admin/blockchain/stats
 * @desc Get blockchain statistics
 */
router.get('/blockchain/stats', 
    authenticateToken, 
    authorize(['admin']), 
    adminController.getBlockchainStats
);

/**
 * @route GET /api/admin/access-logs
 * @desc Get access logs with filtering
 */
router.get('/access-logs', 
    authenticateToken, 
    authorize(['admin']), 
    adminController.getAccessLogs
);

/**
 * @route POST /api/admin/backup/blockchain
 * @desc Backup blockchain data
 */
router.post('/backup/blockchain', 
    authenticateToken, 
    authorize(['admin']), 
    adminController.backupBlockchain
);

/**
 * @route GET /api/admin/system/health
 * @desc Get system health status
 */
router.get('/system/health', 
    authenticateToken, 
    authorize(['admin']), 
    adminController.getSystemHealth
);

module.exports = router;