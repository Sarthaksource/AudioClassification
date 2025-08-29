import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Play, Pause, Loader2 } from "lucide-react"; // added Loader2 icon
import humanImg from "./assets/images/human.jpg";
import robotImg from "./assets/images/robot.jpg";
import humanWav from "./assets/audio/human.wav";
import robotWav from "./assets/audio/robot.wav";
const API_URL = import.meta.env.VITE_API_URL;

// Overlay Button
function OverlayButton({ isPlaying, onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-2xl opacity-50 transition"
    >
      {isPlaying ? <Pause size={48} /> : <Play size={48} />}
    </button>
  );
}

// Simple Card component
function Card({ children, className, ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-md overflow-hidden relative ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function CardContent({ children, className }) {
  return <div className={`relative ${className}`}>{children}</div>;
}

export default function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false); // NEW
  const [humanAudio] = useState(new Audio(humanWav));
  const [robotAudio] = useState(new Audio(robotWav));
  const [playing, setPlaying] = useState({ human: false, robot: false });

  // Reset play state when audio finishes
  useEffect(() => {
    humanAudio.onended = () =>
      setPlaying((prev) => ({ ...prev, human: false }));
    robotAudio.onended = () =>
      setPlaying((prev) => ({ ...prev, robot: false }));

    return () => {
      humanAudio.onended = null;
      robotAudio.onended = null;
    };
  }, [humanAudio, robotAudio]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": [] },
    multiple: false,
  });

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const classify = async () => {
    if (!file) return;
    setLoading(true); // start loading
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/classify`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Classification error:", err);
    } finally {
      setLoading(false); // stop loading
    }
  };

  const togglePlay = (type) => {
    if (type === "human") {
      playing.human ? humanAudio.pause() : humanAudio.play();
      setPlaying({ ...playing, human: !playing.human });
    } else {
      playing.robot ? robotAudio.pause() : robotAudio.play();
      setPlaying({ ...playing, robot: !playing.robot });
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Audio Classifier</h1>

      {/* Image Cards */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="flex justify-center">
            <img
              src={humanImg}
              alt="Human"
              className="w-40 h-40 rounded-2xl shadow object-cover"
            />
            <OverlayButton
              isPlaying={playing.human}
              onClick={() => togglePlay("human")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex justify-center">
            <img
              src={robotImg}
              alt="Robot"
              className="w-40 h-40 rounded-2xl shadow object-cover"
            />
            <OverlayButton
              isPlaying={playing.robot}
              onClick={() => togglePlay("robot")}
            />
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl w-96 p-6 text-center mb-6 cursor-pointer ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-400"
        }`}
      >
        <input {...getInputProps()} onChange={handleFileChange} />
        {file ? (
          <p className="text-gray-700 font-medium">Selected: {file.name}</p>
        ) : isDragActive ? (
          <p className="text-blue-600">Drop the file here...</p>
        ) : (
          <p className="text-gray-600">Drag & Drop or Click to Select Audio</p>
        )}
      </div>

      {/* Classify Button */}
      <button
        className="px-4 py-2 rounded-2xl shadow bg-blue-500 text-white hover:bg-blue-600 mb-6 disabled:bg-gray-400 cursor-pointer flex items-center gap-2"
        onClick={classify}
        disabled={!file || loading}
      >
        {loading && <Loader2 className="animate-spin" size={20} />}
        {loading ? "Processing..." : "Classify"}
      </button>

      {/* Results */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <Loader2 className="animate-spin" size={24} />
          <span>Analyzing your audio...</span>
        </div>
      )}

      {result && !loading && (
        <table className="table-auto border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border px-4 py-2">Class</th>
              <th className="border px-4 py-2">Probability</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-4 py-2">Human</td>
              <td className="border px-4 py-2">
                {result.human_prob.toFixed(3)}
              </td>
            </tr>
            <tr>
              <td className="border px-4 py-2">AI</td>
              <td className="border px-4 py-2">{result.ai_prob.toFixed(3)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
