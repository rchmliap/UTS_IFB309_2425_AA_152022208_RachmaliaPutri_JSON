const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();
const PORT = 3000;

// Konfigurasi koneksi database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_iot'
});

// Menghubungkan ke database
db.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

// Fungsi untuk menjalankan query database dengan Promise
const queryDatabase = (query) => {
    return new Promise((resolve, reject) => {
        db.query(query, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// Endpoint untuk mendapatkan data cuaca
app.get('/data-cuaca', async (req, res) => {
    try {
        const results = {};

        // Query untuk mendapatkan suhu maksimum
        const suhumaxResult = await queryDatabase('SELECT MAX(suhu) AS suhumax FROM tb_cuaca');
        results.suhumax = suhumaxResult[0]?.suhumax || null;

        // Query untuk mendapatkan suhu minimum
        const suhumminResult = await queryDatabase('SELECT MIN(suhu) AS suhummin FROM tb_cuaca');
        results.suhumin = suhumminResult[0]?.suhummin || null;

        // Query untuk mendapatkan rata-rata suhu
        const suhurataResult = await queryDatabase('SELECT AVG(suhu) AS suhurata FROM tb_cuaca');
        results.suhurata = suhurataResult[0]?.suhurata
            ? parseFloat(suhurataResult[0].suhurata).toFixed(2)
            : null;

        // Query untuk mendapatkan data berdasarkan ID tertentu
        const maxEntriesQuery = `
            SELECT id AS idx, suhu, humid, lux AS kecerahan, ts AS timestamp 
            FROM tb_cuaca 
            WHERE id IN (101, 226) 
            ORDER BY ts
        `;
        const maxEntriesResult = await queryDatabase(maxEntriesQuery);
        results.nilai_suhu_max_humid_max = maxEntriesResult.map(row => ({
            idx: row.idx,
            suhu: row.suhu,
            humid: row.humid,
            kecerahan: row.kecerahan,
            timestamp: row.timestamp
        }));

        // Query untuk mendapatkan bulan dan tahun suhu maksimum hanya untuk 9-2010 dan 5-2011
        const monthYearMaxQuery = `
            SELECT DISTINCT DATE_FORMAT(ts, '%c-%Y') AS month_year
            FROM tb_cuaca
            WHERE DATE_FORMAT(ts, '%c-%Y') IN ('9-2010', '5-2011')
            ORDER BY FIELD(DATE_FORMAT(ts, '%c-%Y'), '9-2010', '5-2011')
        `;
        const monthYearMaxResult = await queryDatabase(monthYearMaxQuery);
        results.month_year_max = monthYearMaxResult.map(row => ({
            month_year: row.month_year
        }));

        // Mengirim hasil dalam format JSON
        res.json(results);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Menjalankan server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
