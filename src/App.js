import React, { useState, useEffect, useRef } from "react";
import './App.css';

const API_KEY = "APNA-API-KEY-USE-KARO"; 
// yaha api_key use kar lo
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const App = () => {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [actionItems, setActionItems] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [summary, setSummary] = useState(""); // summary state yha hai

  const recognitionRef = useRef(null);

  // speech wala api 
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Your browser does not support speech recognition. Try Chrome.");
    } else {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript + " ";
        }
        setTranscript(text.trim());
      };

      recognition.onend = () => setRecording(false);
      recognitionRef.current = recognition;
    }
  }, []);

  // Extract action items after transcription update
  useEffect(() => {
    if (transcript) extractActions(transcript.toLowerCase());
  }, [transcript]);

  // Start recording
  const startRecording = () => {
    setTranscript("");
    setActionItems([]);
    setCalendarEvents([]);
    setSummary("");
    recognitionRef.current?.start();
    setRecording(true);
  };

  // Stop recording and fetch AI summary
  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);

    console.log("Final transcript:", transcript); // Debugging log
    fetchSummary(transcript);
  };

  //Extract tasks & calendar events
  const extractActions = (text) => {
    console.log("Extracting from:", text);
  
    // Improved Regex Patterns
    const taskRegex = /(remember to|remind me to|task|todo|make sure to|don't forget to)\s+(.+?)(?=\.|,|$)/gi;
    const dateRegex = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\b\d{1,2}(st|nd|rd|th)?\s+\w+\b)/gi;
    const timeRegex = /(\d{1,2}(:\d{2})?\s?(am|pm|a\.m\.|p\.m\.?))/gi;
  
    const tasks = [...text.matchAll(taskRegex)].map(match => match[2]);
    const dates = [...text.matchAll(dateRegex)].map(match => match[1]);
    const times = [...text.matchAll(timeRegex)].map(match => match[1]);
  
    console.log("Detected Dates:", dates);  
    console.log("Detected Times:", times);  
  
    const events = [];
  
    
    times.forEach((time, i) => {
      const date = dates[i] || "";  // Ensure date is optional
      if (time) {
        events.push(date ? `Event for ${time} on ${date}` : `Event for ${time}`);
      }
    });
  
    setActionItems(tasks);
    setCalendarEvents(events);
  };
  
  
  

  //Fetch AI-generated summary
  const fetchSummary = async (text) => {
    if (!text) {
      console.error("No transcript to summarize");
      setSummary("No transcript available.");
      return;
    }

    console.log("Sending to AI API:", text); // Debugging log

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Summarize this conversation in another words:\n\n${text}` }]
          }]
        })
      });

      console.log("API Response Status:", response.status); // Debugging log
      const data = await response.json();
      console.log("API Response Data:", data); // Debugging log

      if (data.candidates && data.candidates.length > 0) {
        setSummary(data.candidates[0].content.parts[0].text || "No summary available.");
      } else {
        setSummary("Failed to generate summary.");
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummary("Error generating summary.");
    }
  };

  // Share results via email
  const sendEmail = () => {
    const mailto = `mailto:?subject=Meeting Notes&body=Summary:%0D%0A${summary}%0D%0A%0D%0A` +
      `Tasks:%0D%0A${actionItems.join("%0D%0A")}%0D%0A%0D%0A` +
      `Calendar Events:%0D%0A${calendarEvents.join("%0D%0A")}`;
    window.location.href = mailto;
  };

  return (
    <div className="app-container">
      <h2>Smart Voice Assistant(Meeting) by Pawan Singh </h2>
      <button
        onClick={recording ? stopRecording : startRecording}
        className={recording ? "stop-btn" : "record-btn"}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      
      <h3>Transcription:</h3>
      <p className="transcription">{transcript || "Start speaking..."}</p>

      <h3>Action Items:</h3>
      <ul className="results">
        {actionItems.length ? (
          actionItems.map((item, i) => <li key={i}>{item}</li>)
        ) : (
          <p>No tasks detected.</p>
        )}
      </ul>

      <h3>Calendar Events:</h3>
      <ul className="results">
        {calendarEvents.length ? (
          calendarEvents.map((e, i) => <li key={i}>{e}</li>)
        ) : (
          <p>No events detected.</p>
        )}
      </ul>

      <h3>Meeting Summary:</h3>
      <p className="summary-box">{summary || "No key points detected."}</p>

      <button onClick={sendEmail} className="share-btn">
        Share via Email
      </button>
    </div>
  );
};

export default App;
