import React, { useState, useRef, useCallback } from 'react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import { useToast } from '../../contexts/ToastContext';
import eventsService from '../../services/events.service';
import { QrCode, UserCheck, UserX, Search, Camera, X, CheckCircle, Clock } from 'lucide-react';

const EventCheckIn = ({ event, onUpdate }) => {
  const { showToast } = useToast();
  const [mode, setMode] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [checkIns, setCheckIns] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const loadAttendance = useCallback(async () => {
    try {
      const res = await eventsService.getAttendanceList(event.id);
      setAttendanceList(res.data || []);
    } catch {
      setAttendanceList([]);
    }
  }, [event.id]);

  const handleManualCheckIn = async () => {
    if (!manualEmail.trim()) return;
    setLoading(true);
    try {
      const res = await eventsService.checkInAttendee(event.id, { email: manualEmail.trim() });
      setCheckIns(prev => [res.data, ...prev]);
      setManualEmail('');
      setLastResult({ success: true, message: 'Check-in successful' });
      showToast('Check-in successful!', 'success');
      loadAttendance();
    } catch (err) {
      const msg = err.response?.data?.error || 'Check-in failed';
      setLastResult({ success: false, message: msg });
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (attendanceId) => {
    try {
      await eventsService.checkOutAttendee(event.id, attendanceId);
      showToast('Checked out successfully', 'success');
      loadAttendance();
    } catch (err) {
      showToast(err.response?.data?.error || 'Check-out failed', 'error');
    }
  };

  const toggleAttendanceList = async () => {
    if (!showAttendance) {
      await loadAttendance();
    }
    setShowAttendance(!showAttendance);
  };

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try { scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = async () => {
    setScanning(true);
    try {
      const { default: QrScanner } = await import('qr-scanner');
      if (!videoRef.current) return;
      const qrScanner = new QrScanner(
        videoRef.current,
        result => {
          qrScanner.stop();
          handleQrResult(result.data);
        },
        { returnDetailedScanResult: true }
      );
      scannerRef.current = qrScanner;
      await qrScanner.start();
    } catch (err) {
      showToast('Camera access denied or not available', 'error');
      setScanning(false);
    }
  };

  const handleQrResult = async (qrData) => {
    setLoading(true);
    try {
      const res = await eventsService.checkInAttendee(event.id, { qr_data: qrData });
      setCheckIns(prev => [res.data, ...prev]);
      setLastResult({ success: true, message: `Checked in: ${res.data.user_name || 'Attendee'}` });
      showToast('Check-in successful!', 'success');
      loadAttendance();
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid QR code';
      setLastResult({ success: false, message: msg });
      showToast(msg, 'error');
    } finally {
      setLoading(false);
      stopScanner();
    }
  };

  const checkedInCount = attendanceList.filter(a => !a.check_out_time).length;
  const totalCount = attendanceList.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-primary">Attendee Check-in</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleAttendanceList}>
            <Clock size={16} className="mr-1" />
            {totalCount} Checked In
          </Button>
        </div>
      </div>

      {lastResult && (
        <Card>
          <CardBody className={`flex items-center gap-3 ${lastResult.success ? 'text-green-400' : 'text-red-400'}`}>
            {lastResult.success ? <CheckCircle size={20} /> : <X size={20} />}
            <span className="text-sm">{lastResult.message}</span>
            <button onClick={() => setLastResult(null)} className="ml-auto"><X size={16} /></button>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-4">
              <Camera size={20} className="text-primary" />
              <h4 className="font-medium text-primary">Scan QR Code</h4>
            </div>
            {scanning ? (
              <div className="space-y-3">
                <div className="aspect-square max-w-xs mx-auto bg-black rounded-lg overflow-hidden">
                  <video ref={videoRef} className="w-full h-full object-cover" />
                </div>
                <Button variant="ghost" size="sm" onClick={stopScanner} className="w-full">
                  Cancel Scanning
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode size={48} className="mx-auto mb-3 text-secondary" />
                <p className="text-sm text-secondary mb-4">Scan attendee ticket QR code</p>
                <Button onClick={startScanner} disabled={loading}>
                  <Camera size={16} className="mr-2" /> Start Scanner
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-4">
              <Search size={20} className="text-primary" />
              <h4 className="font-medium text-primary">Manual Check-in</h4>
            </div>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter attendee email"
                value={manualEmail}
                onChange={e => setManualEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualCheckIn()}
                className="w-full px-3 py-2 bg-elevated border border-theme rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-primary text-sm"
              />
              <Button
                onClick={handleManualCheckIn}
                disabled={loading || !manualEmail.trim()}
                className="w-full"
              >
                {loading ? 'Checking in...' : <><UserCheck size={16} className="mr-2" /> Check In</>}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {showAttendance && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-primary">Attendance Records</h4>
              <span className="text-sm text-secondary">
                {checkedInCount} present / {totalCount} total
              </span>
            </div>
            {attendanceList.length === 0 ? (
              <p className="text-sm text-secondary py-4 text-center">No attendance records yet</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {attendanceList.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-3 bg-elevated rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCheck size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">{att.user_name || 'Unknown'}</p>
                        <p className="text-xs text-secondary">{att.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-secondary">
                        {new Date(att.check_in_time).toLocaleTimeString()}
                      </span>
                      {att.check_out_time ? (
                        <span className="text-xs text-yellow-400 flex items-center gap-1">
                          <Clock size={12} /> Out
                        </span>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleCheckOut(att.id)}>
                          <UserX size={16} className="text-secondary" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {checkIns.length > 0 && (
        <Card>
          <CardBody>
            <h4 className="font-medium text-primary mb-3">Session Check-ins</h4>
            <div className="space-y-2">
              {checkIns.map((ci, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-sm text-primary">{ci.user_name || 'Attendee'}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default EventCheckIn;
