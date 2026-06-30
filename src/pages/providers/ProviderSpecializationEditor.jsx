import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Plus, GripVertical, Trash2, X, Save, Layers, ChevronDown, ChevronRight, FileText, Video, Music, Image, Code, Link2, Clock, Lock, Eye, DollarSign, Send, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Quote, Heading1, Heading2, Heading3, EyeOff, Upload, Play, Award } from 'lucide-react';
import StarterKit from '@tiptap/starter-kit';
import { useEditor, EditorContent } from '@tiptap/react';
import TextAlign from '@tiptap/extension-text-align';
import TiptapPlaceholder from '@tiptap/extension-placeholder';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';

const getContrastColor = (bg) => {
    const hex = bg.replace('#', '');
    const r = parseInt(hex.substring(0,2), 16);
    const g = parseInt(hex.substring(2,4), 16);
    const b = parseInt(hex.substring(4,6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#000000' : '#ffffff';
};

const BLOCK_TYPES = [
    { value: 'text', label: 'Text', icon: FileText, text: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', dot: 'bg-gray-400 dark:bg-gray-500' },
    { value: 'video', label: 'Video', icon: Video, text: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', dot: 'bg-rose-500 dark:bg-rose-400' },
    { value: 'audio', label: 'Audio', icon: Music, text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500 dark:bg-amber-400' },
    { value: 'image', label: 'Image', icon: Image, text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500 dark:bg-emerald-400' },
    { value: 'code', label: 'Code', icon: Code, text: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', dot: 'bg-indigo-500 dark:bg-indigo-400' },
    { value: 'file', label: 'File', icon: Link2, text: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', dot: 'bg-slate-500 dark:bg-slate-400' },
];

const emptyBlock = { block_type: 'text', content: '', url: '', caption: '', code_language: 'javascript', background_color: '#ffffff' };
const emptyLesson = { title: '', description: '', duration_minutes: 10, is_preview: false, is_locked: false, background_color: '#ffffff' };
const emptyModule = { name: '', description: '', background_color: '#ffffff' };
const DRAFT_KEY = (specId) => 'comrade_draft_spec_editor_' + specId;

const MenuBar = ({ editor }) => {
    if (!editor) return null;
    const btn = 'p-1.5 rounded hover:bg-secondary/10 text-secondary hover:text-primary transition-colors';
    const active = 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded border border-primary/20';
    return (
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-secondary/5 rounded-t-lg border-b border-theme">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`${btn} ${editor.isActive('bold') ? active : ''}`} title="Bold"><Bold size={15} /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btn} ${editor.isActive('italic') ? active : ''}`} title="Italic"><Italic size={15} /></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${btn} ${editor.isActive('underline') ? active : ''}`} title="Underline"><Underline size={15} /></button>
            <span className="w-px h-5 bg-theme mx-0.5" />
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`${btn} ${editor.isActive('heading', { level: 1 }) ? active : ''}`} title="Heading 1"><Heading1 size={15} /></button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${btn} ${editor.isActive('heading', { level: 2 }) ? active : ''}`} title="Heading 2"><Heading2 size={15} /></button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${btn} ${editor.isActive('heading', { level: 3 }) ? active : ''}`} title="Heading 3"><Heading3 size={15} /></button>
            <span className="w-px h-5 bg-theme mx-0.5" />
            <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`${btn} ${editor.isActive({ textAlign: 'left' }) ? active : ''}`}><AlignLeft size={15} /></button>
            <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`${btn} ${editor.isActive({ textAlign: 'center' }) ? active : ''}`}><AlignCenter size={15} /></button>
            <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`${btn} ${editor.isActive({ textAlign: 'right' }) ? active : ''}`}><AlignRight size={15} /></button>
            <span className="w-px h-5 bg-theme mx-0.5" />
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btn} ${editor.isActive('bulletList') ? active : ''}`}><List size={15} /></button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btn} ${editor.isActive('orderedList') ? active : ''}`}><ListOrdered size={15} /></button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${btn} ${editor.isActive('blockquote') ? active : ''}`}><Quote size={15} /></button>
            <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`${btn} ${editor.isActive('codeBlock') ? active : ''}`}><Code size={15} /></button>
        </div>
    );
};

const TextBlockEditor = ({ content, onChange }) => {
    const editor = useEditor({
        extensions: [StarterKit, TextAlign.configure({ types: ['heading', 'paragraph'] }), TiptapPlaceholder.configure({ placeholder: 'Write your content here...' })],
        content: content || '',
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: { attributes: { class: 'prose prose-sm dark:prose-invert max-w-none p-3 min-h-[120px] outline-none prose-headings:text-primary prose-p:text-secondary prose-strong:text-primary prose-a:text-primary-600 prose-blockquote:border-l-primary-500 prose-blockquote:text-secondary prose-blockquote:pl-4 prose-code:bg-secondary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-primary prose-pre:bg-secondary/10 prose-pre:p-3 prose-pre:rounded-lg prose-ul:text-secondary prose-ol:text-secondary' } },
    });
    return (
        <div className="border border-theme rounded-b-lg overflow-hidden">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};

const ProviderSpecializationEditor = () => {
    const { specId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const toast = useToast();
    const initialModuleId = searchParams.get('module');

    const updateUrlParams = (updates) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([k, v]) => {
            if (v === null || v === undefined || v === '') next.delete(k);
            else next.set(k, String(v));
        });
        setSearchParams(next, { replace: true });
    };

    const [spec, setSpec] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeModuleId, setActiveModuleId] = useState(null);
    const [expandedModules, setExpandedModules] = useState(new Set());
    const [editingLesson, setEditingLesson] = useState(null);
    const [addingLesson, setAddingLesson] = useState(false);
    const [lessonForm, setLessonForm] = useState(emptyLesson);
    const [blocks, setBlocks] = useState([{ ...emptyBlock, _id: 'b0' }]);
    const [err, setErr] = useState(null);
    const [saveStatus, setSaveStatus] = useState('');
    const [previewMode, setPreviewMode] = useState(false);
    const [showVersionDialog, setShowVersionDialog] = useState(null);
    const [showAddBlockMenu, setShowAddBlockMenu] = useState(false);
    const [showBottomBlockMenu, setShowBottomBlockMenu] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [showContentMenu, setShowContentMenu] = useState(false);
    const [activeContentTab, setActiveContentTab] = useState(null);
    const [showCourseSettings, setShowCourseSettings] = useState(false);
    const [courseSettings, setCourseSettings] = useState({ lock_for_unenrolled: true, sequential_locking: false, skip_disabled: false });


    // Quiz builder state
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [quizForm, setQuizForm] = useState({ title: '', description: '', passing_score: 70, max_attempts: 3, time_limit_minutes: null, display_mode: 'whole', timer_mode: 'per_test', time_per_question: null, allow_back_navigation: true, show_results_immediately: true, pass_mark_to_continue: false });
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [showQuizGenModal, setShowQuizGenModal] = useState(false);
    const [quizGenLoading, setQuizGenLoading] = useState(false);
    const [genFiles, setGenFiles] = useState([]);
    const [genLinks, setGenLinks] = useState([]);
    const [includeTranscripts, setIncludeTranscripts] = useState(true);

    // Activity builder state
    const [editingActivity, setEditingActivity] = useState(null);
    const [activityForm, setActivityForm] = useState({ title: '', activity_type: 'assignment', instructions: '', submission_required: false, due_days: null });
    const [activityBlocks, setActivityBlocks] = useState([]);

    // Lab builder state
    const [editingLab, setEditingLab] = useState(null);
    const [labForm, setLabForm] = useState({ title: '', description: '', instructions: '', setup_guide: '', expected_output: '', links: [] });
    const [labBlocks, setLabBlocks] = useState([]);

    const [dragIdx, setDragIdx] = useState(null); const [dragOver, setDragOver] = useState(null);
    const [ldragIdx, setLdragIdx] = useState(null); const [ldragOver, setLdragOver] = useState(null);
    const [bdragIdx, setBdragIdx] = useState(null); const [bdragOver, setBdragOver] = useState(null);

    const [meta, setMeta] = useState({ name: '', description: '', learning_type: 'course', is_paid: false, price: '', background_color: '#ffffff' });
    const [showAddModule, setShowAddModule] = useState(false);
    const [moduleForm, setModuleForm] = useState(emptyModule);
    const [hasDraft, setHasDraft] = useState(false);
    const statusTimer = useRef(null);
    const addBlockRef = useRef(null);
    const bottomBlockRef = useRef(null);
    const contentMenuRef = useRef(null);

    const activeModule = modules.find(m => m.id === activeModuleId);
    const activeLessons = activeModule?.lessons || [];

    const load = async () => {
        setLoading(true);
        try {
            const r = await api.get('/api/v1/specializations/specializations/'+specId+'/');
            const data = r.data;
            setSpec(data);
            setMeta({ name: data.name, description: data.description || '', learning_type: data.learning_type, is_paid: data.is_paid || false, price: data.price || '', background_color: data.background_color || '#ffffff' });
            setCourseSettings({ lock_for_unenrolled: data.lock_for_unenrolled !== false, sequential_locking: data.sequential_locking || false, skip_disabled: data.skip_disabled || false });
            const raw = data.stacks_detail || data.stacks || [];
            const stackIds = data.stack_order || [];
            const ordered = stackIds.length > 0 ? stackIds.map(id => raw.find(s => s.id === id)).filter(Boolean) : raw;
            raw.filter(s => !ordered.find(o => o.id === s.id)).forEach(s => ordered.push(s));
            setModules(ordered);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [specId]);
    useEffect(() => {
        if (!loading && initialModuleId && !activeModuleId) {
            setActiveModuleId(initialModuleId);
            setExpandedModules(prev => new Set([...prev, initialModuleId]));
        }
        if (!loading && modules.length > 0) {
            const lessonId = searchParams.get('lesson');
            if (!lessonId || editingLesson) return;
            const id = parseInt(lessonId);
            for (const mod of modules) {
                const lesson = mod.lessons?.find(l => l.id === id);
                if (lesson) {
                    setActiveModuleId(mod.id);
                    setExpandedModules(prev => new Set([...prev, mod.id]));
                    openEditLesson(lesson, { updateUrl: false });
                    break;
                }
            }
        }
    }, [loading, initialModuleId, modules]);
    useEffect(() => {
        const key = DRAFT_KEY(specId);
        const draft = localStorage.getItem(key);
        if (draft) { try { const p = JSON.parse(draft); if (p.lessonForm || p.meta) setHasDraft(true); } catch (e) {} }
    }, [specId]);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (addBlockRef.current && !addBlockRef.current.contains(e.target)) setShowAddBlockMenu(false);
            if (bottomBlockRef.current && !bottomBlockRef.current.contains(e.target)) setShowBottomBlockMenu(false);
            if (contentMenuRef.current && !contentMenuRef.current.contains(e.target)) setShowContentMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const saveDraft = useCallback(() => {
        const key = DRAFT_KEY(specId);
        const draft = { lessonForm, meta, activeModuleId, blocks, timestamp: Date.now() };
        localStorage.setItem(key, JSON.stringify(draft));
        setSaveStatus('draft'); setHasDraft(true);
        if (statusTimer.current) clearTimeout(statusTimer.current);
        statusTimer.current = setTimeout(() => setSaveStatus(''), 3000);
    }, [lessonForm, meta, activeModuleId, blocks, specId]);

    const restoreDraft = () => {
        const key = DRAFT_KEY(specId);
        const draft = localStorage.getItem(key);
        if (draft) {
            try { const p = JSON.parse(draft); if (p.lessonForm) setLessonForm(p.lessonForm); if (p.meta) setMeta(p.meta); if (p.activeModuleId) setActiveModuleId(p.activeModuleId); if (p.blocks) setBlocks(p.blocks); }
            catch (e) {}
        }
        localStorage.removeItem(key); setHasDraft(false); setSaveStatus('');
    };

    const clearDraft = () => { localStorage.removeItem(DRAFT_KEY(specId)); setHasDraft(false); };

    // Debounced autosave on any form/block change (2s after last change)
    useEffect(() => {
        if (!specId) return;
        if (!lessonForm.title && !blocks.some(b => b.content || b.url)) return;
        const timer = setTimeout(saveDraft, 2000);
        return () => clearTimeout(timer);
    }, [lessonForm, blocks, specId]);

    // Save on tab close / refresh
    useEffect(() => {
        const handleBeforeUnload = () => {
            const key = DRAFT_KEY(specId);
            const draft = { lessonForm, meta, activeModuleId, blocks, timestamp: Date.now() };
            localStorage.setItem(key, JSON.stringify(draft));
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [lessonForm, meta, activeModuleId, blocks, specId]);

    const confirmSave = (action) => { setShowVersionDialog({ action, title: lessonForm.title || 'Untitled' }); };
    const handleVersionConfirm = async (effect) => {
        const { action } = showVersionDialog;
        setShowVersionDialog(null); setSaving(true); setErr(null);
        try {
            const payload = { ...lessonForm, duration_minutes: parseInt(lessonForm.duration_minutes) || 10, content_text: blocks.find(b => b.block_type === 'text')?.content || '' };
            if (action === 'add') {
                const r = await api.post('/api/v1/specializations/stacks/'+activeModuleId+'/add_lesson/', payload);
                // Save blocks for the new lesson
                const savedBlocks = blocks.filter(b => b.content || b.url);
                for (const b of savedBlocks) {
                    if (b._temp && b._file) {
                        const ffd = new FormData();
                        ffd.append('file', b._file);
                        ffd.append('block_type', b.block_type || 'file');
                        ffd.append('caption', b.caption || b._file.name);
                        await api.post('/api/v1/specializations/lessons/'+r.data.id+'/upload_block_file/', ffd).catch(() => {});
                    } else {
                        const { _id, _temp, _file, ...clean } = b;
                        await api.post('/api/v1/specializations/lessons/'+r.data.id+'/add_block/', clean).catch(() => {});
                    }
                }
                const newMods = modules.map(mod => mod.id === activeModuleId ? { ...mod, lessons: [...(mod.lessons || []), r.data] } : mod);
                setModules(newMods); setAddingLesson(false); setLessonForm(emptyLesson); setBlocks([{ ...emptyBlock, _id: 'b0' }]); updateUrlParams({ lesson: null, tab: null });
            } else if (action === 'update') {
                await api.patch('/api/v1/specializations/lessons/'+editingLesson.id+'/', payload);
                // Smart diff: remove deleted, add new, replace updated
                const oldIds = new Set((editingLesson.content_blocks || []).map(b => b.id));
                const currentRealIds = new Set(blocks.filter(b => b.id && !String(b.id).startsWith('b')).map(b => b.id));
                const toRemove = [...oldIds].filter(id => !currentRealIds.has(id));
                const toAdd = blocks.filter(b => !b.id || String(b.id).startsWith('b') || !oldIds.has(b.id));
                const toUpdate = blocks.filter(b => b.id && !String(b.id).startsWith('b') && oldIds.has(b.id));
                for (const id of toRemove) { await api.post('/api/v1/specializations/lessons/'+editingLesson.id+'/remove_block/', { block_id: id }).catch(() => {}); }
                for (const b of toAdd) {
                    if (b._temp && b._file) {
                        const ffd = new FormData();
                        ffd.append('file', b._file);
                        ffd.append('block_type', b.block_type || 'file');
                        ffd.append('caption', b.caption || b._file.name);
                        await api.post('/api/v1/specializations/lessons/'+editingLesson.id+'/upload_block_file/', ffd).catch(() => {});
                    } else {
                        const { _id, _temp, _file, ...clean } = b;
                        await api.post('/api/v1/specializations/lessons/'+editingLesson.id+'/add_block/', clean).catch(() => {});
                    }
                }
                for (const b of toUpdate) {
                    await api.post('/api/v1/specializations/lessons/'+editingLesson.id+'/remove_block/', { block_id: b.id }).catch(() => {});
                    if (b._temp && b._file) {
                        const ffd = new FormData();
                        ffd.append('file', b._file);
                        ffd.append('block_type', b.block_type || 'file');
                        ffd.append('caption', b.caption || b._file.name);
                        await api.post('/api/v1/specializations/lessons/'+editingLesson.id+'/upload_block_file/', ffd).catch(() => {});
                    } else {
                        const { _id, _temp, _file, ...clean } = b;
                        await api.post('/api/v1/specializations/lessons/'+editingLesson.id+'/add_block/', clean).catch(() => {});
                    }
                }
                const newMods = modules.map(mod => mod.id === activeModuleId ? { ...mod, lessons: mod.lessons.map(l => l.id === editingLesson.id ? { ...l, ...payload } : l) } : mod);
                setModules(newMods); setEditingLesson(null); setLessonForm(emptyLesson); setBlocks([{ ...emptyBlock, _id: 'b0' }]); updateUrlParams({ lesson: null, tab: null });
            }
            clearDraft(); setSaveStatus('saved');
            toast.success(action === 'add' ? 'Lesson created' : 'Lesson updated');
            if (statusTimer.current) clearTimeout(statusTimer.current);
            statusTimer.current = setTimeout(() => setSaveStatus(''), 3000);
        } catch (e) { setErr(e.response?.data?.error || 'Failed'); } finally { setSaving(false); }
    };

    // Module ops
    const saveModuleOrder = async (mods) => { try { await api.post('/api/v1/specializations/specializations/'+specId+'/reorder_stacks/', { ordered_stack_ids: mods.map(m => m.id) }); } catch (e) {} };
    const handleModuleDrag = (i) => setDragIdx(i); const handleModuleOver = (e, i) => { e.preventDefault(); setDragOver(i); };
    const handleModuleEnd = () => { setDragIdx(null); setDragOver(null); };
    const handleModuleDrop = (i) => { if (dragIdx === null || dragIdx === i) return; const cp = [...modules]; const [m] = cp.splice(dragIdx, 1); cp.splice(i, 0, m); setModules(cp); setDragIdx(null); setDragOver(null); saveModuleOrder(cp); };
    const handleRemoveModule = async (stackId) => { const nm = modules.filter(m => m.id !== stackId); setModules(nm); if (activeModuleId === stackId) { setActiveModuleId(null); setEditingLesson(null); } try { await api.patch('/api/v1/specializations/specializations/'+specId+'/', { stacks: nm.map(m => m.id) }); } catch (e) { load(); } };
    const handleAddModule = async (e) => { e.preventDefault(); setSaving(true); try { const sr = await api.post('/api/v1/specializations/stacks/', { name: moduleForm.name, description: moduleForm.description, specialization: specId }); const nm = [...modules, { ...sr.data, lessons: [] }]; setModules(nm); await api.patch('/api/v1/specializations/specializations/'+specId+'/', { stacks: nm.map(m => m.id) }); setShowAddModule(false); setModuleForm(emptyModule); setActiveModuleId(sr.data.id); setExpandedModules(prev => new Set([...prev, sr.data.id])); } catch (e) { setErr(e.response?.data?.error || 'Failed'); } finally { setSaving(false); } };

    // Lesson ops
    const saveLessonOrder = async (modId, lessons) => { try { await api.post('/api/v1/specializations/stacks/'+modId+'/reorder_lessons/', { ordered_ids: lessons.map(l => l.id) }); } catch (e) {} };
    const handleLessonDrag = (i) => setLdragIdx(i); const handleLessonOver = (e, i) => { e.preventDefault(); setLdragOver(i); };
    const handleLessonEnd = () => { setLdragIdx(null); setLdragOver(null); };
    const handleLessonDrop = (i) => { if (ldragIdx === null || ldragIdx === i || !activeModule) return; const cp = [...activeLessons]; const [m] = cp.splice(ldragIdx, 1); cp.splice(i, 0, m); setModules(modules.map(mod => mod.id === activeModuleId ? { ...mod, lessons: cp } : mod)); setLdragIdx(null); setLdragOver(null); saveLessonOrder(activeModuleId, cp); };
    const handleDeleteLesson = async (lessonId) => { try { await api.post('/api/v1/specializations/stacks/'+activeModuleId+'/remove_lesson/', { lesson_id: lessonId }); setModules(modules.map(mod => mod.id === activeModuleId ? { ...mod, lessons: mod.lessons.filter(l => l.id !== lessonId) } : mod)); if (editingLesson?.id === lessonId) { setEditingLesson(null); setLessonForm(emptyLesson); } } catch (e) {} };

    const openEditLesson = (lesson, { updateUrl = true } = {}) => {
        setEditingLesson(lesson); setLessonForm(lesson); setAddingLesson(false);
        setActiveContentTab('lesson');
        setBlocks(lesson.content_blocks?.length ? lesson.content_blocks.map(b => ({ ...b, _id: b.id })) : [{ ...emptyBlock, _id: 'b0' }]);
        if (updateUrl) updateUrlParams({ lesson: lesson.id, tab: 'lesson' });
    };
    const cancelEdit = () => { setEditingLesson(null); setLessonForm(emptyLesson); setAddingLesson(false); setBlocks([{ ...emptyBlock, _id: 'b0' }]); setErr(null); updateUrlParams({ lesson: null, tab: null }); };
    const handleSaveMeta = async () => { setSaving(true); setSaveStatus('saving'); try { await api.patch('/api/v1/specializations/specializations/'+specId+'/', meta); setSaveStatus('saved'); toast.success('Course saved'); if (statusTimer.current) clearTimeout(statusTimer.current); statusTimer.current = setTimeout(() => setSaveStatus(''), 3000); } catch (e) { setSaveStatus(''); toast.error('Failed to save: ' + (e.response?.data?.error || e.message)); } finally { setSaving(false); } };
    const handleSaveCourseSettings = async () => { setSaving(true); try { await api.patch('/api/v1/specializations/specializations/'+specId+'/', courseSettings); setShowCourseSettings(false); toast.success('Course settings saved'); } catch (e) { toast.error('Failed: ' + (e.response?.data?.error || e.message)); } finally { setSaving(false); } };

    // Block ops
    const addBlock = (type) => { const id = 'b' + Date.now(); setBlocks(prev => [...prev, { ...emptyBlock, block_type: type, _id: id }]); setShowAddBlockMenu(false); setShowBottomBlockMenu(false); setTimeout(() => { const el = document.getElementById('block-' + id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); const inp = el.querySelector('input, textarea, [contenteditable]'); if (inp) inp.focus(); } }, 150); };

    const handleFileUpload = async (idx, file, blockType) => {
        const key = `${idx}`;
        setUploadProgress(prev => ({ ...prev, [key]: 0 }));
        if (!editingLesson?.id) {
            const blobUrl = URL.createObjectURL(file);
            updateBlock(idx, 'url', blobUrl);
            updateBlock(idx, '_temp', true);
            updateBlock(idx, '_file', file);
            setUploadProgress(prev => ({ ...prev, [key]: 100 }));
            toast.success('File staged: ' + file.name + ' (will upload on save)');
            setTimeout(() => setUploadProgress(prev => { const cp = {...prev}; delete cp[key]; return cp; }), 2000);
            return;
        }
        const fd = new FormData();
        fd.append('file', file);
        fd.append('block_type', blockType);
        fd.append('caption', file.name);
        try {
            const r = await api.post('/api/v1/specializations/lessons/'+editingLesson.id+'/upload_block_file/', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    if (e.total) setUploadProgress(prev => ({ ...prev, [key]: Math.round((e.loaded / e.total) * 100) }));
                },
            });
            updateBlock(idx, 'url', r.data.file || r.data.url);
            setUploadProgress(prev => ({ ...prev, [key]: 100 }));
            toast.success('Uploaded: ' + file.name);
            setTimeout(() => setUploadProgress(prev => { const cp = {...prev}; delete cp[key]; return cp; }), 2000);
        } catch (e) {
            setUploadProgress(prev => ({ ...prev, [key]: -1 }));
            toast.error('Upload failed: ' + (e.response?.data?.error || e.message));
            setTimeout(() => setUploadProgress(prev => { const cp = {...prev}; delete cp[key]; return cp; }), 3000);
        }
    };
    const updateBlock = (idx, field, value) => { setBlocks(prev => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b)); };
    const removeBlock = (idx) => { if (blocks.length <= 1) return; setBlocks(prev => prev.filter((_, i) => i !== idx)); };
    const handleBlockDrag = (i) => setBdragIdx(i); const handleBlockOver = (e, i) => { e.preventDefault(); setBdragOver(i); };
    const handleBlockEnd = () => { setBdragIdx(null); setBdragOver(null); };
    const handleBlockDrop = (i) => { if (bdragIdx === null || bdragIdx === i) return; const cp = [...blocks]; const [m] = cp.splice(bdragIdx, 1); cp.splice(i, 0, m); setBlocks(cp); setBdragIdx(null); setBdragOver(null); };

    // Quiz ops
    const openQuizBuilder = () => { setActiveContentTab('quiz'); setEditingLesson(null); setAddingLesson(false); setEditingActivity(null); setEditingLab(null); setQuizForm({ title: '', description: '', passing_score: 70, max_attempts: 3, time_limit_minutes: null, display_mode: 'whole', timer_mode: 'per_test', time_per_question: null, allow_back_navigation: true, show_results_immediately: true, pass_mark_to_continue: false }); setQuizQuestions([]); setShowContentMenu(false); };
    const handleSaveQuiz = async () => {
        setSaving(true); setErr(null);
        try {
            const payload = { stack: activeModuleId, ...quizForm, time_limit_minutes: quizForm.time_limit_minutes ? parseInt(quizForm.time_limit_minutes) : null, time_per_question: quizForm.time_per_question ? parseInt(quizForm.time_per_question) : null };
            if (quizForm.timer_mode === 'per_question') payload.allow_back_navigation = false;
            let quiz;
            if (editingQuiz) {
                await api.patch('/api/v1/specializations/quizzes/'+editingQuiz.id+'/', payload);
                quiz = { ...editingQuiz, ...payload };
                // Diff questions: remove deleted, create new
                const existingIds = new Set((editingQuiz.questions || []).map(q => q.id).filter(Boolean));
                const keptIds = new Set(quizQuestions.filter(q => q.id).map(q => q.id));
                for (const id of existingIds) {
                    if (!keptIds.has(id)) {
                        await api.delete('/api/v1/specializations/quiz-questions/'+id+'/').catch(e => { throw new Error('Failed to remove question: ' + (e.response?.data?.error || e.message)); });
                    }
                }
                for (const q of quizQuestions) {
                    const { id, ...qData } = q;
                    if (id && existingIds.has(id)) {
                        await api.patch('/api/v1/specializations/quiz-questions/'+id+'/', qData).catch(e => { throw new Error('Failed to update question: ' + (e.response?.data?.error || e.message)); });
                    } else {
                        await api.post('/api/v1/specializations/quiz-questions/', { quiz: quiz.id, ...qData }).catch(e => { throw new Error('Failed to add question: ' + (e.response?.data?.error || e.message)); });
                    }
                }
            } else {
                const r = await api.post('/api/v1/specializations/quizzes/', { ...payload, lesson: null });
                quiz = r.data;
                for (const q of quizQuestions) {
                    const { id, ...cleanQ } = q;
                    await api.post('/api/v1/specializations/quiz-questions/', { quiz: quiz.id, ...cleanQ }).catch(e => { throw new Error('Failed to save question: ' + (e.response?.data?.error || e.message)); });
                }
            }
            toast.success(editingQuiz ? 'Test updated' : 'Test created');
            setActiveContentTab(null);
        } catch (e) { setErr(e.response?.data?.error || e.message || 'Failed to save test'); } finally { setSaving(false); }
    };
    const addQuizQuestion = () => { setQuizQuestions(prev => [...prev, { question_text: '', question_type: 'multiple_choice', choices: [{ label: 'A', text: '', is_correct: true }], correct_answer: '', explanation: '', points: 1, order: prev.length }]); };
    const updateQuizQuestion = (idx, field, value) => { setQuizQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q)); };
    const removeQuizQuestion = (idx) => { setQuizQuestions(prev => prev.filter((_, i) => i !== idx)); };
    const addQuizChoice = (qIdx) => { const labels = 'ABCDEFGH'; setQuizQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, choices: [...q.choices, { label: labels[q.choices.length % labels.length], text: '', is_correct: false }] } : q)); };
    const updateQuizChoice = (qIdx, cIdx, field, value) => { setQuizQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, choices: q.choices.map((c, j) => j === cIdx ? { ...c, [field]: value } : c) } : q)); };
    const removeQuizChoice = (qIdx, cIdx) => { setQuizQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, choices: q.choices.filter((_, j) => j !== cIdx) } : q)); };
    const handleGenerateQuizFromContent = async () => {
        setQuizGenLoading(true);
        try {
            const lessonIds = activeLessons.filter(l => l.content_text || l.content_blocks?.length).map(l => l.id);
            const fd = new FormData();
            if (lessonIds.length) fd.append('lesson_ids', JSON.stringify(lessonIds));
            fd.append('num_questions', '5');
            fd.append('question_types', JSON.stringify(['multiple_choice', 'true_false', 'short_answer']));
            if (genLinks.length) fd.append('reference_urls', JSON.stringify(genLinks.filter(l => l.url)));
            fd.append('include_transcripts', includeTranscripts ? 'true' : 'false');
            for (const file of genFiles) fd.append('files', file);
            const result = await api.post('/api/v1/specializations/quizzes/generate_from_content/', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setQuizQuestions(prev => [...prev, ...result.data.questions.map((q, i) => ({ ...q, order: prev.length + i }))]);
            toast.success('Generated ' + result.data.questions.length + ' questions');
            setShowQuizGenModal(false);
            setGenFiles([]);
            setGenLinks([]);
        } catch (e) { toast.error('Generation failed: ' + (e.response?.data?.error || e.message)); } finally { setQuizGenLoading(false); }
    };

    const addActivityBlock = (type) => { const id = 'ab' + Date.now(); setActivityBlocks(prev => [...prev, { ...emptyBlock, block_type: type, _id: id }]); setTimeout(() => { const el = document.getElementById('block-' + id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); const inp = el.querySelector('input, textarea, [contenteditable]'); if (inp) inp.focus(); } }, 150); };
    const updateActivityBlock = (idx, field, value) => { setActivityBlocks(prev => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b)); };
    const removeActivityBlock = (idx) => { if (activityBlocks.length <= 1) return; setActivityBlocks(prev => prev.filter((_, i) => i !== idx)); };

    const addLabBlock = (type) => { const id = 'lb' + Date.now(); setLabBlocks(prev => [...prev, { ...emptyBlock, block_type: type, _id: id }]); setTimeout(() => { const el = document.getElementById('block-' + id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); const inp = el.querySelector('input, textarea, [contenteditable]'); if (inp) inp.focus(); } }, 150); };
    const updateLabBlock = (idx, field, value) => { setLabBlocks(prev => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b)); };
    const removeLabBlock = (idx) => { if (labBlocks.length <= 1) return; setLabBlocks(prev => prev.filter((_, i) => i !== idx)); };

    // Activity ops
    const openActivityEditor = () => { setActiveContentTab('activity'); setEditingLesson(null); setAddingLesson(false); setEditingQuiz(null); setEditingLab(null); setActivityForm({ title: '', activity_type: 'assignment', instructions: '', submission_required: false, due_days: null }); setActivityBlocks([]); setShowContentMenu(false); };
    const handleSaveActivity = async () => {
        setSaving(true); setErr(null);
        try {
            const payload = { stack: activeModuleId, ...activityForm, content_blocks: activityBlocks.filter(b => b.content || b.url).map(({ _id, ...rest }) => rest) };
            if (editingActivity) {
                await api.patch('/api/v1/specializations/activities/'+editingActivity.id+'/', payload);
            } else {
                await api.post('/api/v1/specializations/activities/', payload);
            }
            toast.success(editingActivity ? 'Activity updated' : 'Activity created');
            setActiveContentTab(null);
            await reloadModules();
        } catch (e) { setErr(e.response?.data?.error || 'Failed'); } finally { setSaving(false); }
    };

    // Lab ops
    const openLabEditor = () => { setActiveContentTab('lab'); setEditingLesson(null); setAddingLesson(false); setEditingQuiz(null); setEditingActivity(null); setLabForm({ title: '', description: '', instructions: '', setup_guide: '', expected_output: '', links: [] }); setLabBlocks([]); setShowContentMenu(false); };
    const handleSaveLab = async () => {
        setSaving(true); setErr(null);
        try {
            const payload = { stack: activeModuleId, ...labForm, content_blocks: labBlocks.filter(b => b.content || b.url).map(({ _id, ...rest }) => rest) };
            if (editingLab) {
                await api.patch('/api/v1/specializations/labs/'+editingLab.id+'/', payload);
            } else {
                await api.post('/api/v1/specializations/labs/', payload);
            }
            toast.success(editingLab ? 'Lab updated' : 'Lab created');
            setActiveContentTab(null);
            await reloadModules();
        } catch (e) { setErr(e.response?.data?.error || 'Failed'); } finally { setSaving(false); }
    };
    const addLabLink = () => { setLabForm(prev => ({ ...prev, links: [...prev.links, { label: '', url: '' }] })); };
    const updateLabLink = (idx, field, value) => { setLabForm(prev => ({ ...prev, links: prev.links.map((l, i) => i === idx ? { ...l, [field]: value } : l) })); };
    const removeLabLink = (idx) => { setLabForm(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== idx) })); };

    // Content tab routing
    const handleOpenLesson = () => { setActiveContentTab('lesson'); setAddingLesson(true); setLessonForm(emptyLesson); setEditingLesson(null); setBlocks([{ ...emptyBlock, _id: 'b0' }]); setShowContentMenu(false); updateUrlParams({ lesson: null, tab: 'lesson' }); };

    const handleEditQuiz = async (quiz) => {
        setEditingQuiz(quiz);
        setQuizForm({ title: quiz.title, description: quiz.description, passing_score: quiz.passing_score, max_attempts: quiz.max_attempts, time_limit_minutes: quiz.time_limit_minutes, display_mode: quiz.display_mode, timer_mode: quiz.timer_mode, time_per_question: quiz.time_per_question, allow_back_navigation: quiz.allow_back_navigation, show_results_immediately: quiz.show_results_immediately, pass_mark_to_continue: quiz.pass_mark_to_continue });
        try {
            const r = await api.get('/api/v1/specializations/quiz-questions/', { params: { quiz_id: quiz.id } });
            setQuizQuestions(r.data.map((q, i) => ({ ...q, order: i })));
        } catch (e) {
            setQuizQuestions([]);
        }
        setActiveContentTab('quiz');
        setEditingLesson(null);
        setAddingLesson(false);
        setEditingActivity(null);
        setEditingLab(null);
        setShowContentMenu(false);
    };

    const handleEditActivity = async (activity) => {
        setEditingActivity(activity);
        setActivityForm({ title: activity.title, activity_type: activity.activity_type, instructions: activity.instructions, submission_required: activity.submission_required, due_days: activity.due_days });
        setActivityBlocks((activity.content_blocks || []).map(b => ({ ...b, _id: b.id || 'ab' + Date.now() + Math.random() })));
        setActiveContentTab('activity');
        setEditingLesson(null);
        setAddingLesson(false);
        setEditingQuiz(null);
        setEditingLab(null);
        setShowContentMenu(false);
    };

    const handleEditLab = async (lab) => {
        setEditingLab(lab);
        setLabForm({ title: lab.title, description: lab.description, instructions: lab.instructions, setup_guide: lab.setup_guide, expected_output: lab.expected_output, links: lab.links || [] });
        setLabBlocks((lab.content_blocks || []).map(b => ({ ...b, _id: b.id || 'lb' + Date.now() + Math.random() })));
        setActiveContentTab('lab');
        setEditingLesson(null);
        setAddingLesson(false);
        setEditingQuiz(null);
        setEditingActivity(null);
        setShowContentMenu(false);
    };

    if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-secondary/20 border-t-primary-600 animate-spin" /></div>;
    if (!spec) return <div className="text-center py-20"><h2 className="text-xl font-bold">Not found</h2></div>;

    const renderBlockPreview = (b, bc) => {
        const txtColor = b.background_color && b.background_color !== '#ffffff' ? getContrastColor(b.background_color) : null;
        const style = txtColor ? { backgroundColor: b.background_color, color: txtColor } : {};
        return (
        <div className={`p-3 rounded-lg border ${bc.border} ${bc.bg}`} style={style}>
            <div className="flex items-center gap-2 mb-1"><bc.icon size={14} className={bc.text} /><span className={`text-xs font-medium ${bc.text}`}>{bc.label}{b.caption ? `: ${b.caption}` : ''}</span></div>
            {b.block_type === 'text' && <div className="text-xs prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: b.content }} />}
            {b.block_type === 'video' && <p className="text-xs text-secondary truncate">{b.url || 'No URL'}</p>}
            {b.block_type === 'code' && b.content && <pre className="rounded-lg overflow-hidden"><code className="text-xs" dangerouslySetInnerHTML={{ __html: hljs.highlight(b.content, { language: b.code_language || 'plaintext' }).value }} /></pre>}
            {b.block_type === 'audio' && <p className="text-xs text-secondary truncate">{b.url || 'No URL'}</p>}
            {b.block_type === 'image' && <p className="text-xs text-secondary truncate">{b.url || 'No URL'}</p>}
            {b.block_type === 'file' && <p className="text-xs text-secondary truncate">{b.url || 'No URL'}</p>}
        </div>
    );
    };

    const renderLessonRow = (lesson, i) => {
        const ct = BLOCK_TYPES.find(c => c.value === lesson.content_type) || BLOCK_TYPES[0];
        return (
            <div key={lesson.id} draggable onDragStart={() => handleLessonDrag(i)} onDragOver={(e) => handleLessonOver(e, i)} onDragEnd={handleLessonEnd} onDrop={() => handleLessonDrop(i)}
                className={`flex items-center gap-2 p-2 sm:p-3 bg-elevated border rounded-lg cursor-pointer transition-all hover:border-primary/30 ${ldragIdx === i ? 'opacity-50 border-primary/50' : ldragOver === i ? 'border-primary bg-primary/5' : 'border-theme'}`}
                onClick={() => openEditLesson(lesson)}>
                <GripVertical size={14} className="text-secondary shrink-0 cursor-grab" onClick={e => e.stopPropagation()} />
                <span className="text-[10px] font-bold text-secondary w-4 text-center shrink-0">{i+1}</span>
                <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${ct.bg}`}><ct.icon size={12} className={ct.text} /></div>
                <div className="flex-1 min-w-0"><p className="text-xs font-medium text-primary truncate">{lesson.title}</p><p className="text-[10px] text-secondary">{ct.label} · <Clock size={10} className="inline" /> {lesson.duration_minutes}min</p></div>
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {lesson.is_preview && <Eye size={10} className="text-emerald-500" />}{lesson.is_locked && <Lock size={10} className="text-amber-500" />}
                    <button onClick={() => handleDeleteLesson(lesson.id)} className="p-1 rounded hover:bg-red-50 text-secondary hover:text-red-500"><Trash2 size={12} /></button>
                </div>
            </div>
        );
    };

    const renderBlockEditor = (b, idx) => {
        const bc = BLOCK_TYPES.find(c => c.value === b.block_type) || BLOCK_TYPES[0];
        const isDragging = bdragIdx === idx;
        const isOver = bdragOver === idx;
        return (
            <div key={b._id || idx} id={'block-' + (b._id || idx)} draggable onDragStart={() => handleBlockDrag(idx)} onDragOver={(e) => handleBlockOver(e, idx)} onDragEnd={handleBlockEnd} onDrop={() => handleBlockDrop(idx)}
                className={`bg-elevated border-2 rounded-xl transition-all ${isDragging ? 'opacity-50 border-primary/50' : isOver ? 'border-primary bg-primary/5' : 'border-theme'}`}>
                <div className="flex items-center gap-2 px-3 py-2 border-b border-theme bg-secondary/5 rounded-t-xl">
                    <GripVertical size={14} className="text-tertiary shrink-0 cursor-grab" />
                    <span className="text-[10px] font-bold text-secondary w-4">{idx + 1}</span>
                    <input type="color" value={b.background_color || '#ffffff'} onChange={e => updateBlock(idx, 'background_color', e.target.value)}
                        className="w-5 h-5 rounded border border-theme cursor-pointer p-0.5 shrink-0" title="Block background color" />
                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${bc.bg}`}><bc.icon size={12} className={bc.text} /></div>
                    <div className="flex gap-0.5">
                        {BLOCK_TYPES.map(bt => {
                            const isActive = b.block_type === bt.value;
                            return (
                                <button key={bt.value} onClick={() => updateBlock(idx, 'block_type', bt.value)}
                                    className={`w-6 h-6 rounded flex items-center justify-center transition-all ${isActive ? `${bt.bg} ring-1 ring-inset ${bt.text}` : 'text-tertiary hover:text-secondary hover:bg-secondary/10'}`}
                                    title={bt.label}>
                                    <bt.icon size={11} />
                                </button>
                            );
                        })}
                    </div>
                    <input type="text" value={b.caption || ''} onChange={e => updateBlock(idx, 'caption', e.target.value)}
                        className="flex-1 text-xs bg-transparent border border-theme rounded px-2 py-0.5 text-secondary" placeholder="Optional caption..." />
                    {blocks.length > 1 && <button onClick={() => removeBlock(idx)} className="p-1 rounded hover:bg-red-50 text-secondary hover:text-red-500"><Trash2 size={12} /></button>}
                </div>
                <div className="p-3">
                    {b.block_type === 'text' && (
                        <TextBlockEditor content={b.content} onChange={(html) => updateBlock(idx, 'content', html)} />
                    )}
                    {b.block_type === 'video' && (
                        <div className="space-y-2"><input type="url" value={b.url || ''} onChange={e => updateBlock(idx, 'url', e.target.value)} className="w-full rounded-lg border border-theme bg-background px-3 py-2 text-sm" placeholder="Video URL or upload below" />
                        {b.url && <p className="text-[10px] text-emerald-600 truncate">📁 {b.url.split('/').pop()}</p>}
                        {b.url && !uploadProgress[idx] && (
                            <div className="flex gap-2 flex-wrap">
                                <button type="button" onClick={() => window.open(b.url, '_blank')} className="text-[10px] text-primary-600 hover:underline flex items-center gap-1"><Play size={12} />Preview</button>
                                {b.url.match(/\.(mp4|webm|mov|ogg)$/i) && <video src={b.url} controls className="w-full max-h-24 rounded mt-1 bg-black" preload="metadata" />}
                            </div>
                        )}
                        {uploadProgress[idx] != null && uploadProgress[idx] >= 0 && <div className="h-1.5 bg-secondary/20 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 animate-pulse rounded-full transition-all duration-300" style={{ width: uploadProgress[idx] + '%' }} /></div>}
                        {uploadProgress[idx] === -1 && <p className="text-[10px] text-red-500">Upload failed</p>}
                        <div className="flex items-center gap-2"><span className="text-[10px] text-tertiary">or</span><label className="text-[10px] text-primary-600 cursor-pointer hover:underline"><Upload size={12} className="inline mr-1" />Upload file<input type="file" accept="video/*" className="hidden" onChange={e => { const file = e.target.files[0]; if (!file) return; handleFileUpload(idx, file, 'video'); }} /></label></div></div>
                    )}
                    {b.block_type === 'audio' && (
                        <div className="space-y-2"><input type="url" value={b.url || ''} onChange={e => updateBlock(idx, 'url', e.target.value)} className="w-full rounded-lg border border-theme bg-background px-3 py-2 text-sm" placeholder="Audio URL or upload below" />
                        {b.url && <p className="text-[10px] text-emerald-600 truncate">📁 {b.url.split('/').pop()}</p>}
                        {b.url && !uploadProgress[idx] && <button type="button" onClick={() => window.open(b.url, '_blank')} className="text-[10px] text-primary-600 hover:underline flex items-center gap-1"><Music size={12} />Listen</button>}
                        {uploadProgress[idx] != null && uploadProgress[idx] >= 0 && <div className="h-1.5 bg-secondary/20 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 animate-pulse rounded-full transition-all duration-300" style={{ width: uploadProgress[idx] + '%' }} /></div>}
                        {uploadProgress[idx] === -1 && <p className="text-[10px] text-red-500">Upload failed</p>}
                        <div className="flex items-center gap-2"><span className="text-[10px] text-tertiary">or</span><label className="text-[10px] text-primary-600 cursor-pointer hover:underline"><Upload size={12} className="inline mr-1" />Upload file<input type="file" accept="audio/*" className="hidden" onChange={e => { const file = e.target.files[0]; if (!file) return; handleFileUpload(idx, file, 'audio'); }} /></label></div></div>
                    )}
                    {b.block_type === 'image' && (
                        <div className="space-y-2"><input type="url" value={b.url || ''} onChange={e => updateBlock(idx, 'url', e.target.value)} className="w-full rounded-lg border border-theme bg-background px-3 py-2 text-sm" placeholder="Image URL or upload below" />
                        {b.url && <p className="text-[10px] text-emerald-600 truncate">📁 {b.url.split('/').pop()}</p>}
                        {b.url && !uploadProgress[idx] && <button type="button" onClick={() => window.open(b.url, '_blank')} className="text-[10px] text-primary-600 hover:underline flex items-center gap-1"><Image size={12} />View</button>}
                        {uploadProgress[idx] != null && uploadProgress[idx] >= 0 && <div className="h-1.5 bg-secondary/20 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 animate-pulse rounded-full transition-all duration-300" style={{ width: uploadProgress[idx] + '%' }} /></div>}
                        {uploadProgress[idx] === -1 && <p className="text-[10px] text-red-500">Upload failed</p>}
                        <div className="flex items-center gap-2"><span className="text-[10px] text-tertiary">or</span><label className="text-[10px] text-primary-600 cursor-pointer hover:underline"><Upload size={12} className="inline mr-1" />Upload file<input type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files[0]; if (!file) return; handleFileUpload(idx, file, 'image'); }} /></label></div></div>
                    )}
                    {b.block_type === 'file' && (
                        <div className="space-y-2"><input type="url" value={b.url || ''} onChange={e => updateBlock(idx, 'url', e.target.value)} className="w-full rounded-lg border border-theme bg-background px-3 py-2 text-sm" placeholder="File URL or upload below" />
                        {b.url && <p className="text-[10px] text-emerald-600 truncate">📁 {b.url.split('/').pop()}</p>}
                        {b.url && !uploadProgress[idx] && <button type="button" onClick={() => window.open(b.url, '_blank')} className="text-[10px] text-primary-600 hover:underline flex items-center gap-1"><Link2 size={12} />View File</button>}
                        {uploadProgress[idx] != null && uploadProgress[idx] >= 0 && <div className="h-1.5 bg-secondary/20 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 animate-pulse rounded-full transition-all duration-300" style={{ width: uploadProgress[idx] + '%' }} /></div>}
                        {uploadProgress[idx] === -1 && <p className="text-[10px] text-red-500">Upload failed</p>}
                        <div className="flex items-center gap-2"><span className="text-[10px] text-tertiary">or</span><label className="text-[10px] text-primary-600 cursor-pointer hover:underline"><Upload size={12} className="inline mr-1" />Upload file<input type="file" className="hidden" onChange={e => { const file = e.target.files[0]; if (!file) return; handleFileUpload(idx, file, 'file'); }} /></label></div></div>
                    )}
                    {b.block_type === 'code' && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <select value={b.code_language || 'javascript'} onChange={e => updateBlock(idx, 'code_language', e.target.value)} className="text-xs bg-background border border-theme rounded-lg px-2 py-1">
                                    <option value="javascript">JavaScript</option><option value="typescript">TypeScript</option><option value="python">Python</option><option value="html">HTML</option><option value="css">CSS</option><option value="sql">SQL</option><option value="bash">Bash</option><option value="json">JSON</option><option value="plaintext">Plain Text</option>
                                </select>
                            </div>
                            <textarea rows={8} value={b.content || ''} onChange={e => updateBlock(idx, 'content', e.target.value)}
                                className="w-full rounded-lg border border-theme bg-gray-900 text-gray-100 px-3 py-2.5 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                                style={{ tabSize: 2, whiteSpace: 'pre' }}
                                placeholder="Paste or write code here..." spellCheck={false} />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col bg-background">
            <div className="h-14 sm:h-16 bg-elevated border-b border-theme flex items-center gap-2 sm:gap-3 px-2 sm:px-4 shrink-0">
                <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary/10 text-secondary"><ArrowLeft size={18} /></button>
                <BookOpen size={18} className={`${previewMode ? 'text-amber-500' : 'text-sky-500'} shrink-0 hidden sm:block`} />
                {previewMode ? <span className="flex-1 text-sm sm:text-base font-bold text-amber-600">Preview Mode</span> :
                    <input type="text" value={meta.name} onChange={e => setMeta({...meta, name: e.target.value})} className="flex-1 bg-transparent text-sm sm:text-base font-bold text-primary outline-none min-w-0" placeholder="Learning Path Name" />
                }
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-secondary shrink-0">
                    <input type="color" value={meta.background_color || '#ffffff'} onChange={e => setMeta({...meta, background_color: e.target.value})}
                        className="w-6 h-6 rounded border border-theme cursor-pointer p-0.5" title="Course color" disabled={previewMode} />
                    <select value={meta.learning_type} onChange={e => setMeta({...meta, learning_type: e.target.value})} className="bg-background border border-theme rounded-lg px-2 py-1 text-xs" disabled={previewMode}><option value="specialization">Specialization</option><option value="course">Course</option><option value="masterclass">Masterclass</option></select>
                    <select value={meta.is_paid} onChange={e => setMeta({...meta, is_paid: e.target.value === 'true'})} className="bg-background border border-theme rounded-lg px-2 py-1 text-xs" disabled={previewMode}><option value="false">Free</option><option value="true">Paid</option></select>
                    {meta.is_paid && <input type="number" step="0.01" value={meta.price} onChange={e => setMeta({...meta, price: e.target.value})} className="w-20 bg-background border border-theme rounded-lg px-2 py-1 text-xs" placeholder="Price" disabled={previewMode} />}
                </span>
                {saveStatus === 'draft' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium hidden sm:inline">Draft</span>}
                {saveStatus === 'saved' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium hidden sm:inline">Saved</span>}
                {hasDraft && !previewMode && <Button variant="outline" size="sm" onClick={restoreDraft} className="text-[10px] h-6 text-amber-600 border-amber-300">Restore Draft</Button>}
                {!previewMode && <Button variant="outline" size="sm" onClick={saveDraft} className="text-[10px] h-6 hidden sm:flex"><Save size={12} className="mr-1" /> Draft</Button>}
                {!previewMode && <Button variant="primary" size="sm" onClick={handleSaveMeta} isLoading={saving} className="text-[10px] h-6 shrink-0"><Save size={12} className="mr-1 sm:mr-1" />Save</Button>}
                {!previewMode && <button onClick={() => setShowCourseSettings(true)} className="p-2 rounded-lg text-secondary hover:bg-secondary/10 transition-colors" title="Course Settings"><Layers size={16} /></button>}
                {!previewMode && <button onClick={() => navigate(`/provider/products/specialization/${specId}/certificate`)} className="p-2 rounded-lg text-secondary hover:bg-secondary/10 transition-colors" title="Certificate"><Award size={16} /></button>}
                <button onClick={() => setPreviewMode(!previewMode)} title={previewMode ? 'Edit mode' : 'Preview mode'} className={`p-2 rounded-lg transition-colors shrink-0 ${previewMode ? 'bg-amber-100 text-amber-700' : 'text-secondary hover:bg-secondary/10'}`}>{previewMode ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-64 sm:w-72 lg:w-80 border-r border-theme bg-elevated/50 flex flex-col shrink-0 overflow-hidden">
                    <div className="px-3 sm:px-4 py-3 border-b border-theme flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-secondary">Curriculum</span>{!previewMode && <Button variant="outline" size="sm" onClick={() => { setShowAddModule(true); setModuleForm(emptyModule); }} className="text-[10px] sm:text-xs h-7"><Plus size={12} className="mr-1" /> Module</Button>}</div>
                    {showAddModule && !previewMode && (
                        <div className="p-3 border-b border-theme bg-background space-y-2">
                            <form onSubmit={handleAddModule} className="space-y-2">{err && <p className="text-[10px] text-red-500">{err}</p>}
                                <input type="text" required value={moduleForm.name} onChange={e => setModuleForm({...moduleForm, name: e.target.value})} className="w-full rounded-lg border border-theme bg-background px-2 py-1.5 text-xs" placeholder="Module name" autoFocus />
                                <textarea rows={2} value={moduleForm.description} onChange={e => setModuleForm({...moduleForm, description: e.target.value})} className="w-full rounded-lg border border-theme bg-background px-2 py-1.5 text-xs" placeholder="Description" />
                                <div className="flex gap-2"><Button variant="primary" size="sm" type="submit" isLoading={saving} className="text-[10px] h-6">Create</Button><Button variant="outline" size="sm" type="button" onClick={() => { setShowAddModule(false); setErr(null); }} className="text-[10px] h-6">Cancel</Button></div>
                            </form>
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
                        {modules.length === 0 ? (<p className="text-xs text-secondary text-center py-8">No modules yet.</p>) : modules.map((mod, i) => {
                            const isActive = mod.id === activeModuleId; const isExpanded = expandedModules.has(mod.id); const lc = mod.lessons?.length || 0;
                            return (<div key={mod.id}>
                                <div draggable={!previewMode} onDragStart={() => handleModuleDrag(i)} onDragOver={(e) => handleModuleOver(e, i)} onDragEnd={handleModuleEnd} onDrop={() => handleModuleDrop(i)}
                                    className={`flex items-center gap-1.5 p-2 rounded-lg border-2 cursor-pointer transition-all ${dragIdx===i?'opacity-50 border-primary/50':dragOver===i?'border-primary bg-primary/5':isActive?'border-primary/30 bg-primary/5':'border-transparent hover:border-theme hover:bg-secondary/5'}`}
                                    onClick={() => { setActiveModuleId(mod.id); setEditingLesson(null); setAddingLesson(false); }}>
                                    {!previewMode && <GripVertical size={12} className="text-tertiary shrink-0 cursor-grab" onClick={e=>e.stopPropagation()} />}
                                    <button onClick={e=>{e.stopPropagation();setExpandedModules(prev=>{const s=new Set(prev);s.has(mod.id)?s.delete(mod.id):s.add(mod.id);return s;});}} className="p-0.5 text-secondary">{isExpanded?<ChevronDown size={12}/>:<ChevronRight size={12}/>}</button>
                                    <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-[10px] font-bold">{i+1}</div>
                                    <div className="flex-1 min-w-0"><p className="text-xs font-medium text-primary truncate">{mod.name}</p><p className="text-[10px] text-tertiary">{lc} lessons</p></div>
                                    {!previewMode && <button onClick={e=>{e.stopPropagation();handleRemoveModule(mod.id);}} className="p-0.5 rounded hover:bg-red-50 text-tertiary hover:text-red-500"><Trash2 size={11}/></button>}
                                </div>
                                {isExpanded && mod.lessons?.map((l,li)=>(<div key={l.id} className="ml-6 pl-4 border-l border-theme py-0.5"><div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-secondary/5 cursor-pointer text-xs text-secondary hover:text-primary" onClick={e=>{e.stopPropagation();setActiveModuleId(mod.id);openEditLesson(l);}}><span className="text-[10px] w-4 shrink-0">{li+1}.</span><span className="truncate">{l.title}</span><span className="text-[10px] text-tertiary">{l.duration_minutes}m</span></div></div>))}
                            </div>);
                        })}
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="flex-1 flex flex-col overflow-hidden bg-background">
                    {activeModule ? (
                        <div className="flex flex-col h-full">
                            <div className="px-4 sm:px-6 py-3 border-b border-theme bg-elevated flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2 min-w-0"><Layers size={16} className="text-emerald-500 shrink-0" /><div className="min-w-0"><p className="text-sm font-bold text-primary truncate">{activeModule.name}</p><p className="text-[10px] text-secondary">{activeLessons.length} lessons</p></div></div>
                                {!previewMode && <div className="relative" ref={contentMenuRef}>
                                    <Button variant="outline" size="sm" onClick={() => setShowContentMenu(!showContentMenu)} className="text-[10px] sm:text-xs h-7"><Plus size={12} className="mr-1" /> Add</Button>
                                    {showContentMenu && (
                                        <div className="absolute right-0 top-8 z-30 bg-elevated border border-theme rounded-xl shadow-xl p-1.5 w-44">
                                            <button onClick={handleOpenLesson} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-primary hover:bg-secondary/10 transition-colors"><FileText size={14} /> Lesson</button>
                                            <button onClick={openQuizBuilder} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-primary hover:bg-secondary/10 transition-colors"><ListOrdered size={14} /> Test / Practice</button>
                                            <button onClick={openActivityEditor} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-primary hover:bg-secondary/10 transition-colors"><Play size={14} /> Activity</button>
                                            <button onClick={openLabEditor} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-primary hover:bg-secondary/10 transition-colors"><Code size={14} /> Lab</button>
                                        </div>
                                    )}
                                </div>}
                            </div>

                            {activeContentTab === 'lesson' && !previewMode ? (
                                <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <button onClick={() => { setActiveContentTab(null); cancelEdit(); }} className="p-1 rounded hover:bg-secondary/10 text-secondary"><ArrowLeft size={14} /></button>
                                        <span className="text-sm font-bold text-primary">{editingLesson ? 'Edit' : 'Add'} Lesson</span>
                                    </div>
                                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 max-w-7xl">
                                        {/* Form Column */}
                                        <div className="xl:col-span-2 space-y-4">
                                            <div className="bg-elevated border border-theme rounded-2xl p-4 sm:p-5 space-y-4">
                                                <div className="flex items-center justify-between"><h3 className="font-bold text-primary">{editingLesson ? 'Edit' : 'Add'} Lesson</h3>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" type="button" onClick={saveDraft} className="text-[10px] h-6"><Save size={12} className="mr-1" />Draft</Button>
                                                        <Button variant="primary" size="sm" type="button" onClick={() => confirmSave(editingLesson ? 'update' : 'add')} isLoading={saving} className="text-[10px] h-6"><Save size={12} className="mr-1" />{editingLesson ? 'Update' : 'Add'}</Button>
                                                    </div>
                                                </div>
                                                {err && <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg">{err}</div>}
                                                <div><label className="block text-xs font-medium text-primary mb-1">Title *</label><input type="text" required value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" /></div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><label className="block text-xs font-medium text-primary mb-1">Duration (min)</label><input type="number" value={lessonForm.duration_minutes} onChange={e => setLessonForm({...lessonForm, duration_minutes: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" /></div>
                                                    <div><label className="block text-xs font-medium text-primary mb-1">Color</label><input type="color" value={lessonForm.background_color || '#ffffff'} onChange={e => setLessonForm({...lessonForm, background_color: e.target.value})} className="w-full h-9 rounded-xl border border-theme cursor-pointer p-1" /></div>
                                                    <div className="flex items-end gap-3 pb-2">
                                                        <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={lessonForm.is_preview} onChange={e => setLessonForm({...lessonForm, is_preview: e.target.checked})} /> Preview</label>
                                                        <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={lessonForm.is_locked} onChange={e => setLessonForm({...lessonForm, is_locked: e.target.checked})} /> Locked</label>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between pt-4 border-t border-theme">
                                                    {editingLesson && <Button variant="outline" size="sm" type="button" className="text-red-600" onClick={() => handleDeleteLesson(editingLesson.id)}><Trash2 size={14} className="mr-1" /> Delete</Button>}
                                                    <div className="flex gap-2 ml-auto"><Button variant="outline" size="sm" type="button" onClick={() => { setActiveContentTab(null); cancelEdit(); }}>Cancel</Button></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Blocks Column */}
                                        <div className="xl:col-span-3 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-primary">Content Blocks</h3>
                                                <div className="relative" ref={addBlockRef}>
                                                    <Button variant="primary" size="sm" onClick={() => setShowAddBlockMenu(!showAddBlockMenu)} className="text-[10px] h-6"><Plus size={12} className="mr-1" /> Add Block</Button>
                                                    {showAddBlockMenu && (
                                                        <div className="absolute right-0 top-8 z-20 bg-elevated border border-theme rounded-xl shadow-xl p-2 w-56 grid grid-cols-3 gap-1.5">
                                                            {BLOCK_TYPES.map(bt => { const Icon = bt.icon; return (
                                                                <button key={bt.value} onClick={() => addBlock(bt.value)}
                                                                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] transition-all hover:scale-105 ${bt.bg} ${bt.text} ${bt.border}`}>
                                                                    <div className={`w-2 h-2 rounded-full ${bt.dot}`} /><Icon size={16} />{bt.label}
                                                                </button>
                                                            );})}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {blocks.map((b, idx) => renderBlockEditor(b, idx))}
                                                <div className="flex justify-center pt-1 relative" ref={bottomBlockRef}>
                                                    <Button variant="outline" size="sm" onClick={() => setShowBottomBlockMenu(!showBottomBlockMenu)} className="text-[10px] h-6"><Plus size={12} className="mr-1" /> Add Block</Button>
                                                    {showBottomBlockMenu && (
                                                        <div className="absolute bottom-8 z-20 bg-elevated border border-theme rounded-xl shadow-xl p-2 w-56 grid grid-cols-3 gap-1.5">
                                                            {BLOCK_TYPES.map(bt => { const Icon = bt.icon; return (
                                                                <button key={bt.value} onClick={() => addBlock(bt.value)}
                                                                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] transition-all hover:scale-105 ${bt.bg} ${bt.text} ${bt.border}`}>
                                                                    <div className={`w-2 h-2 rounded-full ${bt.dot}`} /><Icon size={16} />{bt.label}
                                                                </button>
                                                            );})}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Preview Column */}
                                        <div className="xl:col-span-5">
                                            <h3 className="text-sm font-bold text-primary mb-3">Learner Preview</h3>
                                            <div className="bg-elevated border border-theme rounded-2xl p-4 sm:p-5 space-y-4">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs text-secondary"><Clock size={12} className="inline mr-1" />{lessonForm.duration_minutes}min</span>
                                                    {lessonForm.is_preview && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600"><Eye size={10} className="inline mr-0.5" />Preview</span>}
                                                    {lessonForm.is_locked && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600"><Lock size={10} className="inline mr-0.5" />Locked</span>}
                                                </div>
                                                <div className="space-y-2">
                                                    {blocks.map((b, i) => { const bc = BLOCK_TYPES.find(c => c.value === b.block_type) || BLOCK_TYPES[0]; return <React.Fragment key={b._id || b.id || i}>{renderBlockPreview(b, bc)}</React.Fragment>; })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeContentTab === 'quiz' && !previewMode ? (
                                <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <button onClick={() => setActiveContentTab(null)} className="p-1 rounded hover:bg-secondary/10 text-secondary"><ArrowLeft size={14} /></button>
                                        <span className="text-sm font-bold text-primary">Test / Practice</span>
                                    </div>
                                    {err && <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg mb-4">{err}</div>}
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-5xl">
                                        {/* Settings Column */}
                                        <div className="space-y-4">
                                            <div className="bg-elevated border border-theme rounded-2xl p-4 sm:p-5 space-y-4">
                                                <h3 className="font-bold text-primary">Test Settings</h3>
                                                <div><label className="block text-xs font-medium text-primary mb-1">Title *</label><input type="text" required value={quizForm.title} onChange={e => setQuizForm({...quizForm, title: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" /></div>
                                                <div><label className="block text-xs font-medium text-primary mb-1">Description</label><textarea rows={2} value={quizForm.description} onChange={e => setQuizForm({...quizForm, description: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" /></div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div><label className="block text-xs font-medium text-primary mb-1">Pass Score (%)</label><input type="number" value={quizForm.passing_score} onChange={e => setQuizForm({...quizForm, passing_score: parseInt(e.target.value) || 70})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" /></div>
                                                    <div><label className="block text-xs font-medium text-primary mb-1">Max Attempts</label><input type="number" value={quizForm.max_attempts} onChange={e => setQuizForm({...quizForm, max_attempts: parseInt(e.target.value) || 3})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" /></div>
                                                </div>
                                            </div>
                                            <div className="bg-elevated border border-theme rounded-2xl p-4 sm:p-5 space-y-4">
                                                <h3 className="font-bold text-primary">Display & Timing</h3>
                                                <div><label className="block text-xs font-medium text-primary mb-1">Display Mode</label>
                                                    <select value={quizForm.display_mode} onChange={e => setQuizForm({...quizForm, display_mode: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm">
                                                        <option value="whole">Whole Test (all questions at once)</option>
                                                        <option value="one_by_one">One at a Time</option>
                                                    </select>
                                                </div>
                                                <div><label className="block text-xs font-medium text-primary mb-1">Timer Mode</label>
                                                    <select value={quizForm.timer_mode} onChange={e => setQuizForm({...quizForm, timer_mode: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm">
                                                        <option value="per_test">Per Test</option>
                                                        <option value="per_question">Per Question</option>
                                                    </select>
                                                    <p className="text-[10px] text-tertiary mt-1">Note: Per-question timer disables back navigation</p>
                                                </div>
                                                {quizForm.timer_mode === 'per_test' && (
                                                    <div><label className="block text-xs font-medium text-primary mb-1">Time Limit (minutes)</label><input type="number" value={quizForm.time_limit_minutes || ''} onChange={e => setQuizForm({...quizForm, time_limit_minutes: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" placeholder="No limit" /></div>
                                                )}
                                                {quizForm.timer_mode === 'per_question' && (
                                                    <div><label className="block text-xs font-medium text-primary mb-1">Time Per Question (seconds)</label><input type="number" value={quizForm.time_per_question || ''} onChange={e => setQuizForm({...quizForm, time_per_question: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" placeholder="30" /></div>
                                                )}
                                                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={quizForm.allow_back_navigation} onChange={e => setQuizForm({...quizForm, allow_back_navigation: e.target.checked})} disabled={quizForm.timer_mode === 'per_question'} /> Allow Back Navigation</label>
                                            </div>
                                            <div className="bg-elevated border border-theme rounded-2xl p-4 sm:p-5 space-y-3">
                                                <h3 className="font-bold text-primary">Behavior</h3>
                                                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={quizForm.show_results_immediately} onChange={e => setQuizForm({...quizForm, show_results_immediately: e.target.checked})} /> Show Results Immediately</label>
                                                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={quizForm.pass_mark_to_continue} onChange={e => setQuizForm({...quizForm, pass_mark_to_continue: e.target.checked})} /> Must Pass to Continue to Next</label>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="primary" size="sm" onClick={handleSaveQuiz} isLoading={saving}><Save size={12} className="mr-1" /> Save Test</Button>
                                                <Button variant="outline" size="sm" onClick={openQuizBuilder}>Cancel</Button>
                                            </div>
                                        </div>
                                        {/* Questions Column */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-primary">Questions ({quizQuestions.length})</h3>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => setShowQuizGenModal(true)} className="text-[10px] h-6"><Code size={12} className="mr-1" /> AI Generate</Button>
                                                    <Button variant="primary" size="sm" onClick={addQuizQuestion} className="text-[10px] h-6"><Plus size={12} className="mr-1" /> Add Question</Button>
                                                </div>
                                            </div>
                                            {quizQuestions.length === 0 ? (
                                                <p className="text-xs text-secondary text-center py-8">No questions yet. Add manually or use AI generation.</p>
                                            ) : quizQuestions.map((q, qIdx) => (
                                                <div key={qIdx} className="bg-elevated border border-theme rounded-xl p-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-secondary">Q{qIdx + 1}</span>
                                                        <button onClick={() => removeQuizQuestion(qIdx)} className="p-1 rounded hover:bg-red-50 text-secondary hover:text-red-500"><Trash2 size={12} /></button>
                                                    </div>
                                                    <input type="text" value={q.question_text} onChange={e => updateQuizQuestion(qIdx, 'question_text', e.target.value)} className="w-full rounded-lg border border-theme bg-background px-3 py-2 text-sm" placeholder="Question text..." />
                                                    <div className="flex gap-2">
                                                        <select value={q.question_type} onChange={e => updateQuizQuestion(qIdx, 'question_type', e.target.value)} className="text-xs bg-background border border-theme rounded-lg px-2 py-1">
                                                            <option value="multiple_choice">Multiple Choice</option>
                                                            <option value="true_false">True/False</option>
                                                            <option value="short_answer">Short Answer</option>
                                                        </select>
                                                        <input type="number" value={q.points} onChange={e => updateQuizQuestion(qIdx, 'points', parseInt(e.target.value) || 1)} className="w-16 text-xs bg-background border border-theme rounded-lg px-2 py-1" title="Points" />
                                                    </div>
                                                    {(q.question_type === 'multiple_choice' || q.question_type === 'true_false') && (
                                                        <div className="space-y-1.5">
                                                            {q.choices.map((c, cIdx) => (
                                                                <div key={cIdx} className="flex items-center gap-2">
                                                                    <input type="radio" name={`correct-${qIdx}`} checked={c.is_correct} onChange={() => { setQuizQuestions(prev => prev.map((qq, i) => i === qIdx ? { ...qq, choices: qq.choices.map((cc, j) => ({ ...cc, is_correct: j === cIdx })) } : qq)); }} className="accent-primary-600" title="Mark as correct" />
                                                                    <span className="text-xs font-bold text-secondary w-5">{c.label}.</span>
                                                                    <input type="text" value={c.text} onChange={e => updateQuizChoice(qIdx, cIdx, 'text', e.target.value)} className="flex-1 rounded border border-theme bg-background px-2 py-1 text-xs" placeholder="Answer text..." />
                                                                    {q.choices.length > 2 && <button onClick={() => removeQuizChoice(qIdx, cIdx)} className="p-0.5 text-secondary hover:text-red-500"><X size={12} /></button>}
                                                                </div>
                                                            ))}
                                                            {q.question_type === 'multiple_choice' && q.choices.length < 6 && (
                                                                <button onClick={() => addQuizChoice(qIdx)} className="text-[10px] text-primary-600 hover:underline">+ Add choice</button>
                                                            )}
                                                        </div>
                                                    )}
                                                    {q.question_type === 'short_answer' && (
                                                        <input type="text" value={q.correct_answer} onChange={e => updateQuizQuestion(qIdx, 'correct_answer', e.target.value)} className="w-full rounded-lg border border-theme bg-background px-3 py-2 text-sm" placeholder="Correct answer..." />
                                                    )}
                                                    <textarea rows={1} value={q.explanation} onChange={e => updateQuizQuestion(qIdx, 'explanation', e.target.value)} className="w-full rounded-lg border border-theme bg-background px-3 py-2 text-xs" placeholder="Explanation (shown after answering)" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : activeContentTab === 'activity' && !previewMode ? (
                                <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <button onClick={() => setActiveContentTab(null)} className="p-1 rounded hover:bg-secondary/10 text-secondary"><ArrowLeft size={14} /></button>
                                        <span className="text-sm font-bold text-primary">Activity</span>
                                    </div>
                                    {err && <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg mb-4">{err}</div>}
                                    <div className="max-w-xl space-y-4">
                                        <div className="bg-elevated border border-theme rounded-2xl p-4 sm:p-5 space-y-4">
                                            <div><label className="block text-xs font-medium text-primary mb-1">Title *</label><input type="text" required value={activityForm.title} onChange={e => setActivityForm({...activityForm, title: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" /></div>
                                            <div><label className="block text-xs font-medium text-primary mb-1">Type</label>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {[
                                                        { value: 'discussion', label: 'Discussion', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
                                                        { value: 'assignment', label: 'Assignment', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
                                                        { value: 'project', label: 'Project', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
                                                        { value: 'peer_review', label: 'Peer Review', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600', border: 'border-rose-200 dark:border-rose-800', dot: 'bg-rose-500' },
                                                        { value: 'reflection', label: 'Reflection', bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600', border: 'border-teal-200 dark:border-teal-800', dot: 'bg-teal-500' },
                                                    ].map(ac => {
                                                        const isActive = activityForm.activity_type === ac.value;
                                                        return (
                                                            <button key={ac.value} onClick={() => setActivityForm({...activityForm, activity_type: ac.value})}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${isActive ? `${ac.bg} ${ac.text} ${ac.border} ring-1 ring-inset` : 'border-theme text-secondary hover:bg-secondary/5'}`}>
                                                                <div className={`w-2 h-2 rounded-full ${ac.dot}`} />{ac.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div><label className="block text-xs font-medium text-primary mb-1">Instructions</label><textarea rows={3} value={activityForm.instructions} onChange={e => setActivityForm({...activityForm, instructions: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" placeholder="Brief instructions..." /></div>
                                            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={activityForm.submission_required} onChange={e => setActivityForm({...activityForm, submission_required: e.target.checked})} /> Submission Required</label>
                                            {activityForm.submission_required && (
                                                <div><label className="block text-xs font-medium text-primary mb-1">Due (days from enrollment)</label><input type="number" value={activityForm.due_days || ''} onChange={e => setActivityForm({...activityForm, due_days: parseInt(e.target.value) || null})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" /></div>
                                            )}
                                            {/* Activity Content Blocks */}
                                            <div className="border-t border-theme pt-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Content Blocks</h3>
                                                    <div className="relative">
                                                        <Button variant="outline" size="sm" onClick={() => { const el = document.activeElement; const types = BLOCK_TYPES.filter(t => t.value !== 'code' && t.value !== 'embed'); const pick = types[Math.floor(Math.random() * types.length)]; addActivityBlock(pick.value); }} className="text-[10px] h-6"><Plus size={12} className="mr-1" /> Add Block</Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {activityBlocks.length === 0 ? (
                                                        <p className="text-[10px] text-tertiary text-center py-3">No blocks yet. Add content blocks for richer instruction pages.</p>
                                                    ) : activityBlocks.map((b, idx) => {
                                                        const bc = BLOCK_TYPES.find(c => c.value === b.block_type) || BLOCK_TYPES[0];
                                                        return (
                                                            <div key={b._id || idx} id={'block-' + (b._id || idx)} className="bg-elevated border-2 border-theme rounded-xl p-3">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${bc.bg}`}><bc.icon size={10} className={bc.text} /></div>
                                                                    <select value={b.block_type} onChange={e => updateActivityBlock(idx, 'block_type', e.target.value)} className="text-[10px] bg-background border border-theme rounded px-1.5 py-0.5">
                                                                        {BLOCK_TYPES.filter(t => t.value !== 'code' && t.value !== 'embed').map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                                                                    </select>
                                                                    <input type="text" value={b.caption || ''} onChange={e => updateActivityBlock(idx, 'caption', e.target.value)} className="flex-1 text-[10px] bg-transparent border border-theme rounded px-1.5 py-0.5 text-secondary" placeholder="Caption..." />
                                                                    {activityBlocks.length > 1 && <button onClick={() => removeActivityBlock(idx)} className="p-0.5 text-secondary hover:text-red-500"><Trash2 size={10} /></button>}
                                                                </div>
                                                                {b.block_type === 'text' ? (
                                                                    <textarea rows={3} value={b.content || ''} onChange={e => updateActivityBlock(idx, 'content', e.target.value)} className="w-full rounded-lg border border-theme bg-background px-2 py-1.5 text-xs" placeholder="Write content..." />
                                                                ) : (
                                                                    <input type="url" value={b.url || ''} onChange={e => updateActivityBlock(idx, 'url', e.target.value)} className="w-full rounded-lg border border-theme bg-background px-2 py-1.5 text-xs" placeholder="URL..." />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <Button variant="primary" size="sm" onClick={handleSaveActivity} isLoading={saving}><Save size={12} className="mr-1" /> Save Activity</Button>
                                                <Button variant="outline" size="sm" onClick={() => setActiveContentTab(null)}>Cancel</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeContentTab === 'lab' && !previewMode ? (
                                <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <button onClick={() => setActiveContentTab(null)} className="p-1 rounded hover:bg-secondary/10 text-secondary"><ArrowLeft size={14} /></button>
                                        <span className="text-sm font-bold text-primary">Lab / Practice</span>
                                    </div>
                                    {err && <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg mb-4">{err}</div>}
                                    <div className="max-w-xl space-y-4">
                                        <div className="bg-elevated border border-theme rounded-2xl p-4 sm:p-5 space-y-4">
                                            <div><label className="block text-xs font-medium text-primary mb-1">Title *</label><input type="text" required value={labForm.title} onChange={e => setLabForm({...labForm, title: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" /></div>
                                            <div><label className="block text-xs font-medium text-primary mb-1">Description</label><textarea rows={2} value={labForm.description} onChange={e => setLabForm({...labForm, description: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" /></div>
                                            <div><label className="block text-xs font-medium text-primary mb-1">Instructions</label><textarea rows={3} value={labForm.instructions} onChange={e => setLabForm({...labForm, instructions: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" placeholder="Step-by-step lab instructions..." /></div>
                                            {/* Lab Content Blocks */}
                                            <div className="border-t border-theme pt-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Content Blocks</h3>
                                                    <Button variant="outline" size="sm" onClick={() => { const types = BLOCK_TYPES.filter(t => t.value !== 'code' && t.value !== 'embed'); addLabBlock(types[0].value); }} className="text-[10px] h-6"><Plus size={12} className="mr-1" /> Add Block</Button>
                                                </div>
                                                <div className="space-y-2">
                                                    {labBlocks.length === 0 ? (
                                                        <p className="text-[10px] text-tertiary text-center py-3">No blocks yet. Add content blocks for richer instructions.</p>
                                                    ) : labBlocks.map((b, idx) => {
                                                        const bc = BLOCK_TYPES.find(c => c.value === b.block_type) || BLOCK_TYPES[0];
                                                        return (
                                                            <div key={b._id || idx} id={'block-' + (b._id || idx)} className="bg-elevated border-2 border-theme rounded-xl p-3">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${bc.bg}`}><bc.icon size={10} className={bc.text} /></div>
                                                                    <select value={b.block_type} onChange={e => updateLabBlock(idx, 'block_type', e.target.value)} className="text-[10px] bg-background border border-theme rounded px-1.5 py-0.5">
                                                                        {BLOCK_TYPES.filter(t => t.value !== 'code' && t.value !== 'embed').map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                                                                    </select>
                                                                    <input type="text" value={b.caption || ''} onChange={e => updateLabBlock(idx, 'caption', e.target.value)} className="flex-1 text-[10px] bg-transparent border border-theme rounded px-1.5 py-0.5 text-secondary" placeholder="Caption..." />
                                                                    {labBlocks.length > 1 && <button onClick={() => removeLabBlock(idx)} className="p-0.5 text-secondary hover:text-red-500"><Trash2 size={10} /></button>}
                                                                </div>
                                                                {b.block_type === 'text' ? (
                                                                    <textarea rows={3} value={b.content || ''} onChange={e => updateLabBlock(idx, 'content', e.target.value)} className="w-full rounded-lg border border-theme bg-background px-2 py-1.5 text-xs" placeholder="Write content..." />
                                                                ) : (
                                                                    <input type="url" value={b.url || ''} onChange={e => updateLabBlock(idx, 'url', e.target.value)} className="w-full rounded-lg border border-theme bg-background px-2 py-1.5 text-xs" placeholder="URL..." />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div><label className="block text-xs font-medium text-primary mb-1">Setup Guide</label><textarea rows={2} value={labForm.setup_guide} onChange={e => setLabForm({...labForm, setup_guide: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" placeholder="Setup requirements..." /></div>
                                            <div><label className="block text-xs font-medium text-primary mb-1">Expected Output</label><textarea rows={2} value={labForm.expected_output} onChange={e => setLabForm({...labForm, expected_output: e.target.value})} className="w-full rounded-xl border border-theme bg-background px-3 py-2 text-sm" /></div>
                                            <div>
                                                <label className="block text-xs font-medium text-primary mb-1">Links / Resources</label>
                                                {labForm.links.map((link, lIdx) => (
                                                    <div key={lIdx} className="flex items-center gap-2 mb-2">
                                                        <input type="text" value={link.label} onChange={e => updateLabLink(lIdx, 'label', e.target.value)} className="flex-1 rounded-lg border border-theme bg-background px-2 py-1 text-xs" placeholder="Label" />
                                                        <input type="url" value={link.url} onChange={e => updateLabLink(lIdx, 'url', e.target.value)} className="flex-1 rounded-lg border border-theme bg-background px-2 py-1 text-xs" placeholder="URL" />
                                                        <button onClick={() => removeLabLink(lIdx)} className="p-0.5 text-secondary hover:text-red-500"><X size={12} /></button>
                                                    </div>
                                                ))}
                                                <button onClick={addLabLink} className="text-[10px] text-primary-600 hover:underline">+ Add link</button>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <Button variant="primary" size="sm" onClick={handleSaveLab} isLoading={saving}><Save size={12} className="mr-1" /> Save Lab</Button>
                                                <Button variant="outline" size="sm" onClick={() => setActiveContentTab(null)}>Cancel</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : previewMode ? (
                                <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                                    {activeLessons.length === 0 ? (<div className="text-center py-12"><Eye size={48} className="text-secondary/20 mx-auto mb-4" /><h4 className="font-bold text-primary mb-1">No Lessons</h4><p className="text-xs text-secondary">No lessons available in preview mode.</p></div>) : (
                                        <div className="space-y-4 max-w-2xl">
                                            {activeLessons.map((lesson, i) => (<div key={lesson.id} className="bg-elevated border border-theme rounded-2xl overflow-hidden">
                                                <div className="p-4 border-b border-theme flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-xs font-bold text-secondary w-6">{i+1}.</span><span className="font-bold text-primary text-sm">{lesson.title}</span></div><div className="flex items-center gap-2">{(()=>{const ct=BLOCK_TYPES.find(c=>c.value===lesson.content_type)||BLOCK_TYPES[0];return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ct.bg} ${ct.text}`}><ct.icon size={10} className="inline mr-0.5"/>{ct.label}</span>;})()}<span className="text-[10px] text-secondary"><Clock size={10} className="inline"/> {lesson.duration_minutes}min</span></div></div>
                                                <div className="p-4">{lesson.content_text && <div className="text-sm text-primary prose prose-sm max-w-none" dangerouslySetInnerHTML={{__html:lesson.content_text}}/>}{!lesson.content_text && <p className="text-sm text-secondary">{lesson.description || 'No content'}</p>}</div>
                                            </div>))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                                    {activeLessons.length === 0 && !activeModule?.quizzes?.length && !activeModule?.activities?.length && !activeModule?.labs?.length ? (<div className="text-center py-12"><Layers size={48} className="text-secondary/20 mx-auto mb-4" /><h4 className="font-bold text-primary mb-1">No Content Yet</h4><p className="text-xs text-secondary mb-6">Add content to this module</p><div className="flex justify-center gap-2 flex-wrap"><Button variant="primary" size="sm" onClick={handleOpenLesson}><FileText size={14} className="mr-1.5" /> Add First Lesson</Button><Button variant="outline" size="sm" onClick={openQuizBuilder}><ListOrdered size={14} className="mr-1.5" /> Add Test</Button></div></div>) : (
                                        <div className="space-y-1.5 max-w-2xl">
                                            <div className="flex items-center gap-2 mb-2"><h4 className="text-xs font-bold text-secondary uppercase tracking-wider">Lessons</h4><span className="text-[10px] text-tertiary">{activeLessons.length}</span></div>
                                            {activeLessons.map((l, i) => renderLessonRow(l, i))}
                                            {activeModule?.quizzes?.length > 0 && (
                                                <>
                                                    <div className="flex items-center gap-2 mt-4 mb-2"><h4 className="text-xs font-bold text-secondary uppercase tracking-wider">Tests</h4><span className="text-[10px] text-tertiary">{activeModule.quizzes.length}</span></div>
                                                    {activeModule.quizzes.map(quiz => (
                                                        <div key={quiz.id} className="flex items-center gap-2 p-2 sm:p-3 bg-elevated border border-theme rounded-lg cursor-pointer transition-all hover:border-primary/30" onClick={() => handleEditQuiz(quiz)}>
                                                            <ListOrdered size={14} className="text-amber-500 shrink-0" />
                                                            <div className="flex-1 min-w-0"><p className="text-xs font-medium text-primary truncate">{quiz.title}</p><p className="text-[10px] text-secondary">{quiz.question_count || 0} questions · Pass: {quiz.passing_score}%</p></div>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                            {activeModule?.activities?.length > 0 && (
                                                <>
                                                    <div className="flex items-center gap-2 mt-4 mb-2"><h4 className="text-xs font-bold text-secondary uppercase tracking-wider">Activities</h4><span className="text-[10px] text-tertiary">{activeModule.activities.length}</span></div>
                                                    {activeModule.activities.map(activity => (
                                                        <div key={activity.id} className="flex items-center gap-2 p-2 sm:p-3 bg-elevated border border-theme rounded-lg cursor-pointer transition-all hover:border-primary/30" onClick={() => handleEditActivity(activity)}>
                                                            <Play size={14} className="text-emerald-500 shrink-0" />
                                                            <div className="flex-1 min-w-0"><p className="text-xs font-medium text-primary truncate">{activity.title}</p><p className="text-[10px] text-secondary capitalize">{activity.activity_type}</p></div>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                            {activeModule?.labs?.length > 0 && (
                                                <>
                                                    <div className="flex items-center gap-2 mt-4 mb-2"><h4 className="text-xs font-bold text-secondary uppercase tracking-wider">Labs</h4><span className="text-[10px] text-tertiary">{activeModule.labs.length}</span></div>
                                                    {activeModule.labs.map(lab => (
                                                        <div key={lab.id} className="flex items-center gap-2 p-2 sm:p-3 bg-elevated border border-theme rounded-lg cursor-pointer transition-all hover:border-primary/30" onClick={() => handleEditLab(lab)}>
                                                            <Code size={14} className="text-indigo-500 shrink-0" />
                                                            <div className="flex-1 min-w-0"><p className="text-xs font-medium text-primary truncate">{lab.title}</p><p className="text-[10px] text-secondary">Lab / Practice</p></div>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-secondary text-sm">Select a module from the curriculum tree to manage its lessons</div>
                    )}
                </div>
            </div>

            {showVersionDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-5 border-b border-theme"><h3 className="font-bold text-primary">Save Changes</h3><p className="text-sm text-secondary mt-1">"{showVersionDialog.title}" may be active for enrolled learners.</p></div>
                        <div className="p-5 space-y-3">
                            <button onClick={() => handleVersionConfirm('immediately')} className="w-full p-3 rounded-xl border-2 border-theme hover:border-primary/50 text-left"><p className="text-sm font-bold text-primary"><Send size={14} className="inline mr-1" /> Apply Immediately</p><p className="text-xs text-secondary mt-0.5">Changes go live now. Learner progress may be affected.</p></button>
                            <button onClick={() => handleVersionConfirm('after')} className="w-full p-3 rounded-xl border-2 border-theme hover:border-primary/50 text-left"><p className="text-sm font-bold text-primary"><Clock size={14} className="inline mr-1" /> After Current Learners Finish</p><p className="text-xs text-secondary mt-0.5">New learners see updated version.</p></button>
                            <div className="flex justify-end gap-2 pt-4 border-t border-theme"><Button variant="outline" size="sm" type="button" onClick={() => setShowVersionDialog(null)}>Cancel</Button></div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Quiz Generation Modal */}
            {showQuizGenModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-primary">Generate Questions with AI</h3>
                        <p className="text-xs text-secondary">AI will generate questions based on lesson content, uploaded files, and reference links from this module.</p>

                        {/* File upload */}
                        <div>
                            <label className="block text-xs font-medium text-primary mb-1">Upload Reference Files (PDF, DOCX, TXT, MD)</label>
                            <label className="flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-theme cursor-pointer hover:border-primary/50 text-xs text-secondary hover:text-primary transition-colors">
                                <Upload size={16} />
                                {genFiles.length ? `${genFiles.length} file(s) selected` : 'Click to upload'}
                                <input type="file" multiple accept=".pdf,.docx,.txt,.md" className="hidden" onChange={e => setGenFiles(Array.from(e.target.files || []))} />
                            </label>
                            {genFiles.length > 0 && (
                                <div className="mt-1 space-y-1">
                                    {genFiles.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between text-[10px] text-secondary bg-secondary/5 rounded px-2 py-1">
                                            <span className="truncate">{f.name}</span>
                                            <button onClick={() => setGenFiles(prev => prev.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700"><X size={10} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Reference links */}
                        <div>
                            <label className="block text-xs font-medium text-primary mb-1">Reference Links</label>
                            {genLinks.map((link, i) => (
                                <div key={i} className="flex items-center gap-2 mb-1.5">
                                    <input type="text" value={link.label} onChange={e => setGenLinks(prev => prev.map((l, j) => j === i ? { ...l, label: e.target.value } : l))} className="flex-1 rounded-lg border border-theme bg-background px-2 py-1 text-xs" placeholder="Label" />
                                    <input type="url" value={link.url} onChange={e => setGenLinks(prev => prev.map((l, j) => j === i ? { ...l, url: e.target.value } : l))} className="flex-[2] rounded-lg border border-theme bg-background px-2 py-1 text-xs" placeholder="https://..." />
                                    <button onClick={() => setGenLinks(prev => prev.filter((_, j) => j !== i))} className="p-0.5 text-secondary hover:text-red-500"><X size={12} /></button>
                                </div>
                            ))}
                            <button onClick={() => setGenLinks(prev => [...prev, { label: '', url: '' }])} className="text-[10px] text-primary-600 hover:underline">+ Add link</button>
                        </div>

                        {/* Transcript toggle */}
                        <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked={includeTranscripts} onChange={e => setIncludeTranscripts(e.target.checked)} className="accent-primary-600" />
                            Include video transcripts (YouTube & internet videos)
                        </label>

                        <div className="flex gap-2 pt-2">
                            <Button variant="primary" size="sm" onClick={handleGenerateQuizFromContent} isLoading={quizGenLoading}><Code size={12} className="mr-1" /> Generate</Button>
                            <Button variant="outline" size="sm" onClick={() => { setShowQuizGenModal(false); setGenFiles([]); setGenLinks([]); }}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Course Settings Modal */}
            {showCourseSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-elevated border border-theme rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-5 border-b border-theme"><h3 className="font-bold text-primary">Course Settings</h3></div>
                        <div className="p-5 space-y-4">
                            <label className="flex items-center justify-between text-sm">
                                <span className="text-primary">Lock for unenrolled students</span>
                                <input type="checkbox" checked={courseSettings.lock_for_unenrolled} onChange={e => setCourseSettings({...courseSettings, lock_for_unenrolled: e.target.checked})} className="accent-primary-600" />
                            </label>
                            <label className="flex items-center justify-between text-sm">
                                <span className="text-primary">Sequential progression (must complete lesson to unlock next)</span>
                                <input type="checkbox" checked={courseSettings.sequential_locking} onChange={e => setCourseSettings({...courseSettings, sequential_locking: e.target.checked})} className="accent-primary-600" />
                            </label>
                            <label className="flex items-center justify-between text-sm">
                                <span className="text-primary">Disable skipping lessons</span>
                                <input type="checkbox" checked={courseSettings.skip_disabled} onChange={e => setCourseSettings({...courseSettings, skip_disabled: e.target.checked})} className="accent-primary-600" />
                            </label>
                            <div className="pt-4 border-t border-theme flex justify-end gap-2">
                                <Button variant="primary" size="sm" onClick={handleSaveCourseSettings} isLoading={saving}>Save Settings</Button>
                                <Button variant="outline" size="sm" onClick={() => setShowCourseSettings(false)}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderSpecializationEditor;
