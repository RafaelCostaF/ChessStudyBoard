import React, { useEffect, useRef, useState } from "react";

interface VoiceControlProps {
  onMoveCommand: (sanMove: string) => void;
  listening: boolean;
  startListening: () => void;
  stopListening: () => void;
  language?: string; // <-- Optional prop for recognition language
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
  language = "en-US", // <-- ✅ Default to "en-US"
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
    recognition.lang = language; // ✅ Use prop instead of hardcoded value
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

    // Reject direct SAN inputs like "Nf3", but allow "knight f3"
    if (/^[NBRQK][a-h][1-8]$/i.test(sanMove)) {
      alert(`Direct SAN moves like "${sanMove}" are not allowed. Please say the move like "knight f3".`);
      return;
    }

    if (sanMove.toLowerCase().startsWith("move ")) {
      sanMove = sanMove.slice(5).trim();
    }

    // Map of all accepted synonyms (multilingual) to SAN notation
    const synonymMap: Record<string, string> = {
      // Knight
      knight: "N",
      night: "N",
      cavalo: "N",        // Portuguese
      caballo: "N",       // Spanish
      cheval: "N",        // French
      pferd: "N",         // German
      // Bishop
      bishop: "B",
      bispo: "B",         // Portuguese
      alfil: "B",         // Spanish
      fou: "B",           // French
      läufer: "B",        // German
      // Rook
      rook: "R",
      torre: "R",         // Portuguese/Spanish
      tour: "R",          // French
      turm: "R",          // German
      // Queen
      queen: "Q",
      dama: "Q",          // Portuguese/Spanish
      reine: "Q",         // French
      königin: "Q",       // German
      // King
      king: "K",
      rei: "K",           // Portuguese
      rey: "K",           // Spanish
      roi: "K",           // French
      könig: "K",         // German
      // Pawn
      pawn: "",           // SAN uses empty string for pawn
      peão: "",           // Portuguese
      peon: "",           // Spanish
      pion: "",           // French/German
    };


    // Create dynamic pattern based on all known synonyms
  const pieceNamePattern = new RegExp(
    `\\b(${Object.keys(synonymMap).join("|")})\\b`,
    "gi"
  );

  // Replace all synonyms with their SAN equivalent
  sanMove = sanMove.replace(pieceNamePattern, (match) => {
    return synonymMap[match.toLowerCase()] || "";
  });


    sanMove = sanMove.replace(pieceNamePattern, (match) => {
      return pieceMap[match.toLowerCase()] || "";
    });

    sanMove = sanMove.replace(/\b(takes|take|capture|captures|captura|prende|nimmt)\b/gi, "x");


    if (/king castle kingside/i.test(command)) {
      sanMove = "O-O";
    } else if (/king castle queenside/i.test(command)) {
      sanMove = "O-O-O";
    }

    sanMove = sanMove.replace(/([BNRQK])\s+([a-h][1-8])/gi, "$1$2");
    sanMove = sanMove.replace(/([BNRQK])\s*x\s*([a-h][1-8])/gi, "$1x$2");

    // Capitalize pieces, lowercase squares
    sanMove = sanMove.replace(/([bnrqk])/gi, (m) => m.toUpperCase());
    sanMove = sanMove.replace(/([a-h])([1-8])/gi, (m, file, rank) => file.toLowerCase() + rank);

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
