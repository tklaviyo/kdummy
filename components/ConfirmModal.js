'use client'

export function ConfirmModal({ open, mode, title, message, confirmLabel, danger, onConfirm, onCancel }) {
  if (!open) return null

  const isDanger = danger ?? (mode === 'confirm' && (confirmLabel?.toLowerCase().includes('delete') ?? false))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onCancel}
      />
      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-gray-200 transition-opacity duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div className="p-6">
          {title && (
            <h3 id="confirm-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          )}
          <p id="confirm-message" className={`mt-2 text-gray-600 ${title ? '' : 'text-base'}`}>
            {message}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {mode === 'confirm' && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={mode === 'confirm' ? onConfirm : onCancel}
              className={
                isDanger
                  ? 'rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                  : 'rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
              }
            >
              {mode === 'confirm' ? confirmLabel || 'Confirm' : 'OK'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
