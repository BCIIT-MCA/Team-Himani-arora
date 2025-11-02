// Indian Student-Focused Mental Health Platform Constants

// Indian Student Crisis Contacts
export const INDIAN_STUDENT_CRISIS_CONTACTS = {
  primary: {
    name: "KIRAN National Mental Health Helpline",
    number: "1800-599-0019",
    description: "Free 24/7 mental health support for students across India",
    languages: ["Hindi", "English", "Regional Languages"],
  },
  secondary: [
    {
      name: "iCALL Psychosocial Helpline",
      number: "9152987821",
      description: "Professional counseling support for students",
      languages: [
        "Hindi",
        "English",
        "Marathi",
        "Bengali",
        "Tamil",
        "Telugu",
        "Gujarati",
      ],
    },
    {
      name: "Aasra Mumbai Student Support",
      number: "91-22-27546669",
      description: "24/7 crisis intervention for students in Mumbai region",
      languages: ["Hindi", "English", "Marathi"],
    },
    {
      name: "Sneha Chennai Student Helpline",
      number: "91-44-24640050",
      description: "Emotional support for students in Chennai region",
      languages: ["Tamil", "English", "Telugu"],
    },
    {
      name: "Sumaitri Delhi Student Crisis Line",
      number: "91-11-23389090",
      description: "Crisis support for students in Delhi NCR",
      languages: ["Hindi", "English", "Punjabi"],
    },
  ],
  educational: [
    {
      name: "CBSE Student Helpline",
      number: "1800-11-8004",
      description:
        "Official CBSE helpline for board exam stress and academic concerns",
      languages: ["Hindi", "English"],
    },
    {
      name: "NCERT Student Helpline",
      number: "0120-2440872",
      description:
        "Academic and emotional support for NCERT curriculum students",
      languages: ["Hindi", "English"],
    },
  ],
};

// Student Support Services
export const STUDENT_SUPPORT_SERVICES = {
  campusCounseling: {
    name: "Campus Counseling Centers",
    description:
      "Free in-person counseling available at your educational institution",
    availability: "Contact your school/college student affairs office",
  },
  peerSupport: {
    name: "Student Peer Support Groups",
    description:
      "Connect with fellow students facing similar academic challenges",
    types: ["Study Groups", "Mental Health Circles", "Career Guidance Groups"],
  },
  academicStress: {
    name: "Academic Stress Support",
    description:
      "Specialized support for exam anxiety, study pressure, and academic performance concerns",
    specializations: [
      "Board Exam Stress",
      "Entrance Exam Anxiety",
      "Academic Performance Pressure",
    ],
  },
  familyPressure: {
    name: "Family Pressure Counseling",
    description:
      "Support for students dealing with family expectations and career pressure",
    focus: [
      "Career Choice Conflicts",
      "Academic Expectations",
      "Cultural Pressures",
    ],
  },
};

// Indian Locale Configuration
export const LOCALE_CONFIG = {
  timezone: "Asia/Kolkata",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "HH:MM",
  currency: "INR",
  languages: ["en", "hi", "bn"],
  defaultLanguage: "en",
};

// Student Quick Response Options
export const STUDENT_QUICK_RESPONSES = [
  "I'm stressed about board exams",
  "Family pressure about my career choice",
  "I'm worried about entrance exam results",
  "College is overwhelming me",
  "I'm being bullied at school/college",
  "I can't handle the study pressure",
  "I'm confused about my career path",
  "I feel anxious during exams",
  "My parents don't understand me",
  "I'm struggling with peer pressure",
  "I feel burnt out from studying",
  "I'm worried about my future",
];

// Student-Focused Assessment Categories
export const STUDENT_ASSESSMENT_CATEGORIES = {
  academicStress: {
    name: "Academic Stress Assessment",
    description:
      "Evaluate your stress levels related to studies, exams, and academic performance",
    duration: "5-10 minutes",
  },
  examAnxiety: {
    name: "Exam Anxiety Scale",
    description: "Assess anxiety levels before and during examinations",
    duration: "3-5 minutes",
  },
  studyLifeBalance: {
    name: "Study-Life Balance Check",
    description: "Evaluate how well you balance academics with personal life",
    duration: "5-7 minutes",
  },
  careerConfusion: {
    name: "Career Clarity Assessment",
    description:
      "Understand your career concerns and decision-making challenges",
    duration: "7-10 minutes",
  },
  familyPressure: {
    name: "Family Pressure Scale",
    description:
      "Assess the impact of family expectations on your mental health",
    duration: "5-8 minutes",
  },
};

