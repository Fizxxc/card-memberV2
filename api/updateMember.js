import { db, ref, update } from '../../firebase-config';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { rfid, name, phone, email, points } = req.body;
        
        if (!rfid || !name) {
            return res.status(400).json({ error: 'RFID and Name are required' });
        }

        const updates = {
            name,
            phone: phone || '',
            email: email || '',
            points: points || 0,
            updatedAt: new Date().toISOString()
        };

        await update(ref(db, `members/${rfid}`), updates);

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating member:', error);
        return res.status(500).json({ error: error.message });
    }
}