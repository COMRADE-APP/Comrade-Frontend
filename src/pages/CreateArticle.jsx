import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Save, Send, Image as ImageIcon, Bold, Italic, Link as LinkIcon,
    List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3,
    Upload, X, FileText, Eye, EyeOff, Building2, GraduationCap, User, Video, AlignLeft, AlignCenter, AlignRight, Underline as UnderlineIcon, Paperclip, CheckCircle
} from 'lucide-react';
import Button from '../components/common/Button';
import articlesService from '../services/articles.service';
import { useAuth } from '../contexts/AuthContext';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TipTapImage from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import TiptapLink from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import toast from 'react-hot-toast';

const MenuBar = ({ editor, onMediaUpload }) => {
    if (!editor) return null;

    const addYoutubeVideo = () => {
        const url = prompt('Enter YouTube URL');
        if (url) {
            editor.commands.setYoutubeVideo({ src: url });
        }
    };

    const addLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const activeClass = 'bg-primary/20 text-primary ring-2 ring-primary/30 shadow-sm';
    const btnClass = (isActive) => `p-2 rounded-lg transition-all duration-150 ${isActive ? activeClass : 'hover:bg-secondary/10'}`;

    return (
        <div className="bg-elevated border border-theme rounded-xl shadow-sm p-3 flex flex-wrap gap-1.5 sticky top-16 z-20 text-secondary items-center">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold"><Bold className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic"><Italic className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Underline"><UnderlineIcon className="w-4 h-4" /></button>
            <div className="w-px h-6 bg-theme mx-1 self-center" />
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Heading 1"><Heading1 className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2"><Heading2 className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))} title="Heading 3"><Heading3 className="w-4 h-4" /></button>
            <div className="w-px h-6 bg-theme mx-1 self-center" />
            <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="Align Left"><AlignLeft className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="Align Center"><AlignCenter className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btnClass(editor.isActive({ textAlign: 'right' }))} title="Align Right"><AlignRight className="w-4 h-4" /></button>
            <div className="w-px h-6 bg-theme mx-1 self-center" />
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet List"><List className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Quote"><Quote className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnClass(editor.isActive('codeBlock'))} title="Code Block"><Code className="w-4 h-4" /></button>
            <div className="w-px h-6 bg-theme mx-1 self-center" />
            <button onClick={addLink} className={btnClass(editor.isActive('link'))} title="Link"><LinkIcon className="w-4 h-4" /></button>
            <button onClick={addYoutubeVideo} className="p-2 rounded-lg hover:bg-secondary/10 transition-all" title="YouTube Video"><Video className="w-4 h-4" /></button>
            <button onClick={() => onMediaUpload('image')} className="p-2 text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1 text-sm font-medium px-3 ml-2" title="Upload Image"><ImageIcon className="w-4 h-4" /> Image</button>
            <button onClick={() => onMediaUpload('file')} className="p-2 text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1 text-sm font-medium px-3" title="Upload Attachment"><Paperclip className="w-4 h-4" /> Attach File</button>
        </div>
    );
};

