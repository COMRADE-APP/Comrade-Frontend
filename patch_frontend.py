import os

frontend_dir = r"c:\Users\Imani\Documents\Comrade\Comrade-Frontend\src"

def patch_routes():
    file_path = os.path.join(frontend_dir, "routes", "payment.routes.jsx")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if "CreatePiggyBank" not in content:
        content = content.replace(
            "const PiggyBanks = () => Lazy(() => import('../pages/payments/PiggyBanks'));",
            "const PiggyBanks = () => Lazy(() => import('../pages/payments/PiggyBanks'));\nconst CreatePiggyBank = () => Lazy(() => import('../pages/payments/CreatePiggyBank'));"
        )
        content = content.replace(
            '<Route key="piggy-banks" path={ROUTES.PIGGY_BANKS} element={<PiggyBanks />} />',
            '<Route key="piggy-banks" path={ROUTES.PIGGY_BANKS} element={<PiggyBanks />} />\n    <Route key="piggy-create" path="/payments/piggy-banks/create" element={<CreatePiggyBank />} />'
        )
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Patched payment.routes.jsx")

def patch_piggybanks():
    file_path = os.path.join(frontend_dir, "pages", "payments", "PiggyBanks.jsx")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Change onClick of "New Piggy Bank" button
    content = content.replace(
        "onClick={() => setShowCreateModal(true)}",
        "onClick={() => navigate('/payments/piggy-banks/create')}"
    )

    # Remove create modal
    if "{showCreateModal && (" in content:
        import re
        content = re.sub(r'\{\s*showCreateModal\s*&&\s*\([\s\S]*?\n\s*\)\}\n', '', content)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Patched PiggyBanks.jsx")

