import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import "./App.css";

function App() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [matchResults, setMatchResults] = useState(null);

  const handleFileUpload = (data) => {
    setResume(data);
  };

  const handleMatch = () => {
    if (!resume || !jobDescription) return;

    const resumeSkills = resume.skills.map((skill) => skill.toLowerCase());
    const jdWords = jobDescription.toLowerCase().split(/[\s,\.]+/);

    const matched = resumeSkills.filter((skill) => jdWords.includes(skill));
    const missing = resumeSkills.filter((skill) => !jdWords.includes(skill));

    setMatchResults({ matched, missing });
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

          <h2>📄 Job Description:</h2>
          <textarea
            rows="6"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            style={{ width: "100%", marginBottom: "10px" }}
          />

          <button onClick={handleMatch}>🔍 Match Resume</button>

          {matchResults && (
            <div>
              <h3> Matched Skills:</h3>
              <ul>
                {matchResults.matched.map((skill, i) => (
                  <li key={i} style={{ color: "green" }}>{skill}</li>
                ))}
              </ul>

              <h3> Missing Skills:</h3>
              <ul>
                {matchResults.missing.map((skill, i) => (
                  <li key={i} style={{ color: "red" }}>{skill}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
