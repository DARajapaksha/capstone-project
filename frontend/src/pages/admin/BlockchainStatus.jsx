import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle, Clock, ExternalLink, Hash, ChevronRight } from 'lucide-react';

const BlockchainStatus = () => {

    // Mock verification result
    const mockResult = {
        studentId: "IT20123456",
        status: "Verified On-Chain",
        aiMatchScore: "98.7%",
        txHash: "0x8f2d5c...9a12bc",
        polygonLink: "https://amoy.polygonscan.com/tx/0x8f2d5c0b112233445566778899aabbccddeeff00112233445566778899aabbcc",
        timestamp: new Date().toLocaleString()
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative bg-dark-900 pointer-events-auto overflow-hidden text-slate-200">

            {/* Premium Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-3xl relative z-10">

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-4 bg-brand-500/10 border border-brand-500/20 rounded-2xl mb-6 shadow-lg shadow-brand-500/10">
                        <ShieldCheck className="w-10 h-10 text-brand-500" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3">Verification Complete</h1>
                    <p className="text-slate-400 text-lg">Your identity has been securely hashed on the Polygon blockchain.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">

                    {/* Status Panel */}
                    <div className="glass-panel p-8 animate-in slide-in-from-bottom-8 duration-700">
                        <h2 className="text-xl font-semibold text-white mb-6 border-b border-dark-700 pb-4">Digital Receipt</h2>

                        <dl className="space-y-4">
                            <div className="flex justify-between items-center">
                                <dt className="text-slate-400 flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> Student ID</dt>
                                <dd className="font-mono text-white bg-dark-900 px-2 py-1 rounded">{mockResult.studentId}</dd>
                            </div>
                            <div className="flex justify-between items-center">
                                <dt className="text-slate-400 flex items-center"><Hash className="w-4 h-4 mr-2" /> Match Score</dt>
                                <dd className="text-brand-500 font-bold">{mockResult.aiMatchScore}</dd>
                            </div>
                            <div className="flex justify-between items-center">
                                <dt className="text-slate-400 flex items-center"><Clock className="w-4 h-4 mr-2" /> Timestamp</dt>
                                <dd className="text-sm font-medium text-slate-300">{mockResult.timestamp}</dd>
                            </div>
                        </dl>

                        <div className="mt-8 pt-6 border-t border-dark-700">
                            <span className="text-sm text-slate-500 block mb-2">Immutable Blockchain Hash</span>
                            <div className="bg-dark-900/80 p-3 rounded-lg border border-dark-700 flex justify-between items-center group">
                                <span className="font-mono text-xs text-brand-500 truncate">{mockResult.txHash}</span>
                            </div>
                        </div>
                    </div>

                    {/* Audit Trail Panel */}
                    <div className="glass-panel p-8 animate-in slide-in-from-bottom-12 duration-700 delay-100 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-6 border-b border-dark-700 pb-4">Audit Trail</h2>
                            <ul className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-dark-700 before:to-transparent">

                                <li className="relative flex items-center justify-between gap-4">
                                    <div className="w-5 h-5 bg-brand-500 rounded-full border-4 border-dark-900 z-10 shadow shadow-brand-500/50"></div>
                                    <div className="w-full">
                                        <div className="text-white font-medium">NIC Uploaded</div>
                                        <div className="text-xs text-slate-400">Encrypted transmission</div>
                                    </div>
                                </li>
                                <li className="relative flex items-center justify-between gap-4">
                                    <div className="w-5 h-5 bg-brand-500 rounded-full border-4 border-dark-900 z-10 shadow shadow-brand-500/50"></div>
                                    <div className="w-full">
                                        <div className="text-white font-medium">Liveness Verified</div>
                                        <div className="text-xs text-slate-400">DeepFace / Mediapipe</div>
                                    </div>
                                </li>
                                <li className="relative flex items-center justify-between gap-4">
                                    <div className="w-5 h-5 bg-brand-500 flex items-center justify-center rounded-full border-4 border-dark-900 z-10 shadow shadow-brand-500/50"></div>
                                    <div className="w-full">
                                        <div className="text-white font-medium">Polygon Block Minted</div>
                                        <div className="text-xs text-brand-500">Decentralized Storage</div>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <a href={mockResult.polygonLink} target="_blank" rel="noopener noreferrer" className="mt-8 w-full group flex items-center justify-between px-5 py-3.5 bg-brand-500/10 hover:bg-brand-500 border border-brand-500 text-brand-500 hover:text-dark-900 rounded-xl transition-all duration-300 cursor-pointer shadow-lg shadow-brand-500/10">
                            <span className="font-semibold text-sm">View Transaction on PolygonScan</span>
                            <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </a>

                    </div>

                </div>

                <div className="mt-12 text-center text-sm text-slate-500">
                    <Link to="/verify" className="inline-flex items-center hover:text-white transition-colors">Start New Verification <ChevronRight className="w-4 h-4 ml-1" /></Link>
                </div>
            </div>

        </div>
    );
};

export default BlockchainStatus;
