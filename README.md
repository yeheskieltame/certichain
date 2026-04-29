# 🎓 CertiChain: Immutable On-Chain Degrees

> **Live Demo Project** — Web3 University Tour 2026
> **Collaboration:** Coinvestasi x BNB Chain x Binance Academy x DevWeb3 Jogja
> **Developer:** Devrel DevWeb3 Jogja

Isu ijazah palsu adalah problem sistemik yang menggerus *trust* di dunia akademik maupun profesional. Kita tidak perlu melihat jauh; polemik nasional mengenai keaslian ijazah Presiden Jokowi adalah bukti nyata bagaimana dokumen fisik dan verifikasi terpusat bisa memicu debat publik yang menguras energi dan berujung pada saling gugat di pengadilan. Masalah utamanya satu: sistem konvensional tidak memiliki *single source of truth* yang transparan dan independen.

Sebagai antitesis dari masalah tersebut, adopsi Web3 di sektor pendidikan Indonesia kini sudah berjalan. Awal April 2026 lalu, pesepakbola **Pratama Arhan** resmi lulus dari Udinus dan menjadi lulusan pertama di Indonesia yang menerima **ijazah berbasis blockchain**. 

Project CertiChain ini mendemokan *real-world use case* tersebut. Peserta *workshop* dapat melakukan *minting* ijazah mereka ke dalam *smart contract* di jaringan BNB Testnet. Data diikat secara kekal (*immutable*) dan didesain agar langsung terbaca oleh publik melalui *block explorer* tanpa perlu *backend server* tambahan.

---

## 📜 Smart Contract Details

- **Network:** BNB Smart Chain Testnet
- **Contract Address:** [`0x405CcCda7EFd5AC9D7ae662069359cBfca6Fac6d`](https://testnet.bscscan.com/address/0x405CcCda7EFd5AC9D7ae662069359cBfca6Fac6d)

---

## 🏗 Struktur Direktori & Arsitektur

Project ini dipisah ke dalam dua direktori utama untuk mempermudah integrasi *frontend* dan *smart contract* selama *workshop* berlangsung.

| Direktori | Tech Stack | Fungsi & Implementasi Bisnis |
| :--- | :--- | :--- |
| **`/FE`** | Next.js, Tailwind, **Wagmi**, **Privy** | *Client-side interface* modern. Menggunakan **Privy** untuk *seamless onboarding* (support email/social login & *mobile wallet connect*). Menangani *image generation* (HTML5 Canvas), *upload* ke **Pinata IPFS**, dan UI pencarian ijazah publik. |
| **`/SC`** | JSON | Direktori ini dikosongkan dari kode Solidity karena *deployment smart contract* dilakukan secara *on-the-fly* menggunakan Remix IDE. Direktori ini hanya berisi file **`ABI.json`** yang digunakan oleh *frontend* (Wagmi) untuk berinteraksi dengan *contract* di BNB Testnet. |

## ⚙️ End-to-End Workflow & IPFS Handling

Sistem ini didesain dengan alur *client-side generation* untuk meminimalkan beban *gas fee*:

1. **Input & Photo Upload:** Peserta mengisi form data diri dan mengunggah pas foto. FE menembak API Pinata untuk mendapatkan *Content Identifier* (CID) foto.
2. **Auto-Generate Diploma:** FE menggabungkan *template* ijazah, teks (Nama & Universitas), dan pas foto menggunakan `canvas` menjadi satu gambar Ijazah Final.
3. **Metadata Structuring:** Gambar Ijazah Final dan file JSON Metadata (standar ERC-721) diunggah kembali ke jaringan IPFS via Pinata.
4. **On-Chain Minting:** FE men-*trigger* transaksi *smart contract* di BNB Testnet melalui *hooks* Wagmi (membaca `ABI.json` dari folder `/SC`). Data *struct* dicatat untuk keterbacaan di BscScan, dan `tokenURI` diset untuk dukungan *wallet explorer*.
5. **Public Verification Dashboard:** Frontend menyediakan fitur **"Verify Diploma"**. Siapapun (HRD, institusi, publik) cukup memasukkan Token ID, dan sistem akan menarik data langsung dari *smart contract* (`useReadContract` dari Wagmi) untuk menampilkan keaslian Ijazah beserta visualnya.