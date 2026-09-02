/**
 * LaTeX Variable Parser & Serializer
 * Accurately parses \newcommand{\VarName}{Value} with support for nested braces,
 * multi-line content, comments, and structure.
 */

// Master Schema defining sections, fields, labels, input types, and defaults
export const VARIABLE_SCHEMA = [
  {
    id: 'header',
    title: 'Personal Info & Header',
    icon: 'User',
    fields: [
      { key: 'CVFirstName', label: 'First Name', type: 'text', placeholder: 'e.g. Abderrahmene' },
      { key: 'CVLastName', label: 'Last Name', type: 'text', placeholder: 'e.g. KABAR' },
      { key: 'CVJobTitle', label: 'Target Job Title', type: 'textarea', rows: 2, placeholder: 'e.g. Consultant Junior Stratégie IT...' },
      { key: 'CVApplicationRef', label: 'Reference Code / Job ID', type: 'text', placeholder: 'e.g. R-1099' },
      { key: 'CVPhone', label: 'Phone', type: 'text', placeholder: 'e.g. +33 6 12 34 56 78' },
      { key: 'CVEmail', label: 'Email', type: 'email', placeholder: 'e.g. abderrahmene.kabar@ecole.ensicaen.fr' },
      { key: 'CVLocation', label: 'Location / City', type: 'text', placeholder: 'e.g. Caen, France' },
      { key: 'CVLinkedInURL', label: 'LinkedIn URL', type: 'text', placeholder: 'e.g. https://www.linkedin.com/in/...' },
      { key: 'CVLinkedInText', label: 'LinkedIn Display Text', type: 'text', placeholder: 'e.g. linkedin.com/in/...' },
      { key: 'CVGithubURL', label: 'GitHub URL', type: 'text', placeholder: 'e.g. https://github.com/...' },
      { key: 'CVGithubText', label: 'GitHub Display Text', type: 'text', placeholder: 'e.g. @Impactabdou' },
      { key: 'CVDrivingLicense', label: 'Driving License', type: 'text', placeholder: 'e.g. Permis B' },
      { key: 'CVMobility', label: 'Geographic Mobility', type: 'text', placeholder: 'e.g. Mobile sur toute la France' },
    ]
  },
  {
    id: 'profile',
    title: 'Professional Profile / Summary',
    icon: 'FileText',
    fields: [
      { key: 'CVProfileText', label: 'Profile Summary', type: 'textarea', rows: 4, placeholder: 'Summary paragraph...' }
    ]
  },
  {
    id: 'education',
    title: 'Education',
    icon: 'GraduationCap',
    fields: [
      // Degree 1
      { key: 'EduOneSchool', label: 'Degree 1 - School', type: 'text', placeholder: 'e.g. EM Normandie' },
      { key: 'EduOneLocation', label: 'Degree 1 - Location', type: 'text', placeholder: 'e.g. Caen, France' },
      { key: 'EduOneDegree', label: 'Degree 1 - Degree / Program', type: 'text', placeholder: 'e.g. Programme Grande École...' },
      { key: 'EduOneDates', label: 'Degree 1 - Dates', type: 'text', placeholder: 'e.g. Sept. 2025 -- Août 2027' },
      { key: 'EduOneDesc', label: 'Degree 1 - Description', type: 'text', placeholder: 'e.g. Mention Bien' },
      { key: 'EduOneModules', label: 'Degree 1 - Modules', type: 'textarea', rows: 2, placeholder: 'e.g. \\textbf{Modules} : ...' },
      // Degree 2
      { key: 'EduTwoSchool', label: 'Degree 2 - School', type: 'text', placeholder: 'e.g. ENSICAEN' },
      { key: 'EduTwoLocation', label: 'Degree 2 - Location', type: 'text', placeholder: 'e.g. Caen, France' },
      { key: 'EduTwoDegree', label: 'Degree 2 - Degree / Program', type: 'text', placeholder: 'e.g. Diplôme d\'Ingénieur...' },
      { key: 'EduTwoDates', label: 'Degree 2 - Dates', type: 'text', placeholder: 'e.g. Sept. 2024 -- Août 2027' },
      { key: 'EduTwoDesc', label: 'Degree 2 - Description', type: 'text', placeholder: 'e.g. \\textbf{Résultat actuel :} Mention Bien.' },
      { key: 'EduTwoModules', label: 'Degree 2 - Modules', type: 'textarea', rows: 2, placeholder: 'e.g. \\textbf{Modules Data} : ...' },
      // Degree 3
      { key: 'EduThreeSchool', label: 'Degree 3 - School', type: 'text', placeholder: 'e.g. Université de Caen Normandie' },
      { key: 'EduThreeLocation', label: 'Degree 3 - Location', type: 'text', placeholder: 'e.g. Caen, France' },
      { key: 'EduThreeDegree', label: 'Degree 3 - Degree / Program', type: 'text', placeholder: 'e.g. Licence en Informatique...' },
      { key: 'EduThreeDates', label: 'Degree 3 - Dates', type: 'text', placeholder: 'e.g. Sept. 2023 -- Août 2024' },
      { key: 'EduThreeDesc', label: 'Degree 3 - Description', type: 'text', placeholder: 'e.g. \\textbf{Résultat :} Top 3%...' },
    ]
  },
  {
    id: 'experience',
    title: 'Professional Experience',
    icon: 'Briefcase',
    fields: [
      // Job 1
      { key: 'ExpOneCompany', label: 'Experience 1 - Company', type: 'text', placeholder: 'e.g. Groupe Orange' },
      { key: 'ExpOneLocation', label: 'Experience 1 - Location', type: 'text', placeholder: 'e.g. Caen, France' },
      { key: 'ExpOneJob', label: 'Experience 1 - Job Title', type: 'text', placeholder: 'e.g. Stage Assistant Ingénieriste...' },
      { key: 'ExpOneDates', label: 'Experience 1 - Dates', type: 'text', placeholder: 'e.g. Avril 2026 -- Août 2026' },
      { key: 'ExpOneTaskA', label: 'Experience 1 - Bullet 1', type: 'textarea', rows: 2, placeholder: 'Key responsibility / achievement...' },
      { key: 'ExpOneTaskB', label: 'Experience 1 - Bullet 2', type: 'textarea', rows: 2, placeholder: 'Key responsibility / achievement...' },
      { key: 'ExpOneTaskC', label: 'Experience 1 - Bullet 3', type: 'textarea', rows: 2, placeholder: 'Key responsibility / achievement...' },
      { key: 'ExpOneTaskD', label: 'Experience 1 - Bullet 4', type: 'textarea', rows: 2, placeholder: 'Key responsibility / achievement...' },
      // Job 2
      { key: 'ExpTwoCompany', label: 'Experience 2 - Company', type: 'text', placeholder: 'e.g. Chronodrive' },
      { key: 'ExpTwoLocation', label: 'Experience 2 - Location', type: 'text', placeholder: 'e.g. Caen, France' },
      { key: 'ExpTwoJob', label: 'Experience 2 - Job Title', type: 'text', placeholder: 'e.g. Préparateur et coordinateur...' },
      { key: 'ExpTwoDates', label: 'Experience 2 - Dates', type: 'text', placeholder: 'e.g. Fév. 2024 -- Mai 2026' },
      { key: 'ExpTwoTaskA', label: 'Experience 2 - Bullet 1', type: 'textarea', rows: 2, placeholder: 'Key responsibility / achievement...' },
    ]
  },
  {
    id: 'projects',
    title: 'Relevant Projects',
    icon: 'Code',
    fields: [
      // Project 1
      { key: 'ProjOneName', label: 'Project 1 - Name & Tech', type: 'text', placeholder: 'e.g. \\textbf{Moteur de simulation} $|$ \\emph{GitLab CI/CD...}' },
      { key: 'ProjOneDates', label: 'Project 1 - Dates', type: 'text', placeholder: 'e.g. Sept. 2025 -- Déc. 2025' },
      { key: 'ProjOneType', label: 'Project 1 - Type / Context', type: 'text', placeholder: 'e.g. projet académique' },
      { key: 'ProjOneTaskA', label: 'Project 1 - Bullet 1', type: 'textarea', rows: 2, placeholder: 'Achievement details...' },
      { key: 'ProjOneTaskB', label: 'Project 1 - Bullet 2', type: 'textarea', rows: 2, placeholder: 'Achievement details...' },
      // Project 2
      { key: 'ProjTwoName', label: 'Project 2 - Name & Tech', type: 'text', placeholder: 'e.g. \\textbf{Benchmark d\'IA décisionnelles}...' },
      { key: 'ProjTwoDates', label: 'Project 2 - Dates', type: 'text', placeholder: 'e.g. Jan. 2024 -- Avr. 2024' },
      { key: 'ProjTwoType', label: 'Project 2 - Type / Context', type: 'text', placeholder: 'e.g. projet académique' },
      { key: 'ProjTwoTaskA', label: 'Project 2 - Bullet 1', type: 'textarea', rows: 2, placeholder: 'Achievement details...' },
      { key: 'ProjTwoTaskB', label: 'Project 2 - Bullet 2', type: 'textarea', rows: 2, placeholder: 'Achievement details...' },
    ]
  },
  {
    id: 'skills',
    title: 'Technical Skills & Languages',
    icon: 'Cpu',
    fields: [
      { key: 'SkillsLanguages', label: 'Programming Languages', type: 'textarea', rows: 2, placeholder: 'e.g. Python, Go, Bash, Java...' },
      { key: 'SkillsTools', label: 'Frameworks, Tools & Cloud', type: 'textarea', rows: 2, placeholder: 'e.g. AWS, Azure, GitLab, Docker, Kubernetes...' },
      { key: 'SoftSkills', label: 'Soft Skills & Methodologies', type: 'textarea', rows: 2, placeholder: 'e.g. Méthodologies Agiles, Esprit analytique...' },
      { key: 'SkillsSpoken', label: 'Languages (Spoken & Certifications)', type: 'textarea', rows: 2, placeholder: 'e.g. Français (Langue maternelle), Anglais (TOEIC: 910/990)...' },
    ]
  },
  {
    id: 'interests',
    title: 'Interests & Hobbies',
    icon: 'Heart',
    fields: [
      { key: 'HobbyOne', label: 'Interest 1', type: 'textarea', rows: 2, placeholder: 'e.g. \\textbf{Expédition & Randonnée} : ...' },
      { key: 'HobbyTwo', label: 'Interest 2', type: 'textarea', rows: 2, placeholder: 'e.g. \\textbf{Esport} : ...' },
      { key: 'HobbyThree', label: 'Interest 3', type: 'textarea', rows: 2, placeholder: 'e.g. \\textbf{Développement Open Source} : ...' },
    ]
  },
  {
    id: 'references',
    title: 'Professional References',
    icon: 'Award',
    fields: [
      { key: 'RefOneName', label: 'Reference 1 - Name', type: 'text', placeholder: 'e.g. M. Mickael LELIARD' },
      { key: 'RefOneRole', label: 'Reference 1 - Role & Company', type: 'text', placeholder: 'e.g. Responsable adjoint...' },
      { key: 'RefOneEmail', label: 'Reference 1 - Email', type: 'email', placeholder: 'e.g. mickael.leliard@orange.com' },
      { key: 'RefOnePhone', label: 'Reference 1 - Phone', type: 'text', placeholder: 'e.g. +33 6 45 88 36 15' },

      { key: 'RefTwoName', label: 'Reference 2 - Name', type: 'text', placeholder: 'e.g. M. Anthony BLIN' },
      { key: 'RefTwoRole', label: 'Reference 2 - Role & Company', type: 'text', placeholder: 'e.g. Ingénieriste réseaux...' },
      { key: 'RefTwoEmail', label: 'Reference 2 - Email', type: 'email', placeholder: 'e.g. anthony.blin@orange.com' },
      { key: 'RefTwoPhone', label: 'Reference 2 - Phone', type: 'text', placeholder: 'e.g. +33 6 48 19 31 01' },
    ]
  }
];

