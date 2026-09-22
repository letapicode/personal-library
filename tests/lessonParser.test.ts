import { describe, it, expect } from 'vitest';
import { parseCourseMarkdown, mergeLessons } from '../src/parser/lessonParser';

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
});
