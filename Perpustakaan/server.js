const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();
const port = 10000;

// Setup koneksi ke database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Ojan123', // Sesuaikan dengan password MySQL Anda
    database: 'library'
});

// Koneksikan ke database
db.connect(err => {
    if (err) throw err;
    console.log('Connected to database.');
});

// Middleware untuk parsing JSON
app.use(express.json());

// Middleware untuk melayani file statis
app.use(express.static(path.join(__dirname, 'public')));

// Middleware untuk melayani file gambar
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup multer untuk mengunggah file
const upload = multer({ 
    dest: 'uploads/', // Tempat menyimpan file yang diunggah
    limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal ukuran file 5MB
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) { // Filter hanya file gambar
            return cb(new Error('Tipe file tidak didukung, harap unggah gambar'));
        }
        cb(undefined, true);
    }
});

// CRUD untuk pengguna

// Tambah pengguna baru
app.post('/api/pengguna', (req, res) => {
    const { nama, email, role } = req.body;
    
    // Validasi input sederhana
    if (!nama || !email || !role) {
        return res.status(400).json({ message: 'Harap lengkapi semua kolom.' });
    }

    const sql = 'INSERT INTO pengguna (nama, email, role) VALUES (?, ?, ?)';
    db.query(sql, [nama, email, role], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ message: 'Email sudah terdaftar' });
            } else {
                console.error(err);
                res.status(500).json({ message: 'Terjadi kesalahan server' });
            }
        } else {
            res.json({ message: 'Pengguna berhasil ditambahkan', id: result.insertId });
        }
    });
});

// Mendapatkan semua data pengguna
app.get('/api/pengguna', (req, res) => {
    const sql = 'SELECT * FROM pengguna';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        } else {
            res.json(results);
        }
    });
});

// CRUD untuk buku

// Tambah buku baru
app.post('/api/buku', upload.single('gambar'), (req, res) => {
    const { judul, pengarang, genre } = req.body;
    const gambar = req.file ? req.file.filename : 'default.jpg'; // Gunakan gambar default jika tidak ada file

    // Validasi input sederhana
    if (!judul || !pengarang || !genre) {
        return res.status(400).json({ message: 'Harap lengkapi semua kolom.' });
    }

    const sql = 'INSERT INTO buku (judul, pengarang, genre, gambar) VALUES (?, ?, ?, ?)';
    db.query(sql, [judul, pengarang, genre, gambar], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        } else {
            res.json({ message: 'Buku berhasil ditambahkan', id: result.insertId });
        }
    });
});

// Mendapatkan semua data buku
app.get('/api/buku', (req, res) => {
    const sql = 'SELECT * FROM buku';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        } else {
            res.json(results);
        }
    });
});

// Update/Edit buku berdasarkan ID
app.put('/api/buku/:id', upload.single('gambar'), (req, res) => {
    const { id } = req.params;
    const { judul, pengarang, genre } = req.body;
    const gambar = req.file ? req.file.filename : null;

    if (!judul || !pengarang || !genre) {
        return res.status(400).json({ message: 'Harap lengkapi semua kolom.' });
    }

    const getBookSql = 'SELECT * FROM buku WHERE id_buku = ?';
    db.query(getBookSql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Terjadi kesalahan server' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Buku tidak ditemukan' });
        }

        const oldGambar = results[0].gambar;
        const updateBookSql = `UPDATE buku SET judul = ?, pengarang = ?, genre = ?, gambar = ? WHERE id_buku = ?`;
        const updateData = [judul, pengarang, genre, gambar ? gambar : oldGambar, id];

        db.query(updateBookSql, updateData, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Terjadi kesalahan server' });
            }

            if (gambar && oldGambar && oldGambar !== 'default.jpg') {
                fs.unlink(path.join(__dirname, 'uploads', oldGambar), (err) => {
                    if (err) console.error('Gagal menghapus gambar lama:', err);
                });
            }

            res.json({ message: 'Buku berhasil diperbarui' });
        });
    });
});

// Hapus buku berdasarkan ID
app.delete('/api/buku/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM buku WHERE id_buku = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Terjadi kesalahan server' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Buku tidak ditemukan' });
        } else {
            res.json({ message: 'Buku berhasil dihapus' });
        }
    });
});

// Jalankan server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
