import React, { useState, useEffect } from 'react';
import { Briefcase, Building2, MapPin, Clock, ExternalLink, Calendar, Search, Users, Sparkles, Plus, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CustomSelect from '../components/ui/CustomSelect';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const mockOpenings = [
    {
        id: 1,
        title: 'Software Engineer I',
        company: 'Walmart Global Tech',
        location: 'Bengaluru, India',
        type: 'Full-time',
        experience: 'Fresher / 0-1 year',
        postedBy: { name: 'Deepa Priyanka Pentapalli', role: 'Software Engineer' },
        postedAt: '2 days ago',
        link: 'https://careers.walmart.com/technology',
        description: 'Looking for enthusiastic freshers to join our backend services team. A strong grasp of Data Structures and Algorithms in Java or C++ is required.',
        tags: ['Java', 'C++', 'Data Structures', 'Algorithms']
    },
    {
        id: 2,
        title: 'Application Development Associate',
        company: 'Accenture',
        location: 'Hyderabad / Pune',
        type: 'Full-time',
        experience: 'Fresher',
        postedBy: { name: 'Sai Deepti Itha', role: 'Application Development Associate' },
        postedAt: '3 days ago',
        link: 'https://www.accenture.com/in-en/careers',
        description: 'Hiring freshers for Application Development roles. Strong foundation in object-oriented programming and databases is essential. Open to 2024 batch graduates.',
        tags: ['Java', 'Python', 'SQL', 'Problem Solving']
    },
    {
        id: 3,
        title: 'Graduate Engineer Trainee',
        company: 'MEIL',
        location: 'Hyderabad, India',
        type: 'Full-time',
        experience: 'Fresher',
        postedBy: { name: 'Visweswara Rao Kenguva', role: 'Engineer' },
        postedAt: '1 week ago',
        link: 'https://meil.in/careers',
        description: 'Exciting opportunities for fresh engineering graduates to join our infrastructure projects. We are looking for eager, hardworking individuals to train with us.',
        tags: ['Engineering', 'Infrastructure', 'Project Management']
    },
    {
        id: 4,
        title: 'Product Engineer I',
        company: 'Darwinbox',
        location: 'Hyderabad, India',
        type: 'Full-time',
        experience: '0-1 year',
        postedBy: { name: 'Akhil Venkat Gopisetty', role: 'Product Engineer' },
        postedAt: '12 hours ago',
        link: 'https://darwinbox.com/careers',
        description: 'Join our rapidly growing HR Tech startup as a junior engineer. Great opportunity to learn full-stack development using MongoDB, Node.js, and React.',
        tags: ['MERN', 'React', 'Node.js', 'Learning']
    },
    {
        id: 5,
        title: 'Software Engineer Trainee',
        company: 'Riktam',
        location: 'Hyderabad / Remote',
        type: 'Full-time',
        experience: 'Fresher',
        postedBy: { name: 'Chandana Charitha Peddinti', role: 'Software Engineer' },
        postedAt: '5 days ago',
        link: 'https://riktamtech.com/careers/',
        description: 'Hiring freshers for an intensive training boot-camp before moving you directly into full-stack and mobile app projects.',
        tags: ['React Native', 'JavaScript', 'Mobile', 'Bootcamp']
    },
    {
        id: 6,
        title: 'Business Development Associate',
        company: 'TalentServe',
        location: 'Remote',
        type: 'Internship',
        experience: 'Fresher / Students',
        postedBy: { name: 'Naveen Kumar Karri', role: 'Associate' },
        postedAt: '4 hours ago',
        link: 'https://www.linkedin.com/company/talentserve/jobs/',
        description: 'Looking for a dynamic intern or fresh graduate to join our business development and EdTech operations team.',
        tags: ['Marketing', 'Strategy', 'EdTech']
    },
    {
        id: 7,
        title: 'Junior Reliability Engineer',
        company: 'Pinnacle Reliability',
        location: 'Chennai / Hyderabad',
        type: 'Full-time',
        experience: '0-1 year',
        postedBy: { name: 'Marothu Uma Maheswari', role: 'Reliability Engineer' },
        postedAt: '2 days ago',
        link: 'https://pinnaclereliability.com/careers/',
        description: 'Excellent entry-level opportunity to begin your career in reliability engineering. Learn to assess risk and formulate mitigation plans on the job.',
        tags: ['Mechanical', 'Data Analysis', 'Training']
    }
];

export default function OpeningsPage() {
    const { user, profile } = useAuth();
    const [openings, setOpenings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '', company: '', location: '', type: 'Full-time', experience: '', link: '', description: '', tags: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [currentEditingId, setCurrentEditingId] = useState(null);

    useEffect(() => {
        fetchOpenings();
    }, []);

    const fetchOpenings = async () => {
        try {
            const res = await api.get('/job-openings');
            setOpenings(res.data);
        } catch (error) {
            console.error('Failed to fetch openings:', error);
            toast.error('Failed to load job openings');
            // fallback to mock data if API fails to make it robust
            setOpenings(mockOpenings);
        } finally {
            setLoading(false);
        }
    };

    const filteredOpenings = openings.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
                              job.company.toLowerCase().includes(search.toLowerCase()) ||
                              job.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
        
        const matchesRole = roleFilter ? job.type === roleFilter : true;
        
        return matchesSearch && matchesRole;
    });

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        
        const jobData = {
            title: formData.title,
            company: formData.company,
            location: formData.location,
            type: formData.type,
            experience: formData.experience,
            postedBy: { 
                name: profile?.name || 'Alumni', 
                role: profile?.role ? `${profile.role}${profile.company ? ` at ${profile.company}` : ''}` : 'Alumni',
                userId: user?._id || user?.id
            },
            link: formData.link,
            description: formData.description,
            tags: formData.tags ? (typeof formData.tags === 'string' ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : formData.tags) : []
        };
        
        try {
            if (isEditing) {
                const res = await api.put(`/job-openings/${currentEditingId}`, jobData);
                setOpenings(openings.map(op => (op._id === currentEditingId || op.id === currentEditingId) ? res.data : op));
                toast.success('Job opening updated successfully!');
            } else {
                const res = await api.post('/job-openings', jobData);
                setOpenings([res.data, ...openings]);
                toast.success('Job opening posted successfully!');
            }
            closeModal();
        } catch (error) {
            console.error('Failed to save opening:', error);
            toast.error(isEditing ? 'Failed to update job opening' : 'Failed to post job opening');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this job opening?')) return;
        try {
            await api.delete(`/job-openings/${id}`);
            setOpenings(openings.filter(op => op._id !== id && op.id !== id));
            toast.success('Job opening deleted successfully!');
        } catch (error) {
            console.error('Failed to delete opening:', error);
            toast.error('Failed to delete job opening');
        }
    };

    const openEditModal = (job) => {
        setIsEditing(true);
        setCurrentEditingId(job._id || job.id);
        setFormData({
            title: job.title,
            company: job.company,
            location: job.location,
            type: job.type,
            experience: job.experience,
            link: job.link,
            description: job.description,
            tags: job.tags ? job.tags.join(', ') : ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setCurrentEditingId(null);
        setFormData({ title: '', company: '', location: '', type: 'Full-time', experience: '', link: '', description: '', tags: '' });
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef0f7' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                .op-root {
                    min-height: 100vh;
                    background: #eef0f7;
                    font-family: 'DM Sans', sans-serif;
                    color: #1a1d2e;
                    animation: mlFade 0.45s ease both;
                }
                
                /* ── Hero ── */
                .op-hero {
                    padding: 36px 0 72px;
                    background: linear-gradient(135deg, #064e3b 0%, #047857 45%, #10b981 100%);
                    position: relative;
                    overflow: hidden;
                }
                .op-hero::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
                    background-size: 28px 28px;
                    pointer-events: none;
                }
                .op-hero::after {
                    content: '';
                    position: absolute;
                    bottom: -1px; left: 0; right: 0;
                    height: 40px;
                    background: #eef0f7;
                    clip-path: ellipse(55% 100% at 50% 100%);
                }
                .op-hero-inner {
                    position: relative;
                    z-index: 1;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 0 32px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                
                .op-hero-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .op-hero-icon {
                    width: 54px; height: 54px;
                    border-radius: 14px;
                    background: rgba(255,255,255,0.14);
                    border: 2px solid rgba(255,255,255,0.25);
                    display: flex; align-items: center; justify-content: center;
                    backdrop-filter: blur(8px);
                    flex-shrink: 0;
                    color: #fff;
                }
                .op-hero-title {
                    font-family: 'Sora', sans-serif;
                    font-size: 26px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 4px;
                }
                .op-hero-sub {
                    font-size: 13px;
                    color: rgba(255,255,255,0.8);
                    margin: 0;
                }

                /* ── Content ── */
                .op-content {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 28px 32px 60px;
                }

                /* ── Search Bar ── */
                .op-search-card {
                    background: #fff;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(26,29,46,0.06);
                    border: 1px solid #eaecf4;
                    padding: 20px;
                    margin-bottom: 32px;
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                
                .op-search-wrap {
                    flex: 1;
                    min-width: 280px;
                    position: relative;
                }
                
                .op-search-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9ca3af;
                }
                
                .op-search-input {
                    width: 100%;
                    padding: 12px 14px 12px 42px;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 10px;
                    font-size: 14px;
                    color: #1a1d2e;
                    background: #fafbff;
                    font-family: 'DM Sans', sans-serif;
                    outline: none;
                    transition: all 0.2s;
                }
                .op-search-input:focus {
                    border-color: #10b981;
                    box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
                    background: #fff;
                }

                /* ── Job Cards ── */
                .op-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .op-card {
                    background: #fff;
                    border: 1.5px solid #eaecf4;
                    border-radius: 16px;
                    padding: 24px;
                    transition: all 0.2s;
                }
                .op-card:hover {
                    border-color: #a7f3d0;
                    box-shadow: 0 8px 24px rgba(16,185,129,0.08);
                    transform: translateY(-2px);
                }
                
                .op-card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin-bottom: 12px;
                }
                
                .op-title {
                    font-family: 'Sora', sans-serif;
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a1d2e;
                    margin: 0 0 6px;
                }
                
                .op-company {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #4b5563;
                }
                
                .op-meta-row {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin-bottom: 16px;
                    font-size: 13px;
                    color: #6b7280;
                }
                .op-meta-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .op-desc {
                    font-size: 14px;
                    line-height: 1.5;
                    color: #4b5563;
                    margin-bottom: 16px;
                }
                
                .op-tags {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-bottom: 20px;
                }
                .op-tag {
                    padding: 4px 12px;
                    border-radius: 999px;
                    background: #f3f4f6;
                    color: #4b5563;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .op-card-bottom {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid #eaecf4;
                    padding-top: 16px;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                
                .op-posted-by {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .op-posted-avatar {
                    width: 32px; height: 32px;
                    border-radius: 50%;
                    background: #d1fae5;
                    color: #065f46;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 12px;
                    font-weight: 600;
                }
                .op-posted-info {
                    font-size: 12px;
                    line-height: 1.3;
                    color: #6b7280;
                }
                
                .op-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 20px;
                    background: #10b981;
                    color: #fff;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .op-btn:hover {
                    background: #059669;
                    box-shadow: 0 4px 12px rgba(16,185,129,0.3);
                }
                
                /* ── Add & Modal ── */
                .op-add-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: #10b981;
                    color: #fff;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .op-add-btn:hover {
                    background: #059669;
                    box-shadow: 0 4px 12px rgba(16,185,129,0.3);
                }
                
                .op-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                    animation: mlFade 0.2s ease;
                }
                .op-modal {
                    background: #fff;
                    width: 100%;
                    max-width: 600px;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                }
                .op-modal-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #eaecf4;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .op-modal-title {
                    margin: 0;
                    font-family: 'Sora', sans-serif;
                    font-size: 18px;
                    color: #1a1d2e;
                }
                .op-modal-close {
                    background: #f1f5f9;
                    border: none;
                    width: 32px; height: 32px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .op-modal-close:hover {
                    background: #e2e8f0;
                    color: #0f172a;
                }
                .op-modal-body {
                    padding: 24px;
                    overflow-y: auto;
                }
                .op-form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                .op-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .op-form-group.full {
                    grid-column: 1 / -1;
                }
                .op-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #4b5563;
                }
                .op-input, .op-select, .op-textarea {
                    padding: 10px 14px;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 10px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px;
                    color: #1a1d2e;
                    outline: none;
                    transition: all 0.2s;
                    background: #fff;
                }
                .op-input:focus, .op-select:focus, .op-textarea:focus {
                    border-color: #10b981;
                    box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
                }
                .op-textarea {
                    resize: vertical;
                    min-height: 80px;
                }
                .op-modal-footer {
                    padding: 20px 24px;
                    border-top: 1px solid #eaecf4;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .op-btn-outline {
                    padding: 10px 20px;
                    background: #fff;
                    color: #4b5563;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .op-btn-outline:hover {
                    background: #f9fafb;
                    color: #1a1d2e;
                }
                
            `}</style>
            
            <div className="op-root">
                {/* ── Hero ── */}
                <div className="op-hero">
                    <div className="op-hero-inner">
                        <div className="op-hero-left">
                            <div className="op-hero-icon">
                                <Briefcase size={26} />
                            </div>
                            <div>
                                <h1 className="op-hero-title">Job Openings</h1>
                                <p className="op-hero-sub">
                                    Exclusive roles and referrals shared by ANITS alumni
                                </p>
                            </div>
                        </div>
                        <div style={{ color: 'white', background: 'rgba(255,255,255,0.15)', padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500 }}>
                            {openings.length} Active Posts
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="op-content">
                    
                    <div className="op-search-card">
                        <div className="op-search-wrap">
                            <Search className="op-search-icon" size={16} />
                            <input 
                                className="op-search-input" 
                                placeholder="Search roles, companies, or skills..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div style={{ minWidth: 200, display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <CustomSelect 
                                    value={roleFilter} 
                                    onChange={val => setRoleFilter(val)}
                                    options={[
                                        { label: 'Full-time', value: 'Full-time' },
                                        { label: 'Internship', value: 'Internship' },
                                        { label: 'Part-time', value: 'Part-time' },
                                        { label: 'Contract', value: 'Contract' }
                                    ]}
                                    placeholder="All Types"
                                />
                            </div>
                            {user?.role === 'alumni' && (
                                <button className="op-add-btn" onClick={() => setShowModal(true)}>
                                    <Plus size={16} /> Add 
                                </button>
                            )}
                        </div>
                    </div>

                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                        <Sparkles size={14} color="#10b981" /> 
                        {filteredOpenings.length} results found
                    </p>

                    <div className="op-list">
                        {filteredOpenings.map(job => (
                            <div key={job._id || job.id} className="op-card">
                                <div className="op-card-top">
                                    <div>
                                        <h2 className="op-title">{job.title}</h2>
                                        <div className="op-company">
                                            <Building2 size={15} color="#10b981" />
                                            {job.company}
                                        </div>
                                    </div>
                                    <span style={{ 
                                        padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                                        background: job.type === 'Internship' ? '#e0e7ff' : '#d1fae5', 
                                        color: job.type === 'Internship' ? '#4338ca' : '#065f46'
                                    }}>
                                        {job.type}
                                    </span>
                                </div>
                                
                                <div className="op-meta-row">
                                    <span className="op-meta-item"><MapPin size={14}/> {job.location}</span>
                                    <span style={{color: '#d1d5db'}}>|</span>
                                    <span className="op-meta-item"><Briefcase size={14}/> {job.experience}</span>
                                    <span style={{color: '#d1d5db'}}>|</span>
                                    <span className="op-meta-item"><Clock size={14}/> {job.postedAt || new Date(job.createdAt).toLocaleDateString()}</span>
                                </div>
                                
                                <p className="op-desc">{job.description}</p>
                                
                                <div className="op-tags">
                                    {job.tags.map(tag => (
                                        <span key={tag} className="op-tag">{tag}</span>
                                    ))}
                                </div>
                                
                                <div className="op-card-bottom">
                                    <div className="op-posted-by">
                                        <div className="op-posted-avatar">
                                            {job.postedBy.name.charAt(0)}
                                        </div>
                                        <div className="op-posted-info">
                                            <div style={{ color: '#1a1d2e', fontWeight: 600 }}>
                                                Posted by {(!job.postedBy.name || job.postedBy.name.includes('@')) ? 'Alumni' : job.postedBy.name}
                                            </div>
                                            <div>{(!job.postedBy.role || job.postedBy.role === 'undefined at undefined') ? 'Alumni' : job.postedBy.role}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {user && ( (job.postedBy?.userId && job.postedBy.userId === (user._id || user.id)) || user.role === 'admin' ) && (
                                            <>
                                                <button onClick={() => openEditModal(job)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex' }} title="Edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(job._id || job.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', marginRight: '8px' }} title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                        <a href={job.link} target="_blank" rel="noreferrer" className="op-btn">
                                            Apply externally <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {filteredOpenings.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '64px 20px', color: '#9ca3af' }}>
                                <Users size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                                <h3 style={{ fontSize: 16, color: '#4b5563', margin: '0 0 4px', fontWeight: 600 }}>No matching openings</h3>
                                <p style={{ fontSize: 14, margin: 0 }}>Try adjusting your search filters.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Add/Edit Opening Modal ── */}
                {showModal && (
                    <div className="op-modal-overlay" onClick={closeModal}>
                        <div className="op-modal" onClick={e => e.stopPropagation()}>
                            <div className="op-modal-header">
                                <h3 className="op-modal-title">{isEditing ? 'Edit Job Opening' : 'Share a Job Opening'}</h3>
                                <button type="button" className="op-modal-close" onClick={closeModal}>
                                    <X size={18} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleAddSubmit}>
                                <div className="op-modal-body op-form-grid">
                                    <div className="op-form-group full">
                                        <label className="op-label">Job Title</label>
                                        <input required className="op-input" placeholder="e.g. Software Engineer" 
                                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                    </div>
                                    <div className="op-form-group">
                                        <label className="op-label">Company</label>
                                        <input required className="op-input" placeholder="e.g. Google" 
                                            value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                                    </div>
                                    <div className="op-form-group">
                                        <label className="op-label">Location</label>
                                        <input required className="op-input" placeholder="e.g. Remote / Bengaluru" 
                                            value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                                    </div>
                                    <div className="op-form-group">
                                        <label className="op-label">Type</label>
                                        <select className="op-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                            <option value="Full-time">Full-time</option>
                                            <option value="Internship">Internship</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                        </select>
                                    </div>
                                    <div className="op-form-group">
                                        <label className="op-label">Experience Required</label>
                                        <input required className="op-input" placeholder="e.g. Fresher / 0-1 year" 
                                            value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} />
                                    </div>
                                    <div className="op-form-group full">
                                        <label className="op-label">Application Link</label>
                                        <input required type="url" className="op-input" placeholder="https://..." 
                                            value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
                                    </div>
                                    <div className="op-form-group full">
                                        <label className="op-label">Description / Note for Students</label>
                                        <textarea required className="op-textarea" placeholder="Any details..." 
                                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                    </div>
                                    <div className="op-form-group full">
                                        <label className="op-label">Keywords / Tags (comma separated)</label>
                                        <input className="op-input" placeholder="e.g. React, Node.js, Frontend" 
                                            value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} />
                                    </div>
                                </div>
                                <div className="op-modal-footer">
                                    <button type="button" className="op-btn-outline" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="op-add-btn">
                                        {isEditing ? <><Edit size={16}/> Save Changes</> : <><Plus size={16}/> Post Role</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
