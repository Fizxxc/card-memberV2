import { db, ref, get } from '../../firebase-config';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const snapshot = await get(ref(db, 'members'));
        return res.status(200).json(snapshot.val() || {});
    } catch (error) {
        console.error('Error getting members:', error);
        return res.status(500).json({ error: error.message });
    }
}