import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid'; // Cần cài đặt @heroicons/react
import { memo } from 'react';

const UnauthorizedAccess = ({ user, allowedRole }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.role !== allowedRole) {
            const timer = setTimeout(() => {
                navigate("/");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [user, allowedRole, navigate]);

    if (user && user.role === allowedRole) {
        return null;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-6 bg-white p-10 rounded-xl shadow-2xl transform hover:scale-105 transition-transform duration-300 ease-in-out">
                <div className="text-center">
                    <ExclamationCircleIcon className="mx-auto h-20 w-20 text-red-500" />
                    <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
                        Quyền truy cập bị giới hạn
                    </h2>
                    <p className="mt-2 text-center text-lg text-gray-600">
                        Bạn không có đủ quyền hạn để xem trang này.
                    </p>
                </div>
                <div className="mt-8 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md">
                    <p className="text-center text-xl font-semibold">
                        Hệ thống sẽ chuyển bạn về trang chính sau 5 giây...
                    </p>
                </div>
                <div className="text-center text-gray-500 text-sm mt-4">
                    Vui lòng liên hệ bộ phận hỗ trợ nếu bạn cần truy cập.
                </div>
            </div>
        </div>
    );
};

export default memo(UnauthorizedAccess);