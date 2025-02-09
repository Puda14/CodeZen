export const handleFileUpload = (event, setCode) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => setCode(e.target.result);
  reader.readAsText(file);
};
