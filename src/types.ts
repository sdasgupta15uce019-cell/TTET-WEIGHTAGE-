export type Category = 'UR' | 'SC' | 'ST' | 'PH';
export type FilterCategory = 'All' | Category | 'Trash';
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
  isHidden?: boolean;
  rollNo?: string;
  slNo?: number;
  isVerified?: boolean;
}
