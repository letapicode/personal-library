import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Lesson } from '../../types/course';
import styles from './PreviousNextNavigation.module.css';

interface Props {
  prevLesson?: Lesson;
  nextLesson?: Lesson;
  onSelect: (lessonId: string) => void;
}

export const PreviousNextNavigation: React.FC<Props> = ({ prevLesson, nextLesson, onSelect }) => {
  return (
    <div className={styles.navContainer}>
      <button
        className={styles.navBtn}
        disabled={!prevLesson}
        onClick={() => prevLesson && onSelect(prevLesson.id)}
      >
        <ChevronLeft size={18} />
        <div className={styles.btnText}>
          <span className={styles.btnSub}>Previous</span>
          <span className={styles.btnTitle}>
            {prevLesson ? `Lesson ${prevLesson.number}` : 'Beginning'}
          </span>
        </div>
      </button>

      <button
        className={styles.navBtn}
        disabled={!nextLesson}
        onClick={() => nextLesson && onSelect(nextLesson.id)}
      >
        <div className={`${styles.btnText} ${styles.btnTextRight}`}>
          <span className={styles.btnSub}>Next</span>
          <span className={styles.btnTitle}>
            {nextLesson ? `Lesson ${nextLesson.number}` : 'End'}
          </span>
        </div>
        <ChevronRight size={18} />
      </button>
    </div>
  );
};
