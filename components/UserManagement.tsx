import React, { useState, useMemo } from 'react';
import { useInventoryContext } from '../context/InventoryContext';
import { Card } from './Card';
import type { User } from '../types';
import { EditUserModal } from './EditUserModal';
import { DeleteUserModal } from './DeleteUserModal';
import { useToast } from '../context/ToastContext';

export const UserManagement: React.FC = () => {
  const { users, addUser, updateUser, deleteUser } = useInventoryContext();
  const { addToast } = useToast();
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const activeUsers = useMemo(() => users.filter(u => !u.isDeleted), [users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) {
        addToast('رمز عبور مدیر برای افزودن کاربر الزامی است.', 'error');
        return;
    }
    setIsLoading(true);
    try {
      await addUser(newUserName, newUserPassword, adminPassword);
      addToast(`کاربر "${newUserName}" با موفقیت اضافه شد.`, 'success');
      setNewUserName('');
      setNewUserPassword('');
      setAdminPassword('');
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteClick = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };
  
  const handleConfirmEdit = (userId: string, updates: { name?: string; password?: string }, adminPass: string) => {
    return updateUser(userId, updates, adminPass);
  };
  
  const handleConfirmDelete = (userId: string, adminPass: string) => {
     return deleteUser(userId, adminPass);
  };

  return (
    <>
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={editingUser}
        onConfirm={handleConfirmEdit}
      />
      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        user={deletingUser}
        onConfirm={handleConfirmDelete}
      />
      <Card title="مدیریت کاربران">
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label htmlFor="new-user-name" className="block text-sm font-medium text-gray-700">نام کاربر جدید</label>
            <input
              type="text"
              id="new-user-name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="مثلا: سارا محمدی"
              required
            />
          </div>
          <div>
            <label htmlFor="new-user-password" className="block text-sm font-medium text-gray-700">رمز عبور کاربر</label>
            <input
              type="password"
              id="new-user-password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="یک رمز عبور برای کاربر جدید وارد کنید"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">رمز عبور مدیر</label>
            <input
              type="password"
              id="admin-password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="برای افزودن کاربر، رمز مدیر را وارد کنید"
              required
            />
          </div>

          <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
              {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              ) : 'افزودن کاربر'}
          </button>
        </form>
        
        <div>
          <h3 className="text-md font-medium text-gray-600 mb-2">کاربران فعلی</h3>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
              {activeUsers.map(user => (
                  <li key={user.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md text-sm">
                    <span>{user.name}</span>
                    <div className="space-x-2 space-x-reverse">
                      <button onClick={() => handleEditClick(user)} className="text-indigo-600 hover:text-indigo-900 text-xs">ویرایش</button>
                      <button onClick={() => handleDeleteClick(user)} className="text-red-600 hover:text-red-900 text-xs">حذف</button>
                    </div>
                  </li>
              ))}
          </ul>
        </div>
      </Card>
    </>
  );
};
