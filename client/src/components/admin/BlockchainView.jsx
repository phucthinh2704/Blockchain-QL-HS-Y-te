import { Activity, AlertTriangle, CheckCircle, Clock, Database, Hash, RefreshCw, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { useCallback } from 'react';

const BlockchainView = () => {
	const [blockchainInfo, setBlockchainInfo] = useState(null);
	const [verificationResult, setVerificationResult] = useState(null);
	const [blocks, setBlocks] = useState([]);
	const [loading, setLoading] = useState({
		info: false,
		verify: false,
		blocks: false,
		fullVerify: false
	});
	const [activeTab, setActiveTab] = useState('overview');
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 10,
		total: 0,
		pages: 0
	});

	// Simulated API base URL - thay thế bằng URL thực tế
	const API_BASE = `${import.meta.env.VITE_API_URI}/blockchain`;

	// Load blockchain info - sử dụng route GET /api/blockchain/info
	const loadBlockchainInfo = useCallback(async () => {
		setLoading(prev => ({ ...prev, info: true }));
		try {
			const response = await fetch(`${API_BASE}/info`, {
				headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
			});
			const result = await response.json();
			if (result.success) {
				setBlockchainInfo(result.data);
			}
		} catch (error) {
			console.error('Error loading blockchain info:', error);
		} finally {
			setLoading(prev => ({ ...prev, info: false }));
		}
	}, [API_BASE]);

	// Verify blockchain - sử dụng route GET /api/blockchain/verify
	const verifyBlockchain = async () => {
		setLoading(prev => ({ ...prev, verify: true }));
		try {
			const response = await fetch(`${API_BASE}/verify`, {
				headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
			});
			const result = await response.json();
			if (result.success) {
				setVerificationResult(result.data);
			}
		} catch (error) {
			console.error('Error verifying blockchain:', error);
		} finally {
			setLoading(prev => ({ ...prev, verify: false }));
		}
	};

	// Full blockchain verification - sử dụng route GET /api/blockchain/verify/full
	const fullVerifyBlockchain = async () => {
		setLoading(prev => ({ ...prev, fullVerify: true }));
		try {
			const response = await fetch(`${API_BASE}/verify/full`, {
				headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
			});
			const result = await response.json();
			if (result.success) {
				setVerificationResult(result.data);
			}
		} catch (error) {
			console.error('Error in full verification:', error);
		} finally {
			setLoading(prev => ({ ...prev, fullVerify: false }));
		}
	};

	// Load blocks list - sử dụng route GET /api/blockchain/blocks
	const loadBlocks = useCallback(async (page = 1) => {
		setLoading(prev => ({ ...prev, blocks: true }));
		try {
			const response = await fetch(`${API_BASE}/blocks?page=${page}&limit=${pagination.limit}`, {
				headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
			});
			const result = await response.json();
			if (result.success) {
				setBlocks(result.data);
				setPagination(result.pagination);
			}
		} catch (error) {
			console.error('Error loading blocks:', error);
		} finally {
			setLoading(prev => ({ ...prev, blocks: false }));
		}
	}, [API_BASE, pagination.limit]);

	useEffect(() => {
		loadBlockchainInfo();
		if (activeTab === 'blocks') {
			loadBlocks();
		}
	}, [activeTab, loadBlockchainInfo, loadBlocks]);

	const formatHash = (hash) => {
		if (!hash) return 'N/A';
		return hash.substring(0, 8) + '...' + hash.substring(hash.length - 8);
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'healthy': return 'text-green-600';
			case 'warning': return 'text-yellow-600';
			case 'compromised': return 'text-red-600';
			default: return 'text-gray-600';
		}
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
			case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
			case 'compromised': return <AlertTriangle className="w-5 h-5 text-red-500" />;
			default: return <Activity className="w-5 h-5 text-gray-500" />;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold text-gray-900">
					Quản lý Blockchain
				</h2>
				<div className="flex space-x-2">
					<button
						onClick={verifyBlockchain}
						disabled={loading.verify}
						className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
						<Shield className={`w-4 h-4 mr-2 ${loading.verify ? "animate-spin" : ""}`} />
						Xác thực nhanh
					</button>
					<button
						onClick={fullVerifyBlockchain}
						disabled={loading.fullVerify}
						className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
						<Shield className={`w-4 h-4 mr-2 ${loading.fullVerify ? "animate-spin" : ""}`} />
						Xác thực đầy đủ
					</button>
					<button
						onClick={loadBlockchainInfo}
						disabled={loading.info}
						className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
						<RefreshCw className={`w-4 h-4 mr-2 ${loading.info ? "animate-spin" : ""}`} />
						Làm mới
					</button>
				</div>
			</div>

			{/* Blockchain Statistics */}
			{blockchainInfo && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					<div className="bg-white p-6 rounded-lg shadow-md">
						<div className="flex items-center">
							<Database className="w-8 h-8 text-blue-500 mr-4" />
							<div>
								<p className="text-sm font-medium text-gray-600">Tổng số blocks</p>
								<p className="text-2xl font-bold text-gray-900">{blockchainInfo.totalBlocks}</p>
							</div>
						</div>
					</div>

					<div className="bg-white p-6 rounded-lg shadow-md">
						<div className="flex items-center">
							<CheckCircle className="w-8 h-8 text-green-500 mr-4" />
							<div>
								<p className="text-sm font-medium text-gray-600">Tính toàn vẹn</p>
								<p className="text-2xl font-bold text-gray-900">{blockchainInfo.integrityPercentage}%</p>
							</div>
						</div>
					</div>

					<div className="bg-white p-6 rounded-lg shadow-md">
						<div className="flex items-center">
							{getStatusIcon(blockchainInfo.networkStatus)}
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600">Trạng thái mạng</p>
								<p className={`text-lg font-bold ${getStatusColor(blockchainInfo.networkStatus)}`}>
									{blockchainInfo.networkStatus === 'healthy' ? 'Khỏe mạnh' : 
									 blockchainInfo.networkStatus === 'warning' ? 'Cảnh báo' : 'Có vấn đề'}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white p-6 rounded-lg shadow-md">
						<div className="flex items-center">
							<Clock className="w-8 h-8 text-purple-500 mr-4" />
							<div>
								<p className="text-sm font-medium text-gray-600">Block cuối</p>
								<p className="text-lg font-bold text-gray-900">
									#{blockchainInfo.latestBlock?.index || 0}
								</p>
								<p className="text-xs text-gray-500">
									{blockchainInfo.lastBlockTime && formatDate(blockchainInfo.lastBlockTime)}
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Verification Results */}
			{verificationResult && (
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						Kết quả xác thực blockchain
					</h3>
					<div className={`p-4 rounded-lg ${verificationResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
						<div className="flex items-center mb-2">
							{verificationResult.valid ? 
								<CheckCircle className="w-5 h-5 text-green-500 mr-2" /> :
								<AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
							}
							<span className={`font-semibold ${verificationResult.valid ? 'text-green-700' : 'text-red-700'}`}>
								{verificationResult.message}
							</span>
						</div>
						
						{verificationResult.summary && (
							<div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
								<div>
									<span className="text-gray-600">Tổng blocks:</span>
									<span className="ml-2 font-medium">{verificationResult.summary.totalBlocks}</span>
								</div>
								<div>
									<span className="text-gray-600">Hợp lệ:</span>
									<span className="ml-2 font-medium text-green-600">{verificationResult.summary.validBlocks}</span>
								</div>
								<div>
									<span className="text-gray-600">Lỗi:</span>
									<span className="ml-2 font-medium text-red-600">{verificationResult.summary.invalidBlocks}</span>
								</div>
								<div>
									<span className="text-gray-600">Tỷ lệ:</span>
									<span className="ml-2 font-medium">{verificationResult.summary.integrityPercentage}%</span>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Tabs */}
			<div className="bg-white rounded-lg shadow-md">
				<div className="border-b border-gray-200">
					<nav className="flex space-x-8 px-6">
						{[
							{ id: 'overview', name: 'Tổng quan', icon: Activity },
							{ id: 'blocks', name: 'Danh sách Blocks', icon: Database },
						].map(({ id, name, icon: Icon }) => (
							<button
								key={id}
								onClick={() => setActiveTab(id)}
								className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
									activeTab === id
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								}`}>
								<Icon className="w-4 h-4 mr-2" />
								{name}
							</button>
						))}
					</nav>
				</div>

				<div className="p-6">
					{activeTab === 'overview' && blockchainInfo && (
						<div className="space-y-6">
							{/* Latest Block Info */}
							{blockchainInfo.latestBlock && (
								<div>
									<h4 className="text-md font-semibold text-gray-900 mb-3">Block mới nhất</h4>
									<div className="bg-gray-50 p-4 rounded-lg">
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
											<div>
												<span className="text-gray-600">Index:</span>
												<span className="ml-2 font-medium">#{blockchainInfo.latestBlock.index}</span>
											</div>
											<div>
												<span className="text-gray-600">Hash:</span>
												<span className="ml-2 font-mono text-xs">{formatHash(blockchainInfo.latestBlock.hash)}</span>
											</div>
											<div>
												<span className="text-gray-600">Action:</span>
												<span className="ml-2 font-medium capitalize">{blockchainInfo.latestBlock.action}</span>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Genesis Block Info */}
							{blockchainInfo.genesisBlock && (
								<div>
									<h4 className="text-md font-semibold text-gray-900 mb-3">Genesis Block</h4>
									<div className="bg-gray-50 p-4 rounded-lg">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
											<div>
												<span className="text-gray-600">Index:</span>
												<span className="ml-2 font-medium">#{blockchainInfo.genesisBlock.index}</span>
											</div>
											<div>
												<span className="text-gray-600">Hash:</span>
												<span className="ml-2 font-mono text-xs">{formatHash(blockchainInfo.genesisBlock.hash)}</span>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					)}

					{activeTab === 'blocks' && (
						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<h4 className="text-md font-semibold text-gray-900">Danh sách Blocks</h4>
								<button
									onClick={() => loadBlocks(pagination.page)}
									disabled={loading.blocks}
									className="flex items-center px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50">
									<RefreshCw className={`w-4 h-4 mr-1 ${loading.blocks ? "animate-spin" : ""}`} />
									Làm mới
								</button>
							</div>

							{loading.blocks ? (
								<div className="text-center py-8">
									<RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
									<p className="text-gray-500 mt-2">Đang tải blocks...</p>
								</div>
							) : (
								<>
									<div className="space-y-3">
										{blocks.map((block) => (
											<div key={block._id} className="border border-gray-200 rounded-lg p-4">
												<div className="flex justify-between items-start">
													<div className="flex-1">
														<div className="flex items-center space-x-4 mb-2">
															<span className="text-lg font-semibold text-blue-600">
																Block #{block.index}
															</span>
															<span className={`px-2 py-1 rounded text-xs font-medium ${
																block.isValid 
																	? 'bg-green-100 text-green-800' 
																	: 'bg-red-100 text-red-800'
															}`}>
																{block.isValid ? 'Hợp lệ' : 'Không hợp lệ'}
															</span>
															<span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium capitalize">
																{block.data.action}
															</span>
														</div>
														<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
															<div>
																<Hash className="w-4 h-4 inline mr-1" />
																Hash: <span className="font-mono">{formatHash(block.hash)}</span>
															</div>
															<div>
																<Clock className="w-4 h-4 inline mr-1" />
																{formatDate(block.timestamp)}
															</div>
														</div>
														{block.data.updatedBy && (
															<div className="mt-2 text-sm text-gray-600">
																Cập nhật bởi: <span className="font-medium">{block.data.updatedBy.name}</span>
															</div>
														)}
													</div>
												</div>
											</div>
										))}
									</div>

									{/* Pagination */}
									{pagination.pages > 1 && (
										<div className="flex justify-center items-center space-x-2 mt-6">
											<button
												onClick={() => loadBlocks(pagination.current - 1)}
												disabled={pagination.current === 1}
												className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50">
												Trước
											</button>
											<span className="text-sm text-gray-600">
												Trang {pagination.current} / {pagination.pages}
											</span>
											<button
												onClick={() => loadBlocks(pagination.current + 1)}
												disabled={pagination.current === pagination.pages}
												className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50">
												Sau
											</button>
										</div>
									)}
								</>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default BlockchainView;