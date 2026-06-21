export const COLORS = {
  bgDark: '#1a1a1a',
  bgDarker: '#141414',
  white: '#FFFFFF',
  gray100: '#F7F7F7',
  gray200: '#D9D9D9',
  gray300: '#C0C0C0',
  gray400: '#AFAFAF',
  gray500: '#707070',
  accent: '#C8FFFF',
  accentGlow: 'rgba(200, 255, 255, 0.3)',
  accentDim: 'rgba(200, 255, 255, 0.1)',
} as const

export const SECTIONS = [
  'home', 'about', 'tech', 'projects', 'contact'
] as const

export const PROJECTS = [
  {
    title: 'ABSA',
    subtitle: 'AI-Based Digital Habit Coaching System',
    description: 'Neural network powered adaptive behavioral system that learns, adapts, and coaches users through intelligent habit formation using reinforcement learning and real-time decision graphs.',
    tags: ['PyTorch', 'Reinforcement Learning', 'FastAPI', 'React', 'PostgreSQL'],
    gradient: 'linear-gradient(135deg, #0a1628, #1a0a2e)',
    accentColor: '#a78bfa',
    link: 'https://absa-life.vercel.app/',
    siteDisplay: 'absa-life.vercel.app',
    image: '/project_absa.png',
  },
  {
    title: 'FLYMPLY',
    subtitle: 'Intelligent Flight Management Platform',
    description: 'Full-stack aviation management system with real-time flight tracking, turbulence prediction, dynamic route optimization, and cloud-based fleet management.',
    tags: ['Next.js', 'NestJS', 'MongoDB', 'WebSocket', 'Machine Learning'],
    gradient: 'linear-gradient(135deg, #0a1a28, #0a2818)',
    accentColor: '#34d399',
    link: 'https://flymply-frontend.vercel.app/',
    siteDisplay: 'flymply-frontend.vercel.app',
    image: '/project_flymply.png',
  },
  {
    title: 'TRACENOW',
    subtitle: 'Real-Time Face Recognition & Emergency System',
    description: 'Advanced facial recognition platform with real-time location tracking, emergency signal broadcasting, and intelligent alert system for rapid-response scenarios.',
    tags: ['DeepFace', 'FAISS', 'Flask', 'React', 'Supabase'],
    gradient: 'linear-gradient(135deg, #1a0a0a, #280a1a)',
    accentColor: '#f87171',
    link: 'https://github.com/animeshghiloria',
    siteDisplay: 'github.com/animeshghiloria',
    image: '/project_tracenow.png',
  },
] as const

export const SKILLS = [
  { category: 'Languages', items: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C'] },
  { category: 'Frameworks', items: ['React', 'Next.js', 'NestJS', 'FastAPI', 'Flask'] },
  { category: 'Databases', items: ['PostgreSQL', 'MongoDB', 'MySQL', 'Supabase'] },
  { category: 'AI / ML', items: ['PyTorch', 'FAISS', 'DeepFace', 'LLM Fine-Tuning', 'Reinforcement Learning'] },
] as const
