// ... (Bagian atas sama)
<nav style={styles.nav}>
<Link to="/admin" style={isActive('/admin') ? styles.linkActive : styles.link}>
   🏠 Dashboard
</Link>

<Link to="/admin/students" style={isActive('/admin/students') ? styles.linkActive : styles.link}>
   👨‍🎓 Manajemen Siswa
</Link>

<Link to="/admin/students/add" style={isActive('/admin/students/add') ? styles.linkActive : styles.link}>
   ➕ Pendaftaran Baru
</Link>

<Link to="/admin/teachers" style={isActive('/admin/teachers') ? styles.linkActive : styles.link}>
   👨‍🏫 Manajemen Guru
</Link>

{/* MENU BARU: JADWAL */}
<Link to="/admin/schedule" style={isActive('/admin/schedule') ? styles.linkActive : styles.link}>
   📅 Jadwal & Kelas
</Link>

<Link to="/admin/finance" style={isActive('/admin/finance') ? styles.linkActive : styles.link}>
   💰 Keuangan & Kasir
</Link>
</nav>
// ... (Bagian bawah sama)