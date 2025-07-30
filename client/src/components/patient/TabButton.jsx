// eslint-disable-next-line no-unused-vars
const TabButton = ({ id, children, icon: Icon, activeTab, setActiveTab }) => (
		<button
			onClick={() => setActiveTab(id)}
			className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
				activeTab === id
					? "bg-blue-100 text-blue-700 border border-blue-200"
					: "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
			}`}>
			<Icon size={18} />
			<span className="text-xl">{children}</span>
		</button>
	);
   export default TabButton;