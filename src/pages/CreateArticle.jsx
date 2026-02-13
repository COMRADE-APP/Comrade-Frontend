import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Send, Image as ImageIcon, Bold, Italic, Link,
    List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3,
    Upload, X, FileText, Eye, EyeOff, Building2, GraduationCap, User
} from 'lucide-react';
import Button from '../components/common/Button';
import articlesService from '../services/articles.service';
import { useAuth } from '../contexts/AuthContext';

const CreateArticle = () => {
    const navigate = useNavigate();
    const { activeProfile, user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [category, setCategory] = useState('Technology');
    const [coverImage, setCoverImage] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [tags, setTags] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const contentRef = useRef(null);
    const fileInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const categories = ['Technology', 'Business', 'Wellness', 'Education', 'Science', 'Arts', 'Lifestyle'];

    // Get profile icon based on type
    const getProfileIcon = () => {
        if (activeProfile?.type === 'organisation') return Building2;
        if (activeProfile?.type === 'institution') return GraduationCap;
        return User;
    };
    const ProfileIcon = getProfileIcon();

    const handleCoverUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImage(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            setUploadedFiles(prev => [...prev, {
                file,
                name: file.name,
                type: file.type,
                preview: file.type.startsWith('image') ? URL.createObjectURL(file) : null
            }]);
        });
    };

    const removeFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const insertFormatting = (format) => {
        const textarea = contentRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);

        let formattedText = '';
        let cursorOffset = 0;

        switch (format) {
            case 'bold':
                formattedText = `**${selectedText || 'bold text'}**`;
                cursorOffset = selectedText ? 0 : -2;
                break;
            case 'italic':
                formattedText = `*${selectedText || 'italic text'}*`;
                cursorOffset = selectedText ? 0 : -1;
                break;
            case 'link':
                formattedText = `[${selectedText || 'link text'}](url)`;
                cursorOffset = -1;
                break;
            case 'h1':
                formattedText = `\n# ${selectedText || 'Heading 1'}\n`;
                break;
            case 'h2':
                formattedText = `\n## ${selectedText || 'Heading 2'}\n`;
                break;
            case 'h3':
                formattedText = `\n### ${selectedText || 'Heading 3'}\n`;
                break;
            case 'quote':
                formattedText = `\n> ${selectedText || 'Quote'}\n`;
                break;
            case 'code':
                formattedText = selectedText.includes('\n')
                    ? `\n\`\`\`\n${selectedText || 'code'}\n\`\`\`\n`
                    : `\`${selectedText || 'code'}\``;
                break;
            case 'ul':
                formattedText = `\n- ${selectedText || 'List item'}\n`;
                break;
            case 'ol':
                formattedText = `\n1. ${selectedText || 'List item'}\n`;
                break;
            default:
                formattedText = selectedText;
        }

        const newContent = content.substring(0, start) + formattedText + content.substring(end);
        setContent(newContent);

        // Focus and set cursor
        setTimeout(() => {
            textarea.focus();
            const newPosition = start + formattedText.length + cursorOffset;
            textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
    };

    const handleSave = async (publish = false) => {
        if (!title.trim()) {
            alert('Please add a title');
            return;
        }

        setSaving(true);
        try {
            const articleData = {
                title,
                content,
                excerpt: excerpt || content.substring(0, 200),
                category,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                status: publish ? 'published' : 'draft',
                cover_image: coverImage,
                attachments: uploadedFiles.map(f => f.file),
            };

            // Add entity authorship based on active profile
            if (activeProfile?.type === 'organisation') {
                articleData.organisation = activeProfile.id;
            } else if (activeProfile?.type === 'institution') {
                articleData.institution = activeProfile.id;
            }

            if (publish) {
                await articlesService.publish(articleData);
                alert('Article published successfully!');
            } else {
                await articlesService.saveDraft(articleData);
                alert('Article saved as draft!');
            }
            navigate('/articles');
        } catch (error) {
            console.error('Failed to save article:', error);
            alert('Failed to save article. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const renderMarkdown = (text) => {
        // Simple markdown to HTML conversion
        return text
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/`(.*?)`/gim, '<code class="bg-gray-100 px-1 rounded">$1</code>')
            .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">$1</blockquote>')
            .replace(/^\- (.*$)/gim, '<li class="ml-4">• $1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-primary-600 hover:underline">$1</a>')
            .replace(/\n/g, '<br/>');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-elevated border-b border-theme sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/articles')}
                            className="p-2 hover:bg-secondary/5 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-primary" />
                        </button>
                        <span className="text-sm text-secondary">
                            {content.split(/\s+/).filter(Boolean).length} words
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`p-2 rounded-lg transition-colors ${showPreview ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/5 text-secondary'}`}
                            title={showPreview ? 'Edit' : 'Preview'}
                        >
                            {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <Button
                            variant="outline"
                            onClick={() => handleSave(false)}
                            disabled={saving}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Draft
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => handleSave(true)}
                            disabled={saving || !title.trim()}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Publish
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {showPreview ? (
                    /* Preview Mode */
                    <div className="bg-elevated rounded-xl shadow-sm p-8 border border-theme">
                        {coverPreview && (
                            <img src={coverPreview} alt="" className="w-full h-64 object-cover rounded-lg mb-8" />
                        )}
                        <span className="text-sm text-primary font-medium">{category}</span>
                        <h1 className="text-4xl font-bold text-primary mt-2 mb-4">{title || 'Untitled'}</h1>
                        <p className="text-secondary mb-8">{excerpt || 'No excerpt'}</p>
                        <div
                            className="prose prose-lg max-w-none"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                        />
                    </div>
                ) : (
                    /* Editor Mode */
                    <div className="space-y-6">
                        {/* Posting as indicator - show when not personal */}
                        {activeProfile && activeProfile.type !== 'personal' && (
                            <div className="px-4 py-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center gap-3">
                                <ProfileIcon className="w-5 h-5 text-primary-600" />
                                <span className="text-primary-700 dark:text-primary-300">
                                    Writing article as <strong>{activeProfile.name}</strong>
                                </span>
                            </div>
                        )}

                        {/* Cover Image */}
                        <div className="bg-elevated rounded-xl shadow-sm overflow-hidden border border-theme">
                            {coverPreview ? (
                                <div className="relative aspect-[21/9]">
                                    <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => { setCoverImage(null); setCoverPreview(null); }}
                                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="aspect-[21/9] bg-secondary/5 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/10 transition-colors"
                                    onClick={() => coverInputRef.current?.click()}
                                >
                                    <ImageIcon className="w-12 h-12 text-tertiary mb-2" />
                                    <span className="text-secondary">Add cover image</span>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={coverInputRef}
                                onChange={handleCoverUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        {/* Title */}
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Article title..."
                            className="w-full text-4xl font-bold text-primary placeholder-secondary bg-transparent border-0 outline-none"
                        />

                        {/* Category and Tags */}
                        <div className="flex flex-wrap gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-secondary mb-1">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="react, programming, tutorial"
                                    className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Excerpt (optional)</label>
                            <textarea
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                placeholder="A brief summary of your article..."
                                rows={2}
                                className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Formatting Toolbar */}
                        <div className="bg-elevated border border-theme rounded-xl shadow-sm p-2 flex flex-wrap gap-1 sticky top-16 text-secondary">
                            <button onClick={() => insertFormatting('bold')} className="p-2 hover:bg-secondary/5 rounded" title="Bold"><Bold className="w-4 h-4" /></button>
                            <button onClick={() => insertFormatting('italic')} className="p-2 hover:bg-secondary/5 rounded" title="Italic"><Italic className="w-4 h-4" /></button>
                            <button onClick={() => insertFormatting('link')} className="p-2 hover:bg-secondary/5 rounded" title="Link"><Link className="w-4 h-4" /></button>
                            <div className="w-px h-6 bg-theme mx-1 self-center" />
                            <button onClick={() => insertFormatting('h1')} className="p-2 hover:bg-secondary/5 rounded" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
                            <button onClick={() => insertFormatting('h2')} className="p-2 hover:bg-secondary/5 rounded" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
                            <button onClick={() => insertFormatting('h3')} className="p-2 hover:bg-secondary/5 rounded" title="Heading 3"><Heading3 className="w-4 h-4" /></button>
                            <div className="w-px h-6 bg-theme mx-1 self-center" />
                            <button onClick={() => insertFormatting('quote')} className="p-2 hover:bg-secondary/5 rounded" title="Quote"><Quote className="w-4 h-4" /></button>
                            <button onClick={() => insertFormatting('code')} className="p-2 hover:bg-secondary/5 rounded" title="Code"><Code className="w-4 h-4" /></button>
                            <button onClick={() => insertFormatting('ul')} className="p-2 hover:bg-secondary/5 rounded" title="Bullet List"><List className="w-4 h-4" /></button>
                            <button onClick={() => insertFormatting('ol')} className="p-2 hover:bg-secondary/5 rounded" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
                            <div className="w-px h-6 bg-theme mx-1 self-center" />
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-secondary/5 rounded" title="Upload File"><Upload className="w-4 h-4" /></button>
                        </div>

                        {/* Content Editor */}
                        <div className="bg-elevated rounded-xl shadow-sm overflow-hidden border border-theme">
                            <textarea
                                ref={contentRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write your article here... Use Markdown for formatting."
                                className="w-full min-h-[500px] p-6 text-lg text-primary placeholder-secondary bg-elevated border-0 outline-none resize-none font-serif"
                            />
                        </div>

                        {/* File Uploads */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            multiple
                            className="hidden"
                        />

                        {uploadedFiles.length > 0 && (
                            <div className="bg-elevated rounded-xl shadow-sm p-4 border border-theme">
                                <h3 className="font-medium text-primary mb-3">Attachments</h3>
                                <div className="space-y-2">
                                    {uploadedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 bg-secondary/5 rounded-lg border border-theme">
                                            {file.preview ? (
                                                <img src={file.preview} alt="" className="w-10 h-10 object-cover rounded" />
                                            ) : (
                                                <FileText className="w-10 h-10 text-tertiary" />
                                            )}
                                            <span className="flex-1 truncate text-sm text-primary">{file.name}</span>
                                            <button onClick={() => removeFile(idx)} className="p-1 hover:bg-secondary/10 rounded text-secondary">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateArticle;
