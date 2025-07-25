// js/database.js

const DB = (() => {
    const DBNAME = 'bloodBankDB';

    const getDb = () => {
        const db = localStorage.getItem(DBNAME);
        return db ? JSON.parse(db) : null;
    };

    const saveDb = (db) => {
        localStorage.setItem(DBNAME, JSON.stringify(db));
    };

    const init = () => {
        if (!getDb()) {
            console.log('Initializing database with seed data...');
            const today = new Date();
            const seedData = {
                users: [
                    { username: 'staff', password: 'password123', role: 'staff' },
                    { username: 'supervisor', password: 'admin123', role: 'supervisor' }
                ],
                inventory: [
                    { id: 1, bloodType: 'A+', units: 5, donationDate: new Date(today.setDate(today.getDate() - 10)).toISOString(), expiryDate: new Date(today.setDate(today.getDate() + 32)).toISOString(), status: 'available' },
                    { id: 2, bloodType: 'O-', units: 2, donationDate: new Date(today.setDate(today.getDate() - 5)).toISOString(), expiryDate: new Date(today.setDate(today.getDate() + 37)).toISOString(), status: 'available' },
                    { id: 3, bloodType: 'B+', units: 8, donationDate: new Date(today.setDate(today.getDate() - 20)).toISOString(), expiryDate: new Date(today.setDate(today.getDate() + 22)).toISOString(), status: 'available' },
                    { id: 4, bloodType: 'AB+', units: 3, donationDate: new Date(today.setDate(today.getDate() - 15)).toISOString(), expiryDate: new Date(today.setDate(today.getDate() + 27)).toISOString(), status: 'used' },
                ],
                donations: [
                    { id: 1, donorName: 'John Doe', bloodType: 'A+', donationDate: new Date(today.setDate(today.getDate() - 10)).toISOString(), contact: '555-0101' },
                    { id: 2, donorName: 'Jane Smith', bloodType: 'O-', donationDate: new Date(today.setDate(today.getDate() - 5)).toISOString(), contact: '555-0102' },
                    { id: 3, donorName: 'Peter Jones', bloodType: 'B+', donationDate: new Date(today.setDate(today.getDate() - 20)).toISOString(), contact: '555-0103' },
                    { id: 4, donorName: 'Mary Johnson', bloodType: 'AB+', donationDate: new Date(today.setDate(today.getDate() - 15)).toISOString(), contact: '555-0104' },
                ]
            };
            saveDb(seedData);
        }
    };
    
    const getNextId = (collection) => {
        const db = getDb();
        const maxId = db[collection].reduce((max, item) => item.id > max ? item.id : max, 0);
        return maxId + 1;
    };

    return {
        init,
        getUsers: () => getDb().users,
        
        getInventory: () => getDb().inventory,
        addInventory: (item) => {
            const db = getDb();
            const newItem = {
                id: getNextId('inventory'),
                ...item,
                expiryDate: new Date(new Date(item.donationDate).getTime() + 42 * 24 * 60 * 60 * 1000).toISOString(), // 42 days expiry
                status: 'available'
            };
            db.inventory.push(newItem);
            saveDb(db);
            return newItem;
        },
        updateInventoryStatus: (id, status) => {
            const db = getDb();
            const item = db.inventory.find(i => i.id === id);
            if(item) {
                item.status = status;
                saveDb(db);
            }
        },
        
        getDonations: () => getDb().donations,
        addDonation: (donation) => {
            const db = getDb();
            const newDonation = { 
                id: getNextId('donations'),
                ...donation
            };
            db.donations.push(newDonation);
            saveDb(db);
            return newDonation;
        },
        deleteDonation: (id) => {
            const db = getDb();
            db.donations = db.donations.filter(d => d.id !== id);
            saveDb(db);
        }
    };
})();

// Initialize the database on script load
DB.init();