import React, { useState } from 'react';
import { Upload, Plus, Save, FileSpreadsheet, Package, RefreshCw, X } from 'lucide-react';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import shopService from '../../services/shop.service';

export default function InventoryManager() {
    const [activeTab, setActiveTab] = useState('manual');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // For manual entry
    const [manualRows, setManualRows] = useState([
        { sku: '', stock_quantity: '' }
    ]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a file first.');
            return;
        }

        setLoading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('file_upload', file);

        try {
            const res = await shopService.syncInventory(formData, true);
            setMessage(`Success: ${res.message || 'Inventory updated'}`);
            setFile(null);
        } catch (err) {
            setMessage(`Error: ${err.response?.data?.error || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleManualChange = (index, field, value) => {
        const newRows = [...manualRows];
        newRows[index][field] = value;
        setManualRows(newRows);
    };

    const addRow = () => {
        setManualRows([...manualRows, { sku: '', stock_quantity: '' }]);
    };

    const removeRow = (index) => {
        if (manualRows.length === 1) return;
        setManualRows(manualRows.filter((_, i) => i !== index));
    };

    const handleManualSubmit = async () => {
        const dataToSubmit = manualRows.filter(r => r.sku && r.stock_quantity);
        if (dataToSubmit.length === 0) {
            setMessage('Please enter at least one valid row (SKU and Quantity).');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const res = await shopService.syncInventory(dataToSubmit);
            setMessage(`Success: ${res.message || 'Inventory updated'}`);
            setManualRows([{ sku: '', stock_quantity: '' }]);
        } catch (err) {
            setMessage(`Error: ${err.response?.data?.error || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex bg-secondary/10 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-elevated shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                >
                    Manual Entry
                </button>
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'upload' ? 'bg-elevated shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                >
                    File Upload
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.startsWith('Error') ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                    {message}
                </div>
            )}

            {activeTab === 'upload' ? (
                <Card>
                    <CardBody className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-theme bg-secondary/5 rounded-xl hover:bg-secondary/10 transition-colors cursor-pointer" onClick={() => document.getElementById('inventory-file').click()}>
                        <input
                            type="file"
                            id="inventory-file"
                            className="hidden"
                            accept=".csv, .xlsx, .xls, image/*"
                            onChange={handleFileChange}
                        />
                        <FileSpreadsheet size={48} className="text-secondary/50 mb-4" />
                        <h3 className="text-lg font-bold text-primary mb-2">Upload Inventory Data</h3>
                        <p className="text-secondary text-sm max-w-sm mb-6">
                            Upload a spreadsheet (CSV/Excel) or screenshot. The file should contain <b>SKU</b> and <b>stock_quantity</b> columns.
                        </p>

                        {file && (
                            <div className="flex items-center gap-2 bg-elevated px-4 py-2 rounded-lg border border-theme mb-4">
                                <FileSpreadsheet size={16} className="text-blue-500" />
                                <span className="text-sm font-medium text-primary">{file.name}</span>
                                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-2 hover:bg-red-500/10 p-1 rounded text-red-500">
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        <Button
                            variant="primary"
                            onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                            disabled={!file || loading}
                            className="w-full max-w-xs"
                        >
                            {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : 'Sync Inventory'}
                        </Button>
                    </CardBody>
                </Card>
            ) : (
                <Card>
                    <CardBody>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <Package size={18} /> Direct Stock Update
                            </h3>
                            <Button variant="outline" size="sm" onClick={addRow}><Plus size={16} className="mr-1" /> Add Row</Button>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-4 px-2 py-1 border-b border-theme text-xs font-semibold text-secondary uppercase tracking-wider">
                                <div className="col-span-1 text-center">#</div>
                                <div className="col-span-6">Product SKU</div>
                                <div className="col-span-4">New Stock Quantity</div>
                                <div className="col-span-1 text-center">Act</div>
                            </div>

                            {manualRows.map((row, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-4 items-center px-2">
                                    <div className="col-span-1 text-center text-secondary text-sm font-medium">{idx + 1}</div>
                                    <div className="col-span-6">
                                        <input
                                            type="text"
                                            placeholder="e.g. PRD-8234"
                                            className="w-full bg-secondary/10 border border-theme rounded-lg px-3 py-2 text-primary focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                            value={row.sku}
                                            onChange={(e) => handleManualChange(idx, 'sku', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <input
                                            type="number"
                                            placeholder="0"
                                            min="0"
                                            className="w-full bg-secondary/10 border border-theme rounded-lg px-3 py-2 text-primary focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                            value={row.stock_quantity}
                                            onChange={(e) => handleManualChange(idx, 'stock_quantity', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <button
                                            onClick={() => removeRow(idx)}
                                            className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                            disabled={manualRows.length === 1}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button variant="primary" onClick={handleManualSubmit} disabled={loading}>
                                {loading ? <RefreshCw className="animate-spin w-5 h-5 mr-2" /> : <Save size={16} className="mr-2" />}
                                Update Stock Values
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
