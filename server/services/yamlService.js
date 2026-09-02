import YAML from 'yaml';
import path from 'path';
import { VARIABLE_SCHEMA } from './texParser.js';

/**
 * Converts flat LaTeX variables into an elegant, human-readable structured YAML document
 */
export function variablesToStructuredYaml(variables, extraVariables = [], relativePath = '') {
  const refCode = variables.CVApplicationRef || (relativePath ? path.basename(relativePath, '.tex') : 'CV');
  
  const doc = {
    meta: {
      reference_code: refCode,
      file_path: relativePath || undefined,
      exported_at: new Date().toISOString(),
      schema_version: '1.0'
    },
    header: {
      first_name: variables.CVFirstName || '',
      last_name: variables.CVLastName || '',
      job_title: variables.CVJobTitle || '',
      application_ref: variables.CVApplicationRef || '',
      phone: variables.CVPhone || '',
      email: variables.CVEmail || '',
      location: variables.CVLocation || '',
      linkedin: {
        url: variables.CVLinkedInURL || '',
        display_text: variables.CVLinkedInText || ''
      },
      github: {
        url: variables.CVGithubURL || '',
        display_text: variables.CVGithubText || ''
      },
      driving_license: variables.CVDrivingLicense || '',
      mobility: variables.CVMobility || ''
    },
    profile: {
      summary: variables.CVProfileText || ''
    },
    education: [
      {
        school: variables.EduOneSchool || '',
        location: variables.EduOneLocation || '',
        degree: variables.EduOneDegree || '',
        dates: variables.EduOneDates || '',
        description: variables.EduOneDesc || '',
        modules: variables.EduOneModules || ''
      },
      {
        school: variables.EduTwoSchool || '',
        location: variables.EduTwoLocation || '',
        degree: variables.EduTwoDegree || '',
        dates: variables.EduTwoDates || '',
        description: variables.EduTwoDesc || '',
        modules: variables.EduTwoModules || ''
      },
      {
        school: variables.EduThreeSchool || '',
        location: variables.EduThreeLocation || '',
        degree: variables.EduThreeDegree || '',
        dates: variables.EduThreeDates || '',
        description: variables.EduThreeDesc || ''
      }
    ].filter(e => e.school || e.degree),
    experience: [
      {
        company: variables.ExpOneCompany || '',
        location: variables.ExpOneLocation || '',
        job: variables.ExpOneJob || '',
        dates: variables.ExpOneDates || '',
        tasks: [
          variables.ExpOneTaskA,
          variables.ExpOneTaskB,
          variables.ExpOneTaskC,
          variables.ExpOneTaskD
        ].filter(Boolean)
      },
      {
        company: variables.ExpTwoCompany || '',
        location: variables.ExpTwoLocation || '',
        job: variables.ExpTwoJob || '',
        dates: variables.ExpTwoDates || '',
        tasks: [
          variables.ExpTwoTaskA
        ].filter(Boolean)
      }
    ].filter(e => e.company || e.job),
    projects: [
      {
        name: variables.ProjOneName || '',
        dates: variables.ProjOneDates || '',
        type: variables.ProjOneType || '',
        tasks: [
          variables.ProjOneTaskA,
          variables.ProjOneTaskB
        ].filter(Boolean)
      },
      {
        name: variables.ProjTwoName || '',
        dates: variables.ProjTwoDates || '',
        type: variables.ProjTwoType || '',
        tasks: [
          variables.ProjTwoTaskA,
          variables.ProjTwoTaskB
        ].filter(Boolean)
      }
    ].filter(p => p.name),
    skills: {
      languages: variables.SkillsLanguages || '',
      tools: variables.SkillsTools || '',
      soft_skills: variables.SoftSkills || '',
      spoken_languages: variables.SkillsSpoken || ''
    },
    interests: [
      variables.HobbyOne,
      variables.HobbyTwo,
      variables.HobbyThree
    ].filter(Boolean),
    references: [
      {
        name: variables.RefOneName || '',
        role: variables.RefOneRole || '',
        email: variables.RefOneEmail || '',
        phone: variables.RefOnePhone || ''
      },
      {
        name: variables.RefTwoName || '',
        role: variables.RefTwoRole || '',
        email: variables.RefTwoEmail || '',
        phone: variables.RefTwoPhone || ''
      }
    ].filter(r => r.name || r.role),
    custom_variables: extraVariables.reduce((acc, curr) => {
      if (curr && curr.key) acc[curr.key] = curr.value || '';
      return acc;
    }, {}),
    // Complete raw LaTeX variables dictionary for exact lossless mapping
    raw_latex_variables: { ...variables }
  };

  return YAML.stringify(doc, {
    indent: 2,
    lineWidth: 100
  });
}

