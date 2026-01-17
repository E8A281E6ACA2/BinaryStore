"use client";
import React from 'react';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = '确定', cancelText = '取消' }: {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded shadow-lg w-full max-w-md p-4">
        <div className="mb-2 font-semibold text-lg">{title || '确认操作'}</div>
        <div className="mb-4 text-sm text-gray-700">{message || '确定要继续此操作吗？'}</div>
        <div className="flex justify-end space-x-2">
          <button className="px-3 py-1 border rounded" onClick={onCancel}>{cancelText}</button>
          <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