const CreateArticle = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { activeProfile } = useAuth();

    // Core data
    const [articleId, setArticleId] = useState(id || null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [category, setCategory] = useState('Technology');
    const [coverImage, setCoverImage] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [tags, setTags] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState('');

    // UI states
    const [showPreview, setShowPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [savedArticleId, setSavedArticleId] = useState(null);

    const coverInputRef = useRef(null);
    const mediaInputRef = useRef(null);

    const categories = ['Technology', 'Business', 'Wellness', 'Education', 'Science', 'Arts', 'Lifestyle'];

    const getProfileIcon = () => {
        if (activeProfile?.type === 'organisation') return Building2;
        if (activeProfile?.type === 'institution') return GraduationCap;
        return User;
    };
    const ProfileIcon = getProfileIcon();

    const editor = useEditor({
        extensions: [
            StarterKit,
            TipTapImage.configure({
                inline: true,
                HTMLAttributes: {
                    class: 'max-w-full rounded-lg shadow-sm my-6 block mx-auto object-cover max-h-[500px]',
                },
            }),
            Youtube.configure({
                inline: false,
                width: 840,
                height: 472.5,
                HTMLAttributes: {
                    class: 'w-full aspect-video rounded-xl my-6 shadow-md',
                },
            }),
            TiptapLink.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
            TextAlign.configure({ types: ['heading', 'paragraph', 'blockquote', 'listItem'] }),
            Underline,
            Placeholder.configure({ placeholder: 'Start writing your story here. Use the toolbar or insert media inline.' })
        ],
        content: '',
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML());
        }
    });

    useEffect(() => {
        if (id) {
            loadArticle(id);
        }
    }, [id]);

    const loadArticle = async (articleId) => {
        try {
            setLoading(true);
            const data = await articlesService.getById(articleId);
            setTitle(data.title || '');
            setCategory(data.category || 'Technology');
            setExcerpt(data.excerpt || '');
            setTags(data.tags ? data.tags.join(', ') : '');
            setIsPaid(data.is_paid || false);
            setPrice(data.price || '');
            if (data.cover_image) setCoverPreview(data.cover_image);
            if (data.content && editor) {
                editor.commands.setContent(data.content);
                setContent(data.content);
            }
            if (data.attachments) {
                setUploadedFiles(data.attachments.map(a => ({
                    id: a.id,
                    name: a.file.split('/').pop(),
                    url: a.file,
                    isRemote: true
                })));
            }
        } catch (error) {
            toast.error("Failed to load article");
        } finally {
            setLoading(false);
        }
    };

    // Make sure we have a draft before uploading inline media
    const ensureDraft = async () => {
        if (articleId) return articleId;

        try {
            const draftData = {
                title: title || 'Untitled Draft',
                content: editor?.getHTML() || '',
                status: 'draft',
                category
            };
            if (activeProfile?.type === 'organisation') draftData.organisation = activeProfile.id;
            else if (activeProfile?.type === 'institution') draftData.institution = activeProfile.id;

            const res = await articlesService.saveDraft(draftData);
            setArticleId(res.id);
            window.history.replaceState(null, '', `/articles/${res.id}/edit`);
            return res.id;
        } catch (error) {
            toast.error('Failed to create draft for attachment upload');
            throw error;
        }
    };

    // Handle Inline Media / File Attachment 
    const handleMediaUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const toastId = toast.loading('Uploading media...');
            const currentArticleId = await ensureDraft();
            const uploadRes = await articlesService.uploadAttachment(currentArticleId, file);

            // If image, insert directly into TipTap
            if (file.type.startsWith('image/')) {
                editor.chain().focus().setImage({ src: uploadRes.url }).run();
            } else {
                // If standard file, insert a link into TipTap
                const htmlLink = `<p><a href="${uploadRes.url}" download="${uploadRes.name}" class="inline-flex items-center gap-2 px-3 py-2 bg-secondary/10 rounded-lg text-primary hover:bg-secondary/20 transition-colors my-2 border border-theme no-underline font-medium">📎 Download ${uploadRes.name}</a></p>`;
                editor.chain().focus().insertContent(htmlLink).run();

                // Also add to visual attachments list
                setUploadedFiles(prev => [...prev, {
                    id: uploadRes.id,
                    name: uploadRes.name,
                    url: uploadRes.url,
                    isRemote: true
                }]);
            }
            toast.dismiss(toastId);
            toast.success("Media uploaded and inserted");
        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
            toast.dismiss();
        }

        // Reset input
        e.target.value = '';
    };

    const triggerMediaUpload = (type) => {
        if (mediaInputRef.current) {
            mediaInputRef.current.accept = type === 'image' ? 'image/*' : '*/*';
            mediaInputRef.current.click();
        }
    };

    const handleCoverUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImage(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (publish = false) => {
        if (!title.trim()) {
            toast.error('Please add a title before saving!');
            return;
        }

        setSaving(true);
        try {
            const currentHTML = editor.getHTML();
            // generate simple excerpt if empty
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = currentHTML;
            const plainText = tempDiv.textContent || tempDiv.innerText || "";
            const finalExcerpt = excerpt || plainText.substring(0, 200) + "...";

            const articleData = {
                title,
                content: currentHTML,
                excerpt: finalExcerpt,
                category,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                status: publish ? 'published' : 'draft',
                is_paid: isPaid,
                price: price ? parseFloat(price) : null
            };

            // only append object if there's a new file upload
            if (coverImage) {
                articleData.cover_image = coverImage;
            }

            if (activeProfile?.type === 'organisation') {
                articleData.organisation = activeProfile.id;
            } else if (activeProfile?.type === 'institution') {
                articleData.institution = activeProfile.id;
            }

            let savedData;
            if (articleId) {
                if (publish) {
                    savedData = await articlesService.update(articleId, articleData);
                } else {
                    savedData = await articlesService.updateDraft(articleId, articleData);
                }
            } else {
                if (publish) {
                    savedData = await articlesService.publish(articleData);
                } else {
                    savedData = await articlesService.create(articleData);
                }
            }

            setSavedArticleId(savedData?.id || articleId || savedData?.data?.id);
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Failed to save article:', error);
            toast.error('Failed to save article. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-secondary">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-elevated border-b border-theme sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/articles')}
                            className="p-2 hover:bg-secondary/10 rounded-full transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 text-secondary group-hover:text-primary transition-colors" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`p-2 rounded-full transition-colors ${showPreview ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/10 text-secondary'}`}
                            title={showPreview ? 'Edit Document' : 'Preview Document'}
                        >
                            {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Draft
                        </Button>
                        <Button variant="primary" onClick={() => handleSave(true)} disabled={saving || !title.trim()}>
                            <Send className="w-4 h-4 mr-2" />
                            Publish
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {showPreview ? (
                    /* Preview Mode */
                    <div className="bg-elevated rounded-2xl shadow-sm border border-theme p-8 md:p-12">
                        {coverPreview && (
                            <div className="relative aspect-video rounded-2xl overflow-hidden mb-8 shadow-lg">
                                <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="mb-8">
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">{category}</span>
                            <h1 className="text-4xl md:text-5xl font-bold text-primary mt-6 mb-4 leading-tight">{title || 'Untitled'}</h1>
                            <p className="text-xl text-secondary">{excerpt || 'No excerpt'}</p>
                        </div>
                        <div
                            className="prose prose-lg prose-headings:font-bold prose-headings:text-primary prose-a:text-primary prose-p:text-secondary prose-strong:text-primary prose-li:text-secondary max-w-none mb-12"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    </div>
                ) : (
                    /* Editor Mode */
                    <div className="space-y-6">
                        {/* Status Bar */}
                        {activeProfile && activeProfile.type !== 'personal' && (
                            <div className="px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                                <ProfileIcon className="w-5 h-5 text-primary" />
                                <span className="text-primary font-medium">
                                    Authoring as {activeProfile.name}
                                </span>
                            </div>
                        )}

                        {/* Cover Image Upload */}
                        <div className="bg-elevated rounded-2xl border border-theme shadow-sm overflow-hidden group">
                            {coverPreview ? (
                                <div className="relative aspect-[21/9]">
                                    <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => coverInputRef.current?.click()} className="px-4 py-2 bg-white text-black font-medium rounded-full mr-2 hover:bg-gray-100">Change Cover</button>
                                        <button onClick={() => { setCoverImage(null); setCoverPreview(null); }} className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="aspect-[21/9] bg-secondary/5 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/10 transition-colors"
                                    onClick={() => coverInputRef.current?.click()}
                                >
                                    <div className="w-16 h-16 rounded-full bg-elevated shadow-sm flex items-center justify-center mb-4 text-tertiary">
                                        <ImageIcon className="w-8 h-8" />
                                    </div>
                                    <span className="font-medium text-secondary">Add a cover image</span>
                                    <span className="text-sm text-tertiary mt-1">Recommended size: 1200 x 630 pixels</span>
                                </div>
                            )}
                            <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
                        </div>

                        {/* Title Input */}
                        <div className="bg-elevated rounded-2xl border border-theme p-6 md:p-8 shadow-sm">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Article Title"
                                className="w-full text-4xl md:text-5xl font-extrabold text-primary placeholder-secondary/50 bg-transparent border-0 outline-none leading-tight"
                            />

                            <textarea
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                placeholder="A brief summary or subtitle (optional)..."
                                rows={2}
                                className="w-full mt-4 text-xl text-secondary placeholder-tertiary bg-transparent border-0 outline-none resize-none leading-relaxed"
                            />
                        </div>

                        {/* TipTap Editor Toolbar */}
                        <MenuBar editor={editor} onMediaUpload={triggerMediaUpload} />

                        {/* Hidden Media Input for TipTap Uploads */}
                        <input type="file" ref={mediaInputRef} onChange={handleMediaUpload} className="hidden" />

                        {/* TipTap Editor Content */}
                        <div className="bg-elevated rounded-2xl shadow-sm border border-theme overflow-hidden min-h-[500px]">
                            <EditorContent editor={editor} className="prose prose-lg prose-headings:font-bold prose-headings:text-primary prose-a:text-primary prose-p:text-secondary prose-strong:text-primary prose-li:text-secondary max-w-none p-6 md:p-8 min-h-[500px] outline-none" />
                        </div>

                        {/* Configuration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-elevated rounded-2xl shadow-sm border border-theme p-6 md:p-8">
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-2">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 border border-theme bg-secondary/5 text-primary rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-2">Tags</label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="technology, innovation, future..."
                                    className="w-full px-4 py-3 border border-theme bg-secondary/5 text-primary rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                                <span className="text-xs text-tertiary mt-1 inline-block">Separate multiple tags with commas</span>
                            </div>
                        </div>

                        {/* Publication & Access */}
                        <div className="bg-elevated rounded-2xl shadow-sm border border-theme p-6 md:p-8 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-primary mb-2">Publication & Access</h3>
                                <p className="text-sm text-secondary mb-4">Define whether this article requires a paid subscription to access its full content upon publishing.</p>
                                <label className="flex items-center gap-3 cursor-pointer text-primary font-medium">
                                    <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} className="w-5 h-5 rounded border-theme text-primary focus:ring-primary" />
                                    <span>Require Paid Access</span>
                                </label>

                                {isPaid && (
                                    <div className="mt-4 pt-2 pl-8 border-l-2 border-primary/20">
                                        <label className="block text-sm font-semibold text-primary mb-2">Access Price (USD)</label>
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            placeholder="E.g., 5.00"
                                            min="0"
                                            step="0.01"
                                            className="w-full md:w-1/2 px-4 py-3 border border-theme bg-secondary/5 text-primary placeholder-tertiary rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Global Attachments Box */}
                        {(uploadedFiles.length > 0) && (
                            <div className="bg-elevated rounded-xl shadow-sm p-5 border border-theme">
                                <h3 className="font-medium text-primary mb-4 flex items-center gap-2"><Paperclip size={18} /> Uploaded Assets Checklist</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {uploadedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg border border-theme">
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="p-2 bg-primary/10 rounded">
                                                    <FileText className="w-5 h-5 text-primary" />
                                                </div>
                                                <span className="text-sm font-medium text-primary truncate max-w-[200px]" title={file.name}>{file.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-elevated border border-theme rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-primary mb-2">Success!</h2>
                        <p className="text-secondary mb-6">Your article has been {articleId ? 'updated' : 'created'} successfully.</p>
                        <Button variant="primary" className="w-full" onClick={() => navigate(`/articles`)}>
                            View Articles
                        </Button>
                    </div>
                </div>
            )}

            {/* Tiptap styles needed for layout */}
            <style>{`
                .ProseMirror {
                    min-height: 460px;
                }
                .ProseMirror:focus { outline: none; }
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #adb5bd;
                    pointer-events: none;
                    height: 0;
                }
                .ProseMirror a {
                    cursor: pointer;
                }

                /* Blockquote */
                .ProseMirror blockquote {
                    border-left: 4px solid var(--border-color, #7f56d9);
                    padding: 0.75rem 1rem;
                    margin: 1rem 0;
                    background: rgba(127, 86, 217, 0.05);
                    border-radius: 0 0.5rem 0.5rem 0;
                    color: inherit;
                    font-style: italic;
                }
                .ProseMirror blockquote p {
                    margin: 0;
                }

                /* Lists */
                .ProseMirror ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin: 0.75rem 0;
                }
                .ProseMirror ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin: 0.75rem 0;
                }
                .ProseMirror li {
                    margin: 0.25rem 0;
                }
                .ProseMirror li p {
                    margin: 0;
                }

                /* Code Block */
                .ProseMirror pre {
                    background: #1e1e2e;
                    color: #cdd6f4;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    padding: 1rem 1.25rem;
                    border-radius: 0.75rem;
                    margin: 1rem 0;
                    overflow-x: auto;
                    font-size: 0.875rem;
                    line-height: 1.7;
                    border: 1px solid rgba(127, 86, 217, 0.2);
                }
                .ProseMirror pre code {
                    background: none;
                    color: inherit;
                    padding: 0;
                    font-size: inherit;
                }
                .ProseMirror code {
                    background: rgba(127, 86, 217, 0.1);
                    color: #7f56d9;
                    padding: 0.15rem 0.4rem;
                    border-radius: 0.25rem;
                    font-size: 0.875em;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                }

                /* Text Alignment - ensure it's preserved */
                .ProseMirror [style*="text-align: center"] { text-align: center !important; }
                .ProseMirror [style*="text-align: right"] { text-align: right !important; }
                .ProseMirror [style*="text-align: left"] { text-align: left !important; }

                /* Headings */
                .ProseMirror h1 { font-size: 2rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
                .ProseMirror h2 { font-size: 1.5rem; font-weight: 700; margin: 1.25rem 0 0.5rem; }
                .ProseMirror h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }

                /* Paragraph spacing */
                .ProseMirror p {
                    margin: 0.5rem 0;
                    line-height: 1.75;
                }

                /* Horizontal rule */
                .ProseMirror hr {
                    border: none;
                    border-top: 2px solid var(--border-color, #e5e7eb);
                    margin: 1.5rem 0;
                }
            `}</style>
        </div>
    );
};

export default CreateArticle;