// Helper to find balanced closing brace
function extractBracedContent(text, startIndex) {
  let depth = 0;
  let started = false;
  let startPos = -1;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    if (char === '{') {
      if (!started) {
        started = true;
        startPos = i + 1;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (started && depth === 0) {
        return {
          content: text.slice(startPos, i),
          endIndex: i + 1
        };
      }
    }
  }

  return null;
}

/**
 * Parses raw .tex content and extracts key-value pairs of LaTeX commands.
 * Handles \newcommand{\VarName}{Value}, \def\VarName{Value}, etc.
 * Supports multi-line and nested braces.
 */
export function parseTexVariables(texContent) {
  const variables = {};
  const extraVariables = [];
  const knownKeys = new Set();
  
  for (const section of VARIABLE_SCHEMA) {
    for (const field of section.fields) {
      knownKeys.add(field.key);
    }
  }

  // Regex to find start of command: \newcommand{\key} or \newcommand\key or \renewcommand or \providecommand or \def\key
  const cmdRegex = /\\(?:newcommand|renewcommand|providecommand|def)\s*(?:\{\s*\\([a-zA-Z0-9_]+)\s*\}|\\([a-zA-Z0-9_]+))\s*/g;
  
  let match;
  while ((match = cmdRegex.exec(texContent)) !== null) {
    const key = match[1] || match[2];
    const afterMatchIndex = match.index + match[0].length;
    
    // Find the opening brace of the value
    const nextCharIndex = texContent.indexOf('{', afterMatchIndex);
    if (nextCharIndex !== -1 && nextCharIndex - afterMatchIndex < 10) {
      const extracted = extractBracedContent(texContent, nextCharIndex);
      if (extracted) {
        const value = extracted.content;
        variables[key] = value;
        if (!knownKeys.has(key)) {
          extraVariables.push({ key, value });
        }
        cmdRegex.lastIndex = extracted.endIndex;
      }
    }
  }

  return {
    variables,
    extraVariables
  };
}

