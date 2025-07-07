import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import { mockResumeData } from "./utils/mockAnalysis";
import "./App.css";

function App() {
  const [resume, setResume] = useState(null);

  const handleFileUpload = (file) => {
    // Simulate parsing by using mock data
    setResume(mockResumeData);
  };

  return (
    <div className="App">
      <h1>📄 AI Resume Analyzer</h1>
      <FileUpload onUpload={handleFileUpload} />

      {resume && (
        <div className="result">
          <h2>👤 Name:</h2>
          <p>{resume.name}</p>

          <h2>🎓 Education:</h2>
          <p>{resume.education}</p>

          <h2>💼 Experience:</h2>
          <p>{resume.experience}</p>

          <h2>🧠 Skills:</h2>
          <ul>
            {resume.skills.map((skill, index) => (
              <li key={index}>✅ {skill}</li>
            ))}
          </ul>

          <h2>📃 Summary:</h2>
          <p>{resume.summary}</p>
        </div>
      )}
    </div>
  );
}

export default App;
