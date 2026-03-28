import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Briefcase, GraduationCap, FileText,  GraduationCap as GradIcon, Users, Edit3, Image as ImageIcon, Camera, Trash2, X, Upload, Save, CheckCircle2, Plus } from 'lucide-react';
import CustomSelect from '../components/ui/CustomSelect';
import api, { API_URL } from '../utils/api';

/* ══════════════════════════════════════════════════════
   TagInput is defined OUTSIDE ProfilePage.
   This is the critical fix — if it were defined inside,
   React would treat it as a brand-new component on every
   keystroke, unmount + remount the input, and kill the
   cursor. Defined outside = stable identity = focus works.
   ══════════════════════════════════════════════════════ */
function TagInput({ label, placeholder, values, newVal, onNewValChange, onAdd, onRemove }) {
    return (
        <div className="pp-tag-group">
            <label className="pp-label">{label}</label>

            {/* Existing tags */}
            <div className="pp-tags">
                {values?.map((tag, i) => (
                    <span key={i} className="pp-tag">
                        {tag}
                        <button
                            type="button"
                            className="pp-tag-remove"
                            onClick={() => onRemove(i)}
                            aria-label={`Remove ${tag}`}
                        >
                            <X size={10} />
                        </button>
                    </span>
                ))}
            </div>

            {/* Input row */}
            <div className="pp-tag-input-row">
                <input
                    className="pp-input"
                    value={newVal}
                    placeholder={placeholder || `Add ${label.toLowerCase()}…`}
                    onChange={e => onNewValChange(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            onAdd();
                        }
                    }}
                />
                <button
                    type="button"
                    className="pp-add-btn"
                    onClick={onAdd}
                    aria-label={`Add ${label}`}
                >
                    <Plus size={15} />
                </button>
            </div>
        </div>
    );
}