// Platform Messaging Constants
export const PLATFORM_MESSAGING = {
  free: {
    label: "FREE",
    tagline: "100% FREE for Students",
    description: "All services completely FREE for Indian students",
    emphasis: "Completely FREE 24/7 support",
  },
  crisis: {
    primary: `Call ${INDIAN_STUDENT_CRISIS_CONTACTS.primary.name}: ${INDIAN_STUDENT_CRISIS_CONTACTS.primary.number} (FREE 24/7)`,
    secondary: `Call ${INDIAN_STUDENT_CRISIS_CONTACTS.secondary[0].name}: ${INDIAN_STUDENT_CRISIS_CONTACTS.secondary[0].number} (FREE)`,
    urgent:
      "If you're in immediate danger, call KIRAN 1800-599-0019 now (free 24/7).",
  },
  support: {
    availability: "24/7 FREE",
    studentFocus: "Designed for Indian Students",
    accessibility: "Supporting students across India - completely FREE",
  },
};

// Utility Functions
export const formatIndianDateTime = (date: Date): string => {
  return date.toLocaleString("en-IN", {
    timeZone: LOCALE_CONFIG.timezone,
    dateStyle: "short",
    timeStyle: "short",
  });
};

export const formatIndianDate = (date: Date): string => {
  return date.toLocaleDateString("en-IN", {
    timeZone: LOCALE_CONFIG.timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatIndianTime = (date: Date): string => {
  return date.toLocaleTimeString("en-IN", {
    timeZone: LOCALE_CONFIG.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Student Service Features
export const STUDENT_PLATFORM_FEATURES = {
  freeCounseling: {
    title: "100% Free Counseling",
    description: "All mental health services are completely free for students",
    benefits: [
      "No hidden costs",
      "Unlimited sessions",
      "Professional counselors",
    ],
  },
  studentFocused: {
    title: "Student-Specialized Support",
    description:
      "Counselors trained specifically in student mental health issues",
    specializations: [
      "Academic Stress",
      "Exam Anxiety",
      "Career Guidance",
      "Family Issues",
    ],
  },
  multilingual: {
    title: "Multilingual Support",
    description: "Get support in your preferred language",
    languages: ["English", "Hindi", "Bengali", "Regional Languages"],
  },
  campusIntegration: {
    title: "Campus Integration",
    description: "Works with your school/college counseling services",
    features: ["Referral System", "Campus Events", "Peer Support"],
  },
};

// Academic Calendar Support
export const ACADEMIC_PERIODS = {
  boardExams: {
    name: "Board Examination Period",
    months: ["February", "March", "April"],
    supportFocus: "Exam stress management and performance anxiety",
  },
  entranceExams: {
    name: "Entrance Examination Season",
    months: ["April", "May", "June"],
    supportFocus: "Competition anxiety and result stress",
  },
  admissionSeason: {
    name: "College Admission Period",
    months: ["June", "July", "August"],
    supportFocus: "Decision anxiety and transition support",
  },
  newAcademicYear: {
    name: "New Academic Year",
    months: ["June", "July"],
    supportFocus: "Adjustment and new environment stress",
  },
  midTerms: {
    name: "Mid-term Assessments",
    months: ["September", "October", "January"],
    supportFocus: "Continuous assessment pressure",
  },
  finalExams: {
    name: "Final Examinations",
    months: ["November", "December", "April", "May"],
    supportFocus: "Performance pressure and result anxiety",
  },
};

// Student Emergency Resources
export const STUDENT_EMERGENCY_RESOURCES = {
  immediate: {
    title: "Immediate Help Needed",
    resources: [
      {
        type: "Crisis Hotline",
        contact: INDIAN_STUDENT_CRISIS_CONTACTS.primary,
        availability: "24/7",
      },
      {
        type: "Campus Emergency",
        contact: "Contact your college/school counselor immediately",
        availability: "During campus hours",
      },
    ],
  },
  urgent: {
    title: "Need Support Soon",
    resources: [
      {
        type: "Online Counseling",
        description: "Schedule free online session within 24 hours",
        action: "Book appointment",
      },
      {
        type: "Peer Support",
        description: "Connect with student support groups",
        action: "Join community",
      },
    ],
  },
  ongoing: {
    title: "Regular Support",
    resources: [
      {
        type: "Weekly Counseling",
        description: "Regular free counseling sessions",
        commitment: "Ongoing support",
      },
      {
        type: "Study Skills Training",
        description: "Learn stress management and study techniques",
        commitment: "4-6 week program",
      },
    ],
  },
};
