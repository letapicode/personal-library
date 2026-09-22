export const CANONICAL_SECTION_ORDER = [
  'FOUNDATIONS',
  'SOLID',
  'CREATIONAL PATTERNS',
  'STRUCTURAL PATTERNS',
  'BEHAVIORAL PATTERNS',
  'PATTERN SELECTION',
  'LOW-LEVEL DESIGN',
  'SYSTEM DESIGN',
  'DISTRIBUTED SYSTEMS',
  'GENERAL LESSONS'
];

/**
 * Classifies chapters or lessons into logical sections.
 * 1. Honors explicit section declared in metadata or markdown (e.g. > Section: Genetics).
 * 2. Matches known topic keywords (design patterns, system design, foundations).
 * 3. Falls back to a clean general section for non-technical books (science, fiction, health, etc.).
 */
export function classifyLessonSection(
  lessonNumber: number,
  title: string,
  explicitSection?: string
): string {
  if (explicitSection && explicitSection.trim()) {
    return explicitSection.trim();
  }

  const t = title.toUpperCase();

  // Keyword-based classification (only when the title actually reflects the topic)
  if (t.includes('FOUNDATION') || t.includes('OBJECT-ORIENTED') || t.includes('WHAT IS SOFTWARE DESIGN')) {
    return 'Foundations';
  }
  if (t.includes('SOLID') || /SINGLE RESPONSIBILITY|OPEN\/CLOSED|LISKOV|INTERFACE SEGREGATION|DEPENDENCY INVERSION/.test(t)) {
    return 'SOLID';
  }
  if (/FACTORY|BUILDER|PROTOTYPE|SINGLETON/.test(t)) {
    return 'Creational Patterns';
  }
  if (/ADAPTER|BRIDGE|COMPOSITE|DECORATOR|FACADE|FLYWEIGHT|PROXY/.test(t)) {
    return 'Structural Patterns';
  }
  if (/CHAIN OF RESPONSIBILITY|COMMAND|INTERPRETER|ITERATOR|MEDIATOR|MEMENTO|OBSERVER|STATE|STRATEGY|TEMPLATE|VISITOR/.test(t)) {
    return 'Behavioral Patterns';
  }
  if (t.includes('PATTERN SELECTION') || t.includes('CHOOSE THE RIGHT PATTERN')) {
    return 'Pattern Selection';
  }
  if (t.includes('LOW-LEVEL DESIGN') || t.includes('LLD')) {
    return 'Low-Level Design';
  }
  if (t.includes('SYSTEM DESIGN') || t.includes('HIGH-LEVEL DESIGN') || t.includes('HLD')) {
    return 'System Design';
  }
  if (t.includes('DISTRIBUTED')) {
    return 'Distributed Systems';
  }

  // Universal fallback for general books (Science, Health, Fiction, etc.)
  return 'Chapters';
}