/* ── Main page ── */
export default function ProfilePage() {
    const { user, profile, updateProfile, fetchProfile } = useAuth();

    const [uploadingResume, setUploadingResume] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be less than 2MB');
            return;
        }

        if (file.type !== 'application/pdf') {
            toast.error('Only PDF files are allowed');
            return;
        }

        const formData = new FormData();
        formData.append('resume', file);

        setUploadingResume(true);
        try {
            await api.post('/profiles/resume', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Resume uploaded successfully!');
            await fetchProfile();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to upload resume');
        } finally {
            setUploadingResume(false);
            e.target.value = '';
        }
    };

    const handleDeleteResume = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Resume',
            message: 'Are you sure you want to permanently delete your uploaded resume? This cannot be undone.',
            onConfirm: async () => {
                try {
                    await api.delete('/profiles/resume');
                    toast.success('Resume deleted successfully!');
                    await fetchProfile();
                } catch (error) {
                    toast.error('Failed to delete resume');
                }
            }
        });
    };

    const blankForm = {
        name:                    profile?.name                    || '',
        phone:                   profile?.phone                   || '',
        bio:                     profile?.bio                     || '',
        branch:                  profile?.branch                  || '',
        year:                    profile?.year                    || '',
        cgpa:                    profile?.cgpa                    || '',
        company:                 profile?.company                 || '',
        role:                    profile?.role                    || '',
        department:              profile?.department              || '',
        graduationYear:          profile?.graduationYear          || '',
        placementExperience:     profile?.placementExperience     || '',
        isAvailableForMentoring: profile?.isAvailableForMentoring ?? true,
        skills:                  profile?.skills                  || [],
        targetCompanies:         profile?.targetCompanies         || [],
        careerInterests:         profile?.careerInterests         || [],
        mentorTopics:            profile?.mentorTopics            || [],
    };

    const [form, setForm]     = useState(blankForm);
    const [saving, setSaving] = useState(false);
    const [newTag, setNewTag] = useState({
        skills: '', targetCompanies: '', careerInterests: '', mentorTopics: ''
    });

    const resetForm = () => setForm(blankForm);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile(form);
            toast.success('Profile updated successfully!');
        } catch {
            toast.error('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const addTag = (field) => {
        const val = newTag[field].trim();
        if (!val) return;
        setForm(f => ({ ...f, [field]: [...f[field], val] }));
        setNewTag(t => ({ ...t, [field]: '' }));
    };

    const removeTag = (field, index) =>
        setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }));

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const initials = form.name
        ? form.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'CSD', 'CSM'];

    return (
        <div className="pp-root">
            <div className="pp-wrap">

                {/* ── Hero ── */}
                <div className="pp-hero">
                    <div className="pp-hero-inner">
                        <div className="pp-hero-left">
                            <div className="pp-avatar">{initials}</div>
                            <div>
                                <h1 className="pp-hero-name">{form.name || 'Your Name'}</h1>
                                <p className="pp-hero-sub">Update your profile and mentoring preferences</p>
                            </div>
                        </div>
                        <div className="pp-role-pill">
                            <User size={14} />
                            <span>{user?.email}</span>
                        </div>
                    </div>
                </div>

                {/* ── Card ── */}
                <div className="pp-card">

                    <div className="pp-tabs">
                        <div className="pp-tab active">Profile</div>
                        {user?.role !== 'admin' && (
                            <div className="pp-tab">
                                {user?.role === 'alumni' ? 'Alumni Info' : 'Student Info'}
                            </div>
                        )}
                    </div>

                    {/* Basic Info */}
                    <div className="pp-section">
                        <p className="pp-section-title">Basic Information</p>
                        <div className="pp-grid">

                            <div className="pp-field pp-full">
                                <label className="pp-label">Full Name</label>
                                <input className="pp-input" value={form.name}
                                    placeholder="Enter your full name"
                                    onChange={e => set('name', e.target.value)} />
                            </div>

                            <div className="pp-field">
                                <label className="pp-label">Phone Number</label>
                                <input className="pp-input" value={form.phone}
                                    placeholder="+91 XXXXX XXXXX"
                                    onChange={e => set('phone', e.target.value)} />
                            </div>

                            {user?.role !== 'admin' && (
                                <div className="pp-field">
                                    <label className="pp-label">Branch</label>
                                    <CustomSelect
                                        value={form.branch}
                                        onChange={val => set('branch', val)}
                                        placeholder="Select branch"
                                        options={branches.map(b => ({ label: b, value: b }))}
                                    />
                                </div>
                            )}

                            <div className="pp-field pp-full">
                                <label className="pp-label">Bio</label>
                                <textarea className="pp-textarea" rows={3} value={form.bio}
                                    placeholder="Tell others a bit about yourself…"
                                    onChange={e => set('bio', e.target.value)} />
                            </div>

                        </div>
                    </div>

                    <div className="pp-divider" />

                    {/* Resume / CV Section */}
                    {user?.role !== 'admin' && (
                        <>
                            <div className="pp-section">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <div>
                                        <p className="pp-section-title" style={{ marginBottom: 4 }}>Resume / CV</p>
                                        <p className="pp-role-section-sub" style={{ margin: 0 }}>Upload your latest resume (PDF, max 2MB)</p>
                                    </div>
                                </div>
                                
                                <div className="pp-grid">
                                    <div className="pp-field pp-full">
                                        {profile?.resumeUrl ? (
                                            <div style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: 16, background: 'var(--bg-subtle)', borderRadius: 'var(--radius)',
                                                border: '1px solid var(--border)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 40, height: 40, background: 'var(--danger)15', color: 'var(--danger)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)', margin: 0, marginBottom: 4 }}>
                                                            {profile.resumeOriginalName || 'resume.pdf'}
                                                        </p>
                                                        <a href={profile.resumeUrl.startsWith('data:') ? profile.resumeUrl : `${API_URL}${profile.resumeUrl}`} download={profile.resumeOriginalName || 'resume.pdf'} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                                                            View / Download Document
                                                        </a>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-ghost pp-btn-ghost" 
                                                        style={{ padding: '8px', color: 'var(--danger)', cursor: 'pointer', border: 'none', background: 'transparent' }}
                                                        onClick={handleDeleteResume}
                                                        title="Delete Resume"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <label className="pp-btn pp-btn-primary" style={{ padding: '8px 16px', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <Upload size={14} />
                                                        {uploadingResume ? 'Uploading...' : 'Replace'}
                                                        <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleResumeUpload} disabled={uploadingResume} />
                                                    </label>
                                                </div>
                                            </div>
                                        ) : (
                                            <label style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                padding: '32px 16px', border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
                                                background: 'var(--bg-subtle)', cursor: 'pointer', transition: 'all 0.2s ease', gap: 12
                                            }}>
                                                <div style={{ width: 48, height: 48, background: 'var(--bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                                    <Upload size={20} />
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <p style={{ fontWeight: 500, color: 'var(--text)', fontSize: 14, margin: '0 0 4px' }}>
                                                        {uploadingResume ? 'Uploading...' : 'Click to upload your resume'}
                                                    </p>
                                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>PDF files only, up to 2MB</p>
                                                </div>
                                                <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleResumeUpload} disabled={uploadingResume} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
        
                            <div className="pp-divider" />
                        </>
                    )}

                    {/* Student section */}
                    {user?.role === 'student' && (
                        <div className="pp-role-section">
                            <div className="pp-role-section-header">
                                <div className="pp-role-icon student"><GraduationCap size={18} /></div>
                                <div>
                                    <p className="pp-role-section-title">Student Details</p>
                                    <p className="pp-role-section-sub">Academic and career information</p>
                                </div>
                            </div>

                            <div className="pp-grid">
                                <div className="pp-field">
                                    <label className="pp-label">Current Year</label>
                                    <CustomSelect
                                        value={form.year}
                                        onChange={val => set('year', val)}
                                        placeholder="Select year"
                                        options={[1, 2, 3, 4].map(y => ({ label: `Year ${y}`, value: y }))}
                                    />
                                </div>
                                <div className="pp-field">
                                    <label className="pp-label">CGPA</label>
                                    <input type="number" step="0.01" min="0" max="10"
                                        className="pp-input" value={form.cgpa}
                                        placeholder="e.g. 8.50"
                                        onChange={e => set('cgpa', e.target.value)} />
                                </div>
                            </div>

                            <TagInput
                                label="Technical Skills"
                                placeholder="e.g. React, Python… then press Enter"
                                values={form.skills}
                                newVal={newTag.skills}
                                onNewValChange={val => setNewTag(t => ({ ...t, skills: val }))}
                                onAdd={() => addTag('skills')}
                                onRemove={i => removeTag('skills', i)}
                            />
                            <TagInput
                                label="Target Companies"
                                placeholder="e.g. Google, Amazon…"
                                values={form.targetCompanies}
                                newVal={newTag.targetCompanies}
                                onNewValChange={val => setNewTag(t => ({ ...t, targetCompanies: val }))}
                                onAdd={() => addTag('targetCompanies')}
                                onRemove={i => removeTag('targetCompanies', i)}
                            />
                            <TagInput
                                label="Career Interests"
                                placeholder="e.g. SDE, Data Science…"
                                values={form.careerInterests}
                                newVal={newTag.careerInterests}
                                onNewValChange={val => setNewTag(t => ({ ...t, careerInterests: val }))}
                                onAdd={() => addTag('careerInterests')}
                                onRemove={i => removeTag('careerInterests', i)}
                            />
                        </div>
                    )}

                    {/* Alumni section */}
                    {user?.role === 'alumni' && (
                        <div className="pp-role-section">
                            <div className="pp-role-section-header">
                                <div className="pp-role-icon alumni"><Briefcase size={18} /></div>
                                <div>
                                    <p className="pp-role-section-title">Alumni Details</p>
                                    <p className="pp-role-section-sub">Work and mentoring information</p>
                                </div>
                            </div>

                            <div className="pp-grid">
                                <div className="pp-field">
                                    <label className="pp-label">Company</label>
                                    <input className="pp-input" value={form.company}
                                        placeholder="Where do you work?"
                                        onChange={e => set('company', e.target.value)} />
                                </div>
                                <div className="pp-field">
                                    <label className="pp-label">Role / Designation</label>
                                    <input className="pp-input" value={form.role}
                                        placeholder="e.g. Software Engineer"
                                        onChange={e => set('role', e.target.value)} />
                                </div>
                                <div className="pp-field">
                                    <label className="pp-label">Graduation Year</label>
                                    <input type="number" className="pp-input" value={form.graduationYear}
                                        placeholder="e.g. 2022"
                                        onChange={e => set('graduationYear', e.target.value)} />
                                </div>
                                <div className="pp-field pp-full">
                                    <label className="pp-label">Placement Experience</label>
                                    <textarea className="pp-textarea" rows={3}
                                        value={form.placementExperience}
                                        placeholder="Share your placement journey to help students…"
                                        onChange={e => set('placementExperience', e.target.value)} />
                                </div>
                            </div>

                            <div className="pp-toggle-row">
                                <div>
                                    <p className="pp-toggle-label">Available for Mentoring</p>
                                    <p className="pp-toggle-desc">Students will be able to reach out to you for guidance</p>
                                </div>
                                <label className="pp-toggle">
                                    <input type="checkbox" checked={form.isAvailableForMentoring}
                                        onChange={e => set('isAvailableForMentoring', e.target.checked)} />
                                    <span className="pp-toggle-slider" />
                                </label>
                            </div>

                            <TagInput
                                label="Technical Skills"
                                placeholder="e.g. Java, System Design… then press Enter"
                                values={form.skills}
                                newVal={newTag.skills}
                                onNewValChange={val => setNewTag(t => ({ ...t, skills: val }))}
                                onAdd={() => addTag('skills')}
                                onRemove={i => removeTag('skills', i)}
                            />
                            <TagInput
                                label="Mentor Topics"
                                placeholder="e.g. DSA, Interview Prep…"
                                values={form.mentorTopics}
                                newVal={newTag.mentorTopics}
                                onNewValChange={val => setNewTag(t => ({ ...t, mentorTopics: val }))}
                                onAdd={() => addTag('mentorTopics')}
                                onRemove={i => removeTag('mentorTopics', i)}
                            />
                        </div>
                    )}

                    <div className="pp-divider" style={{ marginTop: 32 }} />

                    {/* Actions */}
                    <div className="pp-actions">
                        <p className="pp-save-hint">
                            <CheckCircle2 size={13} />
                            Changes are saved to your profile
                        </p>
                        <div className="pp-btn-row">
                            <button type="button" className="pp-btn pp-btn-ghost" onClick={resetForm}>
                                Reset
                            </button>
                            <button type="button" className="pp-btn pp-btn-primary"
                                onClick={handleSave} disabled={saving}>
                                {saving
                                    ? <><span className="pp-spinner" /> Saving…</>
                                    : <><Save size={15} /> Save Profile</>
                                }
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Custom Confirm Dialog Modal */}
            {confirmDialog.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1100, padding: 20
                }}>
                    <div className="card" style={{ maxWidth: 400, width: '100%', padding: 24, background: 'var(--bg)', borderRadius: 'var(--radius)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                            {confirmDialog.title}
                        </h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
                            {confirmDialog.message}
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                                className="btn btn-ghost"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirmDialog.onConfirm) await confirmDialog.onConfirm();
                                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                                }}
                                className="btn btn-primary"
                                style={{
                                    background: confirmDialog.title.includes('Delete') ? 'var(--danger)' : 'var(--primary)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer'
                                }}
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
