import React, { useState } from 'react';
import announcementService from '../../services/announcements.service';
import './ServiceConverter.css';

const ServiceConverter = ({ onSuccess, onCancel }) => {
    const [sourceType, setSourceType] = useState('event');
    const [sourceId, setSourceId] = useState('');
    const [announcementData, setAnnouncementData] = useState({
        heading: '',
        content: '',
        visibility: 'public',
    });
    const [retainSource, setRetainSource] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const sourceTypes = [
        { value: 'event', label: 'Event' },
        { value: 'task', label: 'Task' },
        { value: 'resource', label: 'Resource' },
        { value: 'post', label: 'Post/Text' },
    ];

    const visibilityOptions = [
        { value: 'public', label: 'Public' },
        { value: 'private', label: 'Private' },
        { value: 'institutional', label: 'Institutional' },
        { value: 'organisational', label: 'Organizational' },
        { value: 'group', label: 'Group' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await announcementService.convertToAnnouncement({
                source_type: sourceType,
                source_id: sourceId,
                announcement_data: announcementData,
                retain_source: retainSource,
            });

            onSuccess(response);
        } catch (err) {
            setError(err.response?.data?.error || 'Conversion failed');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setAnnouncementData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <div className="service-converter">
            <div className="converter-header">
                <h2>Convert to Announcement</h2>
                <button className="close-btn" onClick={onCancel}>×</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Source Type</label>
                    <select
                        value={sourceType}
                        onChange={(e) => setSourceType(e.target.value)}
                        className="form-select"
                    >
                        {sourceTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Source ID</label>
                    <input
                        type="text"
                        value={sourceId}
                        onChange={(e) => setSourceId(e.target.value)}
                        placeholder="Enter the ID of the item to convert"
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Announcement Heading</label>
                    <input
                        type="text"
                        value={announcementData.heading}
                        onChange={(e) => handleInputChange('heading', e.target.value)}
                        placeholder="Enter announcement heading"
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Announcement Content</label>
                    <textarea
                        value={announcementData.content}
                        onChange={(e) => handleInputChange('content', e.target.value)}
                        placeholder="Enter announcement content"
                        className="form-textarea"
                        rows="6"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Visibility</label>
                    <select
                        value={announcementData.visibility}
                        onChange={(e) => handleInputChange('visibility', e.target.value)}
                        className="form-select"
                    >
                        {visibilityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group-checkbox">
                    <label>
                        <input
                            type="checkbox"
                            checked={retainSource}
                            onChange={(e) => setRetainSource(e.target.checked)}
                        />
                        <span>Keep original {sourceType} (don't archive)</span>
                    </label>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Converting...' : 'Convert to Announcement'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ServiceConverter;