/**
 * Parses a YAML document and returns the corresponding LaTeX variables map
 */
export function yamlToVariables(yamlString) {
  const parsed = YAML.parse(yamlString);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid YAML content');
  }

  // If the document contains exact raw_latex_variables, use them as base
  if (parsed.raw_latex_variables && typeof parsed.raw_latex_variables === 'object') {
    const vars = { ...parsed.raw_latex_variables };
    const extras = [];
    if (parsed.custom_variables && typeof parsed.custom_variables === 'object') {
      for (const [k, v] of Object.entries(parsed.custom_variables)) {
        extras.push({ key: k, value: String(v) });
      }
    }
    return { variables: vars, extraVariables: extras };
  }

  // Otherwise, construct from structured fields
  const vars = {};
  const extras = [];

  if (parsed.header) {
    const h = parsed.header;
    if (h.first_name) vars.CVFirstName = h.first_name;
    if (h.last_name) vars.CVLastName = h.last_name;
    if (h.job_title) vars.CVJobTitle = h.job_title;
    if (h.application_ref) vars.CVApplicationRef = h.application_ref;
    if (h.phone) vars.CVPhone = h.phone;
    if (h.email) vars.CVEmail = h.email;
    if (h.location) vars.CVLocation = h.location;
    if (h.linkedin?.url) vars.CVLinkedInURL = h.linkedin.url;
    if (h.linkedin?.display_text) vars.CVLinkedInText = h.linkedin.display_text;
    if (h.github?.url) vars.CVGithubURL = h.github.url;
    if (h.github?.display_text) vars.CVGithubText = h.github.display_text;
    if (h.driving_license) vars.CVDrivingLicense = h.driving_license;
    if (h.mobility) vars.CVMobility = h.mobility;
  }

  if (parsed.profile?.summary) {
    vars.CVProfileText = parsed.profile.summary;
  }

  if (Array.isArray(parsed.education)) {
    const [e1, e2, e3] = parsed.education;
    if (e1) {
      if (e1.school) vars.EduOneSchool = e1.school;
      if (e1.location) vars.EduOneLocation = e1.location;
      if (e1.degree) vars.EduOneDegree = e1.degree;
      if (e1.dates) vars.EduOneDates = e1.dates;
      if (e1.description) vars.EduOneDesc = e1.description;
      if (e1.modules) vars.EduOneModules = e1.modules;
    }
    if (e2) {
      if (e2.school) vars.EduTwoSchool = e2.school;
      if (e2.location) vars.EduTwoLocation = e2.location;
      if (e2.degree) vars.EduTwoDegree = e2.degree;
      if (e2.dates) vars.EduTwoDates = e2.dates;
      if (e2.description) vars.EduTwoDesc = e2.description;
      if (e2.modules) vars.EduTwoModules = e2.modules;
    }
    if (e3) {
      if (e3.school) vars.EduThreeSchool = e3.school;
      if (e3.location) vars.EduThreeLocation = e3.location;
      if (e3.degree) vars.EduThreeDegree = e3.degree;
      if (e3.dates) vars.EduThreeDates = e3.dates;
      if (e3.description) vars.EduThreeDesc = e3.description;
    }
  }

  if (Array.isArray(parsed.experience)) {
    const [exp1, exp2] = parsed.experience;
    if (exp1) {
      if (exp1.company) vars.ExpOneCompany = exp1.company;
      if (exp1.location) vars.ExpOneLocation = exp1.location;
      if (exp1.job) vars.ExpOneJob = exp1.job;
      if (exp1.dates) vars.ExpOneDates = exp1.dates;
      if (exp1.tasks) {
        if (exp1.tasks[0]) vars.ExpOneTaskA = exp1.tasks[0];
        if (exp1.tasks[1]) vars.ExpOneTaskB = exp1.tasks[1];
        if (exp1.tasks[2]) vars.ExpOneTaskC = exp1.tasks[2];
        if (exp1.tasks[3]) vars.ExpOneTaskD = exp1.tasks[3];
      }
    }
    if (exp2) {
      if (exp2.company) vars.ExpTwoCompany = exp2.company;
      if (exp2.location) vars.ExpTwoLocation = exp2.location;
      if (exp2.job) vars.ExpTwoJob = exp2.job;
      if (exp2.dates) vars.ExpTwoDates = exp2.dates;
      if (exp2.tasks && exp2.tasks[0]) vars.ExpTwoTaskA = exp2.tasks[0];
    }
  }

  if (Array.isArray(parsed.projects)) {
    const [p1, p2] = parsed.projects;
    if (p1) {
      if (p1.name) vars.ProjOneName = p1.name;
      if (p1.dates) vars.ProjOneDates = p1.dates;
      if (p1.type) vars.ProjOneType = p1.type;
      if (p1.tasks) {
        if (p1.tasks[0]) vars.ProjOneTaskA = p1.tasks[0];
        if (p1.tasks[1]) vars.ProjOneTaskB = p1.tasks[1];
      }
    }
    if (p2) {
      if (p2.name) vars.ProjTwoName = p2.name;
      if (p2.dates) vars.ProjTwoDates = p2.dates;
      if (p2.type) vars.ProjTwoType = p2.type;
      if (p2.tasks) {
        if (p2.tasks[0]) vars.ProjTwoTaskA = p2.tasks[0];
        if (p2.tasks[1]) vars.ProjTwoTaskB = p2.tasks[1];
      }
    }
  }

  if (parsed.skills) {
    const s = parsed.skills;
    if (s.languages) vars.SkillsLanguages = s.languages;
    if (s.tools) vars.SkillsTools = s.tools;
    if (s.soft_skills) vars.SoftSkills = s.soft_skills;
    if (s.spoken_languages) vars.SkillsSpoken = s.spoken_languages;
  }

  if (Array.isArray(parsed.interests)) {
    if (parsed.interests[0]) vars.HobbyOne = parsed.interests[0];
    if (parsed.interests[1]) vars.HobbyTwo = parsed.interests[1];
    if (parsed.interests[2]) vars.HobbyThree = parsed.interests[2];
  }

  if (Array.isArray(parsed.references)) {
    const [r1, r2] = parsed.references;
    if (r1) {
      if (r1.name) vars.RefOneName = r1.name;
      if (r1.role) vars.RefOneRole = r1.role;
      if (r1.email) vars.RefOneEmail = r1.email;
      if (r1.phone) vars.RefOnePhone = r1.phone;
    }
    if (r2) {
      if (r2.name) vars.RefTwoName = r2.name;
      if (r2.role) vars.RefTwoRole = r2.role;
      if (r2.email) vars.RefTwoEmail = r2.email;
      if (r2.phone) vars.RefTwoPhone = r2.phone;
    }
  }

  if (parsed.custom_variables && typeof parsed.custom_variables === 'object') {
    for (const [k, v] of Object.entries(parsed.custom_variables)) {
      extras.push({ key: k, value: String(v) });
      vars[k] = String(v);
    }
  }

  return { variables: vars, extraVariables: extras };
}