/**
 * Serializes variable dictionary back into clean, organized .tex content.
 * Guarantees that ALL required variables are declared and formatted.
 */
function sanitizeTexValue(val) {
  if (typeof val !== 'string') return '';
  // Auto escape unescaped & (unless inside a URL or command)
  return val.replace(/(?<!\\)&/g, '\\&');
}

export function serializeTexVariables(variables, extraVariables = []) {
  let tex = `% ==========================================\n`;
  tex += `% LaTeX CV Reference Variables File\n`;
  tex += `% Fully self-contained configuration\n`;
  tex += `% ==========================================\n\n`;

  const writtenKeys = new Set();

  for (const section of VARIABLE_SCHEMA) {
    tex += `% --- ${section.title.toUpperCase()} ---\n`;
    for (const field of section.fields) {
      let rawVal = variables[field.key] !== undefined ? variables[field.key] : '';
      // Don't auto-escape ampersands in URLs or if it's already properly formatted
      if (field.type !== 'url' && !field.key.includes('URL')) {
        rawVal = sanitizeTexValue(rawVal);
      }
      tex += `\\newcommand{\\${field.key}}{${rawVal}}\n`;
      writtenKeys.add(field.key);
    }
    tex += `\n`;
  }

  // Extra variables if any
  const extras = [];
  for (const [k, v] of Object.entries(variables)) {
    if (!writtenKeys.has(k)) {
      extras.push({ key: k, value: v });
    }
  }
  if (Array.isArray(extraVariables)) {
    for (const item of extraVariables) {
      if (item && item.key && !writtenKeys.has(item.key) && !extras.find(e => e.key === item.key)) {
        extras.push(item);
      }
    }
  }

  if (extras.length > 0) {
    tex += `% --- ADDITIONAL / CUSTOM VARIABLES ---\n`;
    for (const extra of extras) {
      tex += `\\newcommand{\\${extra.key}}{${extra.value || ''}}\n`;
    }
    tex += `\n`;
  }

  return tex;
}

