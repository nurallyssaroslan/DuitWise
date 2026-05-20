/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Check, AlertTriangle, Calendar, Tag, Info,
  UploadCloud, RefreshCw, Pizza, Coffee, Car, Printer, ShoppingBag, Sparkles, CircleEllipsis, Trash2,
  Mic, MicOff, Camera, Video
} from 'lucide-react';
import { Expense, CATEGORIES, SurvivalMetrics } from '../types';
import Tesseract from 'tesseract.js';

interface RecordExpenseProps {
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onCancel: () => void;
  metrics: SurvivalMetrics;
}

export default function RecordExpense({ onAddExpense, onCancel, metrics }: RecordExpenseProps) {
  // Input Form States
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('food');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string>('');

  // Tab Control State: manual, voice, upload
  const [activeMode, setActiveMode] = useState<'manual' | 'voice' | 'upload'>('manual');

  // Voice Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  const [voiceSimulationInput, setVoiceSimulationInput] = useState('');

  // AI OCR States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string>('');
  const [ocrError, setOcrError] = useState<string>('');

  // Live Camera Preview States and Refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const [scanSubMode, setScanSubMode] = useState<'camera' | 'file'>('camera');

  // Set default date to today
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setDate(`${year}-${month}-${day}`);
  }, []);

  // Compute budget safety warning impact
  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      const simulatedRemain = metrics.remainingBalance - numAmount;
      const days = metrics.daysUntilNextAllowance;
      
      if (simulatedRemain <= 0) {
        setWarningMessage('🚨 Warning: This single expense will fully deplete your budget!');
      } else if (days > 0) {
        const simulatedSafeDaily = simulatedRemain / days;
        if (simulatedSafeDaily < metrics.safeDailySpendingLimit) {
          setWarningMessage(
            `Impact: Your safe daily limit will drop from RM ${metrics.safeDailySpendingLimit.toFixed(2)} to RM ${simulatedSafeDaily.toFixed(2)}`
          );
        } else {
          setWarningMessage('');
        }
      }
    } else {
      setWarningMessage('');
    }
  }, [amount, metrics]);

  // Core receipt text parsing algorithm
  const parseReceiptText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    let detectedAmount: number | null = null;
    let detectedMerchant = '';
    let detectedDate = '';
    let detectedCategory = 'others';

    // 1. Merchant Detection
    const phonePattern = /(phone|tel|contact|\+\d|0\d[- ]\d{4})/i;
    const addressPattern = /(st\.|street|road|jalan|avenue|ave|mall|plaza|floor|level|suite|unit)/i;
    const numberOnlyPattern = /^[\d\s\-\/\\:.,()]+$/;
    const logoDummyText = /(receipt|invoice|tax|bill|welcome|kopitiam|cashier|member|guest|trans|order|date|time)/i;
    
    let merchantCandidate = '';
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      if (
        line.length > 3 && 
        !phonePattern.test(line) && 
        !addressPattern.test(line) &&
        !numberOnlyPattern.test(line) &&
        !logoDummyText.test(line)
      ) {
        const cleaned = line.replace(/[*#=\-_+:[\]()|]/g, '').trim();
        if (cleaned.length > 3) {
          merchantCandidate = cleaned;
          break;
        }
      }
    }
    
    if (merchantCandidate) {
      detectedMerchant = merchantCandidate.substring(0, 35);
    }

    // 2. Date Detection
    let dateCandidate = '';
    const dateRegexes = [
      /\b(202\d)[-\/.](0[1-9]|1[0-2])[-\/.](0[1-9]|[12]\d|3[01])\b/, // YYYY-MM-DD
      /\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-\/.](202\d)\b/, // DD/MM/YYYY
      /\b(0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])[-\/.](202\d)\b/, // MM/DD/YYYY
    ];

    for (const line of lines) {
      let matched = false;
      for (const regex of dateRegexes) {
        const match = line.match(regex);
        if (match) {
          if (regex === dateRegexes[0]) {
            dateCandidate = `${match[1]}-${match[2]}-${match[3]}`;
          } else if (regex === dateRegexes[1]) {
            dateCandidate = `${match[3]}-${match[2]}-${match[1]}`;
          } else {
            dateCandidate = `${match[3]}-${match[1]}-${match[2]}`;
          }
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    detectedDate = dateCandidate;

    // 3. Category Detection
    const lowercaseText = text.toLowerCase();
    const foodWords = ['lunch', 'dinner', 'nasi', 'ayam', 'drink', 'cafe', 'coffee', 'meal', 'food', 'breakfast', 'makan', 'restoran', 'burger', 'kfc', 'mcd', 'starbucks', 'maggi', 'noodle', 'tea', 'bread', 'teh', 'kopi', 'bakery', 'restaurant', 'coke', 'soda', 'pizza', 'steamboat', 'menu', 'sushi', 'dunkin'];
    const transportWords = ['bus', 'grab', 'train', 'taxi', 'car', 'petrol', 'mrt', 'lrt', 'ride', 'fare', 'toll', 'gas', 'shell', 'petronas', 'caltex', 'parking', 'tiket', 'ticket'];
    const studyWords = ['book', 'pen', 'exam', 'stationary', 'stationery', 'library', 'tuition', 'photocopy', 'print', 'class', 'textbook', 'fees', 'paper', 'binder', 'stapler', 'printing'];
    const socialWords = ['movie', 'cinema', 'party', 'gift', 'leisure', 'hangout', 'outing', 'concert', 'game', 'club', 'karaoke', 'unlimited', 'gsc', 'tgv', 'ticket', 'museum'];
    const rentWords = ['rent', 'room', 'hostel', 'bill', 'utility', 'electricity', 'water', 'wifi', 'internet', 'tnb', 'telekom', 'unifi'];

    if (foodWords.some(word => lowercaseText.includes(word))) {
      detectedCategory = 'food';
    } else if (transportWords.some(word => lowercaseText.includes(word))) {
      detectedCategory = 'transport';
    } else if (studyWords.some(word => lowercaseText.includes(word))) {
      detectedCategory = 'study';
    } else if (socialWords.some(word => lowercaseText.includes(word))) {
      detectedCategory = 'social';
    } else if (rentWords.some(word => lowercaseText.includes(word))) {
      detectedCategory = 'rent';
    }

    // 4. Amount Detection: Specific User requirement
    const totalKeywords = ['total', 'jumlah', 'amount'];
    const rmKeyword = ['rm'];

    let primaryCandidates: { value: number; index: number }[] = [];
    let secondaryRmCandidates: { value: number; index: number }[] = [];
    let genericCandidates: { value: number; index: number }[] = [];

    lines.forEach((line, idx) => {
      const lowercaseLine = line.toLowerCase();
      const matches = [...lowercaseLine.matchAll(/(?:\b|\s|rm|rm\s*)(\d+\.\d{2})\b/g)];
      if (matches.length > 0) {
        matches.forEach(match => {
          const val = parseFloat(match[1]);
          if (isNaN(val) || val <= 0) return;

          const hasTotalKeyword = totalKeywords.some(kw => lowercaseLine.includes(kw));
          const hasRmKeyword = rmKeyword.some(kw => lowercaseLine.includes(kw));

          if (hasTotalKeyword) {
            primaryCandidates.push({ value: val, index: idx });
          } else if (hasRmKeyword) {
            secondaryRmCandidates.push({ value: val, index: idx });
          } else {
            genericCandidates.push({ value: val, index: idx });
          }
        });
      }
    });

    if (primaryCandidates.length > 0) {
      primaryCandidates.sort((a,b) => b.value - a.value);
      detectedAmount = primaryCandidates[0].value;
    } else {
      let totalLineIndex = -1;
      lines.forEach((line, idx) => {
        const lowercaseLine = line.toLowerCase();
        if (totalKeywords.some(kw => lowercaseLine.includes(kw))) {
          totalLineIndex = idx;
        }
      });

      if (totalLineIndex !== -1) {
        let allNumberedCandidates: { value: number; index: number; dist: number }[] = [];
        
        lines.forEach((line, idx) => {
          const matches = [...line.matchAll(/(?:\b|\s|rm|rm\s*)(\d+\.\d{2})\b/gi)];
          matches.forEach(match => {
            const val = parseFloat(match[1]);
            if (!isNaN(val) && val > 0) {
              allNumberedCandidates.push({ value: val, index: idx, dist: Math.abs(idx - totalLineIndex) });
            }
          });
        });

        if (allNumberedCandidates.length > 0) {
          allNumberedCandidates.sort((a,b) => a.dist - b.dist);
          detectedAmount = allNumberedCandidates[0].value;
        }
      }
    }

    if (detectedAmount === null && secondaryRmCandidates.length > 0) {
      secondaryRmCandidates.sort((a,b) => b.value - a.value);
      detectedAmount = secondaryRmCandidates[0].value;
    }

    if (detectedAmount === null && genericCandidates.length > 0) {
      genericCandidates.sort((a,b) => b.value - a.value);
      detectedAmount = genericCandidates[0].value;
    }

    return {
      amount: detectedAmount !== null ? detectedAmount.toString() : '',
      description: detectedMerchant ? `${detectedMerchant} receipt` : 'Uploaded receipt',
      category: detectedCategory,
      date: detectedDate
    };
  };

  // Run OCR on Uploaded image
  const runReceiptOcr = async (file: File) => {
    setIsOcrLoading(true);
    setOcrStatus('Reading receipt...');
    setOcrError('');

    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      console.log("OCR parsed text:", text);

      const parsed = parseReceiptText(text);

      if (parsed.amount) {
        setAmount(parsed.amount);
      } else {
        setAmount('');
      }
      if (parsed.description) setDescription(parsed.description);
      if (parsed.category) {
        const isKnown = CATEGORIES.some(cat => cat.value === parsed.category);
        setCategory(isKnown ? parsed.category : 'others');
      }
      if (parsed.date) {
        setDate(parsed.date);
      } else {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
      }

      setOcrStatus('Extracted successfully!');
      // Take them to manual form to view/edit after extraction
      setTimeout(() => {
        setActiveMode('manual');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setOcrError('OCR engine error. Please check the receipt format or upload another receipt.');
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setOcrError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      runReceiptOcr(file);
    }
  };

  // Turn off current camera capture streams
  const stopCameraStream = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
    setVideoStream(null);
    setIsCameraActive(false);
  };

  // Turn on live camera video streaming
  const startCamera = async () => {
    setCameraError('');
    setOcrError('');
    setIsCameraActive(false);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      activeStreamRef.current = stream;
      setVideoStream(stream);
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera hardware access denied/error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Camera access denied by browser permission settings! Please allow camera permissions to scan receipts.");
      } else {
        setCameraError(`Could not initialize camera: ${err.message || 'No camera found'}. Please upload a receipt file instead!`);
      }
    }
  };

  // Take picture frame and run Tesseract OCR analysis
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const videoElem = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = videoElem.videoWidth || 640;
      canvas.height = videoElem.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "captured_receipt.png", { type: "image/png" });
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setImagePreviewUrl(url);
            
            // Turn off camera view once snapped
            stopCameraStream();
            
            // Analyse snapped photo text
            runReceiptOcr(file);
          }
        }, 'image/png');
      }
    } catch (err) {
      console.error("Camera snapshot capture error:", err);
      setOcrError("Failed to freeze and capture image from camera stream.");
    }
  };

  // Cleanup/Restart stream dynamically when tab modes or component resets
  useEffect(() => {
    if (activeMode === 'upload' && scanSubMode === 'camera') {
      startCamera();
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [activeMode, scanSubMode]);

  // Handle dynamic attachment of stream sources on DOM changes
  useEffect(() => {
    if (isCameraActive && videoStream && videoRef.current) {
      videoRef.current.srcObject = videoStream;
      videoRef.current.play().catch(e => {
        console.warn("Autoplay blocked or halted:", e);
      });
    }
  }, [isCameraActive, videoStream]);

  // Core spoken text parsing algorithm
  const parseSpokenSpendingText = (text: string) => {
    const wordToNumberMap: { [key: string]: number } = {
      zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
      ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
      seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
      sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
      satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, lapan: 8, sembilan: 9, sepuluh: 10
    };

    const convertSpokenNumbersToDigits = (phrase: string): string => {
      let t = phrase.toLowerCase().replace(/-/g, ' ');
      const words = t.split(/\s+/).filter(Boolean);
      const result: string[] = [];
      let i = 0;
      
      while (i < words.length) {
        const word = words[i];
        const nextWord = i + 1 < words.length ? words[i+1] : '';
        
        const isTens = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'].includes(word);
        const isOnes = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'].includes(nextWord);
        
        if (isTens && isOnes) {
          const tensVal = wordToNumberMap[word];
          const onesVal = wordToNumberMap[nextWord];
          result.push((tensVal + onesVal).toString());
          i += 2;
        } else if (wordToNumberMap[word] !== undefined) {
          result.push(wordToNumberMap[word].toString());
          i++;
        } else {
          result.push(word);
          i++;
        }
      }
      
      return result.join(' ');
    };

    const normalized = convertSpokenNumbersToDigits(text);
    const lowercase = normalized.toLowerCase();
    
    // Amount extraction
    let parsedAmount = '';
    const prefixMatch = lowercase.match(/(?:rm|ringgit|spent|bayar|harga)\s*(\d+(?:\.\d+)?)/i);
    const suffixMatch = lowercase.match(/(\d+(?:\.\d+)?)\s*(?:ringgit|rm|ringgits)/i);
    const generalNumMatch = lowercase.match(/(\d+(?:\.\d+)?)/);
    
    if (prefixMatch && prefixMatch[1]) {
      parsedAmount = prefixMatch[1];
    } else if (suffixMatch && suffixMatch[1]) {
      parsedAmount = suffixMatch[1];
    } else if (generalNumMatch) {
      parsedAmount = generalNumMatch[0];
    }

    // Category detection based on preset student budget keywords
    let category = 'others';
    const foodWords = ['lunch', 'dinner', 'nasi', 'ayam', 'drink', 'cafe', 'coffee', 'meal', 'food', 'breakfast', 'makan', 'restoran', 'burger', 'kfc', 'mcd', 'starbucks', 'maggi', 'noodle', 'tea', 'bread', 'teh', 'kopi', 'bakery', 'restaurant', 'coke', 'soda', 'pizza', 'steamboat', 'menu', 'sushi', 'dunkin'];
    const transportWords = ['bus', 'grab', 'train', 'taxi', 'car', 'petrol', 'mrt', 'lrt', 'ride', 'fare', 'toll', 'gas', 'shell', 'petronas', 'caltex', 'parking', 'tiket', 'ticket'];
    const studyWords = ['book', 'pen', 'exam', 'stationary', 'stationery', 'library', 'tuition', 'photocopy', 'print', 'class', 'textbook', 'fees', 'paper', 'binder', 'stapler', 'printing'];
    const socialWords = ['movie', 'cinema', 'party', 'gift', 'leisure', 'hangout', 'outing', 'concert', 'game', 'club', 'karaoke', 'unlimited', 'gsc', 'tgv', 'ticket', 'museum'];
    const rentWords = ['rent', 'room', 'hostel', 'bill', 'utility', 'electricity', 'water', 'wifi', 'internet', 'tnb', 'telekom', 'unifi'];

    if (foodWords.some(word => lowercase.includes(word))) {
      category = 'food';
    } else if (transportWords.some(word => lowercase.includes(word))) {
      category = 'transport';
    } else if (studyWords.some(word => lowercase.includes(word))) {
      category = 'study';
    } else if (socialWords.some(word => lowercase.includes(word))) {
      category = 'social';
    } else if (rentWords.some(word => lowercase.includes(word))) {
      category = 'rent';
    }

    // Description extraction by cleaning standard helper noises
    let cleanDesc = normalized;
    cleanDesc = cleanDesc.replace(/\b(i spent|spent|spend|purchased|bought|paid|paying for|paid for|buy|bought|my|saya|beli|bayar)\b/gi, '');
    cleanDesc = cleanDesc.replace(/(?:rm|ringgit)?\s*\d+(?:\.\d+)?\s*(?:ringgit|rm)?/gi, '');
    cleanDesc = cleanDesc.replace(/\b(on|for|a|an|the|at|some|of|worth|untuk|bagi)\b/gi, ' ');
    cleanDesc = cleanDesc.trim().replace(/\s+/g, ' ');

    if (!cleanDesc) {
      cleanDesc = 'Voice recorded transaction';
    }

    // Capitalize first letter
    cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);

    return {
      amount: parsedAmount,
      description: cleanDesc,
      category
    };
  };

  const startVoiceRecognition = async () => {
    setSpeechError('');
    setSpeechTranscript('');

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechError("Microphone speech-to-text is not supported by your browser. Please try on Chrome or Safari, or simulate your spoken text in the input box below!");
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err: any) {
      console.warn("Microphone permission denied:", err);
      setSpeechError("Microphone permission was denied. Please allow microphone access or use the simulation console below!");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcriptText = event.results[0][0].transcript;
          setSpeechTranscript(transcriptText);

          const parsed = parseSpokenSpendingText(transcriptText);

          if (parsed.amount) setAmount(parsed.amount);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.category) setCategory(parsed.category);

          setTimeout(() => {
            setIsListening(false);
            setActiveMode('manual');
          }, 1500);
        }
      };

      recognition.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
        const errType = e.error || 'unknown';
        if (errType === 'not-allowed') {
          setSpeechError("Microphone access is blocked by browser permission policy. Please use our simulation panel below!");
        } else {
          setSpeechError(`Voice input error: ${errType}. Use our simulator below!`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error("Speech Recognition setup error:", err);
      setIsListening(false);
      setSpeechError("Could not start Speech Recognition engine. Please simulate your speech below!");
    }
  };

  const runVoiceSimulation = (text: string) => {
    if (!text.trim()) return;
    setSpeechTranscript(text);
    const parsed = parseSpokenSpendingText(text);
    if (parsed.amount) setAmount(parsed.amount);
    if (parsed.description) setDescription(parsed.description);
    if (parsed.category) setCategory(parsed.category);
    setTimeout(() => {
      setActiveMode('manual');
    }, 1200);
  };

  const removeReceipt = () => {
    setImageFile(null);
    setImagePreviewUrl('');
    setOcrStatus('');
    setOcrError('');
    stopCameraStream();
    if (activeMode === 'upload' && scanSubMode === 'camera') {
      startCamera();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please specify a valid expense amount.');
      return;
    }

    if (!description.trim()) {
      setError('Please specify an item description/name (e.g. Lunch at Cafe).');
      return;
    }

    if (!category) {
      setError('Please select an expense category.');
      return;
    }

    if (!date) {
      setError('Please provide the date of the expense.');
      return;
    }

    onAddExpense({
      amount: parsedAmount,
      category,
      description: description.trim(),
      date
    });
  };

  return (
    <div id="record-expense-view" className="max-w-xl mx-auto py-4 font-sans">
      <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-[#e5e5d1]">
        
        {/* Header navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => {
              removeReceipt();
              onCancel();
            }}
            className="p-2 ml-[-8px] text-[#7a7a6a] hover:text-[#5A5A40] hover:bg-[#f5f5f0] rounded-xl transition-all inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft size={16} />
            Discard
          </button>
          <span className="text-[10px] text-[#8a8a7a] font-mono tracking-wider font-semibold uppercase bg-[#f5f5f0] px-2 py-0.5 rounded border border-[#e5e5d1]">
            SECURE LEDGER RECORD
          </span>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-serif italic text-[#5A5A40] tracking-tight block font-bold">
            Log Spent
          </h2>
          <p className="text-[#8a8a7a] text-xs mt-1 leading-relaxed">
            Quickly log your student budget expenses. Choose one of our swift entry options below.
          </p>
        </div>

        {/* Mode Selector - Intelligent Segmented Controls */}
        <div className="grid grid-cols-3 bg-[#f5f5f0] p-1.5 rounded-2xl border border-[#e5e5d1] mb-6">
          <button
            type="button"
            onClick={() => setActiveMode('manual')}
            className={`py-2.5 text-xs font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer ${
              activeMode === 'manual'
                ? 'bg-[#5A5A40] text-white shadow-sm'
                : 'text-[#8a8a7a] hover:text-[#5A5A40]'
            }`}
          >
            Manual Form
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('voice')}
            className={`py-2.5 text-xs font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 lg:gap-2 ${
              activeMode === 'voice'
                ? 'bg-[#5A5A40] text-white shadow-sm'
                : 'text-[#8a8a7a] hover:text-[#5A5A40]'
            }`}
          >
            <Mic size={13} className={activeMode === 'voice' ? 'text-[#D4A373]' : 'text-[#8a8a7a]'} />
            Voice Input
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`py-2.5 text-xs font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 lg:gap-2 ${
              activeMode === 'upload'
                ? 'bg-[#5A5A40] text-white shadow-sm'
                : 'text-[#8a8a7a] hover:text-[#5A5A40]'
            }`}
          >
            <Camera size={13} className={activeMode === 'upload' ? 'text-[#D4A373]' : 'text-[#8a8a7a]'} />
            Scan Receipt
          </button>
        </div>

        {/* Error Notification Block */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-[#a34444] rounded-2xl text-xs flex items-start gap-2.5 mb-5" id="record-error">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {/* --- VIEW 1: MANUAL FORM --- */}
        {activeMode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount with numerical display */}
            <div className="bg-[#fcf8f2] p-5 rounded-2xl border border-[#D4A373]/30">
              <label className="block text-[10px] font-bold text-[#8a8a7a] uppercase tracking-widest mb-2 font-mono">
                Expend Amount (RM)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-1 flex items-center text-2xl font-black text-[#5A5A40] font-mono">
                  RM
                </span>
                <input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-12 pr-4 py-1.5 bg-transparent border-b-2 border-[#e5e5d1] focus:border-[#D4A373] focus:outline-none transition-all text-2xl font-bold text-[#3d3d33] font-mono"
                  autoFocus
                />
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Tag size={12} className="text-[#D4A373]" />
                Allowance Sub-Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-20 ${
                        isSelected 
                          ? 'border-[#5A5A40] bg-[#5A5A40] text-white shadow-md' 
                          : 'border-[#e5e5d1] bg-[#fcfcf7] hover:bg-[#f5f5f0] text-[#3d3d33]'
                      } cursor-pointer`}
                    >
                      <span className="text-[11px] font-semibold leading-none tracking-tight">
                        {cat.label}
                      </span>
                      <span className={`text-[10px] self-end font-extrabold ${isSelected ? 'text-[#D4A373]' : 'text-[#8a8a7a]'}`}>
                        {isSelected ? 'ACTIVE' : 'CHOOSE'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#7a7a6a] uppercase tracking-widest mb-1.5 ml-1">
                Expense Description
              </label>
              <input
                id="expense-desc"
                type="text"
                required
                placeholder="e.g. McD double cheeseburger combo"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f0] border border-[#e5e5d1] rounded-2xl focus:border-[#5A5A40] focus:bg-white focus:outline-none transition-all text-sm text-[#3d3d33]"
              />
            </div>

            {/* Expense Date Picker */}
            <div>
              <label className="block text-xs font-bold text-[#7a7a6a] uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-[#8a8a7a]" />
                Transaction Timestamp
              </label>
              <input
                id="expense-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f0] border border-[#e5e5d1] rounded-2xl focus:border-[#5A5A40] focus:bg-white focus:outline-none transition-all text-sm font-semibold text-[#3d3d33] font-mono"
              />
            </div>

            {/* Dynamic limits safety impact */}
            {warningMessage && (
              <div className="p-4 bg-[#fdf8f2] border border-[#D4A373]/30 rounded-2xl text-[#3d3d33] text-xs flex items-start gap-2.5">
                <Info size={16} className="text-[#D4A373] shrink-0 mt-0.5" />
                <p className="leading-normal font-medium">{warningMessage}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3.5 px-4 bg-[#f5f5f0] hover:bg-[#eaeae0] text-[#7a7a6a] text-xs font-bold tracking-widest uppercase rounded-2xl transition-all cursor-pointer text-center border border-[#e5e5d1]"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-expense-btn"
                className="flex-1 py-3.5 px-4 bg-[#5A5A40] hover:bg-[#4a4a34] hover:shadow-lg hover:shadow-[#5A5A40]/10 text-white text-xs font-bold tracking-widest uppercase rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Check size={16} />
                Save Record
              </button>
            </div>
          </form>
        )}

        {/* --- VIEW 2: WORKING MICROPHONE VOICE INPUT --- */}
        {activeMode === 'voice' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Mic size={14} className="text-[#D4A373]" />
              Smart Microphone Dictation
            </h3>
            <p className="text-xs text-[#8a8a7a] leading-relaxed">
              Describe your transaction in your own words, e.g. <span className="font-semibold text-[#5A5A40]">"I spent RM8 on nasi ayam"</span>. The system automatically processes the speech, extracts amount and merchant title, and targets the correct budget categories!
            </p>

            <div className="flex flex-col items-center justify-center p-8 bg-[#fdfdf7] border border-[#e5e5d1] rounded-[28px] text-center space-y-4">
              {isListening ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-24 h-24 rounded-full bg-[#D4A373]/20 animate-ping" />
                    <div className="absolute w-16 h-16 rounded-full bg-[#D4A373]/30 animate-pulse" />
                    <button
                      type="button"
                      onClick={() => setIsListening(false)}
                      className="relative z-10 p-5 bg-[#a34444] hover:bg-[#8d3737] text-white rounded-full transition-all cursor-pointer shadow-md duration-300 flex items-center justify-center"
                    >
                      <MicOff size={26} />
                    </button>
                  </div>
                  <div className="font-serif italic text-lg text-[#5A5A40] font-bold tracking-tight animate-pulse">
                    Listening to your voice...
                  </div>
                  <p className="text-xs text-[#8a8a7a] max-w-xs leading-relaxed">
                    Speak clearly. We are capturing your spending words live!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <button
                    type="button"
                    onClick={startVoiceRecognition}
                    className="p-5 bg-[#D4A373] hover:bg-[#c39262] text-white rounded-full transition-all cursor-pointer shadow-md hover:scale-105 duration-300 flex items-center justify-center"
                    id="start-voice-recon-btn"
                    title="Click to start listening"
                  >
                    <Mic size={28} />
                  </button>
                  <h4 className="text-sm font-bold text-[#5A5A40] uppercase tracking-wider font-mono">
                    Tap to start recording
                  </h4>
                  <p className="text-xs text-[#8a8a7a] max-w-xs leading-relaxed">
                    Starts listening. Requires browser microphone permissions.
                  </p>
                </div>
              )}

              {speechTranscript && (
                <div className="mt-4 p-4 bg-[#f5f5f0] border border-[#e5e5d1] rounded-2xl text-xs text-[#3d3d33] font-medium max-w-xs w-full">
                  🎤 Transcribed: <span className="italic font-semibold text-[#5A5A40]">"{speechTranscript}"</span>
                </div>
              )}

              {speechError && (
                <div className="text-left mt-4 p-3 bg-red-50 border border-red-100 rounded-2xl text-[11px] text-[#a34444] leading-relaxed max-w-xs w-full">
                  ⚠️ {speechError}
                </div>
              )}
            </div>

            {/* Simulated backup console block */}
            <div className="bg-[#f5f5f0]/85 border border-[#e5e5d1] rounded-[24px] p-5 space-y-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#5A5A40] uppercase tracking-wider font-mono">
                <Sparkles size={13} className="text-[#D4A373]" />
                <h3>Speech & Voice Parsing Simulator</h3>
              </div>
              <p className="text-[11px] text-[#8a8a7a] leading-relaxed">
                If the browser sandbox shuts off physical microphone access, type or tap a preset below to mock the spoken word processing directly:
              </p>

              <div className="space-y-2">
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    value={voiceSimulationInput}
                    onChange={(e) => setVoiceSimulationInput(e.target.value)}
                    placeholder="e.g. Spent RM8 on nasi ayam"
                    className="flex-1 px-3.5 py-2.5 bg-white border border-[#e5e5d1] rounded-xl text-xs text-[#3d3d33] focus:outline-none focus:border-[#5A5A40]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        runVoiceSimulation(voiceSimulationInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => runVoiceSimulation(voiceSimulationInput)}
                    disabled={!voiceSimulationInput.trim()}
                    className="px-4 py-2 bg-[#5A5A40] hover:bg-[#4a4a34] disabled:bg-[#d8d8c8] disabled:cursor-not-allowed text-white text-[11px] font-bold uppercase rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    Simulate
                  </button>
                </div>

                {/* Simulation presets cards for rapid testing */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    key="voice-set-1"
                    type="button"
                    onClick={() => {
                      setVoiceSimulationInput("eight ringgit for copy printing");
                      runVoiceSimulation("eight ringgit for copy printing");
                    }}
                    className="text-[10px] text-[#5A5A40] hover:text-[#D4A373] bg-white border border-[#e5e5d1] px-2 py-1.5 rounded-lg transition-all"
                  >
                    "eight ringgit for copy printing" 🖨️
                  </button>
                  <button
                    key="voice-set-2"
                    type="button"
                    onClick={() => {
                      setVoiceSimulationInput("spent ten ringgit on delicious lunch");
                      runVoiceSimulation("spent ten ringgit on delicious lunch");
                    }}
                    className="text-[10px] text-[#5A5A40] hover:text-[#D4A373] bg-white border border-[#e5e5d1] px-2 py-1.5 rounded-lg transition-all"
                  >
                    "spent ten ringgit on delicious lunch" 🍗
                  </button>
                  <button
                    key="voice-set-3"
                    type="button"
                    onClick={() => {
                      setVoiceSimulationInput("took taxi for RM twelve");
                      runVoiceSimulation("took taxi for RM twelve");
                    }}
                    className="text-[10px] text-[#5A5A40] hover:text-[#D4A373] bg-white border border-[#e5e5d1] px-2 py-1.5 rounded-lg transition-all"
                  >
                    "took taxi for RM twelve" 🚗
                  </button>
                  <button
                    key="voice-set-4"
                    type="button"
                    onClick={() => {
                      setVoiceSimulationInput("I bought a textbook");
                      runVoiceSimulation("I bought a textbook");
                    }}
                    className="text-[10px] text-[#5A5A40] hover:text-[#D4A373] bg-white border border-dashed border-[#e5e5d1] px-2 py-1.5 rounded-lg transition-all"
                    title="This preset has no amount. It leaves amount field blank for manual typing."
                  >
                    "I bought a textbook" 📚 (Empty amount fallback)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 3: LIVE CAMERA RECEIPT SCANNER & OCR --- */}
        {activeMode === 'upload' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Camera size={14} className="text-[#D4A373]" />
                Interactive Receipt Camera Scanner
              </h3>
              {isCameraActive && (
                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                  ● LIVE
                </span>
              )}
            </div>
            
            <p className="text-xs text-[#8a8a7a] leading-relaxed font-sans">
              Scan a store receipt using your device's live camera and our high-accuracy OCR engine to instantly extract prices, dates, and merchant titles!
            </p>

            {/* Sub-mode selector tabs */}
            <div className="grid grid-cols-2 p-1.5 bg-[#f5f5f0] rounded-2xl border border-[#e5e5d1]">
              <button
                type="button"
                onClick={() => {
                  setScanSubMode('camera');
                  setImagePreviewUrl('');
                }}
                className={`py-2 text-[11px] font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  scanSubMode === 'camera'
                    ? 'bg-[#5A5A40] text-white shadow-sm'
                    : 'text-[#8a8a7a] hover:text-[#5A5A40]'
                }`}
              >
                <Camera size={13} />
                Live Camera
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanSubMode('file');
                  stopCameraStream();
                  setImagePreviewUrl('');
                }}
                className={`py-2 text-[11px] font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  scanSubMode === 'file'
                    ? 'bg-[#5A5A40] text-white shadow-sm'
                    : 'text-[#8a8a7a] hover:text-[#5A5A40]'
                }`}
              >
                <UploadCloud size={13} />
                Upload Photo File
              </button>
            </div>

            {/* If we have a captured preview */}
            {imagePreviewUrl ? (
              <div className="relative rounded-[24px] overflow-hidden bg-[#f5f5f0] border border-[#e5e5d1] p-4 flex flex-col items-center justify-center space-y-4">
                <div className="relative max-h-56 w-full rounded-2xl overflow-hidden bg-white border border-[#e5e5d1]/60 flex items-center justify-center p-2">
                  <img
                    src={imagePreviewUrl}
                    alt="Captured Receipt"
                    className="max-h-52 object-contain rounded-xl shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 bg-[#5A5A40] text-white text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg shadow-sm">
                    {scanSubMode === 'camera' ? 'CAMERA SCAN' : 'PHOTO UPLOAD'}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
                  {scanSubMode === 'camera' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreviewUrl('');
                        startCamera();
                      }}
                      className="flex-1 py-2.5 px-4 bg-[#D4A373] hover:bg-[#c39262] text-white text-xs font-bold tracking-wider uppercase rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <Camera size={14} />
                      Retake Photo
                    </button>
                  ) : (
                    <>
                      <label 
                        htmlFor="upload-another-input"
                        className="flex-1 py-2.5 px-4 bg-[#D4A373] hover:bg-[#c39262] text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all shadow-sm active:translate-y-0.5 flex items-center justify-center gap-1.5 cursor-pointer text-center"
                      >
                        <UploadCloud size={14} />
                        Choose Different Photo
                      </label>
                      <input
                        type="file"
                        id="upload-another-input"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </>
                  )}

                  <button
                    type="button"
                    onClick={removeReceipt}
                    className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-[#a34444] border border-red-200 text-xs font-bold tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              /* If we don't have a preview yet */
              <div>
                {scanSubMode === 'camera' ? (
                  /* CAMERA SUB-MODE */
                  <div className="space-y-4">
                    {isCameraActive ? (
                      <div className="space-y-4">
                        <div className="relative rounded-[28px] overflow-hidden bg-black border border-[#e5e5d1] aspect-video w-full flex items-center justify-center shadow-inner">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform scale-x-102"
                          />
                          <div className="absolute inset-0 bg-[#D4A373]/5 pointer-events-none" />
                          <div className="absolute top-0 left-0 w-full h-[3px] bg-[#D4A373]/70 shadow-[0_0_12px_#D4A373] animate-bounce pointer-events-none" style={{ animationDuration: '3s' }} />
                          <div className="absolute bottom-3 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold text-white font-mono flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                            ENVIRONMENT CAMERA FEED
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={captureSnapshot}
                            className="flex-1 py-3 px-5 bg-[#D4A373] hover:bg-[#c39262] text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all shadow-md active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Camera size={15} />
                            Snap Receipt Photo
                          </button>
                          <button
                            type="button"
                            onClick={stopCameraStream}
                            className="py-3 px-4 bg-white hover:bg-[#fcfcd7] border border-[#e5e5d1] text-[#7a7a6a] text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                          >
                            Stop Feed
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={startCamera}
                        className="flex flex-col items-center justify-center p-8 bg-white hover:bg-[#fdfcf7] border border-[#e5e5d1] hover:border-[#D4A373] rounded-3xl cursor-pointer transition-all active:scale-98 group shadow-sm text-center space-y-4 animate-in zoom-in-95 duration-200"
                      >
                        <div className="p-4 bg-amber-50 text-[#D4A373] group-hover:bg-amber-100 rounded-full transition-colors flex items-center justify-center">
                          <Camera size={28} />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-[#5A5A40] uppercase tracking-wider font-mono">
                            Activate Live Camera Preview
                          </h4>
                          <p className="text-xs text-[#8a8a7a] mt-1 max-w-sm leading-relaxed">
                            Grant camera access to capture paper receipts in real time using your phone or web camera.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* FILE UPLOAD SUB-MODE */
                  <div className="border-2 border-dashed border-[#e5e5d1] hover:border-[#D4A373] hover:bg-[#fcfdf8] rounded-3xl p-8 text-center bg-white transition-all duration-300 group">
                    <input
                      type="file"
                      id="receipt-file-picker-mode"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <label 
                      htmlFor="receipt-file-picker-mode" 
                      className="cursor-pointer flex flex-col items-center justify-center gap-3 w-full h-full"
                    >
                      <div className="p-4 bg-[#fdfcf7] text-[#D4A373] group-hover:scale-105 transition-all rounded-full shadow-inner border border-[#e5e5d1]/30">
                        <UploadCloud size={32} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider font-mono">
                          Upload Receipt Photo File
                        </span>
                        <span className="block text-[11px] text-[#8a8a7a] mt-1 font-sans">
                          Click to select or drag and drop JPEG, PNG, or JPG files (Up to 10MB)
                        </span>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Camera connectivity warning */}
            {cameraError && scanSubMode === 'camera' && (
              <div className="p-3 bg-red-50/70 border border-red-100 text-[#a34444] rounded-2xl text-[11px] leading-relaxed flex items-start gap-1.5 shadow-sm">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Permissions / Hardware issue:</strong>
                  <span>{cameraError}</span>
                </div>
              </div>
            )}

            {/* OCR Status/Loading State */}
            {isOcrLoading && (
              <div className="p-4 bg-[#fdfaf2] border border-[#D4A373]/30 rounded-2xl flex items-center gap-3 justify-center animate-pulse shadow-sm animate-in zoom-in duration-100">
                <RefreshCw className="animate-spin text-[#D4A373]" size={16} />
                <span className="text-xs font-bold font-mono text-[#5A5A40]">Reading receipt...</span>
              </div>
            )}

            {ocrStatus && !isOcrLoading && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center gap-2 animate-in fade-in duration-300">
                <span className="text-xs font-bold text-emerald-800 font-mono">🎉 {ocrStatus}</span>
              </div>
            )}

            {ocrError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center gap-2 animate-in border-dashed">
                <span className="text-xs font-semibold text-[#a34444]">⚠️ {ocrError}</span>
              </div>
            )}

            {/* Note below upload area */}
            <p className="text-[11px] text-[#8a8a7a] text-center italic mt-2">
              "Receipt scanning may not be perfect. Please check the details before saving."
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
