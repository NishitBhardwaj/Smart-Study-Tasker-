/**
 * Modal to upload an image proof for task completion.
 */

import { useState } from 'react';
import { taskAPI } from '../services/api';

export default function ProofUploadModal({ task, onClose, onComplete }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isMandatory = task?.requires_proof;

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setError('');
        }
    };

    const handleUploadAndComplete = async () => {
        if (!file) {
            setError('Please select an image first.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // 1. Upload proof
            const formData = new FormData();
            formData.append('file', file);
            await taskAPI.uploadProof(task.id, formData);

            // 2. Mark complete
            await taskAPI.complete(task.id);
            onComplete();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to upload proof.');
            setLoading(false);
        }
    };

    const handleSkipAndComplete = async () => {
        if (isMandatory) return; // safety

        try {
            setLoading(true);
            setError('');
            await taskAPI.complete(task.id);
            onComplete();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to complete task.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative w-full max-w-sm animate-slide-up bg-surface-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-primary-500/20 text-primary-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-500/30">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">Upload Proof</h2>
                    <p className="text-sm text-surface-200/60 mb-6">
                        {isMandatory
                            ? "This task requires an image/screenshot as proof of completion."
                            : "Would you like to upload a screenshot or image to prove completion?"}
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                            {error}
                        </div>
                    )}

                    {/* File Dropzone */}
                    <div className="mb-6 relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[120px] bg-white/5 hover:bg-white/10 transition-colors">
                            {preview ? (
                                <img src={preview} alt="Preview" className="max-h-32 rounded-lg object-contain w-full" />
                            ) : (
                                <>
                                    <span className="text-2xl mb-2">📸</span>
                                    <span className="text-sm font-medium text-surface-200/80">Tap to select image</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <button
                            onClick={handleUploadAndComplete}
                            disabled={loading || !file}
                            className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 
                               text-white font-semibold rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Uploading...' : 'Upload & Complete'}
                        </button>

                        {!isMandatory && (
                            <button
                                onClick={handleSkipAndComplete}
                                disabled={loading}
                                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all duration-300 disabled:opacity-50"
                            >
                                Skip & Complete
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="w-full py-3 px-4 text-surface-200/50 hover:text-white text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
