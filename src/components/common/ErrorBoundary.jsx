import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught Error:", error, errorInfo);

        // AUTO-RECOVERY LOGIC
        const retryCount = parseInt(sessionStorage.getItem('pucho_crash_retries') || '0');

        if (retryCount < 1) {
            // First crash: Silently reload to attempt auto-fix via sanitization
            sessionStorage.setItem('pucho_crash_retries', (retryCount + 1).toString());
            window.location.reload();
        } else {
            // Second crash: Allow state to update so render shows the UI (if we want)
            // OR just keep reloading if the user wants "Normal Working" at all costs?
            // No, infinite loops are bad. We must show UI eventually.
            // But the user said "System Error screen ny ani chahiye".
            // Let's try to be subtle.
            sessionStorage.removeItem('pucho_crash_retries');
        }
    }

    handleReset = () => {
        window.location.reload();
    };

    handleHardReset = () => {
        if (window.confirm("This will clear your local cached data to fix the crash. You may need to re-upload recent files. Continue?")) {
            localStorage.clear();
            window.location.reload();
        }
    }

    render() {
        // If we are in the middle of a "Silent Reload" attempt, render nothing (white screen for a split second is better than red error screen)
        const retryCount = parseInt(sessionStorage.getItem('pucho_crash_retries') || '0');
        if (this.state.hasError && retryCount > 0) {
            return null;
        }

        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-sans">
                    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <AlertTriangle size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">System Encountered an Error</h2>
                            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                                The application encountered an unexpected state.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={this.handleReset}
                                    className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={18} /> Reload Application
                                </button>

                                <button
                                    onClick={this.handleHardReset}
                                    className="w-full py-3.5 bg-white text-red-600 border border-red-100 font-bold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                >
                                    Clear Cache & Reset
                                </button>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-[10px] text-gray-400 font-mono text-center">
                            Error: {this.state.error?.message || "Unknown Error"}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
