import axios from 'axios';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

const verificationApi = axios.create({
  baseURL: API_ENDPOINTS.VERIFICATION.LIST.replace('/verifications/', '/'),
  headers: {
    'Content-Type': 'application/json',
  },
});

verificationApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const verificationService = {
  createVerification: async (data) => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (key === 'identifications') {
        data.identifications.forEach((id, index) => {
          formData.append(`identifications[${index}][type]`, id.type);
          formData.append(`identifications[${index}][number]`, id.number);
          formData.append(`identifications[${index}][issuing_country]`, id.issuing_country);
          if (id.file) {
            formData.append(`identifications[${index}][file]`, id.file);
          }
        });
      } else if (key === 'entity_type_specific' && data[key]) {
        Object.keys(data[key]).forEach(subKey => {
          formData.append(subKey, data[key][subKey]);
        });
      } else {
        formData.append(key, data[key]);
      }
    });

    const response = await verificationApi.post('', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  submitVerification: async (verificationId) => {
    const response = await verificationApi.post('submit/', { verification_id: verificationId });
    return response.data;
  },

  getMyVerifications: async () => {
    const response = await verificationApi.get('');
    return response.data;
  },

  getVerificationDetail: async (id) => {
    const response = await verificationApi.get(`${id}/`);
    return response.data;
  },

  getStaffDashboard: async (params = {}) => {
    const response = await verificationApi.get('staff_dashboard/', { params });
    return response.data;
  },

  bulkAction: async (verificationIds, action, notes = '') => {
    const response = await verificationApi.post('bulk_action/', {
      verification_ids: verificationIds,
      action,
      notes,
    });
    return response.data;
  },

  initiateLiveness: async (verificationRequestId) => {
    const response = await verificationApi.post('liveness/initiate/', {
      verification_request_id: verificationRequestId,
    });
    return response.data;
  },

  getLivenessSession: async (sessionId) => {
    const response = await verificationApi.get('liveness/get_session/', {
      params: { session_id: sessionId },
    });
    return response.data;
  },

  completeLiveness: async (sessionId, livenessData) => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('face_detected', livenessData.faceDetected);
    formData.append('multiple_faces', livenessData.multipleFaces);
    formData.append('screen_recording_detected', livenessData.screenRecordingDetected);
    formData.append('mask_detected', livenessData.maskDetected);
    formData.append('liveness_score', livenessData.livenessScore);
    
    if (livenessData.video) {
      formData.append('video', livenessData.video);
    }

    const response = await verificationApi.post('liveness/complete/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  retryLiveness: async (verificationRequestId) => {
    const response = await verificationApi.post('liveness/retry/', {
      verification_request_id: verificationRequestId,
    });
    return response.data;
  },

  uploadDocument: async (verificationRequestId, documentType, file) => {
    const formData = new FormData();
    formData.append('verification_request_id', verificationRequestId);
    formData.append('document_type', documentType);
    formData.append('file', file);
    formData.append('document_name', file.name);

    const response = await verificationApi.post('documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadVideo: async (verificationRequestId, videoType, file) => {
    const formData = new FormData();
    formData.append('verification_request_id', verificationRequestId);
    formData.append('video_type', videoType);
    formData.append('video_file', file);
    formData.append('title', `${videoType} video`);

    const response = await verificationApi.post('videos/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  addIdentification: async (verificationRequestId, identificationData) => {
    const formData = new FormData();
    formData.append('verification_request_id', verificationRequestId);
    formData.append('identification_type', identificationData.type);
    formData.append('document_number', identificationData.number);
    formData.append('issuing_country', identificationData.issuing_country);
    formData.append('document_file', identificationData.file);

    const response = await verificationApi.post('identifications/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  verifyIdentification: async (identificationId, notes = '') => {
    const response = await verificationApi.post(`identifications/${identificationId}/verify/`, { notes });
    return response.data;
  },

  getChecklist: async (verificationRequestId) => {
    const response = await verificationApi.get('checklist/', {
      params: { verification_request_id: verificationRequestId },
    });
    return response.data;
  },

  getStats: async () => {
    const response = await verificationApi.get('stats/');
    return response.data;
  },
};

export default verificationService;