// ... (Bagian import dan config sama persis seperti sebelumnya)
// ... (Langsung ke bagian return utama di paling bawah)

export default function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState('');
  
  useEffect(() => { signInAnonymously(auth); }, []);

  const login = (role, username) => {
    setUser(username);
    setPage(role);
  };

  return (
    // CLASS INI PENTING UNTUK FULL WIDTH: w-full min-h-screen
    <div className="antialiased w-full min-h-screen bg-gray-50">
      {page === 'login' && <LoginPage onLogin={login}/>}
      {page === 'admin' && <DashboardAdmin onLogout={()=>setPage('login')}/>}
      {page === 'guru' && <TeacherDashboard db={db} user={user} onLogout={()=>setPage('login')}/>}
    </div>
  );
}