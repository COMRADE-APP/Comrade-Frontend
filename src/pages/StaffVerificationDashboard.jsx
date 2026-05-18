import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import verificationService from '../services/verification';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  pending_liveness: 'bg-orange-100 text-orange-800',
  liveness_failed: 'bg-red-100 text-red-800',
  under_review: 'bg-blue-100 text-blue-800',
  additional_info: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  activated: 'bg-emerald-100 text-emerald-800',
};

const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  pending_liveness: 'Pending Liveness',
  liveness_failed: 'Liveness Failed',
  under_review: 'Under Review',
  additional_info: 'Additional Info',
  approved: 'Approved',
  rejected: 'Rejected',
  activated: 'Activated',
};

export default function StaffVerificationDashboard() {
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState([]);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ status: '', entity_type: '' });
  const [bulkSelected, setBulkSelected] = useState([]);
  const [actionModal, setActionModal] = useState({ open: false, type: '', ids: [] });

  useEffect(() => {
    fetchVerifications();
    fetchStats();
  }, [filters]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const response = await verificationService.getStaffDashboard(filters);
      setVerifications(response.results || response);
    } catch (error) {
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await verificationService.getStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const handleBulkAction = async () => {
    try {
      const { type, notes } = actionModal;
      await verificationService.bulkAction(actionModal.ids, type, notes);
      toast.success(`${actionModal.ids.length} verifications updated`);
      setActionModal({ open: false, type: '', ids: [] });
      setBulkSelected([]);
      fetchVerifications();
      fetchStats();
    } catch (error) {
      toast.error('Failed to perform bulk action');
    }
  };

  const toggleBulkSelect = (id) => {
    setBulkSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (bulkSelected.length === verifications.length) {
      setBulkSelected([]);
    } else {
      setBulkSelected(verifications.map(v => v.id));
    }
  };

  const openActionModal = (type) => {
    setActionModal({
      open: true,
      type,
      ids: bulkSelected,
    });
  };

  const renderStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      {stats && Object.entries(stats).filter(([k]) => k !== 'by_type').map(([key, value]) => (
        <div key={key} className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500 capitalize">{key.replace('_', ' ')}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      ))}
    </div>
  );

  const renderFilters = () => (
    <div className="flex flex-wrap gap-4 mb-6">
      <select
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        className="p-2 border border-gray-300 rounded-lg"
      >
        <option value="">All Statuses</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <select
        value={filters.entity_type}
        onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
        className="p-2 border border-gray-300 rounded-lg"
      >
        <option value="">All Entity Types</option>
        <option value="group">Group</option>
        <option value="business">Business</option>
        <option value="shop">Shop</option>
        <option value="personal">Personal</option>
        <option value="creator">Creator</option>
        <option value="tutor">Tutor</option>
        <option value="course">Course</option>
      </select>
    </div>
  );

  const renderBulkActions = () => (
    <div className="flex items-center gap-4 mb-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={bulkSelected.length === verifications.length && verifications.length > 0}
          onChange={toggleSelectAll}
          className="w-4 h-4"
        />
        Select All
      </label>

      {bulkSelected.length > 0 && (
        <>
          <span className="text-gray-500">{bulkSelected.length} selected</span>
          <button
            onClick={() => openActionModal('approve')}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Approve
          </button>
          <button
            onClick={() => openActionModal('reject')}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reject
          </button>
          <button
            onClick={() => openActionModal('request_info')}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Request Info
          </button>
        </>
      )}
    </div>
  );

  const renderVerificationCard = (v) => (
    <div
      key={v.id}
      className={`bg-white border rounded-lg p-4 cursor-pointer hover:shadow-lg transition ${
        selectedVerification?.id === v.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
      onClick={() => setSelectedVerification(v)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bulkSelected.includes(v.id)}
            onChange={(e) => {
              e.stopPropagation();
              toggleBulkSelect(v.id);
            }}
            className="w-4 h-4"
          />
          <h3 className="font-semibold">{v.basic_info?.name || 'Unnamed'}</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[v.status]}`}>
          {STATUS_LABELS[v.status] || v.status}
        </span>
      </div>

      <div className="text-sm text-gray-500 mb-2">
        <span className="capitalize">{v.entity_type}</span>
        {v.location && <span> • {v.location.city}, {v.location.country}</span>}
      </div>

      <div className="text-xs text-gray-400">
        Submitted by: {v.submitted_by_username || 'Unknown'}
        {v.submitted_at && <span> • {new Date(v.submitted_at).toLocaleDateString()}</span>}
      </div>

      {v.is_verified && (
        <div className="mt-2 flex items-center gap-1 text-green-600">
          <span className="text-lg">✓</span>
          <span className="text-sm font-medium">Verified</span>
        </div>
      )}
    </div>
  );

  const renderVerificationDetail = () => {
    if (!selectedVerification) return null;
    const v = selectedVerification;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">{v.basic_info?.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm ${STATUS_COLORS[v.status]}`}>
                {STATUS_LABELS[v.status]}
              </span>
              <span className="text-gray-500 capitalize">{v.entity_type}</span>
              {v.is_verified && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setSelectedVerification(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {v.location && (
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Location</h3>
              <p>{v.location.address}</p>
              <p>{v.location.city}, {v.location.state}, {v.location.country}</p>
              {v.location.postal_code && <p>Postal: {v.location.postal_code}</p>}
              {v.location.is_virtual && <p className="text-blue-600">Virtual Entity</p>}
            </div>
          )}

          {v.contact && (
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Contact</h3>
              <p>Email: {v.contact.email}</p>
              <p>Phone: {v.contact.phone_number}</p>
              {v.contact.website && <p>Website: {v.contact.website}</p>}
            </div>
          )}

          {v.registration && (
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Registration</h3>
              <p>Number: {v.registration.registration_number}</p>
              {v.registration.year_established && <p>Established: {v.registration.year_established}</p>}
              {v.registration.legal_name && <p>Legal Name: {v.registration.legal_name}</p>}
            </div>
          )}

          {v.tax_info && (
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Tax Information</h3>
              {v.tax_info.tax_id && <p>Tax ID: {v.tax_info.tax_id}</p>}
              {v.tax_info.tax_system && <p>System: {v.tax_info.tax_system}</p>}
              {v.tax_info.vat_number && <p>VAT: {v.tax_info.vat_number}</p>}
              {v.tax_info.GST_number && <p>GST: {v.tax_info.GST_number}</p>}
            </div>
          )}
        </div>

        {v.description && (
          <div className="mt-4 border p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Description</h3>
            <p>{v.description}</p>
          </div>
        )}

        <div className="mt-4">
          <h3 className="font-semibold mb-2">Identifications ({v.identifications?.length || 0})</h3>
          <div className="space-y-2">
            {v.identifications?.map((id, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium capitalize">{id.identification_type}</span>
                  <span className="text-gray-500 ml-2">{id.document_number}</span>
                  <span className="text-gray-400 ml-2">({id.issuing_country})</span>
                </div>
                {id.is_verified ? (
                  <span className="text-green-600">✓ Verified</span>
                ) : (
                  <button
                    onClick={() => verificationService.verifyIdentification(id.id)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Verify
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {v.documents && v.documents.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Documents ({v.documents.length})</h3>
            <div className="flex flex-wrap gap-2">
              {v.documents.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  {doc.document_type} - {doc.document_name}
                </a>
              ))}
            </div>
          </div>
        )}

        {v.videos && v.videos.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Videos ({v.videos.length})</h3>
            <div className="flex flex-wrap gap-2">
              {v.videos.map((vid, idx) => (
                <a
                  key={idx}
                  href={vid.video_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                >
                  {vid.video_type} - {vid.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {v.activities && v.activities.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Activity Log</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {v.activities.slice(0, 5).map((activity, idx) => (
                <div key={idx} className="text-sm text-gray-600 flex justify-between">
                  <span className="capitalize">{activity.action.replace(/_/g, ' ')}</span>
                  <span className="text-gray-400">
                    {new Date(activity.timestamp).toLocaleString()}
                    {activity.performed_by_username && ` by ${activity.performed_by_username}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {v.status === 'submitted' || v.status === 'under_review' ? (
            <>
              <button
                onClick={async () => {
                  await verificationService.bulkAction([v.id], 'approve', 'Approved by staff');
                  fetchVerifications();
                  setSelectedVerification(null);
                  toast.success('Verification approved');
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={async () => {
                  await verificationService.bulkAction([v.id], 'reject', 'Rejected by staff');
                  fetchVerifications();
                  setSelectedVerification(null);
                  toast.success('Verification rejected');
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Reject
              </button>
              <button
                onClick={async () => {
                  await verificationService.bulkAction([v.id], 'request_info', 'Additional information required');
                  fetchVerifications();
                  setSelectedVerification(null);
                  toast.success('Info requested');
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Request More Info
              </button>
            </>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Verification Dashboard</h1>
        <div className="text-sm text-gray-500">
          Staff Access
        </div>
      </div>

      {renderStats()}
      {renderFilters()}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="flex gap-6">
          <div className="flex-1">
            {renderBulkActions()}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {verifications.map(renderVerificationCard)}
            </div>
          </div>

          {selectedVerification && (
            <div className="w-1/2 sticky top-4">
              {renderVerificationDetail()}
            </div>
          )}
        </div>
      )}

      {actionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {actionModal.type === 'approve' && 'Approve Verifications'}
              {actionModal.type === 'reject' && 'Reject Verifications'}
              {actionModal.type === 'request_info' && 'Request Additional Information'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {actionModal.type === 'request_info' ? 'Message to applicant' : 'Notes (optional)'}
              </label>
              <textarea
                id="actionNotes"
                className="w-full p-3 border border-gray-300 rounded-lg"
                rows={4}
                placeholder={actionModal.type === 'reject' ? 'Reason for rejection' : 'Add notes...'}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActionModal({ open: false, type: '', ids: [] })}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const notes = document.getElementById('actionNotes').value;
                  handleBulkAction();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}