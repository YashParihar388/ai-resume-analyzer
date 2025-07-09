import React, { useRef, useState } from "react";

const FileUpload = ({ onUpload }) => {
  const inputRef = useRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    setError(null);
    setLoading(true);
    try {
      const file = e.target.files[0];
      if (!file) {
        setError("No file selected.");
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.error || "Upload failed.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      onUpload(data); // display the result in the app
    } catch (err) {
      setError("An error occurred while uploading. Please try again.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileChange}
        ref={inputRef}
        disabled={loading}
      />
      {loading && <p>Uploading and analyzing resume...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default FileUpload;
