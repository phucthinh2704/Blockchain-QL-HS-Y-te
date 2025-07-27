import { useState } from 'react';
import { Search, Plus, Edit3, Trash2, FileText, User, Calendar, Phone } from 'lucide-react';

const MedicalRecords = () => {
  const [records, setRecords] = useState([
    {
      id: 1,
      name: 'Nguyễn Văn An',
      age: 35,
      gender: 'Nam',
      phone: '0901234567',
      lastVisit: '2025-01-15',
      condition: 'Khỏe mạnh',
      records: 5,
      blockchainHash: '0x1a2b3c4d...'
    },
    {
      id: 2,
      name: 'Trần Thị Bình',
      age: 28,
      gender: 'Nữ',
      phone: '0987654321',
      lastVisit: '2025-01-10',
      condition: 'Theo dõi',
      records: 8,
      blockchainHash: '0x5e6f7g8h...'
    },
    {
      id: 3,
      name: 'Lê Hoàng Cường',
      age: 42,
      gender: 'Nam',
      phone: '0912345678',
      lastVisit: '2025-01-18',
      condition: 'Điều trị',
      records: 12,
      blockchainHash: '0x9i0j1k2l...'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Nam',
    phone: '',
    condition: 'Khỏe mạnh',
    records: 0
  });

  const filteredRecords = records.filter(record =>
    record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.blockchainHash.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setFormData({
      name: '',
      age: '',
      gender: 'Nam',
      phone: '',
      condition: 'Khỏe mạnh',
      records: 0
    });
    setSelectedRecord(null);
    setShowForm(true);
  };

  const handleEdit = (record) => {
    setFormData(record);
    setSelectedRecord(record);
    setShowForm(true);
  };

  const handleSave = () => {
    if (selectedRecord) {
      setRecords(records.map(record => 
        record.id === selectedRecord.id 
          ? { ...formData, id: selectedRecord.id, lastVisit: new Date().toISOString().split('T')[0], blockchainHash: selectedRecord.blockchainHash }
          : record
      ));
    } else {
      const newRecord = {
        ...formData,
        id: Date.now(),
        lastVisit: new Date().toISOString().split('T')[0],
        blockchainHash: `0x${Math.random().toString(16).substr(2, 8)}...`
      };
      setRecords([...records, newRecord]);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa hồ sơ này?')) {
      setRecords(records.filter(record => record.id !== id));
    }
  };

  const getStatusColor = (condition) => {
    switch (condition) {
      case 'Khỏe mạnh': return 'bg-green-100 text-green-800';
      case 'Theo dõi': return 'bg-yellow-100 text-yellow-800';
      case 'Điều trị': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="text-blue-600" size={32} />
              Hồ Sơ Y Tế
            </h1>
            <p className="text-gray-600 mt-2">Quản lý thông tin bệnh nhân và hồ sơ điều trị</p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Thêm Hồ Sơ Mới
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, tình trạng, hoặc blockchain hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 outline-none border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Records Grid */}
      <div className="grid gap-6">
        {filteredRecords.map((record) => (
          <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{record.name}</h3>
                    <p className="text-gray-600">Blockchain: {record.blockchainHash}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.condition)}`}>
                    {record.condition}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(record)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} />
                  <span className="text-sm">
                    {record.age} tuổi ({record.gender})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={16} />
                  <span className="text-sm">{record.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText size={16} />
                  <span className="text-sm">{record.records} hồ sơ</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText size={16} />
                  <span className="text-sm">Khám gần nhất: {record.lastVisit}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Không tìm thấy hồ sơ' : 'Chưa có hồ sơ nào'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Thử tìm kiếm với từ khóa khác'
              : 'Bắt đầu thêm hồ sơ bệnh nhân đầu tiên'
            }
          </p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">
                {selectedRecord ? 'Chỉnh Sửa Hồ Sơ' : 'Thêm Hồ Sơ Mới'}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và Tên *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập họ tên đầy đủ"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tuổi *
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || ''})}
                    className="w-full px-3 py-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tuổi"
                    min="0"
                    max="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới Tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0901234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tình Trạng Sức Khỏe
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Khỏe mạnh">Khỏe mạnh</option>
                    <option value="Theo dõi">Theo dõi</option>
                    <option value="Điều trị">Điều trị</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số Hồ Sơ
                  </label>
                  <input
                    type="number"
                    value={formData.records}
                    onChange={(e) => setFormData({...formData, records: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={!formData.name || !formData.age}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {selectedRecord ? 'Cập Nhật' : 'Thêm Mới'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Hủy Bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;