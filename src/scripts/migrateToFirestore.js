const migrateLegacyData = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const legacyData = {};
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("hasil_")) {
      const cleanKey = key.replace("hasil_", "");
      legacyData[cleanKey] = JSON.parse(localStorage.getItem(key));
    }
  });

  if (Object.keys(legacyData).length > 0) {
    await saveSkripsiData(legacyData);
    console.log("Migrasi berhasil!");
  }
};