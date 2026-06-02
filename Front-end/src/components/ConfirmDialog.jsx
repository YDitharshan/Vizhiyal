// ConfirmDialog — reusable destructive-action confirmation modal
import { AlertTriangle } from "lucide-react";

/**
 * Props:
 *   open        — boolean, whether to show the dialog
 *   title       — string, bold heading
 *   description — string, plain-text explanation of what will happen
 *   confirmLabel — string (default "Delete")
 *   onConfirm   — () => void, called when user confirms
 *   onCancel    — () => void, called when user cancels
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
        {/* Icon + title */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">{title}</p>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
