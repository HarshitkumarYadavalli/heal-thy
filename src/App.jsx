import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, collection, 
  query, getDocs, deleteDoc, orderBy 
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  Sparkles, Loader2, Salad, ChevronRight, UtensilsCrossed, Wheat, Droplet, Cookie, 
  Apple, Lightbulb, CheckCircle, User, Ruler, Scale, Ban, Dumbbell, Clock, 
  Target, ChevronLeft, Plus, Bell, BellOff, X, AlertTriangle, Shield, BarChart3, 
  Database, Users, Key, Upload, FileText, RefreshCw, LogOut, Heart, Sun, Moon,
  Flame, Calendar, Edit3, PlusCircle, Coffee, Trash
} from 'lucide-react';

// This is a real Vite project. Vite ONLY exposes env vars through
// import.meta.env.VITE_XXX (replaced at build time). Do NOT use
// process.env or window globals here — they are not populated in a
// Vite browser bundle and mixing them back in just reintroduces bugs.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY;

const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
  !firebaseConfig.apiKey.startsWith('YOUR_') &&
  firebaseConfig.apiKey !== 'PLACEHOLDER'
);

let app;
let db;
let auth;
let functions;

if (isFirebaseConfigured) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    db = getFirestore(app);
    auth = getAuth(app);
    functions = getFunctions(app);
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
}

const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'main': return <UtensilsCrossed className="w-5 h-5 text-teal-600 shrink-0" />;
    case 'carb': return <Wheat className="w-5 h-5 text-amber-600 shrink-0" />;
    case 'side': return <Salad className="w-5 h-5 text-emerald-600 shrink-0" />;
    case 'probiotic': return <Droplet className="w-5 h-5 text-blue-600 shrink-0" />;
    case 'dessert': return <Cookie className="w-5 h-5 text-rose-600 shrink-0" />;
    default: return <Apple className="w-5 h-5 text-gray-600 shrink-0" />;
  }
};

// Seed mock database profiles so Admin has profiles to view and download immediately
const seedMockDatabase = () => {
  const existing = localStorage.getItem('heal_thy_registered_users');
  if (!existing) {
    const mockUsers = [
      {
        id: 'usr-1',
        name: 'Alice Vance',
        email: 'alice@example.com',
        password: 'password123',
        onboardingCompleted: true,
        onboardingData: {
          age: '29',
          gender: 'Female',
          heightUnit: 'metric',
          heightCm: '165',
          weightUnit: 'metric',
          weightKg: '58',
          dietType: 'Vegetarian',
          allergies: ['Peanuts', 'Gluten'],
          mealsPerDay: '3 meals',
          routine: 'Mostly active (on your feet)',
          experience: 'Experienced',
          daysPerWeek: 5,
          minsPerDay: 45,
          startingPoint: 'High-Protein Meal Plan',
          calculatedHeightCm: 165,
          calculatedWeightKg: 58,
          bmr: 1332,
          tdee: 2298
        },
        goals: { calories: 2298, water: 8, protein: 90 },
        dailyLogs: [
          { id: 'log-1', text: 'Scrambled paneer and roti', calories: 450, protein: 22, carbs: 45, fat: 18, timestamp: '08:30 AM' },
          { id: 'log-2', text: 'Mixed sprout salad and curd', calories: 300, protein: 15, carbs: 35, fat: 8, timestamp: '01:15 PM' }
        ],
        logHistory: ['2026-06-21', '2026-06-20', '2026-06-19', '2026-06-18', '2026-06-16', '2026-06-15'],
        achievementHistory: [
          { date: '2026-06-20', achievements: ['Calories', 'Water'], note: 'Hit calorie & hydration targets!' },
          { date: '2026-06-19', achievements: ['Water'], note: 'Hydration goal met!' },
          { date: '2026-06-18', achievements: ['Protein', 'Water'], note: 'Hit protein & hydration targets!' }
        ]
      },
      {
        id: 'usr-2',
        name: 'Bob Miller',
        email: 'bob@example.com',
        password: 'password123',
        onboardingCompleted: true,
        onboardingData: {
          age: '35',
          gender: 'Male',
          heightUnit: 'metric',
          heightCm: '180',
          weightUnit: 'metric',
          weightKg: '88',
          dietType: 'Non-vegetarian',
          allergies: [],
          mealsPerDay: '5 small meals',
          routine: 'Mostly sedentary (desk job/studying)',
          experience: 'Complete beginner',
          daysPerWeek: 3,
          minsPerDay: 30,
          startingPoint: 'Learn to Track Calories',
          calculatedHeightCm: 180,
          calculatedWeightKg: 88,
          bmr: 1830,
          tdee: 2196
        },
        goals: { calories: 2196, water: 10, protein: 130 },
        dailyLogs: [],
        logHistory: ['2026-06-21', '2026-06-20'],
        achievementHistory: [
          { date: '2026-06-20', achievements: ['Water'], note: 'Hydration goal met!' }
        ]
      },
      {
        id: 'usr-3',
        name: 'Charlie Smith',
        email: 'charlie@example.com',
        password: 'password123',
        onboardingCompleted: false,
        onboardingData: null,
        goals: { calories: 2000, water: 8, protein: 100 },
        dailyLogs: [],
        logHistory: []
      }
    ];
    localStorage.setItem('heal_thy_registered_users', JSON.stringify(mockUsers));
  }
};

