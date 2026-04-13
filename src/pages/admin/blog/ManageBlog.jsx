// Logika deteksi otomatis link untuk Admin
const handleSubmitKonten = async (e) => {
    e.preventDefault();
    let type = "image";
    if (url.includes("tiktok.com")) type = "tiktok";
    if (url.includes("instagram.com")) type = "instagram";
  
    await addDoc(collection(db, "web_blog"), {
      url,
      caption,
      type,
      createdAt: serverTimestamp()
    });
  };