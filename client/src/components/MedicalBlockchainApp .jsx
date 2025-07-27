import React, { useState } from 'react';
import { 
  Shield, 
  FileText, 
  Users, 
  Activity, 
  Lock, 
  Plus, 
  Search, 
  Bell, 
  User, 
  Calendar,
  Heart,
  Clipboard,
  Database,
  Settings,
  LogOut,
  ChevronRight,
  Download,
  Eye,
  Edit3,
  Share2,
  X,
  Save,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import MedicalRecords from './MedicalRecords';
import { Navigate } from 'react-router-dom';

const MedicalBlockchainApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    bloodType: '',
    allergies: '',
    chronicDiseases: '',
    currentMedications: '',
    insurance: '',
    notes: ''
  });
  const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      return <Navigate to="/login" />;
    }

  // Sample data
  const patientData = [
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
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleLogout = () => {

  }

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate blockchain transaction
    console.log('Creating patient record...', formData);
    
    // Generate mock blockchain hash
    const mockHash = '0x' + Math.random().toString(16).substr(2, 8) + '...';
    
    // Here you would typically:
    // 1. Validate form data
    // 2. Create blockchain transaction
    // 3. Store encrypted data
    // 4. Update patient list
    
    alert(`Bệnh nhân đã được tạo thành công!\nBlockchain Hash: ${mockHash}`);
    
    // Reset form and close modal
    setFormData({
      fullName: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      bloodType: '',
      allergies: '',
      chronicDiseases: '',
      currentMedications: '',
      insurance: '',
      notes: ''
    });
    setShowAddPatientModal(false);
  };

  const AddPatientModal = () => (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showAddPatientModal ? '' : 'hidden'}`}>
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Thêm bệnh nhân mới</h3>
                <p className="text-gray-600">Tạo hồ sơ y tế trên blockchain</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddPatientModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Thông tin cơ bản */}
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Thông tin cơ bản
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập họ và tên đầy đủ"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày sinh *
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giới tính *
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0901234567"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Địa chỉ
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Địa chỉ đầy đủ"
                    />
                  </div>
                </div>
              </div>

              {/* Liên hệ khẩn cấp */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Liên hệ khẩn cấp
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên người liên hệ
                    </label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Họ tên người thân"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại khẩn cấp
                    </label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0901234567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin y tế */}
            <div className="space-y-6">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  Thông tin y tế
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhóm máu
                    </label>
                    <select
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Chọn nhóm máu</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dị ứng
                    </label>
                    <textarea
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ghi rõ các loại dị ứng (thuốc, thức ăn...)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bệnh mãn tính
                    </label>
                    <textarea
                      name="chronicDiseases"
                      value={formData.chronicDiseases}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Tiểu đường, cao huyết áp, tim mạch..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thuốc đang sử dụng
                    </label>
                    <textarea
                      name="currentMedications"
                      value={formData.currentMedications}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Tên thuốc, liều lượng, tần suất..."
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin bảo hiểm */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Bảo hiểm & Ghi chú
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thông tin bảo hiểm
                    </label>
                    <input
                      type="text"
                      name="insurance"
                      value={formData.insurance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Số thẻ BHYT, loại bảo hiểm..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú thêm
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Các thông tin quan trọng khác..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Security Notice */}
          <div className="mt-8 bg-blue-900 text-white rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h5 className="font-semibold mb-2">Bảo mật Blockchain</h5>
                <p className="text-sm opacity-90 mb-2">
                  Hồ sơ bệnh nhân sẽ được mã hóa và lưu trữ an toàn trên blockchain. 
                  Mọi thay đổi đều được ghi lại và không thể thay đổi.
                </p>
                <ul className="text-xs opacity-80 space-y-1">
                  <li>• Dữ liệu được mã hóa AES-256</li>
                  <li>• Hash được tạo tự động cho mỗi bản ghi</li>
                  <li>• Chỉ người có quyền mới có thể truy cập</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowAddPatientModal(false)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>Tạo hồ sơ trên Blockchain</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  const recentTransactions = [
   { id: 1, action: 'Tạo hồ sơ mới', patient: 'Nguyễn Văn An', time: '10:30 AM', hash: '0x1a2b...' },
   { id: 2, action: 'Cập nhật kết quả xét nghiệm', patient: 'Trần Thị Bình', time: '9:15 AM', hash: '0x5e6f...' },
   { id: 3, action: 'Chia sẻ hồ sơ', patient: 'Lê Hoàng Cường', time: '8:45 AM', hash: '0x9i0j...' }
 ];

  const Sidebar = () => (
    <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white h-screen fixed left-0 top-0 shadow-2xl">
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold">MedChain</h1>
            <p className="text-blue-200 text-sm">Blockchain Healthcare</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-8">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'patients', label: 'Bệnh nhân', icon: Users },
          { id: 'records', label: 'Hồ sơ y tế', icon: FileText },
          { id: 'blockchain', label: 'Blockchain', icon: Database },
          { id: 'settings', label: 'Cài đặt', icon: Settings }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-6 py-4 text-left hover:bg-blue-700 transition-all duration-200 ${
              activeTab === item.id ? 'bg-blue-600 border-r-4 border-blue-300' : ''
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-blue-800 rounded-lg p-4 border border-blue-600">
          <div className="flex items-center space-x-3 mb-3">
            <User className="w-10 h-10 bg-blue-600 rounded-full p-2" />
            <div>
              <p className="font-semibold">Dr. Nguyễn Văn A</p>
              <p className="text-blue-200 text-sm">Bác sĩ chuyên khoa</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-2 text-blue-200 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );

  const Header = () => (
    <div className="ml-64 bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'patients' && 'Quản lý Bệnh nhân'}
            {activeTab === 'records' && 'Hồ sơ Y tế'}
            {activeTab === 'blockchain' && 'Blockchain Network'}
            {activeTab === 'settings' && 'Cài đặt'}
          </h2>
          <p className="text-gray-600">
            {activeTab === 'dashboard' && 'Tổng quan hệ thống quản lý y tế'}
            {activeTab === 'patients' && 'Danh sách và thông tin bệnh nhân'}
            {activeTab === 'records' && 'Hồ sơ bệnh án điện tử'}
            {activeTab === 'blockchain' && 'Trạng thái mạng blockchain'}
            {activeTab === 'settings' && 'Cấu hình hệ thống'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="pl-10 pr-4 py-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
          </button>
        </div>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Tổng bệnh nhân', value: '1,234', change: '+12%', icon: Users, color: 'blue' },
          { title: 'Hồ sơ mới hôm nay', value: '28', change: '+5%', icon: FileText, color: 'green' },
          { title: 'Giao dịch blockchain', value: '567', change: '+8%', icon: Database, color: 'purple' },
          { title: 'Bảo mật', value: '99.9%', change: '0%', icon: Shield, color: 'green' }
        ].map((stat, index) => (
          <div key={index} className={`bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="opacity-90 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
                <p className="text-sm opacity-90 mt-1">
                  <span className="font-semibold">{stat.change}</span> so với tháng trước
                </p>
              </div>
              <stat.icon className="w-12 h-12 opacity-80" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-500" />
            Hoạt động gần đây
          </h3>
          <div className="space-y-3">
            {recentTransactions.map(tx => (
              <div key={tx.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="bg-blue-100 p-2 rounded-full">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{tx.action}</p>
                  <p className="text-sm text-gray-600">{tx.patient} • {tx.time}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-red-500" />
            Thống kê sức khỏe
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Bệnh nhân khỏe mạnh', value: 75, color: 'green' },
              { label: 'Đang theo dõi', value: 20, color: 'yellow' },
              { label: 'Cần điều trị', value: 5, color: 'red' }
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold">{item.value}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className={`bg-${item.color}-500 h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const PatientList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowAddPatientModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm bệnh nhân</span>
          </button>
        </div>
        <div className="flex space-x-3">
          <select className="border border-gray-300 rounded-lg px-3 py-2">
            <option>Tất cả trạng thái</option>
            <option>Khỏe mạnh</option>
            <option>Theo dõi</option>
            <option>Điều trị</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bệnh nhân</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thông tin</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lần khám gần nhất</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Blockchain Hash</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patientData.map(patient => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold">
                        {patient.name.split(' ').pop().charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{patient.name}</p>
                        <p className="text-sm text-gray-600">{patient.records} hồ sơ</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-800">{patient.age} tuổi, {patient.gender}</p>
                      <p className="text-sm text-gray-600">{patient.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{patient.lastVisit}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      patient.condition === 'Khỏe mạnh' ? 'bg-green-100 text-green-800' :
                      patient.condition === 'Theo dõi' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {patient.condition}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                      {patient.blockchainHash}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-800 transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="text-purple-600 hover:text-purple-800 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const BlockchainView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="opacity-90">Trạng thái mạng</p>
              <p className="text-2xl font-bold mt-1">Hoạt động</p>
            </div>
            <div className="w-4 h-4 bg-green-300 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="opacity-90">Block cuối cùng</p>
              <p className="text-2xl font-bold mt-1">#12,547</p>
            </div>
            <Database className="w-8 h-8 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="opacity-90">Gas Price</p>
              <p className="text-2xl font-bold mt-1">15 Gwei</p>
            </div>
            <Activity className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Lock className="w-5 h-5 mr-2 text-purple-500" />
          Giao dịch gần đây
        </h3>
        <div className="space-y-3">
          {recentTransactions.map(tx => (
            <div key={tx.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">{tx.action}</p>
                  <p className="text-sm text-gray-600 mt-1">Bệnh nhân: {tx.patient}</p>
                  <p className="text-xs text-gray-500 mt-2">Thời gian: {tx.time}</p>
                </div>
                <div className="text-right">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                    {tx.hash}
                  </code>
                  <p className="text-xs text-green-600 mt-1 flex items-center justify-end">
                    <Shield className="w-3 h-3 mr-1" />
                    Đã xác thực
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'patients' && <PatientList />}
          {activeTab === 'records' && <MedicalRecords />}
          {activeTab === 'blockchain' && <BlockchainView />}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Cài đặt hệ thống</h3>
              <p className="text-gray-600">Trang cài đặt đang được phát triển...</p>
            </div>
          )}
        </main>
      </div>
      
      {/* Add Patient Modal */}
      <AddPatientModal />
    </div>
  );
};

export default MedicalBlockchainApp;