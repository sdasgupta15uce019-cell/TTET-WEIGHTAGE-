export type Category = 'UR' | 'SC' | 'ST';
export type FilterCategory = 'All' | Category;
export type Gender = 'Male' | 'Female';

export interface CandidateRecord {
  id?: string;
  name: string;
  phone: string;
  gender?: Gender;
  category: Category;
  score12th: number;
  scoreGrad: number;
  scoreBEd: number;
  scoreTET2: number;
  finalScore: number;
  timestamp: any;
}
