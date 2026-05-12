import os

path = 'C:/Users/Imani/Documents/Comrade/Comrade-Frontend/src/pages/payments/PaymentGroupDetail.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the start of the tabs array
start_idx = -1
for i, line in enumerate(lines):
    if "{ id: 'overview', label: 'Overview', icon: Target }" in line:
        start_idx = i
        break

if start_idx != -1:
    # Find the end of the tabs array
    end_idx = -1
    for i in range(start_idx, len(lines)):
        if "].map((tab) => (" in lines[i]:
            end_idx = i
            break
    
    if end_idx != -1:
        new_tabs = [
            "                    { id: 'overview', label: 'Overview', icon: Target },\n",
            "                    { id: 'analytics', label: 'Analytics', icon: TrendingUp },\n",
            "                    { id: 'members', label: 'Members', icon: Users },\n",
            "                    { id: 'contributions', label: 'Contributions', icon: History },\n",
            "                    { id: 'approvals', label: 'Approvals', icon: CheckCircle },\n",
            "                    { id: 'withdrawals', label: 'Withdrawals', icon: Download },\n",
            "                    { id: 'kitties', label: 'Kitties', icon: Wallet },\n",
            "                    { id: 'piggybanks', label: 'Piggy Banks', icon: PiggyBank },\n",
            "                    { id: 'rounds', label: 'Rounds', icon: CalendarIcon },\n",
            "                    { id: 'donations', label: 'Donations', icon: HeartHandshake },\n",
            "                    { id: 'investments', label: 'Investments', icon: TrendingUp },\n",
            "                    { id: 'ventures', label: 'Ventures', icon: Zap },\n",
            "                    { id: 'businesses', label: 'Businesses', icon: BookOpen },\n",
            "                    { id: 'loans', label: 'Loans', icon: CreditCard },\n",
            "                    { id: 'automations', label: 'Automations', icon: Smartphone },\n",
            "                    { id: 'benefits', label: 'Benefits', icon: Percent },\n",
            "                    { id: 'governance', label: 'Governance', icon: ShieldCheck },\n",
            "                    { id: 'discourse', label: 'Discourse', icon: MessageCircle },\n",
            "                    { id: 'rules', label: 'Rules', icon: Shield },\n",
            "                    { id: 'settings', label: 'Settings', icon: Settings },\n"
        ]
        
        lines[start_idx:end_idx] = new_tabs
        
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print("Successfully updated tabs including Piggy Banks.")
    else:
        print("Could not find end of tabs array.")
else:
    print("Could not find start of tabs array.")
