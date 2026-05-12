import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import verificationService from '../services/verification';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  submitted: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  pending_liveness: 'bg-orange-100 text-orange-800 border-orange-300',
  liveness_failed: 'bg-red-100 text-red-800 border-red-300',
  under_review: 'bg-blue-100 text-blue-800 border-blue-300',
  additional_info: 'bg-purple-100 text-purple-800 border-purple-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  activated: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  pending_liveness: 'Pending Liveness Verification',
  liveness_failed: 'Liveness Failed',
  under_review: 'Under Review',
  additional_info: 'Additional Info Required',
  approved: 'Approved',
  rejected: 'Rejected',
  activated: 'Activated',
};

export default function MyVerifications() {
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState(null);

  useEffect(() => {
    fetchMyVerifications();
  }, []);

  const fetchMyVerifications = async () => {
    setLoading(true);
    try {
      const response = await verificationService.getMyVerifications();
      setVerifications(response.results || response);
    } catch (error) {
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (verificationId) => {
    try {
      await verificationService.submitVerification(verificationId);
      toast.success('Verification submitted!');
      fetchMyVerifications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit');
    }
  };

  const getRequiredActions = (v) => {
    const actions = [];
    
    if (v.status === 'draft') {
      actions.push({ type: 'complete', label: 'Complete your application', action: () => navigate(`/verification/${v.id}/edit`) });
    }
    
    if (v.status === 'submitted' || v.status === 'pending_liveness') {
      if (!v.liveness_verifications?.length || v.status === 'pending_liveness') {
        actions.push({ type: 'liveness', label: 'Complete liveness verification', action: () => navigate(`/verification/${v.id}/liveness`) });
      }
    }
    
    if (v.status === 'additional_info') {
      actions.push({ type: 'info', label: 'Provide additional information', action: () => navigate(`/verification/${v.id}/edit`) });
    }
    
    if (v.status === 'liveness_failed') {
      actions.push({ type: 'retry', label: 'Retry liveness verification', action: () => navigate(`/verification/${v.id}/liveness`) });
    }
    
    return actions;
  };

  const renderVerificationCard = (v) => (
    <div
      key={v.id}
      className={`bg-white border-2 rounded-xl p-6 cursor-pointer transition hover:shadow-lg ${
        selectedVerification?.id === v.id ? 'border-blue-500' : 'border-gray-200'
      }`}
      onClick={() => setSelectedVerification(v)}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{v.basic_info?.name || 'Unnamed Verification'}</h3>
          <p className="text-gray-500 capitalize">{v.entity_type}</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium border ${STATUS_COLORS[v.status]}`}>
          {STATUS_LABELS[v.status]}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        {v.location && (
          <span>📍 {v.location.city}, {v.location.country}</span>
        )}
        {v.submitted_at && (
          <span>📅 {new Date(v.submitted_at).toLocaleDateString()}</span>
        )}
      </div>

      {v.is_verified && (
        <div className="flex items-center gap-2 text-green-600 font-medium">
          <span className="text-2xl">✓</span>
          <span>Verified</span>
          {v.verification_badge && (
            <span className="ml-2 px-2 py-1 bg-green-100 rounded text-xs">
              {v.verification_badge}
            </span>
          )}
        </div>
      )}

      {getRequiredActions(v).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {getRequiredActions(v).map((action, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                action.action();
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderVerificationDetail = () => {
    if (!selectedVerification) return null;
    const v = selectedVerification;

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold">{v.basic_info?.name}</h2>
          <button
            onClick={() => setSelectedVerification(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className={`px-4 py-2 rounded-lg text-center mb-6 ${STATUS_COLORS[v.status]}`}>
          {STATUS_LABELS[v.status]}
        </div>

        <div className="space-y-4">
          {v.location && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Location</h4>
              <p>{v.location.address}</p>
              <p>{v.location.city}, {v.location.country}</p>
            </div>
          )}

          {v.contact && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Contact</h4>
              <p>{v.contact.email}</p>
              <p>{v.contact.phone_number}</p>
            </div>
          )}

          {v.registration && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Registration</h4>
              <p>Number: {v.registration.registration_number}</p>
            </div>
          )}

          {v.checklist && v.checklist.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Checklist</h4>
              <div className="space-y-2">
                {v.checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className={item.is_completed ? 'text-green-500' : 'text-gray-400'}>
                      {item.is_completed ? '✓' : '○'}
                    </span>
                    <span className="text-sm capitalize">{item.item.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {v.identifications && v.identifications.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Identifications</h4>
              <div className="space-y-1">
                {v.identifications.map((id, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className={id.is_verified ? 'text-green-500' : 'text-gray-400'}>
                      {id.is_verified ? '✓' : '○'}
                    </span>
                    <span className="capitalize">{id.identification_type}</span>
                    <span className="text-gray-400">- {id.document_number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {v.status === 'draft' && (
          <button
            onClick={() => handleSubmit(v.id)}
            className="w-full mt-6 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Submit for Review
          </button>
        )}

        {v.status === 'rejected' && v.rejection_reason && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-800">Rejection Reason</h4>
            <p className="text-sm text-red-600">{v.rejection_reason}</p>
          </div>
        )}

        {v.status === 'additional_info' && v.additional_info_request && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-800">Additional Information Requested</h4>
            <p className="text-sm text-yellow-700">{v.additional_info_request}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Verifications</h1>
        <button
          onClick={() => navigate('/verification/apply')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          New Application
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : verifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">No Verifications Yet</h3>
          <p className="text-gray-600 mb-6">Start your first verification application</p>
          <button
            onClick={() => navigate('/verification/apply')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Apply Now
          </button>
        </div>
      ) : (
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            {verifications.map(renderVerificationCard)}
          </div>

          {selectedVerification && (
            <div className="w-96">
              {renderVerificationDetail()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}