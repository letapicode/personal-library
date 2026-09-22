import { describe, it, expect } from 'vitest';
import { parseCourseMarkdown, mergeLessons, parseRomanNumeral } from '../src/parser/lessonParser';

describe('Universal Lesson Parser', () => {
  it('parses standard hashes and dashes format', () => {
    const markdown = `
# Lesson 1 — Foundations
Intro text

# Lesson 2: Object-Oriented Principles
OOP details
    `;
    const lessons = parseCourseMarkdown(markdown);
    expect(lessons).toHaveLength(2);
    expect(lessons[0].number).toBe(1);
    expect(lessons[0].title).toBe('Foundations');
    expect(lessons[1].number).toBe(2);
    expect(lessons[1].title).toBe('Object-Oriented Principles');
  });

  it('orders lessons numerically ascending rather than lexicographically', () => {
    const markdown = `
# Lesson 10 — Facade Pattern
Content 10

# Lesson 2 — Factory Pattern
Content 2

# Lesson 1 — OOP
Content 1
    `;
    const lessons = parseCourseMarkdown(markdown);
    expect(lessons.map(l => l.number)).toEqual([1, 2, 10]);
  });

  it('suppresses false-positive textual references', () => {
    const markdown = `
# Lesson 1 — Introduction
As we will see in Lesson 30, design patterns are useful.
Please refer to Lesson 5 for further reading.

# Lesson 2 — Encapsulation
Encapsulation details.
    `;
    const lessons = parseCourseMarkdown(markdown);
    expect(lessons).toHaveLength(2);
    expect(lessons.map(l => l.number)).toEqual([1, 2]);
  });

  it('merges new incoming lessons without losing bookmark/completion state', () => {
    const existing = parseCourseMarkdown(`
# Lesson 1 — Old Intro
Old content
    `);
    existing[0].completed = true;
    existing[0].bookmarked = true;

    const incoming = parseCourseMarkdown(`
# Lesson 1 — Updated Intro
New updated text

# Lesson 2 — New Topic
Brand new
    `);

    const merged = mergeLessons(existing, incoming, 'replace-conflicts');
    expect(merged).toHaveLength(2);
    expect(merged[0].markdown).toBe('New updated text');
    expect(merged[0].completed).toBe(true);
    expect(merged[0].bookmarked).toBe(true);
    expect(merged[1].number).toBe(2);
  });

  it('parses Roman numerals in lesson headings', () => {
    const markdown = `
# Chapter I: Foundations
Intro text

# Chapter IV: Architecture
Architecture text

# Chapter IX: Testing
Testing text
    `;
    const lessons = parseCourseMarkdown(markdown);
    expect(lessons).toHaveLength(3);
    expect(lessons[0].number).toBe(1);
    expect(lessons[0].title).toBe('Foundations');
    expect(lessons[1].number).toBe(4);
    expect(lessons[1].title).toBe('Architecture');
    expect(lessons[2].number).toBe(9);
    expect(lessons[2].title).toBe('Testing');
  });

  it('assigns unique sequential numbers to duplicate lessons from different sections', () => {
    const markdown = `
# Part 1: Foundations
## Lesson 1: Introduction
Foundations intro text
## Lesson 2: Basic Concepts
Foundations basics text

# Part 2: Advanced Topics
## Lesson 1: Deep Dive
Advanced deep dive text
## Lesson 2: Performance
Advanced performance text
    `;
    const lessons = parseCourseMarkdown(markdown);
    expect(lessons).toHaveLength(4);
    expect(lessons.map(l => l.number)).toEqual([1, 2, 3, 4]);
    expect(lessons[0].title).toBe('Introduction');
    expect(lessons[1].title).toBe('Basic Concepts');
    expect(lessons[2].title).toBe('Deep Dive');
    expect(lessons[3].title).toBe('Performance');
    expect(lessons[2].section).toBe('Advanced Topics');
  });

  it('merges duplicate lessons in the same section as continuations', () => {
    const markdown = `
# Part 1: Foundations
## Lesson 1: Introduction
Initial text

## Lesson 1: Introduction Part 2
Continuation text
    `;
    const lessons = parseCourseMarkdown(markdown);
    expect(lessons).toHaveLength(1);
    expect(lessons[0].number).toBe(1);
    expect(lessons[0].markdown).toContain('Continuation text');
    expect(lessons[0].markdown).toContain('Continuation: Introduction Part 2');
  });

  it('correctly handles multi-part books with Lessons 1-5 in Part 1 and Part 2', () => {
    const markdown = `
# Part 1: Basics
## Lesson 1: L1
Text
## Lesson 2: L2
Text
## Lesson 3: L3
Text
## Lesson 4: L4
Text
## Lesson 5: L5
Text

# Part 2: Applied
## Lesson 1: L6
Text
## Lesson 2: L7
Text
## Lesson 3: L8
Text
## Lesson 4: L9
Text
## Lesson 5: L10
Text
    `;
    const lessons = parseCourseMarkdown(markdown);
    expect(lessons).toHaveLength(10);
    expect(lessons.map(l => l.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(lessons.slice(0, 5).every(l => l.section === 'Basics')).toBe(true);
    expect(lessons.slice(5, 10).every(l => l.section === 'Applied')).toBe(true);
  });

  it('converts Roman numerals correctly', () => {
    expect(parseRomanNumeral('I')).toBe(1);
    expect(parseRomanNumeral('II')).toBe(2);
    expect(parseRomanNumeral('III')).toBe(3);
    expect(parseRomanNumeral('IV')).toBe(4);
    expect(parseRomanNumeral('V')).toBe(5);
    expect(parseRomanNumeral('VI')).toBe(6);
    expect(parseRomanNumeral('VII')).toBe(7);
    expect(parseRomanNumeral('VIII')).toBe(8);
    expect(parseRomanNumeral('IX')).toBe(9);
    expect(parseRomanNumeral('X')).toBe(10);
    expect(parseRomanNumeral('XIV')).toBe(14);
    expect(parseRomanNumeral('XL')).toBe(40);
    expect(parseRomanNumeral('XLIX')).toBe(49);
    expect(parseRomanNumeral('L')).toBe(50);
  });

  it('parses standalone Part headers without subtitles', () => {
    const markdown = `
# Part 1
## Lesson 1: Intro
Part 1 text

# Part 2
## Lesson 1: Next
Part 2 text
    `;
    const lessons = parseCourseMarkdown(markdown);
    expect(lessons).toHaveLength(2);
    expect(lessons[0].section).toBe('Part 1');
    expect(lessons[1].section).toBe('Part 2');
    expect(lessons[1].number).toBe(2);
  });

  it('parses Roman numerals in fallback numbered headings', () => {
    const markdown = `
# I. Overview of Distributed Systems
Distributed overview text

# II. Consensus Algorithms
Consensus text

# IV. Storage Layers
Storage text
    `;
    const lessons = parseCourseMarkdown(markdown);
    expect(lessons).toHaveLength(3);
    expect(lessons[0].number).toBe(1);
    expect(lessons[0].title).toBe('Overview of Distributed Systems');
    expect(lessons[1].number).toBe(2);
    expect(lessons[1].title).toBe('Consensus Algorithms');
    expect(lessons[2].number).toBe(4);
    expect(lessons[2].title).toBe('Storage Layers');
  });
});

