# 🏥 Blockchain Quản Lý Hồ Sơ Y Tế

Ứng dụng này sử dụng công nghệ **Blockchain** để quản lý và bảo mật hồ sơ y tế. Bệnh nhân có thể toàn quyền kiểm soát hồ sơ sức khỏe cá nhân của mình, trong khi bác sĩ và các cơ sở y tế có thể truy cập và cập nhật thông tin y tế khi có sự cho phép.

---

## ⚙️ Công nghệ sử dụng

### **Frontend:**

-   **ReactJS** (Vite)
-   **TailwindCSS** (Với `@tailwindcss/vite`)
-   **React Router DOM** (Điều hướng ứng dụng)

### **Backend:**

-   **Express** (Node.js Framework)
-   **Mongoose** (Quản lý MongoDB)
-   **Ethers.js** (Tương tác với Ethereum Blockchain)
-   **JWT** (JSON Web Tokens cho xác thực)
-   **bcrypt** (Mã hóa mật khẩu)
-   **Crypto** (Mã hóa bảo mật)

## ✨ Tính năng chính

### 🔐 Đăng nhập bằng ví điện tử (Wallet Auth)

-   Cho phép người dùng (Bệnh nhân, Bác sĩ, Admin) đăng ký và đăng nhập bằng cách kết nối và ký một thông điệp từ ví MetaMask.
-   Loại bỏ nhu cầu sử dụng email và mật khẩu truyền thống, tăng cường bảo mật.

### 🔍 Truy xuất nguồn gốc

-   Bệnh nhân và các bên được cấp quyền có thể xem lịch sử đầy đủ của một hồ sơ y tế.
-   Hệ thống cho phép truy vết mọi thay đổi của hồ sơ, từ thời điểm tạo cho đến các lần cập nhật cuối cùng.

### 🛡️ Phân quyền truy cập

-   Bệnh nhân có toàn quyền kiểm soát dữ liệu của chính mình, có thể cấp hoặc thu hồi quyền truy cập của bác sĩ.
-   Các vai trò (Patient, Doctor, Admin) được phân quyền rõ ràng để thực hiện các chức năng tương ứng.

### 🔐 Quản lý Hồ Sơ Y Tế

-   **Bệnh nhân:**

    -   Tạo và cập nhật hồ sơ y tế cá nhân.
    -   Xem và kiểm tra các hồ sơ y tế đã được lưu trữ.
    -   Quản lý quyền truy cập, cấp phép cho bác sĩ hoặc cơ sở y tế.

-   **Bác sĩ và cơ sở y tế:**

    -   Cập nhật và theo dõi hồ sơ bệnh án của bệnh nhân.
    -   Truy cập thông tin hồ sơ y tế khi có sự cho phép từ bệnh nhân.

## 🚀 Hướng dẫn chạy ứng dụng

### 1. Clone repository

```bash
git clone https://github.com/phucthinh2704/Blockchain-QL-HS-Y-te.git
cd Blockchain-QL-HS-Y-te
```

---

### 2. ⚛️ Cách chạy frontend (ReactJS)

```bash
cd client
npm install
npm run dev
```

Frontend sẽ chạy tại: [http://localhost:5173](http://localhost:5173)

---

### 3. 🐍 Cách chạy backend (Express)

```bash
cd server
npm install
npm run start
```

Backend sẽ chạy tại: [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 🔒 Lưu ý kỹ thuật

-   Dữ liệu hồ sơ y tế sẽ được lưu trữ trên Blockchain để đảm bảo tính toàn vẹn.
-   Cần đảm bảo các bước xác thực và phân quyền truy cập đúng để bảo vệ thông tin cá nhân của bệnh nhân.
-   Các thông tin người dùng và hồ sơ y tế sẽ được mã hóa trước khi lưu trữ trong cơ sở dữ liệu.
-   Backend sẽ xóa các file tạm sau khi xử lý để đảm bảo an toàn.

---

### Tài liệu yêu cầu

-   **Node.js** (>= 24)
-   **MongoDB** (hoặc sử dụng dịch vụ như MongoDB Atlas)
-   **Ethereum Wallet** (Ví MetaMask hoặc ví hỗ trợ Ethereum)
-   **React** (>= 18)

---

## 📄 License

MIT – Dự án mã nguồn mở phục vụ mục đích học tập và nghiên cứu cho môn CT099 - Blockchain và Ứng dụng.

---
