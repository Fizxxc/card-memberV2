import { db, ref, get } from '../../firebase-config';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { rfid } = req.query;
        
        if (!rfid) {
            return res.status(400).json({ error: 'RFID is required' });
        }

        const snapshot = await get(ref(db, `members/${rfid}`));
        
        if (snapshot.exists()) {
            return res.status(200).json(snapshot.val());
        } else {
            return res.status(404).json(null);
        }
    } catch (error) {
        console.error('Error getting member:', error);
        return res.status(500).json({ error: error.message });
    }
}