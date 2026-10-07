import { AssessmentDefinition } from '../types';

export const ASSESSMENT_DEFINITIONS: Record<string, AssessmentDefinition> = {
  PHQ9: {
    type: 'PHQ9',
    title: 'PHQ-9',
    fullName: 'Patient Health Questionnaire-9',
    description: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    options: [
      { label: 'Not at all (0)', value: 0 },
      { label: 'Several days (1)', value: 1 },
      { label: 'More than half the days (2)', value: 2 },
      { label: 'Nearly every day (3)', value: 3 },
    ],
    questions: [
      { id: 1, question: 'Little interest or pleasure in doing things' },
      { id: 2, question: 'Feeling down, depressed, or hopeless' },
      { id: 3, question: 'Trouble falling or staying asleep, or sleeping too much' },
      { id: 4, question: 'Feeling tired or having little energy' },
      { id: 5, question: 'Poor appetite or overeating' },
      { id: 6, question: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down' },
      { id: 7, question: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
      { id: 8, question: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual' },
      { id: 9, question: 'Thoughts that you would be better off dead or of hurting yourself in some way' },
    ],
    scoringBands: [
      { min: 0, max: 4, severity: 'Minimal', color: '#10B981', bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { min: 5, max: 9, severity: 'Mild', color: '#3B82F6', bgClass: 'bg-blue-50 text-blue-700 border-blue-200' },
      { min: 10, max: 14, severity: 'Moderate', color: '#F59E0B', bgClass: 'bg-amber-50 text-amber-700 border-amber-200' },
      { min: 15, max: 19, severity: 'Moderately Severe', color: '#F97316', bgClass: 'bg-orange-50 text-orange-700 border-orange-200' },
      { min: 20, max: 27, severity: 'Severe', color: '#EF4444', bgClass: 'bg-red-50 text-red-700 border-red-200' },
    ]
  },
  GAD7: {
    type: 'GAD7',
    title: 'GAD-7',
    fullName: 'Generalized Anxiety Disorder-7',
    description: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    options: [
      { label: 'Not at all (0)', value: 0 },
      { label: 'Several days (1)', value: 1 },
      { label: 'More than half the days (2)', value: 2 },
      { label: 'Nearly every day (3)', value: 3 },
    ],
    questions: [
      { id: 1, question: 'Feeling nervous, anxious or on edge' },
      { id: 2, question: 'Not being able to stop or control worrying' },
      { id: 3, question: 'Worrying too much about different things' },
      { id: 4, question: 'Trouble relaxing' },
      { id: 5, question: 'Being so restless that it is hard to sit still' },
      { id: 6, question: 'Becoming easily annoyed or irritable' },
      { id: 7, question: 'Feeling afraid, as if something awful might happen' },
    ],
    scoringBands: [
      { min: 0, max: 4, severity: 'Minimal', color: '#10B981', bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { min: 5, max: 9, severity: 'Mild', color: '#3B82F6', bgClass: 'bg-blue-50 text-blue-700 border-blue-200' },
      { min: 10, max: 14, severity: 'Moderate', color: '#F59E0B', bgClass: 'bg-amber-50 text-amber-700 border-amber-200' },
      { min: 15, max: 21, severity: 'Severe', color: '#EF4444', bgClass: 'bg-red-50 text-red-700 border-red-200' },
    ]
  }
};
