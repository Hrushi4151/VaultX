import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  type = "danger" 
}) {
  const isDanger = type === 'danger';
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant={isDanger ? "danger" : "primary"} 
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="py-4">
        <p className="text-gray-600">{message}</p>
      </div>
    </Modal>
  );
}