const calculateStreak = (history) => {
  if (!history || history.length === 0) return 0;
  const sorted = [...new Set(history)].sort((a, b) => new Date(b) - new Date(a));
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let checkDate = new Date(today);
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (!sorted.includes(todayStr) && !sorted.includes(yesterdayStr)) {
    return 0; // Streak broken
  }
  
  if (!sorted.includes(todayStr) && sorted.includes(yesterdayStr)) {
    checkDate = new Date(yesterday);
  }
  
  while (true) {
    const checkStr = checkDate.toISOString().split('T')[0];
    if (sorted.includes(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

const calculateBmrAndTdee = (age, gender, heightCm, weightKg, routine, experience) => {
  const ageNum = parseInt(age) || 25;
  const htCm = parseFloat(heightCm) || 170;
  const wtKg = parseFloat(weightKg) || 70;
  
  let bmr = 0;
  if (gender === 'Male') {
    bmr = 10 * wtKg + 6.25 * htCm - 5 * ageNum + 5;
  } else if (gender === 'Female') {
    bmr = 10 * wtKg + 6.25 * htCm - 5 * ageNum - 161;
  } else {
    bmr = 10 * wtKg + 6.25 * htCm - 5 * ageNum - 78;
  }

  let factor = 1.2; 
  const isSedentary = routine?.toLowerCase().includes('sedentary');
  
  if (isSedentary) {
    if (experience === 'Complete beginner') factor = 1.2;
    else if (experience === 'Some experience') factor = 1.375;
    else factor = 1.45;
  } else {
    if (experience === 'Complete beginner') factor = 1.375;
    else if (experience === 'Some experience') factor = 1.55;
    else factor = 1.725;
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(bmr * factor)
  };
};

const calculateBmi = (onboardingData) => {
  if (!onboardingData) return { bmi: 0, category: 'N/A', colorClass: 'text-gray-500', bgClass: 'bg-gray-50 border-gray-250' };
  const htM = onboardingData.calculatedHeightCm / 100;
  const wtKg = onboardingData.calculatedWeightKg;
  if (!htM || !wtKg) return { bmi: 0, category: 'N/A', colorClass: 'text-gray-500', bgClass: 'bg-gray-50 border-gray-250' };
  
  const bmi = wtKg / (htM * htM);
  const rounded = Math.round(bmi * 10) / 10;
  
  let category = 'Normal';
  let colorClass = 'text-emerald-500 dark:text-emerald-400';
  let bgClass = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40';
  
  if (rounded < 18.5) {
    category = 'Underweight';
    colorClass = 'text-blue-500 dark:text-blue-400';
    bgClass = 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40';
  } else if (rounded >= 25 && rounded < 30) {
    category = 'Overweight';
    colorClass = 'text-amber-500 dark:text-amber-400';
    bgClass = 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40';
  } else if (rounded >= 30) {
    category = 'Obese';
    colorClass = 'text-rose-500 dark:text-rose-400';
    bgClass = 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40';
  }
  
  return { bmi: rounded, category, colorClass, bgClass };
};function MealPlanCard({ mealData, isLoading, onFollowUp, onStartWorkout, darkMode }) {
  const [selectedDay, setSelectedDay] = useState('Monday');

  if (isLoading) {
    return (
      <div className={`w-full max-w-md p-6 rounded-2xl shadow-sm border animate-pulse h-96 ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
      }`} />
    );
  }
  if (!mealData) return null;

  if (!mealData.days || !Array.isArray(mealData.days)) {
    return (
      <div className={`w-full max-w-md p-5 rounded-2xl shadow-lg border text-center space-y-4 ${
        darkMode ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-gray-100 text-gray-600'
      }`}>
        <p className="text-xs text-gray-550 italic">Your previous plan is in an older format.</p>
        <button 
          onClick={() => onFollowUp()} 
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
        >
          Regenerate 7-Day Daywise Plan
        </button>
      </div>
    );
  }

  // Find selected day data
  const dayPlan = mealData.days?.find(d => d.dayName === selectedDay) || mealData.days?.[0];

  const mealItems = [
    { label: '🍳 Breakfast', value: dayPlan?.breakfast },
    { label: '🍲 Lunch', value: dayPlan?.lunch },
    { label: '🍉 Snack', value: dayPlan?.snack },
    { label: '🥗 Dinner', value: dayPlan?.dinner },
    { label: '🏃‍♂️ Workout Plan', value: dayPlan?.workout, isWorkout: true }
  ];

  return (
    <div className={`w-full max-w-md p-5 rounded-2xl shadow-lg border space-y-6 transition-colors ${
      darkMode ? 'bg-gray-900 border-gray-800 text-gray-100' : 'bg-white border-gray-100 text-gray-900'
    }`}>
      <div>
        <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-teal-700 bg-teal-50 rounded-full">
          7-Day Daywise Planner
        </span>
        <h2 className={`text-2xl font-extrabold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{mealData.mealTitle}</h2>
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{mealData.summary}</p>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 pr-1 no-scrollbar -mx-1 px-1">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border shrink-0 transition-all ${
                isSelected 
                  ? 'bg-teal-600 border-teal-600 text-white shadow-sm font-black' 
                  : darkMode 
                    ? 'bg-gray-850 border-gray-800 text-gray-300 hover:bg-gray-800' 
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {day.substring(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Selected Day Meals and Workouts */}
      <div className="space-y-3">
        {mealItems.map((item, idx) => {
          if (!item.value) return null;
          return (
            <div key={idx} className={`p-3.5 rounded-xl border transition-all ${
              item.isWorkout 
                ? darkMode ? 'bg-teal-955/20 border-teal-900/60 font-bold' : 'bg-teal-50/50 border-teal-100 font-bold'
                : darkMode ? 'bg-gray-850/80 border-gray-800' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="space-y-1">
                <span className={`block text-[9px] font-black uppercase tracking-wider ${
                  item.isWorkout ? 'text-teal-600' : 'text-gray-405'
                }`}>
                  {item.label}
                </span>
                <p className={`text-xs font-bold leading-normal ${darkMode ? 'text-white' : 'text-gray-855'}`}>
                  {item.value}
                </p>
                {item.isWorkout && onStartWorkout && (
                  <button 
                    onClick={() => onStartWorkout(item.value)}
                    className="mt-2 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] transition-colors shadow-sm flex items-center justify-center gap-1"
                  >
                    <Dumbbell className="w-3.5 h-3.5" /> Start Exercise Circuit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Health Tips */}
      {mealData.healthTips && mealData.healthTips.length > 0 && (
        <div className={`space-y-2 border-t pt-4 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <h4 className="text-[10px] font-bold text-gray-450 uppercase tracking-wider mb-2">💡 Health Tips</h4>
          {mealData.healthTips.map((tip, idx) => (
            <div key={idx} className="flex gap-2 text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span className={darkMode ? 'text-gray-300' : 'text-gray-650'}>{tip}</span>
            </div>
          ))}
        </div>
      )}

      {/* Follow-up question */}
      <button
        onClick={() => onFollowUp(mealData.followUpQuestion)}
        className="w-full flex items-center justify-between p-3 bg-teal-600 hover:bg-teal-700 transition-colors text-white rounded-xl text-xs font-bold shadow-md"
      >
        <span>{mealData.followUpQuestion}</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ToastNotification({ toast, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for fade-out transition
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const borderColors = {
    success: 'border-emerald-500',
    error: 'border-rose-500',
    warning: 'border-amber-500',
    info: 'border-teal-500'
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
      default:
        return <Lightbulb className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-80 bg-white border-l-4 rounded-xl shadow-xl p-4 flex gap-3 items-start transition-all duration-300 transform ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      } ${borderColors[toast.type] || 'border-teal-500'}`}
    >
      {getIcon()}
      <div className="flex-1">
        <h4 className="font-bold text-xs text-gray-900 leading-tight">{toast.title}</h4>
        <p className="text-[11px] text-gray-500 mt-1 leading-normal">{toast.body}</p>
      </div>
      <button 
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="text-gray-400 hover:text-gray-650 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function PlanBuilder({ onComplete, triggerNotification, darkMode }) {
  const [step, setStep] = useState(1);
  const [isFade, setIsFade] = useState(true);
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    heightUnit: 'metric', // metric (cm) or imperial (ft/in)
    heightCm: '',
    heightFt: '',
    heightIn: '',
    weightUnit: 'metric', // metric (kg) or imperial (lb)
    weightKg: '',
    weightLb: '',
    dietType: '',
    allergyInput: '',
    allergies: [],
    mealsPerDay: '3 meals',
    routine: '', 
    experience: '', 
    daysPerWeek: 3,
    minsPerDay: 30,
    startingPoint: '',
    healthConditions: []
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setIsFade(false);
    const t = setTimeout(() => setIsFade(true), 50);
    return () => clearTimeout(t);
  }, [step]);

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const preventInvalidKeys = (e) => {
    if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const handlePositiveInputChange = (field, val, minVal = 1, maxVal = null) => {
    if (val === '') {
      handleInputChange(field, '');
      return;
    }
    let num = parseFloat(val);
    if (!isNaN(num)) {
      num = Math.max(minVal, num);
      if (maxVal !== null) {
        num = Math.min(maxVal, num);
      }
      handleInputChange(field, num.toString());
    }
  };

  const handleAddAllergy = (e) => {
    e.preventDefault();
    const tag = formData.allergyInput.trim();
    if (tag && !formData.allergies.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, tag],
        allergyInput: ''
      }));
    }
  };

  const handleRemoveAllergy = (idx) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== idx)
    }));
  };

  // Apple Health / Google Fit mock imports
  const handleSyncMockService = (service) => {
    let mockProfile = {};
    if (service === 'apple') {
      mockProfile = {
        age: '27',
        gender: 'Female',
        heightUnit: 'metric',
        heightCm: '168',
        weightUnit: 'metric',
        weightKg: '62',
        dietType: 'Vegetarian'
      };
    } else if (service === 'google') {
      mockProfile = {
        age: '32',
        gender: 'Male',
        heightUnit: 'metric',
        heightCm: '182',
        weightUnit: 'metric',
        weightKg: '84',
        dietType: 'Non-vegetarian'
      };
    }
    setFormData(prev => ({ ...prev, ...mockProfile }));
    triggerNotification('Sync Complete', `Successfully imported profile stats from ${service === 'apple' ? 'Apple Health' : 'Google Fit'}.`, 'success');
  };

  // Local File Reader for CSV / JSON uploads
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        let imported = {};
        
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          imported = {
            age: json.age || '',
            gender: json.gender || '',
            heightUnit: json.heightUnit || 'metric',
            heightCm: json.heightCm || json.height || '',
            weightUnit: json.weightUnit || 'metric',
            weightKg: json.weightKg || json.weight || '',
            dietType: json.dietType || ''
          };
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n');
          lines.forEach(line => {
            const parts = line.split(',');
            if (parts.length >= 2) {
              const k = parts[0].trim().toLowerCase();
              const v = parts[1].trim();
              if (k.includes('age')) imported.age = v;
              if (k.includes('gender')) imported.gender = v;
              if (k.includes('height')) imported.heightCm = v;
              if (k.includes('weight')) imported.weightKg = v;
              if (k.includes('diet')) imported.dietType = v;
            }
          });
        }

        if (imported.age || imported.heightCm || imported.weightKg) {
          setFormData(prev => ({ ...prev, ...imported }));
          triggerNotification('Import Successful', `Loaded health profile variables from ${file.name}.`, 'success');
        } else {
          triggerNotification('Invalid File', 'No recognizable health parameters found in this file.', 'warning');
        }
      } catch (err) {
        console.error(err);
        triggerNotification('Parser Error', 'Could not parse the selected data document.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.age || parseFloat(formData.age) <= 0) newErrors.age = 'Age is required and must be positive';
      if (!formData.gender) newErrors.gender = 'Gender selection is required';
      
      if (formData.heightUnit === 'metric') {
        if (!formData.heightCm || parseFloat(formData.heightCm) <= 0) newErrors.heightCm = 'Height in cm is required';
      } else {
        if (!formData.heightFt || parseFloat(formData.heightFt) <= 0) newErrors.heightFt = 'Feet is required';
        if (formData.heightIn === '' || parseFloat(formData.heightIn) < 0 || parseFloat(formData.heightIn) >= 12) {
          newErrors.heightIn = 'Inches must be between 0 and 11';
        }
      }

      if (formData.weightUnit === 'metric') {
        if (!formData.weightKg || parseFloat(formData.weightKg) <= 0) newErrors.weightKg = 'Weight in kg is required';
      } else {
        if (!formData.weightLb || parseFloat(formData.weightLb) <= 0) newErrors.weightLb = 'Weight in lbs is required';
      }
    } else if (step === 2) {
      if (!formData.dietType) newErrors.dietType = 'Dietary type selection is required';
      if (!formData.mealsPerDay) newErrors.mealsPerDay = 'Meals per day selection is required';
    } else if (step === 3) {
      if (!formData.routine) newErrors.routine = 'Daily routine selection is required';
      if (!formData.experience) newErrors.experience = 'Exercise experience is required';
    } else if (step === 4) {
      if (!formData.startingPoint) newErrors.startingPoint = 'Please select a starting point';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = () => {
    if (!validateStep()) return;

    // Convert height to cm
    let heightCm = parseFloat(formData.heightCm);
    if (formData.heightUnit === 'imperial') {
      const ft = parseFloat(formData.heightFt || 0);
      const inches = parseFloat(formData.heightIn || 0);
      heightCm = (ft * 12 + inches) * 2.54;
    }

    // Convert weight to kg
    let weightKg = parseFloat(formData.weightKg);
    if (formData.weightUnit === 'imperial') {
      const lb = parseFloat(formData.weightLb || 0);
      weightKg = lb * 0.45359237;
    }

    const age = parseInt(formData.age);

    const { bmr, tdee } = calculateBmrAndTdee(age, formData.gender, heightCm, weightKg, formData.routine, formData.experience);
    const results = {
      ...formData,
      calculatedHeightCm: Math.round(heightCm * 10) / 10,
      calculatedWeightKg: Math.round(weightKg * 10) / 10,
      bmr: Math.round(bmr),
      tdee
    };

    onComplete(results);
  };

  const stepsMeta = [
    { title: 'Physical', icon: <User className="w-4 h-4" /> },
    { title: 'Dietary', icon: <Salad className="w-4 h-4" /> },
    { title: 'Activity', icon: <Dumbbell className="w-4 h-4" /> },
    { title: 'Focus', icon: <Target className="w-4 h-4" /> }
  ];

  return (
    <div className={`w-full max-w-md mx-auto rounded-2xl shadow-xl border overflow-hidden flex flex-col transition-colors ${
      darkMode ? 'bg-gray-900 border-gray-800 text-gray-100 shadow-black/45' : 'bg-white border-gray-100 text-gray-900'
    }`}>
      {/* Header & Progress */}
      <div className={`p-5 border-b transition-colors ${
        darkMode ? 'bg-teal-955/30 border-teal-900/60' : 'bg-teal-50/70 border-teal-100'
      }`}>
        <h2 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-teal-400' : 'text-teal-900'}`}>
          <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
          Build Your Personalized Plan
        </h2>
        <p className={`text-[11px] mt-1 ${darkMode ? 'text-teal-355' : 'text-teal-700'}`}>Let's collect your metrics to calculate your TDEE and personalize your recommendations.</p>
        
        {/* Progress indicators */}
        <div className="mt-5">
          <div className="flex justify-between items-center relative">
            <div className={`absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 z-0 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
            <div 
              className="absolute left-0 top-1/2 h-0.5 bg-teal-500 -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / (stepsMeta.length - 1)) * 100}%` }}
            />

            {stepsMeta.map((s, idx) => {
              const num = idx + 1;
              const isActive = num <= step;
              const isCurrent = num === step;
              return (
                <div key={idx} className="flex flex-col items-center z-10">
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                      isCurrent 
                        ? 'bg-teal-600 text-white ring-4 ring-teal-100 scale-110' 
                        : isActive 
                          ? 'bg-teal-500 text-white' 
                          : darkMode 
                            ? 'bg-gray-850 text-gray-500 border border-gray-850'
                            : 'bg-white text-gray-400 border border-gray-200'
                    }`}
                  >
                    {s.icon}
                  </div>
                  <span className={`text-[9px] mt-1 font-bold ${isActive ? 'text-teal-500' : 'text-gray-400'}`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
          <div className={`text-right text-[10px] font-bold mt-2 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
            Step {step} of 4
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-5 flex-1 min-h-[360px]">
        <div className={`transition-opacity duration-300 ${isFade ? 'opacity-100' : 'opacity-0'}`}>
          
          {/* STEP 1: PHYSICAL METRICS */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Import Options */}
              <div className={`border border-dashed rounded-xl p-3 space-y-2 ${
                darkMode ? 'bg-gray-850/60 border-gray-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-450 uppercase tracking-wide">
                  <span>Import Data from other apps</span>
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => handleSyncMockService('apple')}
                    className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm ${
                      darkMode ? 'bg-gray-900 border-gray-800 hover:border-teal-500 text-gray-300' : 'bg-white border-gray-200 hover:border-teal-500 text-gray-700'
                    }`}
                  >
                    🍎 Apple Health
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSyncMockService('google')}
                    className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm ${
                      darkMode ? 'bg-gray-900 border-gray-800 hover:border-teal-500 text-gray-300' : 'bg-white border-gray-200 hover:border-teal-500 text-gray-700'
                    }`}
                  >
                    🤖 Google Fit
                  </button>
                </div>
                
                <div className="flex items-center justify-center gap-1 pt-1">
                  <label className="text-[10px] font-bold text-teal-550 hover:underline cursor-pointer flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Upload Profile JSON/CSV
                    <input 
                      type="file" 
                      accept=".json,.csv"
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Age</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-450" />
                    <input 
                      type="number" 
                      min="1"
                      onKeyDown={preventInvalidKeys}
                      value={formData.age}
                      onChange={e => handlePositiveInputChange('age', e.target.value, 1)}
                      placeholder="e.g. 28"
                      className={`pl-9 w-full rounded-xl p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${
                        darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                  {errors.age && <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.age}</p>}
                </div>

                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Gender</label>
                  <select 
                    value={formData.gender}
                    onChange={e => handleInputChange('gender', e.target.value)}
                    className={`w-full rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${
                      darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.gender}</p>}
                </div>
              </div>

              {/* Height */}
              <div className={`space-y-2 border-t pt-3 ${darkMode ? 'border-gray-800' : 'border-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Height</label>
                  <div className={`p-0.5 rounded-lg flex gap-1 ${darkMode ? 'bg-gray-850' : 'bg-gray-100'}`}>
                    <button 
                      type="button"
                      onClick={() => handleInputChange('heightUnit', 'metric')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        formData.heightUnit === 'metric' 
                          ? darkMode ? 'bg-gray-800 text-teal-400' : 'bg-white shadow-sm text-teal-700' 
                          : 'text-gray-500'
                      }`}
                    >
                      cm
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleInputChange('heightUnit', 'imperial')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        formData.heightUnit === 'imperial' 
                          ? darkMode ? 'bg-gray-800 text-teal-400' : 'bg-white shadow-sm text-teal-700' 
                          : 'text-gray-500'
                      }`}
                    >
                      ft/in
                    </button>
                  </div>
                </div>

                <div className="relative">
                  {formData.heightUnit === 'metric' ? (
                    <div className="relative">
                      <Ruler className="absolute left-3 top-3 w-4 h-4 text-gray-455" />
                      <input 
                        type="number" 
                        min="1"
                        onKeyDown={preventInvalidKeys}
                        value={formData.heightCm}
                        onChange={e => handlePositiveInputChange('heightCm', e.target.value, 1)}
                        placeholder="Height in cm (e.g. 175)"
                        className={`pl-9 w-full rounded-xl p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${
                          darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Ruler className="absolute left-3 top-3 w-4 h-4 text-gray-455" />
                        <input 
                          type="number" 
                          min="1"
                          onKeyDown={preventInvalidKeys}
                          value={formData.heightFt}
                          onChange={e => handlePositiveInputChange('heightFt', e.target.value, 1)}
                          placeholder="Feet (e.g. 5)"
                          className={`pl-9 w-full rounded-xl p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${
                            darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="number" 
                          min="0"
                          max="11"
                          onKeyDown={preventInvalidKeys}
                          value={formData.heightIn}
                          onChange={e => handlePositiveInputChange('heightIn', e.target.value, 0, 11)}
                          placeholder="Inches (e.g. 9)"
                          className={`w-full rounded-xl p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${
                            darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {errors.heightCm && <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.heightCm}</p>}
                {(errors.heightFt || errors.heightIn) && (
                  <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.heightFt || errors.heightIn}</p>
                )}
              </div>

              {/* Weight */}
              <div className={`space-y-2 border-t pt-3 ${darkMode ? 'border-gray-800' : 'border-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Weight</label>
                  <div className={`p-0.5 rounded-lg flex gap-1 ${darkMode ? 'bg-gray-855' : 'bg-gray-100'}`}>
                    <button 
                      type="button"
                      onClick={() => handleInputChange('weightUnit', 'metric')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        formData.weightUnit === 'metric' 
                          ? darkMode ? 'bg-gray-800 text-teal-400' : 'bg-white shadow-sm text-teal-700' 
                          : 'text-gray-500'
                      }`}
                    >
                      kg
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleInputChange('weightUnit', 'imperial')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        formData.weightUnit === 'imperial' 
                          ? darkMode ? 'bg-gray-800 text-teal-400' : 'bg-white shadow-sm text-teal-700' 
                          : 'text-gray-500'
                      }`}
                    >
                      lb
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Scale className="absolute left-3 top-3 w-4 h-4 text-gray-455" />
                  {formData.weightUnit === 'metric' ? (
                    <input 
                      type="number" 
                      min="1"
                      onKeyDown={preventInvalidKeys}
                      value={formData.weightKg}
                      onChange={e => handlePositiveInputChange('weightKg', e.target.value, 1)}
                      placeholder="Weight in kg (e.g. 70)"
                      className={`pl-9 w-full rounded-xl p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${
                        darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    />
                  ) : (
                    <input 
                      type="number" 
                      min="1"
                      onKeyDown={preventInvalidKeys}
                      value={formData.weightLb}
                      onChange={e => handlePositiveInputChange('weightLb', e.target.value, 1)}
                      placeholder="Weight in lbs (e.g. 154)"
                      className={`pl-9 w-full rounded-xl p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${
                        darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    />
                  )}
                </div>
                {errors.weightKg && <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.weightKg}</p>}
                {errors.weightLb && <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.weightLb}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: DIETARY PREFERENCES & CONSTRAINTS */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Dietary Type</label>
                <select 
                  value={formData.dietType}
                  onChange={e => handleInputChange('dietType', e.target.value)}
                  className={`w-full rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="">Select Diet Type</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-vegetarian">Non-vegetarian</option>
                  <option value="Eggitarian">Eggitarian</option>
                  <option value="Vegan">Vegan</option>
                </select>
                {errors.dietType && <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.dietType}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Meals Per Day</label>
                <div className="grid grid-cols-3 gap-2">
                  {['3 meals', '3 meals + 2 snacks', '5 small meals'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleInputChange('mealsPerDay', option)}
                      className={`p-2 text-[10px] font-bold rounded-xl border text-center transition-all ${
                        formData.mealsPerDay === option 
                          ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-50' 
                          : darkMode 
                            ? 'border-gray-800 bg-gray-800 text-gray-300 hover:bg-gray-750'
                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {errors.mealsPerDay && <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.mealsPerDay}</p>}
              </div>

              <div className={`border-t pt-3 ${darkMode ? 'border-gray-800' : 'border-gray-50'}`}>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Ban className="w-3.5 h-3.5 text-rose-500" /> Allergies or Dislikes
                </label>
                <form onSubmit={handleAddAllergy} className="flex gap-2">
                  <input 
                    type="text" 
                    value={formData.allergyInput}
                    onChange={e => handleInputChange('allergyInput', e.target.value)}
                    placeholder="e.g. Peanuts, Milk"
                    className={`flex-1 rounded-xl p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${
                      darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                  <button 
                    type="submit"
                    className="bg-teal-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-teal-700 flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </form>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {formData.allergies.length === 0 ? (
                    <span className="text-[11px] text-gray-550 italic">No specific allergies/dislikes added.</span>
                  ) : (
                    formData.allergies.map((allergy, idx) => (
                      <span 
                        key={idx} 
                        className={`flex items-center gap-1 px-2 py-0.5 border text-[10px] font-bold rounded-lg ${
                          darkMode ? 'bg-rose-955/40 border-rose-900 text-rose-305' : 'bg-rose-50 border-rose-100 text-rose-800'
                        }`}
                      >
                        {allergy}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveAllergy(idx)}
                          className="hover:text-rose-900 font-bold ml-0.5"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className={`border-t pt-3 ${darkMode ? 'border-gray-800' : 'border-gray-55 font-bold'}`}>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  🩺 Health Conditions / Medical History
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Diabetes', 'Hypertension', 'Thyroid', 'PCOS/PCOD', 'None / Healthy'].map((cond) => {
                    const isSelected = formData.healthConditions?.includes(cond);
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => {
                          let current = formData.healthConditions || [];
                          if (cond.includes('None')) {
                            current = ['None / Healthy'];
                          } else {
                            current = current.filter(c => !c.includes('None'));
                            if (current.includes(cond)) {
                              current = current.filter(c => c !== cond);
                            } else {
                              current = [...current, cond];
                            }
                          }
                          handleInputChange('healthConditions', current);
                        }}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all ${
                          formData.healthConditions?.includes(cond)
                            ? 'border-teal-600 bg-teal-50 text-teal-850 dark:bg-teal-950/30 dark:text-teal-300 ring-2 ring-teal-50 font-bold'
                            : darkMode
                              ? 'border-gray-800 bg-gray-800 text-gray-300 hover:bg-gray-750'
                              : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ACTIVITY LEVEL & SCHEDULE */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Daily Routine</label>
                <div className="space-y-2">
                  {[
                    { label: 'Mostly sedentary (desk job/studying)', desc: 'Spend most of the day sitting with minimal walking.' },
                    { label: 'Mostly active (on your feet)', desc: 'Walk, stand, or perform physical labor frequently.' }
                  ].map((item) => (
                    <label 
                      key={item.label}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        formData.routine === item.label
                          ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-50' 
                          : darkMode
                            ? 'border-gray-800 bg-gray-850 text-gray-350 hover:bg-gray-800'
                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="routine" 
                        checked={formData.routine === item.label}
                        onChange={() => handleInputChange('routine', item.label)}
                        className="mt-1 accent-teal-600"
                      />
                      <div>
                        <p className={`text-[11px] font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.label}</p>
                        <p className="text-[9px] text-gray-550 mt-0.5">{item.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.routine && <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.routine}</p>}
              </div>

              <div className={`border-t pt-3 ${darkMode ? 'border-gray-800' : 'border-gray-55 font-bold'}`}>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Exercise Experience</label>
                <div className="flex gap-2">
                  {['Complete beginner', 'Some experience', 'Experienced'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleInputChange('experience', opt)}
                      className={`flex-1 p-2 text-[10px] font-bold rounded-xl border text-center transition-all ${
                        formData.experience === opt
                          ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-50' 
                          : darkMode
                            ? 'border-gray-800 bg-gray-800 text-gray-300 hover:bg-gray-750'
                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {errors.experience && <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.experience}</p>}
              </div>

              <div className={`border-t pt-3 space-y-2 ${darkMode ? 'border-gray-800' : 'border-gray-50'}`}>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" /> Workout Commitment / Week
                </label>
                
                <div>
                  <div className="flex justify-between text-xs text-gray-500 font-semibold mb-1">
                    <span>Days per week</span>
                    <span className="text-teal-500 font-bold">{formData.daysPerWeek} days</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="7"
                    value={formData.daysPerWeek}
                    onChange={e => handleInputChange('daysPerWeek', parseInt(e.target.value))}
                    className="w-full accent-teal-600 h-1 bg-gray-200 dark:bg-gray-750 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-500 font-semibold mb-1">
                    <span>Minutes per session</span>
                    <span className="text-teal-500 font-bold">{formData.minsPerDay} mins</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="120"
                    step="5"
                    value={formData.minsPerDay}
                    onChange={e => handleInputChange('minsPerDay', parseInt(e.target.value))}
                    className="w-full accent-teal-600 h-1 bg-gray-200 dark:bg-gray-750 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PRIMARY STARTING POINT */}
          {step === 4 && (
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Select Your Primary Focus</label>
              
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { title: 'High-Protein Meal Plan', desc: 'Focus heavily on diet composition, satiety, and muscle building.', icon: <Salad className="w-5 h-5 text-teal-600" /> },
                  { title: 'Beginner-Friendly Home Workout', desc: 'Build movement habits at home with zero equipment.', icon: <Dumbbell className="w-5 h-5 text-teal-600" /> },
                  { title: 'Learn to Track Calories', desc: 'Build structural awareness of portion sizes and calorie density.', icon: <Target className="w-5 h-5 text-teal-600" /> }
                ].map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => handleInputChange('startingPoint', item.title)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      formData.startingPoint === item.title
                        ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/20 ring-2 ring-teal-100/50 shadow-sm' 
                        : darkMode
                          ? 'border-gray-800 bg-gray-850 hover:bg-gray-800 text-gray-305'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-normal">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              {errors.startingPoint && <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.startingPoint}</p>}
            </div>
          )}

        </div>
      </div>

      {/* Buttons Footer */}
      <div className={`p-4 border-t flex justify-between gap-4 transition-colors ${
        darkMode ? 'bg-gray-850/60 border-gray-800' : 'bg-gray-50 border-gray-100'
      }`}>
        <button
          onClick={handleBack}
          disabled={step === 1}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ${
            step === 1 ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {step < 4 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1 bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-teal-700 transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" /> Generate My Plan
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [mealData, setMealData] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Theme control state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('heal_thy_dark_mode') === 'true';
  });

  // Custom User Session & Role states
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserAuthModal, setShowUserAuthModal] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'coach', 'milestones', 'settings'

  // Input states for login/register modals
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Notification states
  const [toast, setToast] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // Onboarding states
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);

  // Tracking Log & Goal states
  const [goals, setGoals] = useState({ calories: 2000, water: 8, protein: 100 });
  const [dailyLogs, setDailyLogs] = useState([]);
  const [logHistory, setLogHistory] = useState([]);
  const [achievementHistory, setAchievementHistory] = useState([]);
  const [foodText, setFoodText] = useState('');
  const [loggingFood, setLoggingFood] = useState(false);
  const [showGoalsEditor, setShowGoalsEditor] = useState(false);

  // Temporary local states for goals inputs
  const [goalInputs, setGoalInputs] = useState({ calories: 2000, water: 8, protein: 100 });

  // Weight History Tracker states
  const [weightHistory, setWeightHistory] = useState([]);
  const [weightInput, setWeightInput] = useState('');

  // Active workout states
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [workoutRunning, setWorkoutRunning] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    seedMockDatabase();
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Firebase auth & firestore data sync hook
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setIsAuthenticated(true);
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          let userData = null;
          if (userSnap.exists()) {
            userData = userSnap.data();
          } else {
            const localUsers = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
            const localMatched = localUsers.find(u => u.email.toLowerCase() === user.email.toLowerCase());
            
            userData = {
              name: localMatched?.name || user.displayName || user.email.split('@')[0],
              email: user.email,
              onboardingCompleted: localMatched?.onboardingCompleted || false,
              onboardingData: localMatched?.onboardingData || null,
              mealPlan: localMatched?.mealPlan || null,
              goals: localMatched?.goals || { calories: 2000, water: 8, protein: 100 },
              achievementHistory: localMatched?.achievementHistory || []
            };
            
            await setDoc(userRef, userData);

            if (localMatched?.dailyLogs) {
              for (const log of localMatched.dailyLogs) {
                await setDoc(doc(db, 'users', user.uid, 'dailyLogs', log.id), log);
              }
            }
          }

          const logsQuery = query(collection(db, 'users', user.uid, 'dailyLogs'));
          const logsSnap = await getDocs(logsQuery);
          const logsList = [];
          logsSnap.forEach((docSnap) => {
            logsList.push(docSnap.data());
          });

          const weightQuery = query(collection(db, 'users', user.uid, 'weightHistory'), orderBy('timestamp', 'asc'));
          const weightSnap = await getDocs(weightQuery);
          const weightList = [];
          weightSnap.forEach((docSnap) => {
            weightList.push(docSnap.data());
          });

          setCurrentUser({
            id: user.uid,
            name: userData.name,
            email: userData.email,
            achievementHistory: userData.achievementHistory || []
          });
          setHasCompletedOnboarding(userData.onboardingCompleted);
          setOnboardingData(userData.onboardingData);
          setMealData(userData.mealPlan);
          setGoals(userData.goals);
          setGoalInputs(userData.goals);
          setDailyLogs(logsList);
          setWeightHistory(weightList);
          setAchievementHistory(userData.achievementHistory || []);

          if (weightList.length === 0 && userData.onboardingData) {
            const initialWeightEntry = {
              id: 'init-' + Date.now(),
              weight: userData.onboardingData.calculatedWeightKg,
              date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
              timestamp: Date.now()
            };
            await setDoc(doc(db, 'users', user.uid, 'weightHistory', initialWeightEntry.id), initialWeightEntry);
            setWeightHistory([initialWeightEntry]);
          }

          const dates = [...new Set(logsList.map(log => {
            const ts = log.id.startsWith('log-') || log.id.startsWith('water-') 
              ? parseInt(log.id.split('-')[1]) 
              : Date.now();
            return new Date(ts).toISOString().split('T')[0];
          }))];
          setLogHistory(dates);
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
          setHasCompletedOnboarding(false);
          setOnboardingData(null);
          setMealData(null);
          setDailyLogs([]);
          setWeightHistory([]);
          setLogHistory([]);
          setAchievementHistory([]);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Workout countdown timer hook
  useEffect(() => {
    if (workoutRunning && workoutTimer > 0) {
      timerRef.current = setInterval(() => {
        setWorkoutTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setWorkoutRunning(false);
            handleWorkoutTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [workoutRunning, workoutTimer]);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('heal_thy_dark_mode', String(next));
      return next;
    });
  };

  const triggerNotification = (title, body, type = 'info') => {
    setToast({ title, body, type });
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🥬</text></svg>'
        });
      } catch (err) {
        console.error('Failed to trigger native browser notification:', err);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      triggerNotification('Unsupported', 'Browser notifications are not supported on this browser.', 'warning');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        triggerNotification('Notifications Enabled', 'You will now receive notifications from Heal-Thy!', 'success');
      } else {
        setToast({
          title: 'Notifications Denied',
          body: 'Please enable notifications in your browser settings to receive native alerts.',
          type: 'warning'
        });
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  // Custom Local / Firebase Auth Operations
  const handleUserRegister = async (e) => {
    e.preventDefault();
    if (!authForm.name || !authForm.email || !authForm.password) {
      setAuthError('All fields are required.');
      return;
    }

    if (isFirebaseConfigured && auth) {
      try {
        setAuthError(null);
        const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        const user = userCredential.user;

        const initialUserData = {
          name: authForm.name,
          email: authForm.email,
          onboardingCompleted: false,
          onboardingData: null,
          mealPlan: null,
          goals: { calories: 2000, water: 8, protein: 100 },
          achievementHistory: []
        };
        await setDoc(doc(db, 'users', user.uid), initialUserData);

        triggerNotification('Registered', 'Account created successfully! You are now logged in.', 'success');
        setShowUserAuthModal(false);
        setAuthForm({ name: '', email: '', password: '' });
      } catch (err) {
        console.error(err);
        setAuthError(err.message || 'Failed to register with Firebase.');
      }
    } else {
      const users = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
      const exists = users.find(u => u.email.toLowerCase() === authForm.email.toLowerCase());
      if (exists) {
        setAuthError('An account with this email already exists.');
        return;
      }

      const newUser = {
        id: 'usr-' + Date.now(),
        name: authForm.name,
        email: authForm.email,
        password: authForm.password,
        onboardingCompleted: false,
        onboardingData: null,
        mealPlan: null,
        goals: { calories: 2000, water: 8, protein: 100 },
        dailyLogs: [],
        logHistory: [],
        achievementHistory: []
      };

      users.push(newUser);
      localStorage.setItem('heal_thy_registered_users', JSON.stringify(users));
      triggerNotification('Registered', 'Account created successfully! You can now sign in.', 'success');
      setAuthMode('login');
      setAuthError(null);
      setAuthForm({ name: '', email: '', password: '' });
    }
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password) {
      setAuthError('Email and Password are required.');
      return;
    }

    if (isFirebaseConfigured && auth) {
      try {
        setAuthError(null);
        await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        setShowUserAuthModal(false);
        setAuthForm({ name: '', email: '', password: '' });
      } catch (err) {
        console.error(err);
        setAuthError('Invalid email or password.');
        triggerNotification('Login Failed', 'Authentication failed.', 'error');
      }
    } else {
      const users = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
      const matched = users.find(
        u => u.email.toLowerCase() === authForm.email.toLowerCase() && u.password === authForm.password
      );

      if (!matched) {
        setAuthError('Invalid email or password.');
        return;
      }

      setCurrentUser(matched);
      setIsAuthenticated(true);
      setHasCompletedOnboarding(matched.onboardingCompleted);
      setOnboardingData(matched.onboardingData);
      setMealData(matched.mealPlan);

      const uGoals = matched.goals || { calories: matched.onboardingData?.tdee || 2000, water: 8, protein: 100 };
      setGoals(uGoals);
      setGoalInputs(uGoals);
      setDailyLogs(matched.dailyLogs || []);
      setLogHistory(matched.logHistory || []);
      setAchievementHistory(matched.achievementHistory || []);

      setShowUserAuthModal(false);
      setAuthForm({ name: '', email: '', password: '' });
      setAuthError(null);
      triggerNotification('Logged In', `Welcome back, ${matched.name}!`, 'success');
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setIsAdmin(true);
      setShowAdminAuthModal(false);
      setAdminPassword('');
      setAdminError('');
      triggerNotification('Admin Portal', 'Welcome back, Administrator.', 'success');
    } else {
      setAdminError('Invalid administrator credentials.');
    }
  };

  const syncCurrentUserToDB = async (updatedFields = {}) => {
    if (!currentUser) return;
    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', currentUser.id);
        const updateData = {
          onboardingCompleted: hasCompletedOnboarding,
          onboardingData,
          mealPlan: mealData,
          goals,
          achievementHistory,
          ...updatedFields
        };
        await updateDoc(userRef, updateData);
      } catch (err) {
        console.error('Error syncing to Firestore:', err);
      }
    } else {
      const users = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
      const idx = users.findIndex(u => u.id === currentUser.id);
      if (idx !== -1) {
        const updatedUser = {
          ...users[idx],
          onboardingCompleted: hasCompletedOnboarding,
          onboardingData,
          mealPlan: mealData,
          goals,
          dailyLogs,
          logHistory,
          achievementHistory,
          ...updatedFields
        };
        users[idx] = updatedUser;
        localStorage.setItem('heal_thy_registered_users', JSON.stringify(users));
        setCurrentUser(updatedUser);
      }
    }
  };

  const handleUserLogout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
        setCurrentUser(null);
        setIsAuthenticated(false);
        setHasCompletedOnboarding(false);
        setOnboardingData(null);
        setMealData(null);
        setDailyLogs([]);
        setLogHistory([]);
        setAchievementHistory([]);
        triggerNotification('Logged Out', 'You have been safely signed out.', 'success');
      } catch (err) {
        console.error('Logout error:', err);
      }
    } else {
      await syncCurrentUserToDB();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
      setOnboardingData(null);
      setMealData(null);
      setDailyLogs([]);
      setLogHistory([]);
      setAchievementHistory([]);
      triggerNotification('Logged Out', 'You have been safely signed out.', 'success');
    }
  };

  const updateAchievementHistory = (updatedLogs, updatedGoals) => {
    if (!currentUser) return [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    const curGoals = updatedGoals || goals;
    const curLogs = updatedLogs || dailyLogs;

    const loggedCal = curLogs.reduce((acc, curr) => acc + (curr.calories || 0), 0);
    const loggedProt = curLogs.reduce((acc, curr) => acc + (curr.protein || 0), 0);
    const loggedWat = curLogs.filter(log => log.isWater).length;
    
    const achievementsToday = [];
    
    // Check calories (must be within +/- 10% range or met)
    if (loggedCal >= curGoals.calories * 0.9 && loggedCal <= curGoals.calories * 1.1) {
      achievementsToday.push('Calories');
    }
    // Check protein (>= goal)
    if (loggedCal > 0 && loggedProt >= curGoals.protein) {
      achievementsToday.push('Protein');
    }
    // Check water (>= goal)
    if (loggedWat >= curGoals.water) {
      achievementsToday.push('Water');
    }
    
    let currentHistory = currentUser.achievementHistory || [];
    currentHistory = currentHistory.filter(a => a.date !== todayStr);
    
    if (achievementsToday.length === 0) {
      setAchievementHistory(currentHistory);
      return currentHistory;
    }
    
    let note = '';
    if (achievementsToday.length === 3) {
      note = 'Perfect Day! Hit all target goals! 🏆';
    } else {
      note = `Goals met: ${achievementsToday.join(' & ')} targets achieved! 🎉`;
    }
    
    const newAchievement = {
      date: todayStr,
      achievements: achievementsToday,
      note
    };
    
    const updatedHistory = [newAchievement, ...currentHistory];
    setAchievementHistory(updatedHistory);
    return updatedHistory;
  };

  const handleUpdateRoutine = (newRoutine) => {
    if (!currentUser || !onboardingData) return;

    const newOnboarding = {
      ...onboardingData,
      routine: newRoutine
    };
    
    const { bmr, tdee } = calculateBmrAndTdee(
      newOnboarding.age,
      newOnboarding.gender,
      newOnboarding.calculatedHeightCm,
      newOnboarding.calculatedWeightKg,
      newRoutine,
      newOnboarding.experience
    );

    newOnboarding.bmr = bmr;
    newOnboarding.tdee = tdee;

    setOnboardingData(newOnboarding);

    const updatedGoals = {
      ...goals,
      calories: tdee
    };
    setGoals(updatedGoals);
    setGoalInputs(updatedGoals);

    const updatedAchievements = updateAchievementHistory(dailyLogs, updatedGoals);

    // Update in local state & localStorage
    const users = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) {
      users[idx].onboardingData = newOnboarding;
      users[idx].goals = updatedGoals;
      users[idx].achievementHistory = updatedAchievements;
      localStorage.setItem('heal_thy_registered_users', JSON.stringify(users));
      setCurrentUser(users[idx]);
    }

    triggerNotification(
      'Routine Updated', 
      `Activity level updated. Maintenance TDEE is now ${tdee} kcal. Daily goals synced!`, 
      'success'
    );
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    triggerNotification('Admin Logged Out', 'Admin session terminated.', 'success');
  };

  const handleOnboardingComplete = (data) => {
    setOnboardingData(data);
    setHasCompletedOnboarding(true);

    const calculatedProtein = Math.round(data.calculatedWeightKg * 1.5);
    const initialGoals = { calories: data.tdee, water: 8, protein: calculatedProtein };
    setGoals(initialGoals);
    setGoalInputs(initialGoals);

    // Save user update
    const users = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) {
      users[idx].onboardingCompleted = true;
      users[idx].onboardingData = data;
      users[idx].goals = initialGoals;
      localStorage.setItem('heal_thy_registered_users', JSON.stringify(users));
      setCurrentUser(users[idx]);
    }

    triggerNotification(
      'Profile Configured', 
      `Intake complete! Maintenance TDEE calculated at ${data.tdee} kcal.`, 
      'success'
    );
  };

  const handleResetOnboarding = () => {
    setHasCompletedOnboarding(false);
  };

  const exportUsersToCSV = () => {
    const users = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
    if (users.length === 0) {
      triggerNotification('No Data', 'No registered client profiles to export.', 'warning');
      return;
    }

    const headers = ['User ID', 'Name', 'Email', 'Age', 'Gender', 'Height (cm)', 'Weight (kg)', 'TDEE (kcal)', 'Diet Type', 'Starting Point', 'Allergies'];
    const rows = users.map(u => {
      const d = u.onboardingData || {};
      return [
        u.id,
        `"${u.name.replace(/"/g, '""')}"`,
        `"${u.email.replace(/"/g, '""')}"`,
        d.age || 'N/A',
        d.gender || 'N/A',
        d.calculatedHeightCm || 'N/A',
        d.calculatedWeightKg || 'N/A',
        d.tdee || 'N/A',
        d.dietType || 'N/A',
        d.startingPoint || 'N/A',
        `"${(d.allergies || []).join(', ').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'healthy_client_database.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerNotification('Download Started', 'healthy_client_database.csv downloaded.', 'success');
  };

  const deleteUserFromAdmin = (id) => {
    let users = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
    users = users.filter(u => u.id !== id);
    localStorage.setItem('heal_thy_registered_users', JSON.stringify(users));
    triggerNotification('User Removed', 'Selected user profile deleted successfully from mock DB.', 'success');
  };

  const fetchMealPlan = async (followUpText = null) => {
    setLoadingAi(true);
    setAiError(null);
    setMealData(null);

    triggerNotification(
      followUpText ? 'Updating Plan' : 'Generating Plan',
      followUpText ? `Adapting plan for: "${followUpText}"` : 'AI Coach is building your health recommendations...',
      'info'
    );

    try {
      if (isFirebaseConfigured && functions) {
        const generatePlanFn = httpsCallable(functions, 'generateMealPlan');
        const res = await generatePlanFn({ onboardingData, followUpText });
        const parsed = res.data;
        setMealData(parsed);

        if (currentUser) {
          await updateDoc(doc(db, 'users', currentUser.id), { mealPlan: parsed });
        }
        triggerNotification('Plan Ready!', 'Your customized fitness advice has been loaded.', 'success');
      } else {
        const apiKey = getApiKey();
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.startsWith('YOUR_')) {
          throw new Error('API_KEY_MISSING');
        }

        let onboardingContext = '';
        if (onboardingData) {
          const healthCondStr = onboardingData.healthConditions && onboardingData.healthConditions.length > 0 
            ? onboardingData.healthConditions.join(', ') 
            : 'None';
          
          let diabeticGuideline = '';
          if (onboardingData.healthConditions?.some(c => c.toLowerCase().includes('diabet'))) {
            diabeticGuideline = 'CRITICAL DIETARY CONSTRAINT: The user is DIABETIC. Ensure all meal recommendations have a very low Glycemic Index (GI), limit simple sugars and refined grains, prioritize complex carbohydrates (like brown rice, millet, whole wheat, vegetables, and high fiber legumes), and provide health tips specifically targeted at blood sugar monitoring and portion management. ';
          }

          onboardingContext = `The user is ${onboardingData.age} years old, identifying as ${onboardingData.gender}, with a height of ${onboardingData.calculatedHeightCm} cm and weight of ${onboardingData.calculatedWeightKg} kg. Their calculated TDEE is ${onboardingData.tdee} kcal. They follow a ${onboardingData.dietType} diet with allergies/dislikes: [${onboardingData.allergies.join(', ') || 'None'}], eat ${onboardingData.mealsPerDay} per day. Their activity level is ${onboardingData.routine} and they focus on: "${onboardingData.startingPoint}". They have medical health conditions: [${healthCondStr}]. ${diabeticGuideline}`;
        }

        const basePrompt = `${onboardingContext}Provide a JSON object for a 7-day healthy daywise meal and workout plan. The JSON must match this structure exactly: { "mealTitle": string, "summary": string, "days": [ { "dayName": string, "breakfast": string, "lunch": string, "snack": string, "dinner": string, "workout": string } ], "healthTips": string[], "followUpQuestion": string }. Provide details for 7 days (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday). Keep meals traditional Indian/customized, healthy, and tailored to the user's constraints. Respond with ONLY the raw JSON object, no markdown, no backticks, no explanation.`;
        const prompt = followUpText 
          ? `Based on the previous daywise plan context, the user had a follow-up query: "${followUpText}". ${onboardingContext}Generate an updated 7-day healthy daywise meal and workout plan matching this query. Return the same JSON structure: { "mealTitle": string, "summary": string, "days": [ { "dayName": string, "breakfast": string, "lunch": string, "snack": string, "dinner": string, "workout": string } ], "healthTips": string[], "followUpQuestion": string }. Respond with ONLY the raw JSON object, no markdown, no backticks, no explanation.`
          : basePrompt;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Gemini API request failed with status ${response.status}`);
        }

        const result = await response.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const isValid =
          typeof parsed?.mealTitle === 'string' &&
          typeof parsed?.summary === 'string' &&
          Array.isArray(parsed?.days) &&
          parsed.days.length > 0 &&
          Array.isArray(parsed?.healthTips) &&
          typeof parsed?.followUpQuestion === 'string';

        if (!isValid) {
          throw new Error('Malformed meal plan data received from Gemini');
        }

        setMealData(parsed);

        if (currentUser) {
          const users = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
          const idx = users.findIndex(u => u.id === currentUser.id);
          if (idx !== -1) {
            users[idx].mealPlan = parsed;
            localStorage.setItem('heal_thy_registered_users', JSON.stringify(users));
          }
        }
        triggerNotification('Plan Ready!', 'Your customized fitness advice has been loaded.', 'success');
      }
    } catch (err) {
      console.error('Error fetching meal plan:', err);
      if (err.message === 'API_KEY_MISSING') {
        setAiError('Gemini API Key is missing. Set VITE_GEMINI_API_KEY in your .env file.');
        triggerNotification('API Key Missing', 'VITE_GEMINI_API_KEY is not configured.', 'error');
      } else {
        setAiError('Could not generate a meal plan right now. Try again.');
        triggerNotification('Generation Failed', 'Vite/Gemini connection failed.', 'error');
      }
      setMealData(null);
    } finally {
      setLoadingAi(false);
    }
  };

  // AI-powered Calorie Logger (Gemini food parsing)
  const handleLogFoodWithGemini = async (e) => {
    e.preventDefault();
    if (!foodText.trim()) return;

    setLoggingFood(true);
    triggerNotification('Estimating Calories', 'AI Coach is analyzing your meals...', 'info');

    try {
      let parsed;
      if (isFirebaseConfigured && functions) {
        const estimateCaloriesFn = httpsCallable(functions, 'estimateCalories');
        const res = await estimateCaloriesFn({ foodText });
        parsed = res.data;
      } else {
        const apiKey = getApiKey();
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.startsWith('YOUR_')) {
          throw new Error('API_KEY_MISSING');
        }

        const prompt = `Analyze this food description: "${foodText}". Estimate the total calories (kcal), protein (g), carbs (g), and fat (g) contained in it. Return ONLY a valid JSON object matching this structure: { "calories": number, "protein": number, "carbs": number, "fat": number, "foodSummary": string }. Keep estimations realistic for common ingredients/portions. Respond with ONLY the raw JSON object, no markdown backticks, no JSON prefix.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Gemini food request failed with status ${response.status}`);
        }

        const result = await response.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      const newLog = {
        id: 'log-' + Date.now(),
        text: parsed.foodSummary || foodText,
        calories: parsed.calories || 0,
        protein: parsed.protein || 0,
        carbs: parsed.carbs || 0,
        fat: parsed.fat || 0,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updatedLogs = [...dailyLogs, newLog];
      setDailyLogs(updatedLogs);

      const todayStr = new Date().toISOString().split('T')[0];
      const updatedHistory = [...new Set([...logHistory, todayStr])];
      setLogHistory(updatedHistory);

      const updatedAchievements = updateAchievementHistory(updatedLogs);
      setFoodText('');
      triggerNotification('Food Logged', `Added "${newLog.text}" (+${newLog.calories} kcal).`, 'success');

      if (isFirebaseConfigured && currentUser) {
        await setDoc(doc(db, 'users', currentUser.id, 'dailyLogs', newLog.id), newLog);
        await updateDoc(doc(db, 'users', currentUser.id), { 
          logHistory: updatedHistory,
          achievementHistory: updatedAchievements
        });
      } else {
        const users = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
        const idx = users.findIndex(u => u.id === currentUser.id);
        if (idx !== -1) {
          users[idx].dailyLogs = updatedLogs;
          users[idx].logHistory = updatedHistory;
          users[idx].achievementHistory = updatedAchievements;
          localStorage.setItem('heal_thy_registered_users', JSON.stringify(users));
          setCurrentUser(users[idx]);
        }
      }
    } catch (err) {
      console.error('Gemini food parsing error:', err);
      if (err.message === 'API_KEY_MISSING') {
        triggerNotification('API Key Missing', 'VITE_GEMINI_API_KEY is not configured.', 'error');
      } else {
        triggerNotification('Analysis Failed', 'Could not evaluate food details.', 'error');
      }
    } finally {
      setLoggingFood(false);
    }
  };

  const handleDeleteFoodLog = async (id) => {
    const updatedLogs = dailyLogs.filter(log => log.id !== id);
    setDailyLogs(updatedLogs);

    const updatedAchievements = updateAchievementHistory(updatedLogs);
    triggerNotification('Log Removed', 'Food entry has been deleted.', 'info');

    if (isFirebaseConfigured && currentUser) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.id, 'dailyLogs', id));
        await updateDoc(doc(db, 'users', currentUser.id), { achievementHistory: updatedAchievements });
      } catch (err) {
        console.error(err);
      }
    } else {
      const users = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
      const idx = users.findIndex(u => u.id === currentUser.id);
      if (idx !== -1) {
        users[idx].dailyLogs = updatedLogs;
        users[idx].achievementHistory = updatedAchievements;
        localStorage.setItem('heal_thy_registered_users', JSON.stringify(users));
        setCurrentUser(users[idx]);
      }
    }
  };

  const handleUpdateGoals = async (e) => {
    e.preventDefault();
    const updatedGoals = {
      calories: parseInt(goalInputs.calories) || 2000,
      water: parseInt(goalInputs.water) || 8,
      protein: parseInt(goalInputs.protein) || 100
    };
    setGoals(updatedGoals);
    setShowGoalsEditor(false);

    const updatedAchievements = updateAchievementHistory(dailyLogs, updatedGoals);
    triggerNotification('Goals Updated', 'Daily targets modified successfully.', 'success');

    if (isFirebaseConfigured && currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.id), { 
          goals: updatedGoals,
          achievementHistory: updatedAchievements
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      const users = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
      const idx = users.findIndex(u => u.id === currentUser.id);
      if (idx !== -1) {
        users[idx].goals = updatedGoals;
        users[idx].achievementHistory = updatedAchievements;
        localStorage.setItem('heal_thy_registered_users', JSON.stringify(users));
        setCurrentUser(users[idx]);
      }
    }
  };

  const handleIncrementWater = async () => {
    const newLog = {
      id: 'water-' + Date.now(),
      text: '1 Cup of Water',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      isWater: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedLogs = [...dailyLogs, newLog];
    setDailyLogs(updatedLogs);

    const todayStr = new Date().toISOString().split('T')[0];
    const updatedHistory = [...new Set([...logHistory, todayStr])];
    setLogHistory(updatedHistory);

    const updatedAchievements = updateAchievementHistory(updatedLogs);
    triggerNotification('Water Logged', 'Hydration logged (+1 Cup).', 'success');

    if (isFirebaseConfigured && currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.id, 'dailyLogs', newLog.id), newLog);
        await updateDoc(doc(db, 'users', currentUser.id), {
          logHistory: updatedHistory,
          achievementHistory: updatedAchievements
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      const users = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
      const idx = users.findIndex(u => u.id === currentUser.id);
      if (idx !== -1) {
        users[idx].dailyLogs = updatedLogs;
        users[idx].logHistory = updatedHistory;
        users[idx].achievementHistory = updatedAchievements;
        localStorage.setItem('heal_thy_registered_users', JSON.stringify(users));
        setCurrentUser(users[idx]);
      }
    }
  };

  const handleLogWeight = async (e) => {
    e.preventDefault();
    if (!weightInput || parseFloat(weightInput) <= 0) return;

    const loggedWeight = parseFloat(weightInput);
    const dateStr = new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
    const newEntry = {
      id: 'weight-' + Date.now(),
      weight: loggedWeight,
      date: dateStr,
      timestamp: Date.now()
    };

    const updatedHistory = [...weightHistory, newEntry].sort((a, b) => a.timestamp - b.timestamp);
    setWeightHistory(updatedHistory);
    setWeightInput('');

    if (isFirebaseConfigured && currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.id, 'weightHistory', newEntry.id), newEntry);
        const isImperial = onboardingData?.weightUnit === 'imperial';
        const weightKg = isImperial ? loggedWeight * 0.45359237 : loggedWeight;
        
        const updatedOnboarding = {
          ...onboardingData,
          calculatedWeightKg: Math.round(weightKg * 10) / 10
        };
        setOnboardingData(updatedOnboarding);
        await updateDoc(doc(db, 'users', currentUser.id), { onboardingData: updatedOnboarding });
      } catch (err) {
        console.error('Error logging weight to Firestore:', err);
      }
    } else {
      const localUsers = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
      const idx = localUsers.findIndex(u => u.id === currentUser?.id);
      if (idx !== -1) {
        const isImperial = onboardingData?.weightUnit === 'imperial';
        const weightKg = isImperial ? loggedWeight * 0.45359237 : loggedWeight;
        
        localUsers[idx].onboardingData.calculatedWeightKg = Math.round(weightKg * 10) / 10;
        localUsers[idx].weightHistory = updatedHistory;
        localStorage.setItem('heal_thy_registered_users', JSON.stringify(localUsers));
      }
    }

    triggerNotification('Weight Logged', `Weight updated to ${loggedWeight} ${onboardingData?.weightUnit === 'imperial' ? 'lbs' : 'kg'}.`, 'success');
  };

  const renderWeightHistoryGraph = () => {
    if (weightHistory.length === 0) return null;

    const width = 380;
    const height = 160;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 25;

    const points = weightHistory.slice(-10);
    const values = points.map(p => p.weight);
    const maxVal = Math.max(...values) + 0.5;
    const minVal = Math.max(0, Math.min(...values) - 0.5);
    const range = maxVal - minVal || 1;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const coords = points.map((p, idx) => {
      const x = paddingLeft + (idx / Math.max(1, points.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((p.weight - minVal) / range) * chartHeight;
      return { x, y, label: p.date, value: p.weight };
    });

    let linePath = '';
    coords.forEach((c, idx) => {
      if (idx === 0) {
        linePath += `M ${c.x} ${c.y}`;
      } else {
        linePath += ` L ${c.x} ${c.y}`;
      }
    });

    const areaPath = coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${paddingTop + chartHeight} L ${coords[0].x} ${paddingTop + chartHeight} Z`
      : '';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((r, idx) => {
          const y = paddingTop + r * chartHeight;
          const val = Math.round((maxVal - r * range) * 10) / 10;
          return (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                className={darkMode ? 'stroke-gray-800' : 'stroke-gray-100'} 
                strokeWidth="1"
                strokeDasharray="4"
              />
              <text 
                x={paddingLeft - 6} 
                y={y + 3} 
                textAnchor="end" 
                className="text-[8px] font-bold fill-gray-400"
              >
                {val}
              </text>
            </g>
          );
        })}

        {coords.length > 0 && <path d={areaPath} fill="url(#weightGrad)" />}

        {coords.length > 0 && (
          <path 
            d={linePath} 
            fill="none" 
            className="stroke-teal-500" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        )}

        {coords.map((c, idx) => (
          <g key={idx}>
            <circle cx={c.x} cy={c.y} r="4" className="fill-teal-500/20" />
            <circle cx={c.x} cy={c.y} r="2.5" className="fill-teal-500 stroke-white" strokeWidth="1" />
            
            <text 
              x={c.x} 
              y={height - paddingBottom + 12} 
              textAnchor="middle" 
              className="text-[8px] font-bold fill-gray-450"
            >
              {c.label}
            </text>

            {(idx === 0 || idx === coords.length - 1 || idx === Math.floor(coords.length / 2)) && (
              <text 
                x={c.x} 
                y={c.y - 6} 
                textAnchor="middle" 
                className={`text-[9px] font-extrabold ${darkMode ? 'fill-gray-300' : 'fill-gray-700'}`}
              >
                {c.value}
              </text>
            )}
          </g>
        ))}
      </svg>
    );
  };

  const startWorkoutSession = (workoutText) => {
    const defaultSteps = [
      { name: 'Jumping Jacks (Warmup)', type: 'exercise', duration: 30, reps: 'Continuous' },
      { name: 'Rest', type: 'rest', duration: 15, reps: '' },
      { name: 'Bodyweight Squats', type: 'exercise', duration: 40, reps: '15 Reps' },
      { name: 'Rest', type: 'rest', duration: 20, reps: '' },
      { name: 'Pushups / Knee Pushups', type: 'exercise', duration: 40, reps: '10-12 Reps' },
      { name: 'Rest', type: 'rest', duration: 20, reps: '' },
      { name: 'Plank Hold', type: 'exercise', duration: 30, reps: 'Hold' },
      { name: 'Round Rest', type: 'rest', duration: 45, reps: '' },
      { name: 'Bodyweight Squats', type: 'exercise', duration: 40, reps: '15 Reps' },
      { name: 'Rest', type: 'rest', duration: 20, reps: '' },
      { name: 'Pushups / Knee Pushups', type: 'exercise', duration: 40, reps: '10-12 Reps' },
      { name: 'Rest', type: 'rest', duration: 20, reps: '' },
      { name: 'Plank Hold', type: 'exercise', duration: 30, reps: 'Hold' }
    ];

    const session = {
      title: workoutText ? (workoutText.length > 35 ? workoutText.substring(0, 35) + '...' : workoutText) : 'Home Workout Session',
      stepIndex: 0,
      steps: defaultSteps
    };

    setActiveWorkout(session);
    setWorkoutTimer(defaultSteps[0].duration);
    setWorkoutRunning(true);
    triggerNotification('Workout Started', `Let's go! First exercise: ${defaultSteps[0].name}.`, 'info');
  };

  const handleWorkoutTimerComplete = () => {
    if (!activeWorkout) return;

    const nextIndex = activeWorkout.stepIndex + 1;
    if (nextIndex < activeWorkout.steps.length) {
      const nextStep = activeWorkout.steps[nextIndex];
      setActiveWorkout(prev => ({
        ...prev,
        stepIndex: nextIndex
      }));
      setWorkoutTimer(nextStep.duration);
      setWorkoutRunning(true);
      triggerNotification(
        nextStep.type === 'rest' ? 'Rest Time' : 'Next Exercise', 
        nextStep.type === 'rest' ? 'Catch your breath.' : `Time for ${nextStep.name}!`,
        nextStep.type === 'rest' ? 'info' : 'success'
      );
    } else {
      completeWorkoutSession();
    }
  };

  const completeWorkoutSession = async () => {
    setActiveWorkout(null);
    setWorkoutRunning(false);
    setWorkoutTimer(0);

    triggerNotification('Workout Completed!', 'Excellent work! You finished the entire routine. 🏆', 'success');

    const newLog = {
      id: 'log-' + Date.now(),
      text: '🏃‍♂️ Completed AI Workout Session',
      calories: 150,
      protein: 0,
      carbs: 0,
      fat: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedLogs = [...dailyLogs, newLog];
    setDailyLogs(updatedLogs);

    const todayStr = new Date().toISOString().split('T')[0];
    const updatedHistory = [...new Set([...logHistory, todayStr])];
    setLogHistory(updatedHistory);

    const updatedAchievements = updateAchievementHistory(updatedLogs);

    if (isFirebaseConfigured && currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.id, 'dailyLogs', newLog.id), newLog);
        await updateDoc(doc(db, 'users', currentUser.id), { 
          logHistory: updatedHistory,
          achievementHistory: updatedAchievements
        });
      } catch (err) {
        console.error('Error syncing completed workout:', err);
      }
    } else {
      const localUsers = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
      const idx = localUsers.findIndex(u => u.id === currentUser?.id);
      if (idx !== -1) {
        localUsers[idx].dailyLogs = updatedLogs;
        localUsers[idx].logHistory = updatedHistory;
        localUsers[idx].achievementHistory = updatedAchievements;
        localStorage.setItem('heal_thy_registered_users', JSON.stringify(localUsers));
      }
    }
  };

  const renderHeatmap = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const str = d.toISOString().split('T')[0];
      const isActive = logHistory && logHistory.includes(str);
      
      const dayName = d.toLocaleDateString([], { weekday: 'narrow' });
      const formattedDate = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      days.push({ dateStr: str, isActive, dayName, formattedDate });
    }
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
          <span>Habit Heatmap (Last 28 Days)</span>
          <span className="text-emerald-500 font-extrabold flex items-center gap-0.5">
            <Calendar className="w-3.5 h-3.5" /> Grid View
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1 max-w-xs mx-auto">
          {days.map((day, idx) => (
            <div 
              key={idx}
              title={`${day.formattedDate}: ${day.isActive ? 'Active Log' : 'No Log'}`}
              className={`w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold transition-all ${
                day.isActive 
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/10' 
                  : darkMode 
                    ? 'bg-gray-800 text-gray-500 hover:bg-gray-750' 
                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
              }`}
            >
              {day.dayName}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const appLayoutWrapper = (content) => (
    <div className={`min-h-screen relative flex flex-col justify-between transition-colors duration-300 ${
      darkMode ? 'bg-gray-955 text-gray-150' : 'bg-gray-50 text-gray-900'
    }`}>
      {content}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );

  // RENDER ADMIN DASHBOARD
  if (isAdmin) {
    const dbUsers = JSON.parse(localStorage.getItem('heal_thy_registered_users') || '[]');
    const totalTdee = dbUsers.filter(u => u.onboardingData).reduce((acc, curr) => acc + curr.onboardingData.tdee, 0);
    const avgTdee = dbUsers.filter(u => u.onboardingData).length > 0
      ? Math.round(totalTdee / dbUsers.filter(u => u.onboardingData).length)
      : 0;

    return appLayoutWrapper(
      <div className={`min-h-screen flex flex-col transition-colors ${
        darkMode ? 'bg-gray-955' : 'bg-gray-105'
      }`}>
        <header className={`p-4 shadow-md flex justify-between items-center transition-colors ${
          darkMode ? 'bg-teal-950 border-b border-teal-900/60' : 'bg-teal-800 text-white'
        }`}>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-450" /> Heal-Thy Admin Center
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-xl border transition-all ${
                darkMode
                  ? 'bg-teal-900 border-teal-800 text-amber-400'
                  : 'bg-teal-700 border-teal-600 text-white hover:bg-teal-650'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={handleAdminLogout}
              className={`flex items-center gap-1.5 text-xs font-bold py-2 px-4 rounded-xl transition-all ${
                darkMode ? 'bg-teal-900 hover:bg-teal-850 text-white' : 'bg-teal-900 hover:bg-teal-955 text-white'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" /> Logout Admin
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-5xl mx-auto w-full flex-1 space-y-6">
          {/* Key Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl shadow-sm border flex items-center gap-4 transition-colors ${
              darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
            }`}>
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl text-teal-600"><Users className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Registered Users</p>
                <p className={`text-2xl font-black mt-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{dbUsers.length}</p>
              </div>
            </div>
            <div className={`p-5 rounded-2xl shadow-sm border flex items-center gap-4 transition-colors ${
              darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
            }`}>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600"><BarChart3 className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Average TDEE</p>
                <p className={`text-2xl font-black mt-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{avgTdee} kcal</p>
              </div>
            </div>
            <div className={`p-5 rounded-2xl shadow-sm border flex items-center gap-4 transition-colors ${
              darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
            }`}>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600"><Sparkles className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gemini API Status</p>
                <p className={`text-2xl font-black mt-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Active</p>
              </div>
            </div>
            <div className={`p-5 rounded-2xl shadow-sm border flex items-center gap-4 transition-colors ${
              darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
            }`}>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600"><Database className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mock DB Status</p>
                <p className={`text-2xl font-black mt-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Active</p>
              </div>
            </div>
          </div>

          {/* User Database Controls */}
          <div className={`rounded-2xl shadow-sm border p-5 space-y-4 transition-colors ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>User Database Directory</h3>
                <p className="text-xs text-gray-400">View and manage registered clients and calculated metrics.</p>
              </div>
              <button 
                onClick={exportUsersToCSV}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-all"
              >
                <FileText className="w-4 h-4" /> Export Client Database (CSV)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-bold">
                    <th className="py-3 px-2">Client ID</th>
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Age / Gender</th>
                    <th className="py-3 px-2">Metrics</th>
                    <th className="py-3 px-2">Diet</th>
                    <th className="py-3 px-2">Goal Focus</th>
                    <th className="py-3 px-2">TDEE</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${darkMode ? 'divide-gray-800 text-gray-350' : 'divide-gray-55 text-gray-700'}`}>
                  {dbUsers.map(u => (
                    <tr key={u.id} className={darkMode ? 'hover:bg-gray-850/50' : 'hover:bg-gray-50/50'}>
                      <td className="py-3.5 px-2 text-gray-500 font-mono">{u.id}</td>
                      <td className={`py-3.5 px-2 font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{u.name}</td>
                      <td className="py-3.5 px-2">{u.email}</td>
                      <td className="py-3.5 px-2">
                        {u.onboardingData ? `${u.onboardingData.age}y / ${u.onboardingData.gender}` : 'Pending Onboarding'}
                      </td>
                      <td className="py-3.5 px-2">
                        {u.onboardingData ? `${u.onboardingData.calculatedHeightCm}cm / ${u.onboardingData.calculatedWeightKg}kg` : 'N/A'}
                      </td>
                      <td className="py-3.5 px-2">
                        {u.onboardingData ? (
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}>{u.onboardingData.dietType}</span>
                        ) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-2 truncate max-w-[120px]">
                        {u.onboardingData ? u.onboardingData.startingPoint : 'N/A'}
                      </td>
                      <td className="py-3.5 px-2 font-bold text-teal-600">
                        {u.onboardingData ? `${u.onboardingData.tdee} kcal` : 'N/A'}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <button 
                          onClick={() => deleteUserFromAdmin(u.id)}
                          className="text-rose-500 hover:text-rose-700 hover:underline text-[10px] font-bold"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // RENDER LANDING PAGE & AUTH MODALS
  if (!isAuthenticated) {
    return appLayoutWrapper(
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
        darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        {/* Navigation */}
        <nav className="p-4 flex justify-between items-center max-w-5xl mx-auto w-full">
          <span className="text-xl font-black tracking-tight text-teal-555 flex items-center gap-1">
            🥬 Heal-Thy
          </span>
          <div className="flex gap-4 items-center">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-xl border transition-all ${
                darkMode
                  ? 'bg-gray-900 border-gray-800 text-amber-400'
                  : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setShowAdminAuthModal(true)}
              className="text-xs font-bold text-teal-500 hover:underline flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" /> Admin Portal
            </button>
            <button 
              onClick={() => { setAuthMode('login'); setShowUserAuthModal(true); }}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md"
            >
              Login / Register
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="flex-1 max-w-4xl mx-auto w-full px-6 flex flex-col items-center justify-center text-center space-y-6 py-12">
          <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full border uppercase tracking-widest animate-pulse ${
            darkMode ? 'bg-teal-500/10 text-teal-300 border-teal-500/20' : 'bg-teal-50 text-teal-850 border-teal-100'
          }`}>
            Introducing Heal-Thy 1.0
          </span>
          <h2 className={`text-4xl sm:text-5xl font-black tracking-tight leading-none max-w-xl transition-colors ${
            darkMode ? 'text-white' : 'text-teal-900'
          }`}>
            Your Journey to a <span className="text-teal-555">Healthier You</span> starts here
          </h2>
          <p className={`text-sm max-w-md leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-550'}`}>
            Heal-Thy combines Mifflin-St Jeor metabolic tracking, dynamic dietary intake configurations, and an active Google Gemini AI health coach.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-4">
            <button 
              onClick={() => { setAuthMode('register'); setShowUserAuthModal(true); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
            >
              Start Your Journey
            </button>
            <button 
              onClick={() => { setAuthMode('login'); setShowUserAuthModal(true); }}
              className={`px-8 py-3 rounded-full font-bold transition-all ${
                darkMode ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-teal-50 text-teal-850 hover:bg-teal-100/80 border border-teal-100/50'
              }`}
            >
              Access Member Dashboard
            </button>
          </div>
        </header>

        {/* Features Highlights */}
        <section className={`py-12 border-t transition-colors ${
          darkMode ? 'bg-gray-900 border-gray-850' : 'bg-teal-50/40 border-teal-100'
        }`}>
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className={`p-6 rounded-2xl border space-y-3 transition-colors ${
              darkMode ? 'bg-gray-955 border-gray-850' : 'bg-white border-teal-50 shadow-sm'
            }`}>
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-12"><Scale className="w-6 h-6" /></div>
              <h4 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-teal-900'}`}>TDEE Tracking</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Instantly map out active daily maintenance calorie requirements using the Mifflin-St Jeor equation.</p>
            </div>
            <div className={`p-6 rounded-2xl border space-y-3 transition-colors ${
              darkMode ? 'bg-gray-955 border-gray-850' : 'bg-white border-teal-50 shadow-sm'
            }`}>
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-12"><Salad className="w-6 h-6" /></div>
              <h4 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-teal-900'}`}>External Sync</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Pre-populate physical profiles immediately via JSON uploads or single-tap Apple Health / Google Fit sync keys.</p>
            </div>
            <div className={`p-6 rounded-2xl border space-y-3 transition-colors ${
              darkMode ? 'bg-gray-955 border-gray-855' : 'bg-white border-teal-50 shadow-sm'
            }`}>
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-12"><Sparkles className="w-6 h-6" /></div>
              <h4 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-teal-900'}`}>AI Health Advisor</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Request Indian recipe suggestions and workout instructions tailored to your specific metabolic constraints.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`p-6 text-center text-xs border-t flex justify-between items-center max-w-5xl mx-auto w-full ${
          darkMode ? 'text-gray-600 border-gray-900' : 'text-gray-500 border-teal-100'
        }`}>
          <span>&copy; 2026 Heal-Thy Inc. All rights reserved.</span>
          <span className="flex items-center gap-1">Made with <Heart className="w-3.5 h-3.5 text-rose-500" /> for wellness</span>
        </footer>

        {/* USER AUTHENTICATION MODAL */}
        {showUserAuthModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-sm rounded-2xl shadow-xl border overflow-hidden flex flex-col transition-colors ${
              darkMode ? 'bg-gray-900 border-gray-800 text-white shadow-black/40' : 'bg-white border-gray-100 text-gray-900'
            }`}>
              {/* Tab Switchers */}
              <div className={`flex p-1 ${darkMode ? 'bg-gray-850 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-100'}`}>
                <button 
                  onClick={() => { setAuthMode('login'); setAuthError(null); }}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                    authMode === 'login' 
                      ? darkMode ? 'bg-gray-800 text-teal-400 shadow-sm' : 'bg-white shadow-sm text-teal-800' 
                      : 'text-gray-400'
                  }`}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setAuthMode('register'); setAuthError(null); }}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                    authMode === 'register' 
                      ? darkMode ? 'bg-gray-800 text-teal-400 shadow-sm' : 'bg-white shadow-sm text-teal-800' 
                      : 'text-gray-400'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={authMode === 'login' ? handleUserLogin : handleUserRegister} className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`font-extrabold text-base ${darkMode ? 'text-white' : 'text-teal-900'}`}>
                    {authMode === 'login' ? 'Welcome Back' : 'Sign Up to Heal-Thy'}
                  </h3>
                  <button type="button" onClick={() => { setShowUserAuthModal(false); setAuthError(null); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {authMode === 'register' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={authForm.name}
                        onChange={e => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. John Doe"
                        className={`pl-9 w-full rounded-xl p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${
                          darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input 
                      type="email" 
                      value={authForm.email}
                      onChange={e => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. john@example.com"
                      className={`pl-9 w-full rounded-xl p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${
                        darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input 
                      type="password" 
                      value={authForm.password}
                      onChange={e => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                      className={`pl-9 w-full rounded-xl p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${
                        darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                {authError && (
                  <p className="text-rose-500 text-[10px] font-bold bg-rose-50 border border-rose-100 p-2 rounded-lg">{authError}</p>
                )}

                <button 
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                >
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ADMIN AUTHENTICATION MODAL */}
        {showAdminAuthModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-sm rounded-2xl shadow-xl border overflow-hidden flex flex-col p-6 space-y-4 transition-colors ${
              darkMode ? 'bg-gray-900 border-gray-800 text-white shadow-black/40' : 'bg-white border-gray-100 text-gray-900'
            }`}>
              <div className="flex justify-between items-center">
                <h3 className={`font-extrabold text-base flex items-center gap-1.5 ${darkMode ? 'text-teal-400' : 'text-teal-900'}`}>
                  <Shield className="w-5 h-5 text-teal-600" /> Admin Access Portal
                </h3>
                <button onClick={() => { setShowAdminAuthModal(false); setAdminError(''); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Admin Key Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input 
                      type="password" 
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="Enter Admin Password (admin123)"
                      className={`pl-9 w-full rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${
                        darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                {adminError && (
                  <p className="text-rose-500 text-[10px] font-bold bg-rose-50 border border-rose-100 p-2 rounded-lg">{adminError}</p>
                )}

                <button 
                  type="submit"
                  className="w-full bg-teal-800 hover:bg-teal-900 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                >
                  Verify Admin Identity
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER ONBOARDING FLOW
  if (!hasCompletedOnboarding) {
    return appLayoutWrapper(
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${
        darkMode ? 'bg-gray-955' : 'bg-gray-50'
      }`}>
        <div className="w-full max-w-md mb-4 flex justify-between items-center px-1">
          <h1 className={`text-xl font-black flex items-center gap-1.5 ${darkMode ? 'text-teal-400' : 'text-teal-800'}`}>
            🥬 Heal-Thy
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className={`p-1.5 rounded-lg border transition-all ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-amber-400'
                  : 'bg-gray-100/50 border-gray-200 text-gray-500 hover:text-gray-700'
              }`}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={requestNotificationPermission}
              className={`p-1.5 rounded-lg border transition-all ${
                notificationPermission === 'granted'
                  ? 'bg-teal-50 border-teal-100 text-teal-600'
                  : darkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-400'
                    : 'bg-gray-100/50 border-gray-200 text-gray-400 hover:text-gray-600'
              }`}
            >
              {notificationPermission === 'granted' ? (
                <Bell className="w-3.5 h-3.5" />
              ) : (
                <BellOff className="w-3.5 h-3.5" />
              )}
            </button>
            <button 
              onClick={handleUserLogout}
              className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-750' 
                  : 'bg-gray-200/50 hover:bg-gray-200 text-gray-500 hover:text-gray-700'
              }`}
            >
              Logout
            </button>
          </div>
        </div>
        <PlanBuilder onComplete={handleOnboardingComplete} triggerNotification={triggerNotification} darkMode={darkMode} />
      </div>
    );
  }

  // RENDER MAIN DASHBOARD
  const loggedCalories = dailyLogs.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const loggedProtein = dailyLogs.reduce((acc, curr) => acc + (curr.protein || 0), 0);
  const loggedWater = dailyLogs.filter(log => log.isWater).length;

  const renderProjectedGraph = () => {
    if (!onboardingData) return null;
    
    const weightUnit = onboardingData.weightUnit || 'metric';
    const currentWeight = weightUnit === 'metric' 
      ? onboardingData.calculatedWeightKg 
      : Math.round(onboardingData.calculatedWeightKg * 2.20462);
      
    // Projected daily energy balance
    const dailyTarget = goals.calories;
    const maintenanceTdee = onboardingData.tdee;
    const netKcal = dailyTarget - maintenanceTdee;
    
    // Weight change coefficients (7700 kcal per kg, or ~3500 kcal per lb)
    let deltaPerWeek = 0;
    if (weightUnit === 'metric') {
      deltaPerWeek = (netKcal * 7) / 7700; // in kg
    } else {
      deltaPerWeek = (netKcal * 7) / 3500; // in lbs
    }
    
    // Generate data points
    const points = [];
    for (let i = 0; i <= 4; i++) {
      const projectedVal = currentWeight + (deltaPerWeek * i);
      points.push({
        label: i === 0 ? 'Today' : `Wk ${i}`,
        value: Math.round(projectedVal * 10) / 10
      });
    }
    
    // SVG Dimensions
    const width = 380;
    const height = 160;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;
    
    // Find min and max for Y scale scaling
    const values = points.map(p => p.value);
    const maxVal = Math.max(...values) + 1;
    const minVal = Math.max(0, Math.min(...values) - 1);
    const range = maxVal - minVal || 1;
    
    // Convert points to SVG coordinates
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    
    const coords = points.map((p, idx) => {
      const x = paddingLeft + (idx / 4) * chartWidth;
      const y = paddingTop + chartHeight - ((p.value - minVal) / range) * chartHeight;
      return { x, y, label: p.label, value: p.value };
    });
    
    // Construct line path (D attribute)
    let linePath = '';
    coords.forEach((c, idx) => {
      if (idx === 0) {
        linePath += `M ${c.x} ${c.y}`;
      } else {
        linePath += ` L ${c.x} ${c.y}`;
      }
    });
    
    // Construct area path for gradient fill
    const areaPath = `${linePath} L ${coords[4].x} ${paddingTop + chartHeight} L ${coords[0].x} ${paddingTop + chartHeight} Z`;
    
    return (
      <div className={`w-full max-w-md p-5 rounded-2xl shadow-lg border transition-all ${
        darkMode ? 'bg-gray-900 border-gray-800 text-white shadow-black/40' : 'bg-white border-gray-150 text-gray-900'
      }`}>
        <div className="flex justify-between items-center border-b pb-3 mb-4 dark:border-gray-800">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-teal-650 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-teal-500" /> 4-Week Weight Projection
            </h3>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Projected trajectory based on target calorie intake</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
            netKcal < 0 
              ? 'bg-emerald-600 text-white'
              : netKcal > 0
                ? 'bg-amber-600 text-white'
                : darkMode ? 'bg-gray-800 text-gray-450' : 'bg-gray-100 text-gray-500'
          }`}>
            {netKcal < 0 ? 'Deficit (Loss)' : netKcal > 0 ? 'Surplus (Gain)' : 'Maintenance'}
          </span>
        </div>
        
        {/* SVG Graphic */}
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            
            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
              const y = paddingTop + r * chartHeight;
              const val = Math.round((maxVal - r * range) * 10) / 10;
              return (
                <g key={idx}>
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={width - paddingRight} 
                    y2={y} 
                    className={darkMode ? 'stroke-gray-800' : 'stroke-gray-100'} 
                    strokeWidth="1"
                    strokeDasharray="4"
                  />
                  <text 
                    x={paddingLeft - 8} 
                    y={y + 3} 
                    textAnchor="end" 
                    className="text-[9px] font-bold fill-gray-400"
                  >
                    {val}
                  </text>
                </g>
              );
            })}
            
            {/* Gradient Area Fill */}
            <path d={areaPath} fill="url(#chartGradient)" />
            
            {/* Line Path */}
            <path 
              d={linePath} 
              fill="none" 
              className="stroke-teal-500" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            
            {/* Dot Points and Labels */}
            {coords.map((c, idx) => (
              <g key={idx}>
                {/* Outer shadow dot */}
                <circle cx={c.x} cy={c.y} r="5" className="fill-teal-500/20" />
                {/* Inner dot */}
                <circle cx={c.x} cy={c.y} r="3.5" className="fill-teal-500 stroke-white" strokeWidth="1.5" />
                
                {/* Week Label (X-axis) */}
                <text 
                  x={c.x} 
                  y={height - paddingBottom + 16} 
                  textAnchor="middle" 
                  className="text-[10px] font-bold fill-gray-400"
                >
                  {c.label}
                </text>
                
                {/* Value Label (Above dot) */}
                <text 
                  x={c.x} 
                  y={c.y - 8} 
                  textAnchor="middle" 
                  className={`text-[9px] font-extrabold ${darkMode ? 'fill-gray-300' : 'fill-gray-700'}`}
                >
                  {c.value} {weightUnit === 'metric' ? 'kg' : 'lb'}
                </text>
              </g>
            ))}
          </svg>
        </div>
        
        {/* Prediction summary analysis */}
        <div className={`mt-3 text-[11px] p-3 rounded-xl border leading-relaxed ${
          darkMode ? 'bg-gray-850 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-655'
        }`}>
          {netKcal < 0 ? (
            <span>
              📉 With a planned daily deficit of <strong>{Math.abs(netKcal)} kcal</strong> below maintenance, you are projected to lose about <strong>{Math.round(Math.abs(deltaPerWeek) * 10) / 10} {weightUnit === 'metric' ? 'kg' : 'lb'}</strong> per week, reaching <strong>{points[4].value} {weightUnit === 'metric' ? 'kg' : 'lb'}</strong> in 4 weeks.
            </span>
          ) : netKcal > 0 ? (
            <span>
              📈 With a planned daily surplus of <strong>{netKcal} kcal</strong> over maintenance, you are projected to gain about <strong>{Math.round(deltaPerWeek * 10) / 10} {weightUnit === 'metric' ? 'kg' : 'lb'}</strong> per week, reaching <strong>{points[4].value} {weightUnit === 'metric' ? 'kg' : 'lb'}</strong> in 4 weeks.
            </span>
          ) : (
            <span>
              ⚖️ Your intake perfectly matches your maintenance TDEE. Your weight is projected to remain stable at <strong>{currentWeight} {weightUnit === 'metric' ? 'kg' : 'lb'}</strong> over the next 4 weeks.
            </span>
          )}
        </div>
      </div>
    );
  };

  return appLayoutWrapper(
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-350 ${
      darkMode ? 'bg-gray-955 text-gray-150' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className={`hidden md:flex flex-col w-64 border-r h-screen sticky top-0 justify-between p-5 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 border-gray-850 text-white' : 'bg-white border-gray-150 text-gray-900'
      }`}>
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <span className="text-xl font-black tracking-tight text-teal-600 flex items-center gap-1">
              🥬 Heal-Thy
            </span>
          </div>
          
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Overview & Metrics', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'coach', label: 'AI Diet Coach', icon: <Sparkles className="w-4 h-4" /> },
              { id: 'milestones', label: 'Milestones & Goals', icon: <Target className="w-4 h-4" /> },
              { id: 'settings', label: 'Routine & Settings', icon: <Scale className="w-4 h-4" /> }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-teal-600 text-white shadow-md' 
                      : darkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-855' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-55'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Sidebar Footer */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-805">
          <div className="px-2">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Signed in as</p>
            <p className="text-xs font-bold truncate mt-0.5">{currentUser?.name}</p>
          </div>
          
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
              className={`p-2 rounded-xl border flex-1 flex justify-center transition-all ${
                darkMode ? 'bg-gray-850 border-gray-800 text-amber-400' : 'bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-700'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <button
              onClick={handleUserLogout}
              title="Logout"
              className={`p-2 rounded-xl border flex-1 flex justify-center transition-all ${
                darkMode ? 'bg-gray-850 border-gray-800 text-rose-400' : 'bg-gray-100 border-gray-200 text-rose-600 hover:text-rose-700'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Mobile Header (visible only on mobile) */}
        <header className={`md:hidden p-4 border-b flex justify-between items-center transition-colors ${
          darkMode ? 'bg-gray-900 border-gray-850' : 'bg-white border-gray-100'
        }`}>
          <div>
            <h1 className={`text-lg font-black ${darkMode ? 'text-teal-400' : 'text-teal-800'}`}>🥬 Heal-Thy</h1>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{currentUser?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className={`p-1.5 rounded-xl border transition-all ${
                darkMode ? 'bg-gray-850 border-gray-800 text-amber-400' : 'bg-gray-50 border-gray-200 text-gray-505'
              }`}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={handleUserLogout}
              className={`text-[10px] font-bold py-1.5 px-3 rounded-xl border transition-all ${
                darkMode ? 'bg-gray-850 border-gray-805 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-650'
              }`}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6 flex-1 flex flex-col items-center space-y-6 pb-24 md:pb-6">
          
          {/* TAB 1: OVERVIEW & METRICS */}
          {activeTab === 'overview' && (
            <>
              {/* Streak & Habit Heatmap Card */}
              <div className={`w-full max-w-md p-5 rounded-2xl shadow-lg border transition-colors ${
                darkMode ? 'bg-gray-900 border-gray-805' : 'bg-white border-gray-100'
              }`}>
                <div className="flex justify-between items-center border-b pb-3 mb-4 dark:border-gray-800">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-650 flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500 animate-bounce" /> {calculateStreak(logHistory)} Day Active Streak
                  </span>
                  <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-400' : 'text-gray-505'}`}>Habit Calendar</span>
                </div>
                {renderHeatmap()}
              </div>

              {/* BMI Card */}
              {onboardingData && (
                <div className={`w-full max-w-md p-5 rounded-2xl shadow-lg border transition-colors ${
                  darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100'
                }`}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-teal-655 mb-4 flex items-center gap-1.5">
                    <Scale className="w-4.5 h-4.5 text-teal-500" /> BMI & Body Composition Profile
                  </h3>
                  {(() => {
                    const { bmi, category, colorClass, bgClass } = calculateBmi(onboardingData);
                    const percent = Math.min(100, Math.max(0, ((bmi - 15) / 20) * 100));
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Current BMI</span>
                            <p className="text-3xl font-black">{bmi}</p>
                          </div>
                          <div className={`px-3 py-1.5 rounded-xl border font-extrabold text-xs ${bgClass} ${colorClass}`}>
                            🩺 {category}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="relative h-2 rounded-full bg-gradient-to-r from-blue-400 via-emerald-400 via-amber-400 to-rose-400">
                            <div 
                              className="absolute -top-1 w-4 h-4 bg-white dark:bg-gray-900 border-2 border-teal-500 rounded-full shadow-md transition-all duration-500 transform -translate-x-1/2"
                              style={{ left: `${percent}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                            <span>15 (Under)</span>
                            <span>18.5 (Normal)</span>
                            <span>25 (Over)</span>
                            <span>30 (Obese)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Weight Tracker Card */}
              {onboardingData && (
                <div className={`w-full max-w-md p-5 rounded-2xl shadow-lg border transition-colors ${
                  darkMode ? 'bg-gray-900 border-gray-850 text-white' : 'bg-white border-gray-100'
                }`}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-teal-655 mb-4 flex items-center gap-1.5">
                    <Scale className="w-4.5 h-4.5 text-teal-500" /> Weight Tracker & History
                  </h3>
                  
                  <form onSubmit={handleLogWeight} className="flex gap-2 mb-4">
                    <input 
                      type="number"
                      step="0.1"
                      min="1"
                      value={weightInput}
                      onChange={e => setWeightInput(e.target.value)}
                      placeholder={`Weight in ${onboardingData?.weightUnit === 'imperial' ? 'lbs' : 'kg'}`}
                      className={`flex-1 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-teal-500 ${
                        darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    />
                    <button 
                      type="submit"
                      className="bg-teal-650 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                    >
                      Log Weight
                    </button>
                  </form>

                  {weightHistory.length > 0 ? (
                    <div className="space-y-4">
                      {renderWeightHistoryGraph()}
                      
                      <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                        {weightHistory.slice().reverse().map(entry => (
                          <div key={entry.id} className={`p-2 rounded-xl flex justify-between text-xs border ${
                            darkMode ? 'bg-gray-855/50 border-gray-800' : 'bg-gray-50 border-gray-100'
                          }`}>
                            <span className="font-semibold">{entry.date}</span>
                            <span className="font-bold text-teal-600">
                              {entry.weight} {onboardingData?.weightUnit === 'imperial' ? 'lbs' : 'kg'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic text-center py-4">No weight history logged yet.</p>
                  )}
                </div>
              )}

              {/* Metabolic Energy Balance Card */}
              {onboardingData && (
                <div className={`w-full max-w-md p-5 rounded-2xl shadow-lg border transition-colors ${
                  darkMode ? 'bg-gray-900 border-gray-805 text-white' : 'bg-white border-gray-100'
                }`}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-teal-655 mb-4 flex items-center gap-1.5">
                    <BarChart3 className="w-4.5 h-4.5 text-teal-500" /> Metabolic Energy Balance
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="flex flex-col items-center justify-center relative py-2">
                      <svg className="w-28 h-28 transform -rotate-90">
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          className={darkMode ? 'stroke-gray-850' : 'stroke-gray-100'}
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          className="stroke-teal-500 transition-all duration-500"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={301.6}
                          strokeDashoffset={301.6 - (301.6 * Math.min(100, (loggedCalories / onboardingData.tdee) * 100)) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-black leading-none">{loggedCalories}</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">kcal logged</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-gray-850 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                        <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider">Maintenance TDEE</span>
                        <span className="text-sm font-extrabold">{onboardingData.tdee} kcal</span>
                      </div>
                      
                      <div className={`p-2.5 rounded-xl border ${
                        loggedCalories <= onboardingData.tdee 
                          ? darkMode ? 'bg-emerald-955/20 border-emerald-900 text-emerald-305' : 'bg-emerald-50 border-emerald-100 text-emerald-850'
                          : darkMode ? 'bg-amber-955/20 border-amber-900 text-amber-305' : 'bg-amber-50 border-amber-100 text-amber-850'
                      }`}>
                        <span className="block text-[9px] opacity-80 font-bold uppercase tracking-wider">
                          {loggedCalories <= onboardingData.tdee ? 'Net Deficit' : 'Net Surplus'}
                        </span>
                        <span className="text-sm font-extrabold">
                          {Math.abs(onboardingData.tdee - loggedCalories)} kcal
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`mt-4 text-center text-xs font-semibold p-2 rounded-xl ${
                    loggedCalories === 0
                      ? darkMode ? 'bg-gray-850 text-gray-400' : 'bg-gray-100 text-gray-505'
                      : loggedCalories <= onboardingData.tdee
                        ? darkMode ? 'bg-emerald-955/40 text-emerald-300' : 'bg-emerald-50 text-emerald-805'
                        : darkMode ? 'bg-amber-955/40 text-amber-300' : 'bg-amber-800 text-white'
                  }`}>
                    {loggedCalories === 0 ? (
                      "Start logging meals to calculate your energy balance."
                    ) : loggedCalories <= onboardingData.tdee ? (
                      `👍 You are currently in a ${onboardingData.tdee - loggedCalories} kcal deficit for weight loss.`
                    ) : (
                      `⚠️ You are currently in a ${loggedCalories - onboardingData.tdee} kcal surplus over maintenance.`
                    )}
                  </div>
                </div>
              )}

              {/* Projected weight trajectory */}
              {renderProjectedGraph()}
            </>
          )}

          {/* TAB 2: AI DIET & WORKOUT COACH */}
          {activeTab === 'coach' && (
            <>
              {/* AI Calorie Food Logger Section */}
              <div className={`w-full max-w-md p-5 rounded-2xl shadow-lg border transition-colors ${
                darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
              }`}>
                <div className="flex items-center gap-1.5 border-b pb-3 mb-4 dark:border-gray-800 text-teal-600 font-extrabold text-sm uppercase">
                  <Coffee className="w-4 h-4" /> Log Food & Estimate Calories
                </div>

                <form onSubmit={handleLogFoodWithGemini} className="space-y-3">
                  <div className="relative">
                    <textarea 
                      value={foodText}
                      onChange={e => setFoodText(e.target.value)}
                      placeholder="What did you eat today? (e.g. 'I had 2 chapatis, a bowl of yellow dal, and one cucumber salad.')"
                      rows="2"
                      className={`w-full rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-teal-500 resize-none ${
                        darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loggingFood || !foodText.trim()}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold p-3 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loggingFood ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating Calories...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Log & Estimate Nutrition</>
                    )}
                  </button>
                </form>

                {/* List of food logged today */}
                <div className="mt-5 space-y-2 border-t pt-4 dark:border-gray-800">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Logged Items Today</h4>
                  {dailyLogs.length === 0 ? (
                    <p className="text-xs text-gray-500 italic text-center py-4">No meals logged for today yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {dailyLogs.map(log => (
                        <div key={log.id} className={`p-3 rounded-xl flex justify-between items-center border ${
                          darkMode ? 'bg-gray-855/60 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-700'
                        }`}>
                          <div>
                            <p className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>{log.text}</p>
                            {log.isWater ? (
                              <p className="text-[9px] text-gray-550 mt-0.5">{log.timestamp}</p>
                            ) : (
                              <p className="text-[9px] text-gray-550 mt-0.5">
                                {log.calories} kcal / {log.protein}g P / {log.carbs}g C / {log.fat}g F &bull; {log.timestamp}
                              </p>
                            )}
                          </div>
                          <button 
                            onClick={() => handleDeleteFoodLog(log.id)}
                            className="text-gray-450 hover:text-rose-505 p-1"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Daywise meal plan display */}
              {!mealData && !loadingAi ? (
                <div className={`w-full max-w-md p-5 rounded-2xl shadow-lg border text-center space-y-4 ${
                  darkMode ? 'bg-gray-900 border-gray-805 text-gray-305' : 'bg-white border-gray-100 text-gray-700'
                }`}>
                  <Sparkles className="w-8 h-8 text-teal-555 mx-auto animate-bounce" />
                  <h4 className="font-extrabold text-sm">No Active Daywise Diet Plan</h4>
                  <p className="text-xs text-gray-500 leading-normal">
                    Generate your day-by-day customized menu based on your metabolic parameters.
                  </p>
                  <button
                    onClick={() => fetchMealPlan()}
                    className="bg-teal-650 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-sm"
                  >
                    Generate Daywise Plan
                  </button>
                </div>
              ) : (
                <div className="flex justify-center w-full">
                  <MealPlanCard isLoading={loadingAi} mealData={mealData} onFollowUp={fetchMealPlan} onStartWorkout={startWorkoutSession} darkMode={darkMode} />
                </div>
              )}
            </>
          )}

          {/* TAB 3: MILESTONES & TARGETS */}
          {activeTab === 'milestones' && (
            <>
              {/* Daily Goals Progress Bars */}
              <div className={`w-full max-w-md p-5 rounded-2xl shadow-lg border transition-colors relative overflow-hidden ${
                darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
              }`}>
                <div className="flex justify-between items-center border-b pb-3 mb-4 dark:border-gray-800">
                  <div>
                    <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Daily Progress Tracker</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Logs vs Targets</p>
                  </div>
                  <button 
                    onClick={() => setShowGoalsEditor(!showGoalsEditor)}
                    className="text-[10px] font-bold text-teal-600 hover:underline flex items-center gap-0.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Targets
                  </button>
                </div>

                {/* Goal Editor Form Overlay */}
                {showGoalsEditor && (
                  <form onSubmit={handleUpdateGoals} className={`absolute inset-0 z-20 p-5 flex flex-col justify-between transition-colors ${
                    darkMode ? 'bg-gray-900' : 'bg-white'
                  }`}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b pb-1 dark:border-gray-800">
                        <h4 className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>Modify Calorie & Water Targets</h4>
                        <button type="button" onClick={() => setShowGoalsEditor(false)} className="text-gray-450"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-gray-450 uppercase tracking-wide">Calories (kcal)</label>
                          <input 
                            type="number"
                            min="1000"
                            value={goalInputs.calories}
                            onChange={e => setGoalInputs(prev => ({ ...prev, calories: e.target.value }))}
                            className={`w-full rounded-lg p-1.5 text-xs outline-none ${
                              darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-450 uppercase tracking-wide">Water (Cups)</label>
                          <input 
                            type="number"
                            min="1"
                            value={goalInputs.water}
                            onChange={e => setGoalInputs(prev => ({ ...prev, water: e.target.value }))}
                            className={`w-full rounded-lg p-1.5 text-xs outline-none ${
                              darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-450 uppercase tracking-wide">Protein (g)</label>
                          <input 
                            type="number"
                            min="10"
                            value={goalInputs.protein}
                            onChange={e => setGoalInputs(prev => ({ ...prev, protein: e.target.value }))}
                            className={`w-full rounded-lg p-1.5 text-xs outline-none ${
                              darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-teal-650 hover:bg-teal-700 text-white font-bold py-2 rounded-xl text-xs shadow-sm mt-3"
                    >
                      Save Target Goals
                    </button>
                  </form>
                )}

                {/* Goal Meters */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-500" /> Calories Intake</span>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-705'}>
                        <strong>{loggedCalories}</strong> / {goals.calories} kcal
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-150'}`}>
                      <div 
                        className="bg-orange-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (loggedCalories / goals.calories) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1"><Salad className="w-3.5 h-3.5 text-teal-500" /> Protein Target</span>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        <strong>{loggedProtein}g</strong> / {goals.protein}g
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-155'}`}>
                      <div 
                        className="bg-teal-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (loggedProtein / goals.protein) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="flex items-center gap-1"><Droplet className="w-3.5 h-3.5 text-blue-500" /> Water Intake</span>
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                          <strong>{loggedWater}</strong> / {goals.water} Cups
                        </span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-150'}`}>
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (loggedWater / goals.water) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleIncrementWater}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl text-xs transition-colors shrink-0 shadow-sm flex items-center gap-1"
                    >
                      <PlusCircle className="w-4 h-4" /> +1 Cup
                    </button>
                  </div>
                </div>
              </div>

              {/* Achievements Milestone List */}
              {currentUser && (
                <div className={`w-full max-w-md p-5 rounded-2xl shadow-lg border transition-all ${
                  darkMode ? 'bg-gray-900 border-gray-850 text-white shadow-black/40' : 'bg-white border-gray-150 text-gray-900'
                }`}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-teal-655 mb-3 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-teal-500 animate-pulse" /> 🏆 Goal Achievement Milestones
                  </h3>
                  
                  {(achievementHistory || []).length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-505 italic space-y-1">
                      <p>No achievements logged yet.</p>
                      <p className="text-[10px] text-gray-450">Hit your Calorie, Protein, or Water goals to log daily achievements!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {(achievementHistory || []).map((ach, idx) => {
                        const hasAll = ach.achievements?.length === 3;
                        return (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-xl border flex flex-col gap-1.5 transition-all ${
                              hasAll 
                                ? darkMode ? 'bg-emerald-955/25 border-emerald-900/60 text-emerald-305' : 'bg-emerald-50 border-emerald-100 text-emerald-850'
                                : darkMode ? 'bg-gray-850/65 border-gray-800 text-gray-305' : 'bg-gray-50 border-gray-100 text-gray-700'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold font-mono text-gray-450">
                                {new Date(ach.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              {hasAll && (
                                <span className="text-[9px] font-extrabold uppercase tracking-wide bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                                  Perfect Day ⭐
                                </span>
                              )}
                            </div>
                            
                            <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {ach.note}
                            </p>
                            
                            <div className="flex flex-wrap gap-1">
                              {ach.achievements?.map((a, aIdx) => {
                                const tagColors = {
                                  Calories: darkMode ? 'bg-orange-955/40 border-orange-900 text-orange-300' : 'bg-orange-50 border-orange-100 text-orange-850',
                                  Protein: darkMode ? 'bg-teal-955/40 border-teal-900 text-teal-300' : 'bg-teal-50 border-teal-100 text-teal-850',
                                  Water: darkMode ? 'bg-blue-955/40 border-blue-900 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-850'
                                };
                                const tagIcons = {
                                  Calories: '🔥',
                                  Protein: '💪',
                                  Water: '💧'
                                };
                                return (
                                  <span 
                                    key={aIdx} 
                                    className={`text-[9px] font-extrabold px-2 py-0.5 border rounded-lg flex items-center gap-0.5 ${tagColors[a] || ''}`}
                                  >
                                    {tagIcons[a]} {a} Goal
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 4: ROUTINE & PROFILE SETTINGS */}
          {activeTab === 'settings' && (
            <>
              {/* Routine Settings Card */}
              {onboardingData && (
                <div className={`w-full max-w-md p-5 rounded-2xl shadow-lg border transition-all ${
                  darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-150 text-gray-900'
                }`}>
                  <div className="flex justify-between items-center border-b pb-3 mb-4 dark:border-gray-800">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-teal-655 flex items-center gap-1.5">
                        <Dumbbell className="w-4 h-4 text-teal-500" /> Active Routine Settings
                      </h3>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Update daily physical baseline</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                      onboardingData.routine?.includes('sedentary')
                        ? darkMode ? 'bg-amber-955/30 text-amber-400' : 'bg-amber-50 text-amber-700'
                        : darkMode ? 'bg-emerald-955/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {onboardingData.routine?.includes('sedentary') ? 'Sedentary' : 'Active'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-405 mb-1">Select your typical daily activity:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateRoutine('Mostly sedentary (desk job/studying)')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          onboardingData.routine === 'Mostly sedentary (desk job/studying)'
                            ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/20 text-teal-850 dark:text-teal-305 ring-2 ring-teal-50 dark:ring-teal-900/40 font-bold'
                            : darkMode 
                              ? 'border-gray-800 bg-gray-850 hover:bg-gray-800 text-gray-305' 
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-105 text-gray-700'
                        }`}
                      >
                        <span className="block text-sm font-extrabold mb-0.5">🚶‍♂️ Sedentary</span>
                        <span className="text-[9px] text-gray-455 block leading-tight">Desk job, studying, minimal walking.</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleUpdateRoutine('Mostly active (on your feet)')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          onboardingData.routine === 'Mostly active (on your feet)'
                            ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/20 text-teal-850 dark:text-teal-305 ring-2 ring-teal-50 dark:ring-teal-900/40 font-bold'
                            : darkMode 
                              ? 'border-gray-850 hover:bg-gray-800 text-gray-350' 
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-750'
                        }`}
                      >
                        <span className="block text-sm font-extrabold mb-0.5">🏃‍♂️ Active</span>
                        <span className="text-[9px] text-gray-455 block leading-tight">On your feet frequently, heavy walking, labor.</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-gray-455 italic mt-1 leading-normal">
                      Updating your routine dynamically recalculates your BMR/TDEE limits using MSJ coefficients.
                    </p>
                  </div>
                </div>
              )}

              {/* Personalized Profile Stats */}
              {onboardingData && (
                <div className="w-full max-w-md bg-gradient-to-br from-teal-800 to-emerald-600 text-white p-5 rounded-2xl shadow-lg space-y-4 border border-teal-700/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold tracking-wider uppercase opacity-85">Personal Energy Profile</p>
                      <h3 className="text-xl font-extrabold mt-0.5">Calculated Stats</h3>
                    </div>
                    <button 
                      onClick={handleResetOnboarding}
                      className="text-[10px] font-bold bg-white/15 hover:bg-white/25 transition-colors px-2.5 py-1 rounded-lg"
                    >
                      Update Profile
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-white/10 p-3 rounded-xl border border-white/5">
                      <span className="block text-[10px] opacity-80 font-bold uppercase tracking-wide">TDEE (Maintenance)</span>
                      <span className="text-2xl font-black mt-1 block">{onboardingData.tdee} kcal</span>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl border border-white/5">
                      <span className="block text-[10px] opacity-80 font-bold uppercase tracking-wide">Focus Starting Point</span>
                      <span className="text-xs font-extrabold mt-1.5 block truncate">{onboardingData.startingPoint}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] font-bold opacity-90 border-t border-white/15 pt-3">
                    <span>{onboardingData.age}y / {onboardingData.gender}</span>
                    <span>{onboardingData.calculatedHeightCm} cm / {onboardingData.calculatedWeightKg} kg</span>
                    <span>{onboardingData.dietType}</span>
                  </div>
                </div>
              )}

              {/* Core System Configuration buttons */}
              <div className="w-full max-w-md flex flex-col gap-2">
                <button
                  onClick={handleResetOnboarding}
                  className="w-full bg-teal-650 hover:bg-teal-700 text-white p-3 rounded-xl font-bold text-xs transition-colors shadow-sm text-center"
                >
                  Update Onboarding Intake Details
                </button>
                <button
                  onClick={requestNotificationPermission}
                  className={`w-full p-3 rounded-xl border font-bold text-xs transition-all ${
                    notificationPermission === 'granted'
                      ? 'bg-teal-50 border-teal-105 text-teal-600'
                      : darkMode ? 'bg-gray-850 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-650'
                  }`}
                >
                  {notificationPermission === 'granted' ? '🔔 Browser Notifications Enabled' : '🔕 Enable Browser Notifications'}
                </button>
              </div>
            </>
          )}

        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-30 flex justify-around items-center transition-colors duration-300 shadow-lg ${
        darkMode ? 'bg-gray-900 border-gray-850 text-white' : 'bg-white border-gray-150 text-gray-900'
      }`}>
        {[
          { id: 'overview', label: 'Metrics', icon: <BarChart3 className="w-5 h-5" /> },
          { id: 'coach', label: 'Diet Coach', icon: <Sparkles className="w-5 h-5" /> },
          { id: 'milestones', label: 'Milestones', icon: <Target className="w-5 h-5" /> },
          { id: 'settings', label: 'Settings', icon: <Scale className="w-5 h-5" /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                isActive 
                  ? 'text-teal-600 font-extrabold' 
                  : 'text-gray-400'
              }`}
            >
              {tab.icon}
              <span className="text-[9px] mt-0.5 font-bold">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Active Workout Overlay Modal */}
      {activeWorkout && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-white animate-fade-in">
          <div className="w-full max-w-md space-y-6 text-center">
            <div>
              <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-teal-400 bg-teal-950/50 rounded-full border border-teal-900/40">
                Exercise Step {activeWorkout.stepIndex + 1} of {activeWorkout.steps.length}
              </span>
              <h2 className="text-2xl font-black mt-2 text-white">{activeWorkout.title}</h2>
              <p className="text-xs text-gray-400 mt-1">Exercise Circuit Session</p>
            </div>

            {/* Glowing Timer Circle */}
            <div className="relative flex flex-col items-center justify-center py-4">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  className="stroke-gray-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  className={`${activeWorkout.steps[activeWorkout.stepIndex].type === 'rest' ? 'stroke-blue-500' : 'stroke-teal-500'} transition-all duration-1000`}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={439.8}
                  strokeDashoffset={439.8 - (439.8 * workoutTimer) / activeWorkout.steps[activeWorkout.stepIndex].duration}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black leading-none">{workoutTimer}s</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">
                  {activeWorkout.steps[activeWorkout.stepIndex].type === 'rest' ? '💤 Rest' : '🔥 Work'}
                </span>
              </div>
            </div>

            {/* Current Step Description */}
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                {activeWorkout.steps[activeWorkout.stepIndex].type === 'rest' ? 'UP NEXT' : 'CURRENT EXERCISE'}
              </span>
              <h4 className="text-lg font-bold text-teal-400">
                {activeWorkout.steps[activeWorkout.stepIndex].name}
              </h4>
              <p className="text-xs text-gray-300">
                {activeWorkout.steps[activeWorkout.stepIndex].reps}
              </p>
            </div>

            {/* Workout Controls */}
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setWorkoutRunning(!workoutRunning)}
                className={`flex-1 font-bold py-3 rounded-xl text-xs transition-colors shadow-md ${
                  workoutRunning 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                {workoutRunning ? 'Pause Session' : 'Resume Session'}
              </button>
              
              <button 
                onClick={handleWorkoutTimerComplete}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold px-6 py-3 rounded-xl text-xs transition-colors border border-gray-700"
              >
                Skip Step
              </button>
            </div>

            <button 
              onClick={() => { setActiveWorkout(null); setWorkoutRunning(false); }}
              className="text-xs text-rose-400 hover:text-rose-355 font-bold block mx-auto hover:underline"
            >
              Quit Workout Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}