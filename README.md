# Expense & Budget Visualizer

Aplikasi web sederhana untuk mencatat dan memantau pengeluaran. Proyek ini dibuat sebagai mini project Coding Camp RevoU dengan HTML, CSS, dan JavaScript.

## Fitur

- Menambahkan transaksi dengan nama barang, nominal dalam rupiah, dan kategori.
- Melihat total pengeluaran serta riwayat transaksi.
- Mengurutkan transaksi berdasarkan waktu terbaru, jumlah terbesar, atau kategori A–Z.
- Mengatur batas pengeluaran per transaksi. Transaksi yang melewati batas akan ditandai.
- Melihat ringkasan pengeluaran berdasarkan kategori melalui pie chart.
- Menghapus transaksi yang sudah dicatat.
- Mengganti tampilan antara mode terang dan gelap.
- Menyimpan transaksi, batas pengeluaran, dan tema di `localStorage` browser.

Kategori transaksi yang tersedia: Food, Transport, Fun, Health, Education, Shopping, dan Other.

## Menjalankan aplikasi

Aplikasi ini tidak memerlukan proses build atau instalasi dependency.

1. Clone atau unduh repository ini.
2. Buka `index.html` langsung di browser, atau jalankan dengan ekstensi seperti **Live Server** di Visual Studio Code.
3. Untuk memuat pie chart, browser perlu terhubung ke internet karena aplikasi menggunakan Chart.js dari CDN.

## Cara menggunakan

1. Isi nama barang, jumlah dalam rupiah, dan kategori, lalu pilih **Tambah**.
2. Atur nominal pada bagian **Batas Pengeluaran per Transaksi**, lalu pilih **Set Limit**. Kosongkan atau masukkan nilai tidak valid untuk menghapus limit.
3. Gunakan tombol pengurutan pada bagian riwayat untuk mengubah urutan transaksi.
4. Pilih tombol tema di bagian atas untuk berganti mode terang atau gelap.
5. Pilih tombol **✕** pada transaksi untuk menghapusnya.

Data tersimpan di browser yang digunakan dan tidak disinkronkan ke perangkat atau browser lain. Menghapus data situs/browser dapat menghapus data transaksi yang tersimpan.

## Struktur proyek

```text
.
├── index.html       # Struktur halaman aplikasi
├── css/
│   └── style.css    # Gaya dan tata letak
└── js/
    └── script.js    # Logika transaksi, penyimpanan, dan grafik
```

## Teknologi

- HTML5
- CSS3
- JavaScript
- [Chart.js](https://www.chartjs.org/) untuk pie chart
