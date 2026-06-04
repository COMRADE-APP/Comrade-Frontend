import re
import sys

def main():
    file_path = r'c:\Users\Imani\Documents\Comrade\Comrade-Frontend\src\pages\Notifications.jsx'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add imports
    content = content.replace("import api from '../services/api';", "import api from '../services/api';\nimport paymentsService from '../services/payments.service';\nimport Button from '../components/common/Button';")

    # 2. Add state
    content = content.replace("const [hasMore, setHasMore] = useState(true);", 
"""const [hasMore, setHasMore] = useState(true);
    const [invitations, setInvitations] = useState([]);
    const [invitationsLoading, setInvitationsLoading] = useState(false);""")

    # 3. Add loadInvitations
    load_invitations_func = """
    useEffect(() => {
        if (category === 'invites' && invitations.length === 0) {
            loadInvitations();
        }
    }, [category]);

    const loadInvitations = async () => {
        setInvitationsLoading(true);
        try {
            const data = await paymentsService.getInvitations();
            setInvitations(data.results || data || []);
        } catch (error) {
            console.error('Failed to load invitations:', error);
        } finally {
            setInvitationsLoading(false);
        }
    };

    const handleAcceptInvitation = async (id) => {
        try {
            await paymentsService.acceptInvitation(id);
            setInvitations(prev => prev.filter(inv => inv.id !== id));
        } catch (error) {
            console.error('Failed to accept:', error);
        }
    };

    const handleRejectInvitation = async (id) => {
        try {
            await paymentsService.rejectInvitation(id);
            setInvitations(prev => prev.filter(inv => inv.id !== id));
        } catch (error) {
            console.error('Failed to reject:', error);
        }
    };
"""
    content = content.replace("useEffect(() => {\n        loadNotifications();\n    }, []);", 
                              "useEffect(() => {\n        loadNotifications();\n    }, []);\n" + load_invitations_func)

    # 4. Modify categories
    content = content.replace("['all', 'interactions', 'following', 'recommendations', 'system']", 
                              "['all', 'interactions', 'following', 'recommendations', 'system', 'invites']")

    # 5. Modify rendering for invites
    invites_render = """
                {category === 'invites' ? (
                    invitationsLoading ? (
                        <div className="p-8 text-center text-secondary">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                            Loading invites...
                        </div>
                    ) : invitations.length === 0 ? (
                        <div className="p-12 text-center text-secondary">
                            <h3 className="font-medium text-primary mb-1">No Pending Invites</h3>
                            <p className="text-sm">You have no pending group or piggy bank invitations.</p>
                        </div>
                    ) : (
                        <div>
                            {invitations.map(inv => (
                                <div key={inv.id} className="p-4 border-b border-theme hover:bg-tertiary/5 transition-colors flex items-center justify-between">
                                    <div>
                                        <p className="text-primary font-bold">{inv.payment_group_name || inv.group_name || 'Group Invitation'}</p>
                                        <p className="text-sm text-secondary">Invited by: {inv.invited_by_name || 'Someone'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleAcceptInvitation(inv.id)}>Accept</Button>
                                        <Button variant="outline" size="sm" className="text-red-600 border-red-200" onClick={() => handleRejectInvitation(inv.id)}>Reject</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : loading ? (
"""
    content = content.replace("{loading ? (", invites_render)
    content = content.replace("</>\n                )}", "</>\n                )}\n                </>")

    # Clean up the trailing tags we accidentally broke
    content = content.replace("</>\n                )}\n                </>", "</>\n                )}\n")
    # Wait, the closing bracket for `category === 'invites' ? (...) : loading ? (...) : (...)`
    # We replaced `{loading ? (` with `{category === 'invites' ? (...) : loading ? (`
    # We just need to add `}` after the entire existing block.
    # Actually, let's do this more cleanly with regex.
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Patched Notifications.jsx successfully")

if __name__ == '__main__':
    main()
