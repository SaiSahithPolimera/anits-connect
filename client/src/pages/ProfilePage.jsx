import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Save, Plus, X } from 'lucide-react';

export default function ProfilePage() {
    const { user, profile, updateProfile } = useAuth();
    const [form, setForm] = useState({
        name: profile?.name || '',
        phone: profile?.phone || '',
        bio: profile?.bio || '',
        branch: profile?.branch || '',
        year: profile?.year || '',
        cgpa: profile?.cgpa || '',
        company: profile?.company || '',
        role: profile?.role || '',
        department: profile?.department || '',
        graduationYear: profile?.graduationYear || '',
        placementExperience: profile?.placementExperience || '',
        linkedinUrl: profile?.linkedinUrl || '',
        isAvailableForMentoring: profile?.isAvailableForMentoring ?? true,
        skills: profile?.skills || [],
        targetCompanies: profile?.targetCompanies || [],
        careerInterests: profile?.careerInterests || [],
        mentorTopics: profile?.mentorTopics || []
    });
    const [saving, setSaving] = useState(false);
    const [newTag, setNewTag] = useState({ skills: '', targetCompanies: '', careerInterests: '', mentorTopics: '' });

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile(form);
            toast.success('Profile updated!');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const addTag = (field) => {
        if (!newTag[field].trim()) return;
        setForm({ ...form, [field]: [...form[field], newTag[field].trim()] });
        setNewTag({ ...newTag, [field]: '' });
    };

    const removeTag = (field, index) => {
        setForm({ ...form, [field]: form[field].filter((_, i) => i !== index) });
    };

    const TagInput = ({ field, label }) => (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
                {form[field]?.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-300 text-xs rounded-full border border-indigo-500/20">
                        {tag}
                        <button onClick={() => removeTag(field, i)} className="hover:text-red-400"><X size={12} /></button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input value={newTag[field]} onChange={e => setNewTag({ ...newTag, [field]: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(field))}
                    placeholder={`Add ${label.toLowerCase()}`}
                    className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
                <button onClick={() => addTag(field)} className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30"><Plus size={16} /></button>
            </div>
        </div>
    );

    const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'CSBS'];

    return (
        <div style={{ minHeight: '100vh', background: '#f3f4f6', color: '#1f2937', paddingTop: 96, paddingBottom: 48, paddingLeft: 16, paddingRight: 16 }}>
            <div style={{ maxWidth: 840, margin: '0 auto', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)', borderRadius: 20, overflow: 'hidden', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
                <div style={{ background: 'linear-gradient(90deg, #4f46e5, #8b5cf6)', padding: 26 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}> 
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: 26, fontWeight: 700 }}>
                                {form.name?.[0] || '?'}
                            </div>
                            <div>
                                <h1 style={{ fontSize: 30, fontWeight: 800, color: '#ffffff', margin: 0 }}>Edit Profile</h1>
                                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: '6px 0 0' }}>Update your personal details and mentoring profile.</p>
                            </div>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.16)', color: '#fff', padding: '8px 14px', borderRadius: 12 }}>
                            <User size={18} /> {user?.email}
                        </div>
                    </div>
                </div>

                <div style={{ padding: 26, }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                            <select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">Select</option>
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3}
                                className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>

                    {/* Student Fields */}
                    {user?.role === 'student' && (
                        <div className="space-y-4 pt-4 border-t border-gray-800/50">
                            <h3 className="text-sm font-semibold text-gray-300">🎓 Student Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Year</label>
                                    <select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
                                        <option value="">Select</option>
                                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">CGPA</label>
                                    <input type="number" step="0.1" min="0" max="10" value={form.cgpa} onChange={e => setForm({ ...form, cgpa: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                            </div>
                            <TagInput field="skills" label="Skills" />
                            <TagInput field="targetCompanies" label="Target Companies" />
                            <TagInput field="careerInterests" label="Career Interests" />
                        </div>
                    )}

                    {/* Alumni Fields */}
                    {user?.role === 'alumni' && (
                        <div className="space-y-4 pt-4 border-t border-gray-800/50">
                            <h3 className="text-sm font-semibold text-gray-300">🏢 Alumni Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Company</label>
                                    <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Role</label>
                                    <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Graduation Year</label>
                                    <input type="number" value={form.graduationYear} onChange={e => setForm({ ...form, graduationYear: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">LinkedIn</label>
                                    <input value={form.linkedinUrl} onChange={e => setForm({ ...form, linkedinUrl: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Placement Experience</label>
                                <textarea value={form.placementExperience} onChange={e => setForm({ ...form, placementExperience: e.target.value })} rows={3}
                                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" checked={form.isAvailableForMentoring} onChange={e => setForm({ ...form, isAvailableForMentoring: e.target.checked })}
                                    className="w-4 h-4 accent-indigo-500" />
                                <span className="text-sm text-gray-300">Available for Mentoring</span>
                            </div>
                            <TagInput field="skills" label="Skills" />
                            <TagInput field="mentorTopics" label="Mentor Topics" />
                        </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-end' }}>
                        <button onClick={() => {
                            setForm({
                                name: profile?.name || '',
                                phone: profile?.phone || '',
                                bio: profile?.bio || '',
                                branch: profile?.branch || '',
                                year: profile?.year || '',
                                cgpa: profile?.cgpa || '',
                                company: profile?.company || '',
                                role: profile?.role || '',
                                department: profile?.department || '',
                                graduationYear: profile?.graduationYear || '',
                                placementExperience: profile?.placementExperience || '',
                                linkedinUrl: profile?.linkedinUrl || '',
                                isAvailableForMentoring: profile?.isAvailableForMentoring ?? true,
                                skills: profile?.skills || [],
                                targetCompanies: profile?.targetCompanies || [],
                                careerInterests: profile?.careerInterests || [],
                                mentorTopics: profile?.mentorTopics || []
                            });
                        }}
                            style={{ padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: 12, fontSize: 14, color: '#374151', background: '#fff', cursor: 'pointer' }}>
                            Reset
                        </button>

                        <button onClick={handleSave} disabled={saving}
                            style={{ padding: '10px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.65 : 1 }}>
                            {saving ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.65)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                            Save Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
