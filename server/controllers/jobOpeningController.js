const JobOpening = require('../models/JobOpening');

exports.getAllOpenings = async (req, res) => {
    try {
        const openings = await JobOpening.find().sort({ createdAt: -1 });
        res.status(200).json(openings);
    } catch (error) {
        console.error('Error fetching job openings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createOpening = async (req, res) => {
    try {
        const { title, company, location, type, experience, link, description, tags, postedBy } = req.body;
        
        const newOpening = new JobOpening({
            title,
            company,
            location,
            type,
            experience,
            link,
            description,
            tags,
            postedBy
        });

        const savedOpening = await newOpening.save();
        res.status(201).json(savedOpening);
    } catch (error) {
        console.error('Error creating job opening:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateOpening = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const opening = await JobOpening.findById(id);
        if (!opening) return res.status(404).json({ message: 'Job opening not found' });
        
        if (req.user.role !== 'admin') {
            if (!opening.postedBy.userId || opening.postedBy.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to update this opening' });
            }
        }

        const updatedOpening = await JobOpening.findByIdAndUpdate(id, updates, { new: true });
        res.status(200).json(updatedOpening);
    } catch (error) {
        console.error('Error updating job opening:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteOpening = async (req, res) => {
    try {
        const { id } = req.params;
        const opening = await JobOpening.findById(id);
        if (!opening) return res.status(404).json({ message: 'Job opening not found' });
        
        if (req.user.role !== 'admin') {
            if (!opening.postedBy.userId || opening.postedBy.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to delete this opening' });
            }
        }

        await JobOpening.findByIdAndDelete(id);
        res.status(200).json({ message: 'Job opening deleted' });
    } catch (error) {
        console.error('Error deleting job opening:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
