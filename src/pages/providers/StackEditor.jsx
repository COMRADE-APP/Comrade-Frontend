import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, Plus, Trash2, Edit2, X, Save, RefreshCcw, FileText, Video, Music, Image, Code, Link, Clock, Lock, Eye, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';

const CT = [
    { value: 'text', label: 'Text', icon: FileText },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'audio', label: 'Audio', icon: Music },
    { value: 'image', label: 'Image', icon: Image },
    { value: 'code', label: 'Code', icon: Code },
    { value: 'file', label: 'File', icon: Link },
];

const StackEditor = () => {
    const { stackId } = useParams();
    const navigate = useNavigate();
    const [stack, setStack] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', content_type: 'text', content_text: '', video_url: '', duration_minutes: 10, is_preview: false, is_locked: false });
    const [editId, setEditId] = useState(null);
    const [err, setErr] = useState(null);
    const [dragIdx, setDragIdx] = useState(null);
    const [dragOver, setDragOver] = useState(null);

    useEffect(() => { load(); }, [stackId]);

    const load = async () => {
        setLoading(true);
        try { const r = await api.get('/api/v1/specializations/stacks/'+stackId+'/'); setStack(r.data); setLessons(r.data.lessons || []); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    // Redirect to spec editor with this module pre-selected if stack belongs to a specialization
    useEffect(() => {
        if (stack && stack.specialization) {
            navigate('/provider/products/specialization/'+stack.specialization+'?module='+stackId, { replace: true });
        }
    }, [stack]);

    const move = (from, to) => {
        const cp = [...lessons]; const [m] = cp.splice(from, 1); cp.splice(to, 0, m); setLessons(cp);
    };

    const saveOrder = async () => {
        setSaving(true);
        try { await api.post('/api/v1/specializations/stacks/'+stackId+'/reorder_lessons/', { ordered_ids: lessons.map(l => l.id) }); }
        catch (e) { console.error(e); } finally { setSaving(false); }
    };

    const add = async () => {
        setErr(null);
        try {
            const r = await api.post('/api/v1/specializations/stacks/'+stackId+'/add_lesson/', { ...form, duration_minutes: parseInt(form.duration_minutes) || 10 });
            setLessons(p => [...p, r.data]); setShowModal(false); setForm({ title: '', description: '', content_type: 'text', content_text: '', video_url: '', duration_minutes: 10, is_preview: false, is_locked: false }); setEditId(null);
        } catch (e) { setErr(e.response?.data?.error || 'Failed'); }
    };

    const update = async () => {
        setErr(null);
        try { await api.patch('/api/v1/specializations/lessons/'+editId+'/', form); setShowModal(false); setForm({ title: '', description: '', content_type: 'text', content_text: '', video_url: '', duration_minutes: 10, is_preview: false, is_locked: false }); setEditId(null); load(); }
        catch (e) { setErr(e.response?.data?.error || 'Failed'); }
    };

    const remove = async (id) => {
        try { await api.post('/api/v1/specializations/stacks/'+stackId+'/remove_lesson/', { lesson_id: id }); setLessons(p => p.filter(l => l.id !== id)); }
        catch (e) { console.error(e); }
    };

    const openEdit = (lesson) => { setForm(lesson); setEditId(lesson.id); setShowModal(true); };

    const dragStart = (i) => setDragIdx(i);
    const dragOverFn = (e, i) => { e.preventDefault(); setDragOver(i); };
    const dragEnd = () => { setDragIdx(null); setDragOver(null); };
    const dropFn = (i) => {
        if (dragIdx === null || dragIdx === i) return;
        const cp = [...lessons]; const [m] = cp.splice(dragIdx, 1); cp.splice(i, 0, m); setLessons(cp);
        setDragIdx(null); setDragOver(null);
    };

    if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-secondary/20 border-t-primary-600 animate-spin" /></div>;
    if (!stack) return <div className="text-center py-20"><h2 className="text-xl font-bold">Stack not found</h2></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary"><ArrowLeft size={18} /></button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2"><Layers size={24} className="text-emerald-500" /> {stack.name}</h1>
                        <p className="text-xs sm:text-sm text-secondary mt-0.5">Stack Editor - {lessons.length} lessons</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={saveOrder} isLoading={saving}><Save size={14} className="mr-1.5" /> Save Order</Button>
                    <Button variant="primary" size="sm" onClick={() => { setForm({ title: '', description: '', content_type: 'text', content_text: '', video_url: '', duration_minutes: 10, is_preview: false, is_locked: false }); setEditId(null); setShowModal(true); }}><Plus size={14} className="mr-1.5" /> Add Lesson</Button>
                </div>
            </div>

            {lessons.length === 0 ? (
                <div className="text-center py-16 bg-elevated rounded-2xl border-2 border-dashed border-theme">
                    <Layers size={48} className="text-secondary/30 mx-auto mb-4" />
                    <h4 className="font-bold text-primary mb-1">No Lessons Yet</h4>
                    <p className="text-sm text-secondary mb-6">Use the Add Lesson button above to start building your stack.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {lessons.map((lesson, i) => {
                        const ct = CT.find(c => c.value === lesson.content_type) || CT[0];
                        const Icon = ct.icon;
                        return (
                            <div key={lesson.id}
                                draggable
                                onDragStart={() => dragStart(i)}
                                onDragOver={(e) => dragOverFn(e, i)}
                                onDragEnd={dragEnd}
                                onDrop={() => dropFn(i)}
                                className={`flex items-center gap-3 p-3 sm:p-4 bg-elevated border-2 rounded-xl transition-all ${dragIdx === i ? 'opacity-50 border-primary/50' : dragOver === i ? 'border-primary bg-primary/5' : 'border-theme hover:border-primary/30'}`}>
                                <div className="flex flex-col gap-1 items-center shrink-0">
                                    <button onClick={() => i > 0 && move(i, i-1)} disabled={i === 0} className="text-secondary hover:text-primary disabled:opacity-20" title="Move up"><ChevronUp size={14} /></button>
                                    <span className="text-xs font-bold text-secondary w-6 text-center">{i + 1}</span>
                                    <button onClick={() => i < lessons.length - 1 && move(i, i+1)} disabled={i === lessons.length - 1} className="text-secondary hover:text-primary disabled:opacity-20" title="Move down"><ChevronDown size={14} /></button>
                                </div>
                                <GripVertical size={18} className="text-secondary shrink-0 cursor-grab" title="Drag to reorder" />
                                <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0"><Icon size={16} className="text-secondary" /></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-primary text-sm truncate">{lesson.title}</p>
                                        {lesson.is_preview && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600"><Eye size={10} className="inline mr-0.5" />Preview</span>}
                                        {lesson.is_locked && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600"><Lock size={10} className="inline mr-0.5" />Locked</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-secondary mt-0.5"><span>{ct.label}</span><span className="text-tertiary">-</span><span><Clock size={10} className="inline" /> {lesson.duration_minutes}min</span></div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => openEdit(lesson)} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary hover:text-primary"><Edit2 size={14} /></button>
                                    <button onClick={() => remove(lesson.id)} className="p-2 rounded-lg hover:bg-red-50 text-secondary hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-theme flex items-center justify-between"><h3 className="font-bold text-primary">{editId ? 'Edit' : 'Add'} Lesson</h3><button onClick={() => { setShowModal(false); setEditId(null); }} className="p-2 rounded-lg hover:bg-secondary/10 text-secondary"><X size={18} /></button></div>
                        <form onSubmit={editId ? (e => { e.preventDefault(); update(); }) : (e => { e.preventDefault(); add(); })} className="p-5 space-y-4">
                            {err && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{err}</div>}
                            <div><label className="block text-sm font-medium text-primary mb-1">Title *</label><input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div>
                            <div><label className="block text-sm font-medium text-primary mb-1">Description</label><textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-primary mb-1">Content Type</label><select value={form.content_type} onChange={e => setForm({...form, content_type: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm">{CT.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div><div><label className="block text-sm font-medium text-primary mb-1">Duration (min)</label><input type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" /></div></div>
                            {form.content_type === 'text' && <div><label className="block text-sm font-medium text-primary mb-1">Content</label><textarea rows={5} value={form.content_text} onChange={e => setForm({...form, content_text: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm font-mono text-xs" /></div>}
                            {form.content_type === 'video' && <div><label className="block text-sm font-medium text-primary mb-1">Video URL</label><input type="url" value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm" placeholder="https://youtube.com/watch?v=..." /></div>}
                            {form.content_type === 'code' && <div><label className="block text-sm font-medium text-primary mb-1">Code</label><textarea rows={5} value={form.content_text} onChange={e => setForm({...form, content_text: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2.5 text-sm font-mono text-xs" /></div>}
                            <div className="flex items-center gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_preview} onChange={e => setForm({...form, is_preview: e.target.checked})} className="w-4 h-4 rounded border-theme" /> Preview (free)</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_locked} onChange={e => setForm({...form, is_locked: e.target.checked})} className="w-4 h-4 rounded border-theme" /> Locked</label></div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-theme"><Button variant="outline" type="button" onClick={() => { setShowModal(false); setEditId(null); }}>Cancel</Button><Button variant="primary" type="submit">{editId ? 'Update' : 'Add'} Lesson</Button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StackEditor;
