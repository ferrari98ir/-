import React, { useState } from 'react';
import { useInventoryContext } from '../context/InventoryContext';
import { Card } from './Card';
import type { User } from '../types';
import { EditUserModal } from './EditUserModal';
import { DeleteUserModal } from './DeleteUserModal';

export const UserManagement: React.FC = () => {
  const { users, addUser, updateUser, deleteUser } = useInventoryContext();
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!adminPassword) {
        setError('رمز عبور مدیر برای افزودن کاربر الزامی است.');
        return;
    }
    try {
      addUser(newUserName, newUserPassword, adminPassword);
      setSuccess(`کاربر "${newUserName}" با موفقیت اضافه شد.`);
      setNewUserName('');
      setNewUserPassword('');
      setAdminPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
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
    try {
      updateUser(userId, updates, adminPass);
    } catch (err) {
      throw err; // Re-throw for modal to display
    }
  };
  
  const handleConfirmDelete = (userId: string, adminPass: string) => {
     try {
      deleteUser(userId, adminPass);
    } catch (err) {
      throw err; // Re-throw for modal to display
    }
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

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
              type="submit"
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
              افزودن کاربر
          </button>
        </form>
        
        <div>
          <h3 className="text-md font-medium text-gray-600 mb-2">کاربران فعلی</h3>
          <ul className="space-y-2 max-h-40 overflow-y-auto">
              {users.filter(u => !u.isDeleted).map(user => (
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