def patch_piggydetail():
    file_path = os.path.join(frontend_dir, "pages", "payments", "PiggyBankDetail.jsx")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add withdraw button next to Add Savings
    old_buttons = """<Button
                                        variant="primary"
                                        onClick={() => setShowContributeModal(true)}
                                        className="flex-1 text-lg shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5"
                                    >
                                        <DollarSign className="w-5 h-5 mr-2" />
                                        Add Savings
                                    </Button>"""
    new_buttons = """<>
                                        <Button
                                            variant="primary"
                                            onClick={() => setShowContributeModal(true)}
                                            className="flex-1 text-lg shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5"
                                        >
                                            <DollarSign className="w-5 h-5 mr-2" />
                                            Add Savings
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleClaimFunds}
                                            disabled={claimLoading || piggy.current_amount <= 0}
                                            className="flex-1 text-lg shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5 bg-white"
                                        >
                                            <DollarSign className="w-5 h-5 mr-2" />
                                            {claimLoading ? 'Withdrawing...' : 'Withdraw'}
                                        </Button>
                                    </>"""
    content = content.replace(old_buttons, new_buttons)

    # 2. Remove automations from modal
    start_str = '<div className="pt-4 border-t border-theme">\n                                    <h4 className="font-bold text-primary mb-3 flex items-center gap-2">\n                                        <Zap className="w-4 h-4 text-amber-500" />\n                                        Automation'
    end_str = '<div className="pt-4 border-t border-theme">\n                                    <h4 className="font-bold text-primary mb-3 flex items-center gap-2">\n                                        <ShieldCheck className="w-4 h-4 text-amber-500" />\n                                        Withdrawal Constraints'
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        content = content[:start_idx] + content[end_idx:]
    else:
        print("Could not find automation block to remove")

    # Remove the Automation summary in overview
    start_summary = '{piggy.automation_trigger && piggy.automation_trigger !== \'none\' && ('
    end_summary_str = '                                    )}\n'
    sum_start_idx = content.find(start_summary)
    
    if sum_start_idx != -1:
        # Find the next closing ')}' after sum_start_idx
        sum_end_idx = content.find(end_summary_str, sum_start_idx)
        if sum_end_idx != -1:
            content = content[:sum_start_idx] + content[sum_end_idx + len(end_summary_str):]
        else:
            print("Could not find end of automation summary block")

    # Remove "Settings & Automation" button text
    content = content.replace('Settings & Automation', 'Settings')

    # 3. Elaborate withdrawal constraints
    old_constraints = """<div className="grid grid-cols-2 gap-3">
                                        <Input
                                            label="Min Withdrawal ($)"
                                            type="number"
                                            value={settingsForm.min_withdrawal_amount}
                                            onChange={(e) => setSettingsForm({...settingsForm, min_withdrawal_amount: e.target.value})}
                                            placeholder="Min amount"
                                        />
                                        <Input
                                            label="Max Withdrawal ($)"
                                            type="number"
                                            value={settingsForm.max_withdrawal_amount}
                                            onChange={(e) => setSettingsForm({...settingsForm, max_withdrawal_amount: e.target.value})}
                                            placeholder="Max amount"
                                        />
                                        <Input
                                            label="Min Balance ($)"
                                            type="number"
                                            value={settingsForm.require_min_balance}
                                            onChange={(e) => setSettingsForm({...settingsForm, require_min_balance: e.target.value})}
                                            placeholder="Must keep"
                                        />
                                        <Input
                                            label="Max/Day"
                                            type="number"
                                            value={settingsForm.max_withdrawals_per_day}
                                            onChange={(e) => setSettingsForm({...settingsForm, max_withdrawals_per_day: e.target.value})}
                                            placeholder="Limit/day"
                                        />
                                        <Input
                                            label="Save Days First"
                                            type="number"
                                            value={settingsForm.required_saving_days_before_withdrawal}
                                            onChange={(e) => setSettingsForm({...settingsForm, required_saving_days_before_withdrawal: e.target.value})}
                                            placeholder="Days to wait"
                                        />
                                        <Input
                                            label="Member Age (days)"
                                            type="number"
                                            value={settingsForm.required_member_age_days}
                                            onChange={(e) => setSettingsForm({...settingsForm, required_member_age_days: e.target.value})}
                                            placeholder="Group members"
                                        />
                                        <div className="col-span-2">
                                            <Input
                                                label="Min Contribution ($)"
                                                type="number"
                                                value={settingsForm.required_minimum_contribution}
                                                onChange={(e) => setSettingsForm({...settingsForm, required_minimum_contribution: e.target.value})}
                                                placeholder="Required before withdrawing"
                                            />
                                        </div>
                                    </div>"""

    new_constraints = """<div className="space-y-4">
                                        <p className="text-xs text-secondary mb-2">Configure detailed rules about when and how funds can be withdrawn from this piggy bank. Set to 0 or leave empty to disable a constraint.</p>
                                        
                                        <div className="bg-elevated border border-theme p-3 rounded-xl shadow-sm">
                                            <h5 className="text-sm font-bold text-primary mb-3">Withdrawal Limits</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Input
                                                    label="Minimum Withdrawal ($)"
                                                    type="number"
                                                    value={settingsForm.min_withdrawal_amount}
                                                    onChange={(e) => setSettingsForm({...settingsForm, min_withdrawal_amount: e.target.value})}
                                                    placeholder="0.00"
                                                />
                                                <Input
                                                    label="Maximum Withdrawal ($)"
                                                    type="number"
                                                    value={settingsForm.max_withdrawal_amount}
                                                    onChange={(e) => setSettingsForm({...settingsForm, max_withdrawal_amount: e.target.value})}
                                                    placeholder="0.00"
                                                />
                                                <Input
                                                    label="Max Daily Withdrawals"
                                                    type="number"
                                                    value={settingsForm.max_withdrawals_per_day}
                                                    onChange={(e) => setSettingsForm({...settingsForm, max_withdrawals_per_day: e.target.value})}
                                                    placeholder="e.g. 3 times per day"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-elevated border border-theme p-3 rounded-xl shadow-sm">
                                            <h5 className="text-sm font-bold text-primary mb-3">Balance & Contribution Requirements</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Input
                                                    label="Minimum Retained Balance ($)"
                                                    type="number"
                                                    value={settingsForm.require_min_balance}
                                                    onChange={(e) => setSettingsForm({...settingsForm, require_min_balance: e.target.value})}
                                                    placeholder="0.00"
                                                />
                                                <Input
                                                    label="Minimum Total Contribution ($)"
                                                    type="number"
                                                    value={settingsForm.required_minimum_contribution}
                                                    onChange={(e) => setSettingsForm({...settingsForm, required_minimum_contribution: e.target.value})}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-elevated border border-theme p-3 rounded-xl shadow-sm">
                                            <h5 className="text-sm font-bold text-primary mb-3">Time Requirements (Days)</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Input
                                                    label="Days Saved Before Withdraw"
                                                    type="number"
                                                    value={settingsForm.required_saving_days_before_withdrawal}
                                                    onChange={(e) => setSettingsForm({...settingsForm, required_saving_days_before_withdrawal: e.target.value})}
                                                    placeholder="0 days"
                                                />
                                                <Input
                                                    label="Group Member Age (Days)"
                                                    type="number"
                                                    value={settingsForm.required_member_age_days}
                                                    onChange={(e) => setSettingsForm({...settingsForm, required_member_age_days: e.target.value})}
                                                    placeholder="0 days"
                                                />
                                            </div>
                                        </div>
                                    </div>"""

    content = content.replace(old_constraints, new_constraints)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched PiggyBankDetail.jsx")

if __name__ == "__main__":
    patch_piggydetail()
