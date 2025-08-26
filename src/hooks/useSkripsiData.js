export const useSkripsiData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await loadSkripsiData();
        setData(result);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveData = async (newData) => {
    await saveSkripsiData({ ...data, ...newData });
  };

  return { data, loading, saveData };
};