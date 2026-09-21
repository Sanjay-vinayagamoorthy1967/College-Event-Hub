import React from 'react';
import Modal from '../ui/Modal';
import GradientButton from '../ui/GradientButton';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Please confirm to proceed.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary', // 'primary' | 'danger'
  loading = false
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-dark-300 text-sm font-poppins mb-6 leading-relaxed">
        {message}
      </p>
      <div className="flex items-center justify-end gap-3.5 border-t border-white/5 pt-5">
        <GradientButton
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </GradientButton>
        <GradientButton
          variant={variant === 'danger' ? 'danger' : 'primary'}
          size="sm"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </GradientButton>
      </div>
    </Modal>
  );
}
