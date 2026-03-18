import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    User, Save, Plus, X,
    Briefcase, GraduationCap,
    Link2, CheckCircle2, ChevronDown
} from 'lucide-react';

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
    const { user, profile, updateProfile } = useAuth();

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
        linkedinUrl:             profile?.linkedinUrl             || '',
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

    const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'CSBS'];

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
                        <div className="pp-tab">
                            {user?.role === 'alumni' ? 'Alumni Info' : 'Student Info'}
                        </div>
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

                            <div className="pp-field">
                                <label className="pp-label">Branch</label>
                                <div className="pp-select-wrap">
                                    <select className="pp-input pp-select" value={form.branch}
                                        onChange={e => set('branch', e.target.value)}>
                                        <option value="">Select branch</option>
                                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="pp-chevron" />
                                </div>
                            </div>

                            <div className="pp-field pp-full">
                                <label className="pp-label">Bio</label>
                                <textarea className="pp-textarea" rows={3} value={form.bio}
                                    placeholder="Tell others a bit about yourself…"
                                    onChange={e => set('bio', e.target.value)} />
                            </div>

                        </div>
                    </div>

                    <div className="pp-divider" />

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
                                    <div className="pp-select-wrap">
                                        <select className="pp-input pp-select" value={form.year}
                                            onChange={e => set('year', e.target.value)}>
                                            <option value="">Select year</option>
                                            {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="pp-chevron" />
                                    </div>
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
                                <div className="pp-field">
                                    <label className="pp-label">LinkedIn URL</label>
                                    <div className="pp-input-icon-wrap">
                                        <span className="pp-input-icon"><Link2 size={14} /></span>
                                        <input className="pp-input" value={form.linkedinUrl}
                                            placeholder="linkedin.com/in/yourname"
                                            onChange={e => set('linkedinUrl', e.target.value)} />
                                    </div>
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
        </div>
    );
}
