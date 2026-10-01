/**
 * frontend/src/data/courses.ts
 * =============================
 * Official Course Catalog for Sri Shakthi Institute of Engineering and Technology (SIET).
 * Authoritative Degree Programmes, Branches, and Entry Modes.
 */

export interface DegreeOption {
  code: string;
  name: string;
  fullTitle: string;
}

export const SIET_DEGREES: string[] = [
  'Bachelor of Engineering (B.E.)',
  'Bachelor of Technology (B.Tech)',
  'Master of Engineering (M.E.)',
  'Master of Technology (M.Tech)',
  'Doctor of Philosophy (Ph.D.)',
];

export const SIET_COURSES_BY_DEGREE: Record<string, string[]> = {
  'Bachelor of Engineering (B.E.)': [
    'B.E. Computer Science and Engineering',
    'B.E. Computer Science and Engineering (Cyber Security)',
    'B.E. Electronics and Communication Engineering',
    'B.E. Electrical and Electronics Engineering',
    'B.E. Electronics Engineering (VLSI Design & Technology)',
    'B.E. Biomedical Engineering',
    'B.E. Civil Engineering',
    'B.E. Mechanical Engineering',
  ],
  'Bachelor of Technology (B.Tech)': [
    'B.Tech. Information Technology',
    'B.Tech. Artificial Intelligence and Data Science',
    'B.Tech. Artificial Intelligence and Machine Learning',
    'B.Tech. Agricultural Engineering',
    'B.Tech. Biotechnology',
    'B.Tech. Food Technology',
  ],
  'Master of Engineering (M.E.)': [
    'M.E. Computer Science and Engineering',
    'M.E. Embedded System Technologies',
    'M.E. Structural Engineering',
    'M.E. VLSI Design',
    'M.E. CAD/CAM',
  ],
  'Master of Technology (M.Tech)': [
    'M.Tech. Food Technology',
    'M.Tech. Farm Machinery & Power Engineering',
  ],
  'Doctor of Philosophy (Ph.D.)': [
    'Ph.D. Computer Science and Engineering',
    'Ph.D. Electronics and Communication Engineering',
    'Ph.D. Electrical and Electronics Engineering',
    'Ph.D. Mechanical Engineering',
    'Ph.D. Information Technology',
    'Ph.D. Physics',
    'Ph.D. Chemistry',
  ],
};

// Aliases for backwards compatibility with short abbreviations
export const DEGREE_ALIASES: Record<string, string> = {
  'B.E.': 'Bachelor of Engineering (B.E.)',
  'B.E. (Bachelor of Engineering)': 'Bachelor of Engineering (B.E.)',
  'B.Tech': 'Bachelor of Technology (B.Tech)',
  'B.Tech.': 'Bachelor of Technology (B.Tech)',
  'B.Tech (Bachelor of Technology)': 'Bachelor of Technology (B.Tech)',
  'M.E.': 'Master of Engineering (M.E.)',
  'M.E. (Master of Engineering)': 'Master of Engineering (M.E.)',
  'M.Tech': 'Master of Technology (M.Tech)',
  'M.Tech.': 'Master of Technology (M.Tech)',
  'M.Tech (Food Technology)': 'Master of Technology (M.Tech)',
  'Ph.D': 'Doctor of Philosophy (Ph.D.)',
  'Ph.D.': 'Doctor of Philosophy (Ph.D.)',
  'Ph.D. in Engineering': 'Doctor of Philosophy (Ph.D.)',
};

export const ENTRY_MODES = [
  'Regular Entry (1st Year Admission)',
  'Lateral Entry (Direct 2nd Year Admission)',
] as const;

export type EntryMode = typeof ENTRY_MODES[number];

/**
 * Returns the official branch list for a given degree name or alias.
 */
export function getBranchesForDegree(degree: string): string[] {
  if (!degree) return [];
  if (SIET_COURSES_BY_DEGREE[degree]) {
    return SIET_COURSES_BY_DEGREE[degree];
  }
  const canonical = DEGREE_ALIASES[degree];
  if (canonical && SIET_COURSES_BY_DEGREE[canonical]) {
    return SIET_COURSES_BY_DEGREE[canonical];
  }
  // Fallback prefix search
  if (degree.startsWith('B.E.')) return SIET_COURSES_BY_DEGREE['Bachelor of Engineering (B.E.)'];
  if (degree.startsWith('B.Tech')) return SIET_COURSES_BY_DEGREE['Bachelor of Technology (B.Tech)'];
  if (degree.startsWith('M.E.')) return SIET_COURSES_BY_DEGREE['Master of Engineering (M.E.)'];
  if (degree.startsWith('M.Tech')) return SIET_COURSES_BY_DEGREE['Master of Technology (M.Tech)'];
  if (degree.startsWith('Ph.D')) return SIET_COURSES_BY_DEGREE['Doctor of Philosophy (Ph.D.)'];
  return [];
}
