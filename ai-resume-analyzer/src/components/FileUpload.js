import React from "react";

function FileUpload({ onUpload }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    onUpload(file);
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <input type="file" accept=".pdf,.docx" onChange={handleFileChange} />
    </div>
  );
}

export default FileUpload;