/**
 * Default fallback template containing standard profile information
 */
export function getDefaultVariables(refCode = 'DEFAULT-001', jobTitle = 'Consultant Junior') {
  return {
    CVFirstName: 'Abderrahmene',
    CVLastName: 'KABAR',
    CVJobTitle: jobTitle,
    CVApplicationRef: refCode,
    CVPhone: '+33 6 12 34 56 78',
    CVEmail: 'abderrahmene.kabar@ecole.ensicaen.fr',
    CVLocation: 'Caen, France',
    CVLinkedInURL: 'https://www.linkedin.com/in/abderrahmene-kabar',
    CVLinkedInText: 'linkedin.com/in/abderrahmene-kabar',
    CVGithubURL: 'https://github.com/Impactabdou',
    CVGithubText: '@Impactabdou',
    CVDrivingLicense: 'Permis B',
    CVMobility: 'Mobile sur toute la France',
    
    CVProfileText: 'Préparant un double diplôme Ingénieur-Manager (ENSICAEN / EM Normandie), \\textbf{je recherche un stage de 6 mois (janv. 2027)} en Conseil Techno \\& Transformation SI pour accompagner la croissance et l\'innovation de vos clients.',
    
    EduOneSchool: 'EM Normandie',
    EduOneLocation: 'Caen, France',
    EduOneDegree: 'Programme Grande École (Management \\& Stratégie)',
    EduOneDates: 'Sept. 2025 -- Août 2027',
    EduOneDesc: '',
    EduOneModules: '\\textbf{Modules} : Conduite du changement, Management des organisations, Contrôle budgétaire, Business Models.',
    
    EduTwoSchool: 'ENSICAEN',
    EduTwoLocation: 'Caen, France',
    EduTwoDegree: 'Diplôme d\'Ingénieur en Informatique (e-Paiement \\& Cybersécurité)',
    EduTwoDates: 'Sept. 2024 -- Août 2027',
    EduTwoDesc: '\\textbf{Résultat actuel :} Mention Bien.',
    EduTwoModules: '\\textbf{Modules Data / Tech} : Architecture SI, Cloud Computing, Databases, Sécurité applicative.',
    
    EduThreeSchool: 'Université de Caen Normandie',
    EduThreeLocation: 'Caen, France',
    EduThreeDegree: 'Licence en Informatique (Intelligence Artificielle \\& Systèmes d\'Information)',
    EduThreeDates: 'Sept. 2023 -- Août 2024',
    EduThreeDesc: '\\textbf{Résultat :} Top 3\\% de la promotion (5/160) avec Mention Bien.',
    
    ExpOneCompany: 'Groupe Orange',
    ExpOneLocation: 'Caen, France',
    ExpOneJob: 'Stage Assistant Ingénieriste Sécurisation DNS',
    ExpOneDates: 'Avril 2026 -- Août 2026',
    ExpOneTaskA: 'Conception et pilotage en méthodologie \\textbf{Agile Scrum d\'un Proof of Concept (PoC)} répliquant une infrastructure DNS d\'Orange afin d\'évaluer une solution innovante de sécurisation DNS.',
    ExpOneTaskB: 'Modernisation et automatisation à 100\\% du cycle de vie des déploiements via une approche \\textbf{Infrastructure as Code (IaC)} en utilisant \\textbf{Kubernetes, Ansible, Helm et pipelines CI/CD}.',
    ExpOneTaskC: 'Réalisation d\'une \\textbf{analyse normative des risques} et présentation argumentée des résultats à l\'équipe DNS.',
    ExpOneTaskD: 'Validation fonctionnelle du PoC et livraison d\'une feuille de route stratégique à l\'équipe DNS, sécurisant le futur passage en production.',
    
    ExpTwoCompany: 'Chronodrive',
    ExpTwoLocation: 'Caen, France',
    ExpTwoJob: 'Préparateur et coordinateur de commandes',
    ExpTwoDates: 'Fév. 2024 -- Mai 2026',
    ExpTwoTaskA: 'Gestion des flux logistiques, coordination des commandes clients et maintien des indicateurs de performance dans un environnement exigeant et rythmé.',
    
    ProjOneName: '\\textbf{Moteur de simulation} $|$ \\emph{GitLab CI/CD, Gradle, Agile Kanban}',
    ProjOneDates: 'Sept. 2025 -- Déc. 2025',
    ProjOneType: 'projet académique',
    ProjOneTaskA: 'Développement d\'un simulateur au sein d\'une équipe de 8 personnes en méthodologie Agile.',
    ProjOneTaskB: 'Application de patrons de conception pour structurer le système, couplée à l\'automatisation des tests et des déploiements.',
    
    ProjTwoName: '\\textbf{Benchmark d\'IA décisionnelles} $|$ \\emph{Analyse de données, Modélisation}',
    ProjTwoDates: 'Jan. 2024 -- Avr. 2024',
    ProjTwoType: 'projet académique',
    ProjTwoTaskA: 'Conception et implémentation d\'algorithmes d\'aide à la décision au sein d\'une équipe de 4 étudiants.',
    ProjTwoTaskB: 'Collecte, modélisation et analyse de vastes jeux de données afin d\'évaluer les performances d\'algorithmes et de structurer un benchmark comparatif.',
    
    SkillsLanguages: 'Python, Go, Bash, Java (SE/EE), JS, C, C++, SQL, PSQL.',
    SkillsTools: 'AWS, Azure, GitLab (CI/CD), Kubernetes, Docker, Ansible, Helm, Prometheus, Grafana.',
    SoftSkills: 'Benchmark de solutions, Méthodologies Agiles (Scrum, Kanban, SAFe), Pack Office.',
    SkillsSpoken: 'Français (Langue maternelle), Anglais (Courant - \\textbf{TOEIC : 910/990}), Arabe (Langue maternelle).',
    
    HobbyOne: '\\textbf{Expédition \\& Randonnée} : Traversée de l\'Atlas tellien (Algérie) pendant 2 semaines.',
    HobbyTwo: '\\textbf{Esport \\& Simulation de gestion} : Pratique compétitive en équipe (Ligue Classée sur Fortnite).',
    HobbyThree: '\\textbf{Développement \\& Open Source} : Travail préparatoire en cours pour une contribution sur GitHub (Ansible).',
    
    RefOneName: 'M. Mickael LELIARD',
    RefOneRole: 'Responsable adjoint département Services Communs d\'Infrastructures chez Orange France.',
    RefOneEmail: 'mickael.leliard@orange.com',
    RefOnePhone: '+33 6 45 88 36 15',
    
    RefTwoName: 'M. Anthony BLIN',
    RefTwoRole: 'Ingénieriste réseaux et infrastructure chez Orange France.',
    RefTwoEmail: 'anthony.blin@orange.com',
    RefTwoPhone: '+33 6 48 19 31 01'
  };
}
