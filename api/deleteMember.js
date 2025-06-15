import { db, ref, remove } from '../../firebase-config';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { rfid } = req.body;
        
        if (!rfid) {
            return res.status(400).json({ error: 'RFID is required' });
        }

        await remove(ref(db, `members/${rfid}`));

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting member:', error);
        return res.status(500).json({ error: error.message });
    }
}