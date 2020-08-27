export interface ICape {
    [courseId: string]: ICapeRow[];
}

export interface ICapeRow {
    Instructor: string;
    CourseNumber: string;
    CourseTitle: string; 
    Term: string; 
    Enrolled: number; 
    EvalsMade: number;
    RecommendClass: number;
    RecommendInstructor: number;
    StudyHrsWk: number;
    LearnedFromCourse: number
}