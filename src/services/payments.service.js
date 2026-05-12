import api from './api';
import API_ENDPOINTS from '../constants/apiEndpoints';

export const paymentsService = {
    // ========== Profile ==========
    async getProfile() {
        const response = await api.get(API_ENDPOINTS.PAYMENT_PROFILE);
        return response.data;
    },

    async updatePaymentProfile(profileData) {
        // Note: Update usually requires ID, check if this endpoint supports direct PUT on my_profile or needs ID
        // For now trusting it follows the same pattern, or we might need to change this if my_profile doesn't support PUT
        const response = await api.put(API_ENDPOINTS.PAYMENT_PROFILE, profileData);
        return response.data;
    },

    async getBalance() {
        const response = await api.get(API_ENDPOINTS.PAYMENT_BALANCE);
        return response.data;
    },

    // ========== Transactions ==========
    async getTransactions() {
        const response = await api.get(API_ENDPOINTS.TRANSACTIONS);
        return response.data;
    },

    async getTransactionById(id) {
        const response = await api.get(API_ENDPOINTS.TRANSACTION_DETAIL(id));
        return response.data;
    },

    async createTransaction(transactionData) {
        const response = await api.post(API_ENDPOINTS.CREATE_TRANSACTION, transactionData);
        return response.data;
    },

    async getTransactionHistory() {
        const response = await api.get(API_ENDPOINTS.TRANSACTION_HISTORY);
        return response.data;
    },

    async reverseTransaction(transactionCode, reason = '') {
        const response = await api.post(`${API_ENDPOINTS.TRANSACTIONS}reverse/`, {
            transaction_code: transactionCode,
            reason
        });
        return response.data;
    },

    // ========== Deposit, Withdraw, Transfer ==========
    async deposit(amount, paymentMethod = 'bank_transfer', additionalData = {}) {
        const response = await api.post(API_ENDPOINTS.DEPOSIT, {
            amount,
            payment_method: paymentMethod,
            ...additionalData
        });
        return response.data;
    },

    async withdraw(amount, accountNumber = '', paymentMethod = 'bank_transfer') {
        const response = await api.post(API_ENDPOINTS.WITHDRAW, {
            amount,
            account_number: accountNumber,
            payment_method: paymentMethod
        });
        return response.data;
    },

    async transfer(data) {
        const response = await api.post(API_ENDPOINTS.TRANSFER, data);
        return response.data;
    },

    // ========== Currency Conversion ==========
    async getSupportedCurrencies() {
        const response = await api.get(API_ENDPOINTS.SUPPORTED_CURRENCIES);
        return response.data;
    },

    async getExchangeRate(fromCurrency, toCurrency) {
        const response = await api.get(API_ENDPOINTS.EXCHANGE_RATES, {
            params: { from: fromCurrency, to: toCurrency }
        });
        return response.data;
    },

    async getAllRates(baseCurrency = 'USD') {
        const response = await api.get(API_ENDPOINTS.ALL_RATES, {
            params: { base: baseCurrency }
        });
        return response.data;
    },

    async convertCurrency(amount, fromCurrency, toCurrency) {
        const response = await api.post(API_ENDPOINTS.CURRENCY_CONVERT, {
            amount,
            from_currency: fromCurrency,
            to_currency: toCurrency
        });
        return response.data;
    },

    async setPreferredCurrency(currency) {
        const response = await api.post(API_ENDPOINTS.SET_PREFERRED_CURRENCY, { currency });
        return response.data;
    },

    async detectCurrency() {
        const response = await api.get(API_ENDPOINTS.DETECT_CURRENCY);
        return response.data;
    },

    async verifyAccount(data) {
        const response = await api.post(API_ENDPOINTS.VERIFY_ACCOUNT, data);
        return response.data;
    },

    // ========== Payment Groups ==========
    async getPaymentGroups() {
        const response = await api.get(API_ENDPOINTS.PAYMENT_GROUPS);
        return response.data;
    },

    async getMyGroups() {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}my_groups/`);
        return response.data;
    },

    async createPaymentGroup(groupData) {
        const response = await api.post(API_ENDPOINTS.PAYMENT_GROUPS, groupData);
        return response.data;
    },

    async getPaymentGroupById(id) {
        const response = await api.get(API_ENDPOINTS.PAYMENT_GROUP_DETAIL(id));
        return response.data;
    },

    async joinGroup(groupId) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUP_DETAIL(groupId)}join/`);
        return response.data;
    },

    async joinGroupAnonymously(groupId) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUP_DETAIL(groupId)}join/`, {
            is_anonymous: true,
        });
        return response.data;
    },

    async contributeToGroup(groupId, amount, notes = '', paymentMethod = 'wallet', phoneNumber = '') {
        const data = { amount, notes, payment_method: paymentMethod };
        if (paymentMethod === 'mpesa' && phoneNumber) {
            data.phone_number = phoneNumber;
        }
        const response = await api.post(API_ENDPOINTS.CONTRIBUTE_TO_GROUP(groupId), data);
        return response.data;
    },

    async getGroupMembers(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUP_DETAIL(groupId)}members/`);
        return response.data;
    },

    async getGroupContributions(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUP_DETAIL(groupId)}contributions_list/`);
        return response.data;
    },

    async inviteToGroup(groupId, email, forceExternal = false) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUP_DETAIL(groupId)}invite/`, {
            email,
            force_external: forceExternal
        });
        return response.data;
    },

    async searchInvitableUsers(groupId, query) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUP_DETAIL(groupId)}search_invitable_users/`, {
            params: { q: query }
        });
        return response.data;
    },

    // ========== Group Discourse & Voting ==========
    async getPublicGroups() {
        const response = await api.get(API_ENDPOINTS.PUBLIC_GROUPS);
        return response.data;
    },

    async getRecommendedGroups() {
        const response = await api.get(API_ENDPOINTS.RECOMMENDED_GROUPS);
        return response.data;
    },

    async getMyJoinRequests() {
        const response = await api.get(API_ENDPOINTS.JOIN_REQUESTS);
        return response.data;
    },

    async getIncomingJoinRequests() {
        const response = await api.get(API_ENDPOINTS.JOIN_REQUESTS_INCOMING);
        return response.data;
    },

    async requestToJoinGroup(groupId, notes = '', applicationAnswers = {}) {
        const response = await api.post(API_ENDPOINTS.JOIN_REQUESTS, {
            group: groupId,
            notes,
            application_answers: applicationAnswers
        });
        return response.data;
    },

    async approveJoinRequest(requestId, notes = '') {
        const response = await api.post(API_ENDPOINTS.JOIN_REQUEST_APPROVE(requestId), { notes });
        return response.data;
    },

    async rejectJoinRequest(requestId, notes = '') {
        const response = await api.post(API_ENDPOINTS.JOIN_REQUEST_REJECT(requestId), { notes });
        return response.data;
    },

    async withdrawJoinRequest(requestId) {
        const response = await api.post(API_ENDPOINTS.JOIN_REQUEST_WITHDRAW(requestId));
        return response.data;
    },

    async getGroupVotes(groupId) {
        const response = await api.get(API_ENDPOINTS.GROUP_VOTE_BY_GROUP(groupId));
        return response.data;
    },

    async createGroupVote(voteData) {
        const response = await api.post(API_ENDPOINTS.GROUP_VOTES, voteData);
        return response.data;
    },

    async castGroupVote(voteId, vote) {
        const response = await api.post(API_ENDPOINTS.GROUP_VOTE_CAST(voteId), { vote });
        return response.data;
    },

    // ========== Group Discourse Posts & Phases ==========
    async getGroupPosts(groupId) {
        const response = await api.get(`${API_ENDPOINTS.GROUP_POSTS}?group=${groupId}`);
        return response.data;
    },

    async createGroupPost(data) {
        const response = await api.post(API_ENDPOINTS.GROUP_POSTS, data);
        return response.data;
    },

    async reactToGroupPost(postId, emoji) {
        const response = await api.post(API_ENDPOINTS.GROUP_POST_REACT(postId), { emoji });
        return response.data;
    },

    async pinGroupPost(postId) {
        const response = await api.post(API_ENDPOINTS.GROUP_POST_PIN(postId));
        return response.data;
    },

    async upvoteGroupPost(postId) {
        const response = await api.post(API_ENDPOINTS.GROUP_POST_UPVOTE(postId));
        return response.data;
    },

    async toggleGroupPostShareability(postId) {
        const response = await api.post(API_ENDPOINTS.GROUP_POST_TOGGLE_SHARE(postId));
        return response.data;
    },

    async getGroupPostReplies(postId) {
        const response = await api.get(`${API_ENDPOINTS.GROUP_POST_REPLIES}?post=${postId}`);
        return response.data;
    },

    async createGroupPostReply(data) {
        const response = await api.post(API_ENDPOINTS.GROUP_POST_REPLIES, data);
        return response.data;
    },

    async reactToGroupPostReply(replyId, emoji) {
        const response = await api.post(API_ENDPOINTS.GROUP_REPLY_REACT(replyId), { emoji });
        return response.data;
    },

    async upvoteGroupPostReply(replyId) {
        const response = await api.post(API_ENDPOINTS.GROUP_REPLY_UPVOTE(replyId));
        return response.data;
    },

    async getGroupPhases(groupId) {
        const response = await api.get(`${API_ENDPOINTS.GROUP_PHASES}?group=${groupId}`);
        return response.data;
    },

    async createGroupPhase(data) {
        const response = await api.post(API_ENDPOINTS.GROUP_PHASES, data);
        return response.data;
    },

    async getGroupPortfolio(groupId) {
        const response = await api.get(API_ENDPOINTS.GROUP_PORTFOLIO(groupId));
        return response.data;
    },

    // ========== Group Lifecycle (Deadline / Termination) ==========
    async extendGroupDeadline(groupId, newDeadline) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUP_DETAIL(groupId)}extend_deadline/`, {
            new_deadline: newDeadline
        });
        return response.data;
    },

    async requestGroupTermination(groupId) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUP_DETAIL(groupId)}request_termination/`);
        return response.data;
    },

    async getGroupStatus(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUP_DETAIL(groupId)}group_status/`);
        return response.data;
    },

    // ========== Group Invitations ==========
    async getInvitations() {
        const response = await api.get(API_ENDPOINTS.INVITATION_PENDING);
        return response.data;
    },

    async acceptInvitation(invitationId) {
        const response = await api.post(API_ENDPOINTS.INVITATION_ACCEPT(invitationId));
        return response.data;
    },

    async rejectInvitation(invitationId) {
        const response = await api.post(API_ENDPOINTS.INVITATION_REJECT(invitationId));
        return response.data;
    },

    // ========== Piggy Banks (Group Targets) ==========
    async getPiggyBanks() {
        const response = await api.get(API_ENDPOINTS.GROUP_TARGETS);
        return response.data;
    },

    async createPiggyBank(data) {
        const response = await api.post(API_ENDPOINTS.GROUP_TARGETS, data);
        return response.data;
    },

    async getPiggyBankById(id) {
        const response = await api.get(API_ENDPOINTS.GROUP_TARGET_DETAIL(id));
        return response.data;
    },

    async contributeToPiggyBank(piggyId, amount) {
        const response = await api.post(API_ENDPOINTS.CONTRIBUTE_TARGET(piggyId), { amount });
        return response.data;
    },

    async withdrawFromPiggyBank(piggyId, amount) {
        const response = await api.post(`${API_ENDPOINTS.GROUP_TARGET_DETAIL(piggyId)}withdraw/`, { amount });
        return response.data;
    },

    async lockPiggyBank(piggyId, lockType = 'locked', maturityDate = null) {
        const response = await api.post(`${API_ENDPOINTS.GROUP_TARGET_DETAIL(piggyId)}lock/`, {
            lock_type: lockType,
            maturity_date: maturityDate
        });
        return response.data;
    },

    async unlockPiggyBank(piggyId) {
        const response = await api.post(`${API_ENDPOINTS.GROUP_TARGET_DETAIL(piggyId)}unlock/`);
        return response.data;
    },

    async withdrawPiggyBank(piggyId, amount) {
        const response = await api.post(`${API_ENDPOINTS.GROUP_TARGET_DETAIL(piggyId)}withdraw/`, { amount });
        return response.data;
    },

    async getPiggyAnalytics(id) {
        const response = await api.get(`${API_ENDPOINTS.GROUP_TARGET_DETAIL(id)}piggy_analytics/`);
        return response.data;
    },

    async getPiggyMembers(id) {
        const response = await api.get(`${API_ENDPOINTS.GROUP_TARGET_DETAIL(id)}piggy_members/`);
        return response.data;
    },

    async requestPiggyConversion(id) {
        const response = await api.post(`${API_ENDPOINTS.GROUP_TARGET_DETAIL(id)}request_conversion/`);
        return response.data;
    },

    async approvePiggyConversion(id, requestId) {
        const response = await api.post(`${API_ENDPOINTS.GROUP_TARGET_DETAIL(id)}approve_conversion/${requestId}/`);
        return response.data;
    },

    async getPiggyConversionStatus(id) {
        const response = await api.get(`${API_ENDPOINTS.GROUP_TARGET_DETAIL(id)}conversion_status/`);
        return response.data;
    },

    // ========== Group Invitations ==========
    async getInvitations() {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS.replace('/groups/', '/invitations/')}pending/`);
        return response.data;
    },

    async respondToInvitation(invitationId, accept) {
        const endpoint = API_ENDPOINTS.PAYMENT_GROUPS.replace('/groups/', '/invitations/');
        const response = await api.post(`${endpoint}respond/`, {
            invitation_id: invitationId,
            accept
        });
        return response.data;
    },

    async acceptInvitation(invitationId) {
        const endpoint = API_ENDPOINTS.PAYMENT_GROUPS.replace('/groups/', '/invitations/');
        const response = await api.post(`${endpoint}${invitationId}/accept/`);
        return response.data;
    },

    async rejectInvitation(invitationId) {
        const endpoint = API_ENDPOINTS.PAYMENT_GROUPS.replace('/groups/', '/invitations/');
        const response = await api.post(`${endpoint}${invitationId}/reject/`);
        return response.data;
    },

    // ========== Tier Info ==========
    async getTierInfo() {
        // Return tier pricing and features
        return {
            free: {
                price: 0,
                features: ['Up to 3 members per group', '6 purchases/month', '5 offline notifications']
            },
            standard: {
                price: 9.99,
                features: ['Up to 7 members per group', '25 purchases/month', '25 offline notifications', 'Priority support']
            },
            premium: {
                price: 19.99,
                features: ['Up to 12 members per group', '45 purchases/month', '100 offline notifications', 'Premium support']
            },
            gold: {
                price: 49.99,
                features: ['Unlimited group members', 'Unlimited purchases', 'Unlimited notifications', 'Dedicated support', 'API access']
            }
        };
    },

    // ========== Donations & Charity ==========
    async getDonations() {
        const response = await api.get(API_ENDPOINTS.DONATIONS);
        return response.data;
    },

    async createDonation(data) {
        const response = await api.post(API_ENDPOINTS.DONATIONS, data);
        return response.data;
    },

    async getDonationById(id) {
        const response = await api.get(API_ENDPOINTS.DONATION_DETAIL(id));
        return response.data;
    },

    async contributeToDonation(donationId, amount) {
        const response = await api.post(API_ENDPOINTS.CONTRIBUTE_DONATION(donationId), { amount });
        return response.data;
    },

    // ========== Group Investments ==========
    async getGroupInvestments() {
        const response = await api.get(API_ENDPOINTS.GROUP_INVESTMENTS);
        return response.data;
    },

    async createGroupInvestment(data) {
        const response = await api.post(API_ENDPOINTS.GROUP_INVESTMENTS, data);
        return response.data;
    },

    async getGroupInvestmentById(id) {
        const response = await api.get(API_ENDPOINTS.GROUP_INVESTMENT_DETAIL(id));
        return response.data;
    },

    async quoteGroupInvestment(investmentId, amount) {
        const response = await api.post(API_ENDPOINTS.QUOTE_INVESTMENT(investmentId), { amount });
        return response.data;
    },

    async joinPublicPitch(investmentId) {
        const response = await api.post(`/payments/group-investments/${investmentId}/join_public_pitch/`);
        return response.data;
    },

    async withdrawContribution(investmentId, amount) {
        const response = await api.post(`/payments/group-investments/${investmentId}/withdraw_contribution/`, { amount });
        return response.data;
    },

    async withdrawGains(investmentId, amount, preference) {
        const response = await api.post(`/api/payments/group-investments/${investmentId}/withdraw_gains/`, { amount, preference });
        return response.data;
    },

    async getPublicInvestmentPitches() {
        const response = await api.get('/api/payments/group-investments/public_pitches/');
        return response.data;
    },

    // ========== Group Votes ==========
    async getGroupVotes(groupId) {
        let url = '/api/payments/group-votes/';
        if (groupId) {
            url = `/api/payments/group-votes/by_group/?group_id=${groupId}`;
        }
        const response = await api.get(url);
        return response.data;
    },

    async createVote(data) {
        const response = await api.post('/api/payments/group-votes/', data);
        return response.data;
    },

    async castVote(voteId, choice) {
        // choice: 'for', 'against', 'abstain'
        const response = await api.post(`/api/payments/group-votes/${voteId}/cast_vote/`, { vote: choice });
        return response.data;
    },


    // ========== Products ==========
    async getProducts() {
        const response = await api.get(API_ENDPOINTS.PRODUCTS);
        return response.data;
    },

    async getProductById(id) {
        return api.get(API_ENDPOINTS.PRODUCT_DETAIL(id)).then(res => res.data);
    },

    async processCheckout(data) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_PROFILE.replace('my_profile/', '')}checkout/`, data);
        return response.data;
    },

    async processGroupCheckout(data) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUPS}${data.group_id}/group_checkout/`, data);
        return response.data;
    },

    // --- Group Checkout Approvals ---
    async getGroupCheckoutRequests(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/checkout_requests/`);
        return response.data;
    },

    async getMyCheckoutRequests() {
        const response = await api.get('/payments/profiles/my_checkout_requests/');
        return response.data;
    },

    async approveCheckoutRequest(groupId, requestId, payload = {}) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/checkout_requests/${requestId}/approve/`, payload);
        return response.data;
    },

    async rejectCheckoutRequest(groupId, requestId, payload = {}) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/checkout_requests/${requestId}/reject/`, payload);
        return response.data;
    },

    async updateGroup(groupId, data) {
        const formData = new FormData();
        if (data.name) formData.append('name', data.name);
        if (data.description !== undefined) formData.append('description', data.description);
        if (data.cover_photo) formData.append('cover_photo', data.cover_photo);
        const response = await api.patch(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/update_group/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    async updateGroupSettings(groupId, settings) {
        const response = await api.patch(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/update_settings/`, settings);
        return response.data;
    },

    async updateMemberRole(groupId, memberId, role) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/update_member_role/`, {
            member_id: memberId,
            role
        });
        return response.data;
    },

    async getGroupPiggyBanks(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/group_piggy_banks/`);
        return response.data;
    },

    async getGroupAnalytics(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/group-analytics/`);
        return response.data;
    },

    async getGroupRules(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/rules/`);
        return response.data;
    },

    async updateGroupRules(groupId, rulesText) {
        const response = await api.put(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/rules/`, {
            rules_text: rulesText
        });
        return response.data;
    },

    async applyCertificate(groupId) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/apply_certificate/`);
        return response.data;
    },

    async getCertificateStatus(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/certificate_status/`);
        return response.data;
    },

    async getGroupDonations(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/group_donations/`);
        return response.data;
    },

    async getGroupInvestmentsByGroupId(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/group_investments/`);
        return response.data;
    },

    async getGroupLoans(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/group_loans/`);
        return response.data;
    },

    async getGroupKitties(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/group_kitties/`);
        return response.data;
    },

    async getGroupBusinesses(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/group_businesses/`);
        return response.data;
    },

    async getGroupVentures(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/group_ventures/`);
        return response.data;
    },

    async registerBusiness(businessData) {
        const response = await api.post(API_ENDPOINTS.FUNDING.BUSINESSES, businessData);
        return response.data;
    },

    async createGroupVenture(ventureData) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUPS}${ventureData.payment_group}/group_ventures/`, ventureData);
        return response.data;
    },

    async getLoanProducts() {
        const response = await api.get(API_ENDPOINTS.LOAN_PRODUCTS);
        return response.data;
    },

    async applyForLoan(loanData) {
        const response = await api.post(API_ENDPOINTS.LOAN_APPLICATIONS, loanData);
        return response.data;
    },

    async getGroupRounds(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/group_rounds/`);
        return response.data;
    },

    async getGroupWithdrawals(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/group_withdrawals/`);
        return response.data;
    },

    async getGroupBenefitRules(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/group_benefit_rules/`);
        return response.data;
    },

    async getGroupSettingsChanges(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/group_settings_changes/`);
        return response.data;
    },

    async getGroupAutomations(groupId) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/group_automations/`);
        return response.data;
    },

    async createGroupAutomation(groupId, data) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/group_automations/`, data);
        return response.data;
    },

    async requestWithdrawal(groupId, data) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/request_withdrawal/`, data);
        return response.data;
    },

    async approveWithdrawal(id) {
        const response = await api.post(`${API_ENDPOINTS.WITHDRAWAL_REQUESTS}${id}/approve/`);
        return response.data;
    },

    async rejectWithdrawal(id, reason = '') {
        const response = await api.post(`${API_ENDPOINTS.WITHDRAWAL_REQUESTS}${id}/reject/`, { reason });
        return response.data;
    },

    async contributeToRound(roundId, data) {
        const response = await api.post(`${API_ENDPOINTS.ROUND_CONTRIBUTIONS}${roundId}/contribute/`, data);
        return response.data;
    },

    async createRound(data) {
        const response = await api.post(API_ENDPOINTS.ROUND_CONTRIBUTIONS, data);
        return response.data;
    },

    async getRoundApprovalStatus(roundId) {
        const response = await api.get(`${API_ENDPOINTS.ROUND_CONTRIBUTIONS}${roundId}/approval-status/`);
        return response.data;
    },

    async approveRound(roundId) {
        const response = await api.post(`${API_ENDPOINTS.ROUND_CONTRIBUTIONS}${roundId}/approve_round/`);
        return response.data;
    },

    async rejectRound(roundId, note = '') {
        const response = await api.post(`${API_ENDPOINTS.ROUND_CONTRIBUTIONS}${roundId}/reject_round/`, { note });
        return response.data;
    },

    async startRound(roundId) {
        const response = await api.post(`${API_ENDPOINTS.ROUND_CONTRIBUTIONS}${roundId}/start_round/`);
        return response.data;
    },

    async claimRoundPayout(roundId, payload = {}) {
        const data = typeof payload === 'string' ? { destination: payload } : payload;
        const response = await api.post(`${API_ENDPOINTS.ROUND_CONTRIBUTIONS}${roundId}/claim/`, data);
        return response.data;
    },

    async searchUsers(query) {
        const response = await api.get(`${API_ENDPOINTS.PAYMENT_GROUPS}search_users/`, { params: { q: query } });
        return response.data;
    },

    async swapRoundPositions(roundId, data) {
        const response = await api.post(`${API_ENDPOINTS.ROUND_CONTRIBUTIONS}${roundId}/swap-positions/`, data);
        return response.data;
    },

    async randomizeRoundPositions(roundId) {
        const response = await api.post(`${API_ENDPOINTS.ROUND_CONTRIBUTIONS}${roundId}/randomize_positions/`);
        return response.data;
    },

    async getRoundDetail(roundId) {
        const response = await api.get(`${API_ENDPOINTS.ROUND_CONTRIBUTIONS}${roundId}/detail_view/`);
        return response.data;
    },

    async getAvailablePositions(groupId, roundId = null) {
        const params = roundId ? `group=${groupId}&round_id=${roundId}` : `group=${groupId}`;
        const response = await api.get(`${API_ENDPOINTS.ROUND_POSITIONS}available/?${params}`);
        return response.data;
    },

    async pickPosition(groupId, roundId, positionNumber) {
        const response = await api.post(`${API_ENDPOINTS.ROUND_POSITIONS}pick/`, { 
            group: groupId, 
            round_id: roundId,
            position_number: positionNumber 
        });
        return response.data;
    },

    async getMyPosition(groupId, roundId = null) {
        const params = roundId ? `group=${groupId}&round_id=${roundId}` : `group=${groupId}`;
        const response = await api.get(`${API_ENDPOINTS.ROUND_POSITIONS}my-position/?${params}`);
        return response.data;
    },

    async getRoundPositions(groupId, roundId = null) {
        const params = roundId ? `group=${groupId}&round_id=${roundId}` : `group=${groupId}`;
        const response = await api.get(`${API_ENDPOINTS.ROUND_POSITIONS}?${params}`);
        return response.data;
    },

    async proposeSettingsChange(groupId, data) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/propose_settings_change/`, data);
        return response.data;
    },

    async createBenefitRule(groupId, data) {
        const response = await api.post(`${API_ENDPOINTS.PAYMENT_GROUPS}${groupId}/create_benefit_rule/`, data);
        return response.data;
    },

    async voteOnSettingsChange(requestId, vote) {
        const response = await api.post(`${API_ENDPOINTS.GROUP_SETTINGS_CHANGES}${requestId}/vote/`, { vote });
        return response.data;
    },

    async getRecommendations() {
        const response = await api.get(API_ENDPOINTS.RECOMMENDATIONS);
        return response.data;
    },

    // ========== Subscriptions ==========
    async getSubscriptions() {
        const response = await api.get(API_ENDPOINTS.User_SUBSCRIPTIONS);
        return response.data;
    },

    // ========== Partner & Registration ==========
    async registerPartnerApplication(data) {
        const response = await api.post(API_ENDPOINTS.PARTNER_APPLICATIONS, data);
        return response.data;
    },

    async registerAgentApplication(data) {
        const response = await api.post(API_ENDPOINTS.AGENT_APPLICATIONS, data);
        return response.data;
    },

    async registerSupplierApplication(data) {
        const response = await api.post(API_ENDPOINTS.SUPPLIER_APPLICATIONS, data);
        return response.data;
    },

    async registerShop(data) {
        const response = await api.post(API_ENDPOINTS.SHOP_REGISTRATIONS, data);
        return response.data;
    },

    async checkPartnerStatus() {
        try {
            const partnerRes = await api.get(API_ENDPOINTS.PARTNER_STATUS);
            return { is_partner: true, ...partnerRes.data };
        } catch (e) {
            // Check applications
            try {
                const appRes = await api.get(API_ENDPOINTS.PARTNER_APPLICATIONS);
                if (appRes.data && Array.isArray(appRes.data) && appRes.data.length > 0) {
                    return { is_partner: false, has_application: true, application: appRes.data[0] };
                }
            } catch (err) { }
            return { is_partner: false, has_application: false };
        }
    },
};

// Tier Limits Configuration
export const TIER_LIMITS = {
    free: {
        maxGroupMembers: 3,
        maxGroups: 3,
        monthlyPurchases: 6,
        offlineNotifications: 5,
        features: [
            'Up to 3 members per group',
            '6 purchases per month',
            '5 offline notification subscriptions',
            'Basic support'
        ]
    },
    standard: {
        maxGroupMembers: 7,
        maxGroups: 5,
        monthlyPurchases: 25,
        offlineNotifications: 25,
        price: 9.99,
        priceAnnual: 99.99,
        features: [
            'Up to 7 members per group',
            '25 purchases per month',
            '25 offline notification subscriptions',
            'Priority support',
            'Group purchases up to 25 people'
        ]
    },
    premium: {
        maxGroupMembers: 12,
        maxGroups: 15,
        monthlyPurchases: 45,
        offlineNotifications: 100,
        price: 19.99,
        priceAnnual: 199.99,
        features: [
            'Up to 12 members per group',
            '45 purchases per month',
            '100 offline notification subscriptions',
            'Premium support',
            'Advanced analytics'
        ]
    },
    gold: {
        maxGroupMembers: Infinity,
        maxGroups: Infinity,
        monthlyPurchases: Infinity,
        offlineNotifications: Infinity,
        price: 49.99,
        priceAnnual: 499.99,
        features: [
            'Unlimited group members',
            'Unlimited purchases',
            'Unlimited offline notifications',
            'Dedicated support',
            'Custom features',
            'API access'
        ]
    }
};

export const getTierLimit = (tier, limitType) => {
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
    return limits[limitType];
};

export default paymentsService;

