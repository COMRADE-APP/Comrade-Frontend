import re
import sys

def main():
    file_path = r'c:\Users\Imani\Documents\Comrade\Comrade-Frontend\src\pages\payments\PiggyBankDetail.jsx'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add state variables for the new actions
    state_vars = """
    const [extendDate, setExtendDate] = useState('');
    const [actionRequests, setActionRequests] = useState([]);
"""
    # Insert after `const [claimLoading, setClaimLoading] = useState(false);`
    content = content.replace("const [claimLoading, setClaimLoading] = useState(false);",
                              "const [claimLoading, setClaimLoading] = useState(false);\n" + state_vars)

    # 2. Add loading action requests to `loadData`
    load_data_inner = """
            try {
                const [analyticsData, statusData, actionReqsData] = await Promise.all([
                    paymentsService.getPiggyAnalytics(id),
                    data.payment_group ? paymentsService.getPiggyConversionStatus(id) : Promise.resolve(null),
                    data.payment_group ? paymentsService.getPiggyBankActionRequests(id).catch(() => []) : Promise.resolve([])
                ]);
                setAnalytics(analyticsData);
                setConversionStatus(statusData);
                setActionRequests(actionReqsData);
"""
    content = re.sub(r'try \{\s+const \[analyticsData, statusData\] = await Promise\.all\(\[\s+paymentsService\.getPiggyAnalytics\(id\),\s+data\.payment_group \? paymentsService\.getPiggyConversionStatus\(id\) : Promise\.resolve\(null\)\s+\]\);\s+setAnalytics\(analyticsData\);\s+setConversionStatus\(statusData\);',
                     load_data_inner.strip(), content)

    # 3. Add handlers
    handlers = """
    const handleExtendMaturity = async () => {
        if (!extendDate) return;
        setSettingsLoading(true);
        try {
            await paymentsService.extendPiggyBankMaturity(id, extendDate);
            toast.success(piggy.payment_group ? 'Extension request submitted for approval' : 'Maturity date extended');
            setExtendDate('');
            loadData();
            if (!piggy.payment_group) setShowSettingsModal(false);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to extend maturity');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleDissolve = async () => {
        if (!window.confirm('Are you sure you want to dissolve this piggy bank? This will withdraw all funds and deactivate it.')) return;
        setSettingsLoading(true);
        try {
            await paymentsService.dissolvePiggyBank(id);
            toast.success(piggy.payment_group ? 'Dissolve request submitted for approval' : 'Piggy bank dissolved');
            loadData();
            if (!piggy.payment_group) setShowSettingsModal(false);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to dissolve');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleVoteAction = async (requestId, vote) => {
        try {
            await paymentsService.votePiggyBankAction(id, requestId, vote);
            toast.success(vote === 'approve' ? 'Voted to approve' : 'Voted to reject');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to vote');
        }
    };
"""
    # Insert before `const openSettings = () => {`
    content = content.replace("const openSettings = () => {", handlers + "\n    const openSettings = () => {")

    # 4. Add Important Actions section to Settings Modal
    important_actions = """
                                <div className="pt-4 border-t border-theme">
                                    <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
                                        <PiggyBank className="w-4 h-4 text-emerald-500" />
                                        Important Actions
                                    </h4>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm font-bold text-primary mb-2">Extend Maturity Date</p>
                                            <div className="flex gap-2">
                                                <Input 
                                                    type="date"
                                                    value={extendDate}
                                                    onChange={e => setExtendDate(e.target.value)}
                                                />
                                                <Button type="button" onClick={handleExtendMaturity} disabled={!extendDate || settingsLoading}>Extend</Button>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <p className="text-sm font-bold text-red-600 mb-2">Dissolve Piggy Bank</p>
                                            <p className="text-xs text-secondary mb-2">This will withdraw all funds and deactivate the piggy bank.</p>
                                            <Button type="button" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDissolve} disabled={settingsLoading}>Dissolve Piggy Bank</Button>
                                        </div>
                                    </div>
                                    
                                    <div className={`mt-3 p-2 rounded border ${piggy.payment_group ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                        <p className={`text-xs ${piggy.payment_group ? 'text-amber-800' : 'text-emerald-800'}`}>
                                            {piggy.payment_group ? 'As a group piggy bank, these actions will require 100% approval from members.' : 'These changes will take effect immediately.'}
                                        </p>
                                    </div>
                                </div>
"""
    # Insert before `<div className="flex gap-3 pt-2">`
    content = content.replace('<div className="flex gap-3 pt-2">', important_actions + '\n                                <div className="flex gap-3 pt-2">')

    # 5. Add Pending Action Requests View
    action_requests_ui = """
                {/* Pending Action Requests */}
                {piggy.payment_group && actionRequests && actionRequests.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-primary">Pending Action Requests</h3>
                        {actionRequests.filter(req => req.status === 'pending').map(req => (
                            <div key={req.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-5 h-5 text-amber-600" />
                                    <h4 className="font-bold text-amber-900 capitalize">{req.action_type.replace('_', ' ')} Request</h4>
                                </div>
                                <p className="text-sm text-amber-800 mb-2">
                                    Requested by: {req.requested_by_name}
                                </p>
                                {req.action_type === 'extend_maturity' && (
                                    <p className="text-sm font-bold mb-2 text-amber-900">New Date: {new Date(req.new_maturity_date).toLocaleDateString()}</p>
                                )}
                                {req.action_type === 'withdraw' && (
                                    <p className="text-sm font-bold mb-2 text-amber-900">Amount: ${parseFloat(req.amount).toLocaleString()}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-amber-700 mb-4">
                                    <span>Approvals: {req.approvals_count} / {req.total_members}</span>
                                    <span>Rejections: {req.rejections_count}</span>
                                </div>
                                
                                {!req.current_user_vote ? (
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => handleVoteAction(req.id, 'approve')}>Approve</Button>
                                        <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => handleVoteAction(req.id, 'reject')}>Reject</Button>
                                    </div>
                                ) : (
                                    <p className="text-xs font-bold text-amber-800">You voted: {req.current_user_vote}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
"""
    # Insert it right before `<div className="flex flex-col md:flex-row gap-6">` inside the return statement
    content = content.replace('<div className="flex flex-col md:flex-row gap-6">', action_requests_ui + '\n            <div className="flex flex-col md:flex-row gap-6">')

    # 6. Change "Convert to Group" to "Convert to Group Piggy" with confirmation message.
    content = content.replace('Convert to Group', 'Convert to Group Piggy')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Patched PiggyBankDetail.jsx successfully")

if __name__ == '__main__':
    main()
