import { LaporanKejadian } from '../types';

export const initialLaporanKejadian: LaporanKejadian[] = [
  {
    id: 'lap-001',
    nomorLaporan: '001/RW.018/VIII/2026',
    tanggalLaporan: '2026-08-14',
    pelaporNama: 'Eko Purwanto',
    pelaporJabatan: 'Ketua RW 018',
    wilayah: 'RW 018 Kampung Banten',
    kelurahan: 'Iringmulyo',
    kecamatan: 'Metro Timur',
    kota: 'Metro',
    tujuanLaporan: ['Lurah Iringmulyo', 'Kapolsek Metro Timur'],
    jenisKejadian: 'Kerusakan Fasilitas',
    hariKejadian: 'Kamis',
    tanggalKejadian: '2026-08-13',
    waktuKejadian: '22:15 WIB',
    lokasiKejadian: 'Jl. Pala Gang Melati dekat Pos Ronda RT 040',
    rt: '040',
    rw: '018',
    alamatLengkap: 'Jl. Pala Gang Melati No. 12 RT 040 RW 018 Kampung Banten Kelurahan Iringmulyo',
    korban: [
      {
        id: 'kb-001',
        nama: 'Fasilitas PJU RT 040 RW 018',
        nik: '1872020101700018',
        alamat: 'Jl. Pala Gang Melati RT 040 RW 018',
        rtRw: '040/018',
        noHp: '081273849100',
        status: 'Pihak Terkait',
      },
    ],
    kronologi:
      'Pada hari Kamis tanggal 13 Agustus 2026 sekitar pukul 22.15 WIB, terjadi hembusan angin kencang disertai hujan rintik yang mengakibatkan patahnya dahan pohon akasia di samping pos ronda RT 040. Dahan menimpa kabel instalasi penerangan jalan umum (PJU) sehingga tiang PJU miring dan bola lampu pecah. Petugas siskamling regu ronda malam RT 040 segera memasang batas pengaman agar tidak dilalui warga.',
    korbanJiwa: 'Tidak ada',
    jumlahKorbanJiwa: 0,
    korbanLuka: 'Tidak ada',
    jumlahKorbanLuka: 0,
    kerugianMateri: 'Ada',
    nilaiKerugian: 1500000,
    kerusakan:
      'Kabel induk PJU putus, kap lampu LED 50W hancur tertimpa dahan, serta tiang penyangga besi miring 30 derajat.',
    tindakan: [
      'Menghubungi Ketua RT',
      'Menghubungi Lurah',
      'Mengamankan lokasi',
      'Memberikan pertolongan kepada korban',
    ],
    tindakanLainnya: 'Koordinasi pemotongan dahan dengan Dinas Lingkungan Hidup & perbaikan PLN',
    uraianTindakan:
      '1. Petugas ronda langsung mengamankan arus lalu lintas jalan gang.\n2. Ketua RW 018 menghubungi Bhabinkamtibmas dan call center PLN untuk pemutusan arus sementara demi keselamatan.\n3. Kerja bakti warga keesokan paginya membersihkan ranting dan dahan pohon.',
    saksi: [
      {
        id: 'sk-001',
        nama: 'Agus Triono',
        alamat: 'Jl. Pala No. 14 RT 040 RW 018',
        noHp: '081278901234',
      },
      {
        id: 'sk-002',
        nama: 'Bambang Supriyadi',
        alamat: 'Jl. Pala No. 16 RT 040 RW 018',
        noHp: '085298765432',
      },
    ],
    dokumentasi: [
      {
        id: 'dok-001',
        namaFile: 'evakuasi_dahan_pju_rt040.jpg',
        jenisFile: 'foto',
        waktuUpload: '2026-08-14T08:30:00.000Z',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80',
        size: 245000,
      },
    ],
    keteranganTambahan:
      'Situasi saat ini aman terkendali. Lampu PJU darurat telah dipasang sementara oleh pengurus RT 040 menunggu instalasi permanen.',
    status: 'Selesai',
    createdAt: '2026-08-14T09:00:00.000Z',
    updatedAt: '2026-08-14T11:30:00.000Z',
    createdBy: 'Eko Purwanto (Ketua RW 018)',
  },
];
