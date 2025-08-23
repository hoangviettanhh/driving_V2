import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Users, Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Eye, EyeOff, ArrowLeft, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout/Layout'
import axios from 'axios'

const UserManagementPage = () => {
  const { isAdmin, user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmColor: '',
    onConfirm: null,
    userInfo: null
  })

  useEffect(() => {
    if (!isAdmin) {
      return // ProtectedRoute sẽ handle redirect
    }
    fetchUsers()
  }, [isAdmin])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.get('/admin/users')
      
      if (response.data.success) {
        setUsers(response.data.data)
      } else {
        setError('Không thể tải danh sách người dùng')
      }
    } catch (error) {
      console.error('Fetch users error:', error)
      setError('Lỗi kết nối server')
    } finally {
      setLoading(false)
    }
  }

  const showConfirmModal = (userId, currentStatus, username) => {
    const action = currentStatus ? 'vô hiệu hóa' : 'kích hoạt'
    const actionColor = currentStatus ? 'red' : 'green'
    
    setConfirmModal({
      isOpen: true,
      title: currentStatus ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản',
      message: `Bạn có chắc chắn muốn ${action} tài khoản này?`,
      confirmText: currentStatus ? 'Vô hiệu hóa' : 'Kích hoạt',
      confirmColor: actionColor,
      onConfirm: () => toggleUserStatus(userId, currentStatus),
      userInfo: { username, currentStatus }
    })
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    if (actionLoading) return

    try {
      setActionLoading(userId)
      setConfirmModal(prev => ({ ...prev, isOpen: false })) // Close modal
      
      const response = await axios.post(`/admin/toggle-user/${userId}`)
      
      if (response.data.success) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, is_active: !currentStatus } : u
        ))
      } else {
        alert('Lỗi: ' + (response.data.error?.message || 'Không thể cập nhật trạng thái'))
      }
    } catch (error) {
      console.error('Toggle user error:', error)
      alert('Lỗi kết nối server')
    } finally {
      setActionLoading(null)
    }
  }

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      confirmText: '',
      confirmColor: '',
      onConfirm: null,
      userInfo: null
    })
  }

  const resetSuspiciousActivity = async (userId, username) => {
    if (actionLoading) return
    
    if (!window.confirm(`Bạn có chắc muốn xóa cảnh báo hoạt động đáng ngờ cho "${username}"?`)) {
      return
    }

    try {
      setActionLoading(userId)
      const response = await axios.post(`/admin/reset-suspicious/${userId}`)
      
      if (response.data.success) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { 
            ...u, 
            suspicious_activity_count: 0, 
            last_suspicious_attempt: null,
            is_flagged: false 
          } : u
        ))
      } else {
        alert('Lỗi: ' + (response.data.error?.message || 'Không thể reset cảnh báo'))
      }
    } catch (error) {
      console.error('Reset suspicious error:', error)
      alert('Lỗi kết nối server')
    } finally {
      setActionLoading(null)
    }
  }

  const forceLogout = async (userId, username) => {
    if (actionLoading) return
    
    if (!window.confirm(`Bạn có chắc muốn buộc đăng xuất tài khoản "${username}"?`)) {
      return
    }

    try {
      setActionLoading(userId)
      const response = await axios.post(`/admin/force-logout/${userId}`)
      
      if (response.data.success) {
        alert('Đã buộc đăng xuất thành công')
      } else {
        alert('Lỗi: ' + (response.data.error?.message || 'Không thể đăng xuất'))
      }
    } catch (error) {
      console.error('Force logout error:', error)
      alert('Lỗi kết nối server')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate statistics
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 1).length,
    active: users.filter(u => u.is_active).length,
    suspicious: users.filter(u => u.is_flagged || u.suspicious_activity_count > 0).length
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-600 mb-6">
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 sm:p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-200 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Quản lý người dùng
                </h1>
                <p className="text-sm text-gray-600">
                  Quản lý tài khoản và theo dõi hoạt động
                </p>
              </div>
            </div>
            
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-200 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-2xl shadow-md p-4 text-center border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</div>
              <div className="text-xs text-gray-600">Tổng người dùng</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-md p-4 text-center border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.admins}</div>
              <div className="text-xs text-gray-600">Quản trị viên</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-md p-4 text-center border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.active}</div>
              <div className="text-xs text-gray-600">Hoạt động</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-md p-4 text-center border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.suspicious}</div>
              <div className="text-xs text-gray-600">Đáng ngờ</div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-gray-100">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
            </div>
          )}

          {/* Users List */}
          {!loading && users.length > 0 && (
            <div className="space-y-4">
              {users.map((userItem) => {
                const isSuspicious = userItem.is_flagged || userItem.suspicious_activity_count > 0
                
                return (
                  <div 
                    key={userItem.id} 
                    className={`bg-white rounded-2xl shadow-md border-l-4 transition-all duration-200 hover:shadow-lg ${
                      isSuspicious ? 'border-red-500 bg-gradient-to-r from-red-50 to-white' : 'border-blue-500'
                    }`}
                  >
                    <div className="p-5">
                      {/* User Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          {/* Avatar */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                            userItem.role === 1 
                              ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                              : 'bg-gradient-to-br from-blue-500 to-blue-600'
                          }`}>
                            {userItem.username.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* User Info */}
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-bold text-gray-900 text-lg">{userItem.username}</h3>
                              <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                                userItem.role === 1 
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {userItem.role === 1 ? (
                                  <>
                                    <Shield className="w-3 h-3 mr-1" />
                                    Admin
                                  </>
                                ) : (
                                  <>
                                    <Users className="w-3 h-3 mr-1" />
                                    Giáo viên
                                  </>
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{userItem.email}</p>
                            <p className="text-sm text-gray-600">{userItem.full_name}</p>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium ${
                          userItem.is_active 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {userItem.is_active ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Hoạt động
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              Vô hiệu hóa
                            </>
                          )}
                        </span>
                      </div>

                      {/* Suspicious Activity Alert */}
                      {isSuspicious && (
                        <div className="bg-red-100 border border-red-200 rounded-xl p-3 mb-4">
                          <div className="flex items-center mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                            <span className="font-semibold text-red-800 text-sm">Hoạt động đáng ngờ</span>
                          </div>
                          <div className="text-xs text-red-700 space-y-1">
                            <div>Số lần cảnh báo: <span className="font-medium">{userItem.suspicious_activity_count}</span></div>
                            {userItem.last_suspicious_attempt && (
                              <div>Lần cuối: <span className="font-medium">{formatDate(userItem.last_suspicious_attempt)}</span></div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {userItem.role !== 1 && (
                          <button
                            onClick={() => showConfirmModal(userItem.id, userItem.is_active, userItem.username)}
                            disabled={actionLoading === userItem.id}
                            className={`flex-1 min-w-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                              userItem.is_active
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {actionLoading === userItem.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              userItem.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'
                            )}
                          </button>
                        )}
                        
                        {/* {isSuspicious && (
                          <button
                            onClick={() => resetSuspiciousActivity(userItem.id, userItem.username)}
                            disabled={actionLoading === userItem.id}
                            className="flex-1 min-w-0 px-4 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
                          >
                            {actionLoading === userItem.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              'Reset cảnh báo'
                            )}
                          </button>
                        )} */}
                        
                        {/* {userItem.role === 2 && (
                          <button
                            onClick={() => forceLogout(userItem.id, userItem.username)}
                            disabled={actionLoading === userItem.id}
                            className="flex-1 min-w-0 px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
                          >
                            {actionLoading === userItem.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              'Buộc đăng xuất'
                            )}
                          </button>
                        )} */}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && users.length === 0 && (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Không có người dùng nào</h3>
              <p className="text-gray-600">Chưa có dữ liệu người dùng để hiển thị.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                confirmModal.confirmColor === 'red' 
                  ? 'bg-red-100' 
                  : 'bg-green-100'
              }`}>
                {confirmModal.confirmColor === 'red' ? (
                  <XCircle className="w-8 h-8 text-red-600" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {confirmModal.title}
              </h3>
              <p className="text-gray-600 text-lg">
                {confirmModal.message}
              </p>
            </div>

            {/* User Info */}
            {confirmModal.userInfo && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {confirmModal.userInfo.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {confirmModal.userInfo.username}
                    </p>
                    <p className={`text-sm ${
                      confirmModal.userInfo.currentStatus ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      Trạng thái: {confirmModal.userInfo.currentStatus ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={closeConfirmModal}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-semibold text-base border-2 border-gray-200 hover:border-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (confirmModal.onConfirm) {
                    confirmModal.onConfirm()
                  }
                }}
                className={`flex-1 px-6 py-3 text-white rounded-2xl transition-all duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
                  confirmModal.confirmColor === 'red'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default UserManagementPage