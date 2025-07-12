import React, { useEffect, useRef, useState } from "react";

interface VoiceControlProps {
  onMoveCommand: (sanMove: string) => void;
  listening: boolean;
  startListening: () => void;
  stopListening: () => void;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

const SpeechRecognitionConstructor =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const VoiceControl: React.FC<VoiceControlProps> = ({
  onMoveCommand,
  listening,
  startListening,
  stopListening,
}) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isRecognizingRef = useRef(false);
  const hasMicErrorRef = useRef(false);


  const listeningRef = useRef(listening);
  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  useEffect(() => {
    if (!SpeechRecognitionConstructor) {
      setErrorMessage("SpeechRecognition API not supported in this browser");
      return;
    }

    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === "denied") {
            setErrorMessage(
              "Microphone access is denied. Please allow microphone permissions in your browser settings."
            );
          }
          permissionStatus.onchange = () => {
            if (permissionStatus.state === "denied") {
              setErrorMessage(
                "Microphone access is denied. Please allow microphone permissions in your browser settings."
              );
            } else {
              setErrorMessage(null);
            }
          };
        })
        .catch(() => {
          // Ignore silently if Permissions API not supported
        });
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log("VoiceControl heard:", transcript);
      setLastTranscript(transcript);
      setErrorMessage(null);
    hasMicErrorRef.current = false; // <- reset mic error flag  
      handleVoiceCommand(transcript);
      
    };

    recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);

        if (
            event.error === "not-allowed" ||
            event.error === "permission-denied"
        ) {
            setErrorMessage(
            "Microphone access denied. Please allow microphone permission in your browser settings."
            );
            hasMicErrorRef.current = true; // <-- prevent auto-restarting
        } else {
            setErrorMessage(`Speech recognition error: ${event.error}`);
        }

        isRecognizingRef.current = false;
        };


    recognition.onend = () => {
    isRecognizingRef.current = false;
    console.log("Speech recognition ended");

    if (listeningRef.current && !hasMicErrorRef.current) {
        console.log("Restarting recognition because listening is true");
        try {
        recognition.start();
        isRecognizingRef.current = true;
        } catch (e) {
        console.warn("Recognition start error on restart", e);
        }
    }
    };


    recognitionRef.current = recognition;

    if (listening) {
      try {
        recognition.start();
        isRecognizingRef.current = true;
      } catch {
        // Ignore if already started
      }
    }

    return () => {
      if (recognitionRef.current && isRecognizingRef.current) {
        recognitionRef.current.stop();
        isRecognizingRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  // Prompt mic permission once to avoid 'not-allowed' later
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      stream.getTracks().forEach((track) => track.stop()); // close mic
      console.log("Microphone access granted via getUserMedia");
    })
    .catch((err) => {
      console.warn("Microphone access denied via getUserMedia", err);
      setErrorMessage(
        "Microphone access denied. Please allow it in your browser settings."
      );
    });
}, []);


  useEffect(() => {
    if (!recognitionRef.current) return;

    if (listening) {
      if (!isRecognizingRef.current) {
        try {
          recognitionRef.current.start();
          isRecognizingRef.current = true;
        } catch {
          // Ignore error if recognition already started
        }
      }
    } else {
      if (isRecognizingRef.current) {
        recognitionRef.current.stop();
        isRecognizingRef.current = false;
      }
    }
  }, [listening]);

  const handleVoiceCommand = (command: string) => {
    let sanMove = command.trim();

    if (sanMove.toLowerCase().startsWith("move ")) {
      sanMove = sanMove.slice(5).trim();
    }

    const pieceMap: Record<string, string> = {
      pawn: "",
      bishop: "B",
      knight: "N",
      rook: "R",
      queen: "Q",
      king: "K",
    };

    const pieceNamePattern = new RegExp(
      `\\b(${Object.keys(pieceMap).join("|")})\\b`,
      "gi"
    );

    sanMove = sanMove.replace(pieceNamePattern, (match) => {
      return pieceMap[match.toLowerCase()] || "";
    });

    sanMove = sanMove.replace(/\b(takes|capture|captures)\b/gi, "x");

    if (/king castle kingside/i.test(command)) {
      sanMove = "O-O";
    } else if (/king castle queenside/i.test(command)) {
      sanMove = "O-O-O";
    }

    sanMove = sanMove.replace(/([BNRQK])\s+([a-h][1-8])/gi, "$1$2");
    sanMove = sanMove.replace(/([BNRQK])\s*x\s*([a-h][1-8])/gi, "$1x$2");

    // --- FIX: Capitalize pieces but keep squares lowercase ---
    sanMove = sanMove.replace(/([bnrqk])/gi, (m) => m.toUpperCase()); // pieces uppercase
    sanMove = sanMove.replace(/([a-h])([1-8])/gi, (m, file, rank) => file.toLowerCase() + rank); // squares lowercase

    sanMove = sanMove.trim();

    if (sanMove.length === 0) {
      alert(`Could not parse command: "${command}"`);
      return;
    }

    onMoveCommand(sanMove);
  };

  return (
    <div style={{ margin: "10px", userSelect: "none" }}>
      <button
        onClick={listening ? stopListening : startListening}
        style={{ padding: "8px 16px", fontSize: "16px", cursor: "pointer" }}
        aria-pressed={listening}
      >
        {listening ? "Stop Voice Commands" : "Start Voice Commands"}
      </button>

      <div style={{ marginTop: 8, fontSize: 14, minHeight: 20 }}>
        {listening ? (
          <span role="status" aria-live="polite">
            🎤 Listening... Last heard:{" "}
            <strong>{lastTranscript || "..."}</strong>
          </span>
        ) : (
          <span role="status" aria-live="polite" style={{ color: "#888" }}>
            🎙 Voice commands are off
          </span>
        )}
      </div>

      {errorMessage && (
        <div
            style={{
            marginTop: 4,
            color: "red",
            fontSize: 12,
            textAlign: "center", // <-- Added this line
            }}
            role="alert"
        >
            ⚠️ {errorMessage}
        </div>
        )}

    </div>
  );
};

export default VoiceControl;
