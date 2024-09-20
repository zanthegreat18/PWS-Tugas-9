if (user) {
    if (user.role === 'admin') {
      window.location.href = `Dashbord.html?username=${user.username}`;
    } else if (user.role === 'karyawan') {
      window.location.href = `Dashbord2.html?username=${user.username}`;
    }
  } else {
    errorMessage.style.display = 'block';
  }
  

const express = require('express');
const multer = require('multer'); //mutler untuk mengunggah gambar ke database dengan membuat folder uploads
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/api/buku', upload.single('gambar'), (req, res) => {
    const { judul, pengarang, genre } = req.body;
    const gambar = req.file.filename;

    // fungsi untuk menyimpan ke database 
    // Data yang disimpan di databse gua itu judul, pengarang, genre, gambar (path file gambar)

    res.json({ message: 'Buku berhasil ditambahkan'
    });
})


