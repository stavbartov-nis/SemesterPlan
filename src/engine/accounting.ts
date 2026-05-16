import { Course, DegreeTrack, RequirementBasket } from '../types';

export interface BasketProgress {
  basketId: string;
  basketName: string;
  basketType: 'Mandatory' | 'Core' | 'Elective';
  currentCredits: number;
  targetCredits: number;
  isMet: boolean;
  courseIds: string[];
}

export interface ComponentProgress {
  name: string;
  baskets: BasketProgress[];
}

export interface ProgressReport {
  components: ComponentProgress[];
  totalCredits: number;
}

/**
 * Calculates credit progress per requirement basket and component.
 */
export function calculateRequirementProgress(
  plannedCourseIds: string[],
  historyCourseIds: string[],
  track: DegreeTrack,
  catalog: Course[]
): ProgressReport {
  const allRelevantCourseIds = Array.from(new Set([...plannedCourseIds, ...historyCourseIds]));
  const componentProgress: ComponentProgress[] = [];

  for (const component of track.components) {
    const baskets: BasketProgress[] = [];

    for (const basket of component.baskets) {
      const coursesInBasket = allRelevantCourseIds.filter((id) =>
        basket.courseIds.includes(id)
      );

      const currentCredits = coursesInBasket.reduce((sum, id) => {
        const course = catalog.find((c) => c.id === id);
        return sum + (course?.credits || 0);
      }, 0);

      baskets.push({
        basketId: basket.id,
        basketName: basket.name,
        basketType: basket.type,
        currentCredits,
        targetCredits: basket.minCredits,
        isMet: currentCredits >= basket.minCredits,
        courseIds: coursesInBasket,
      });
    }

    componentProgress.push({
      name: component.name,
      baskets,
    });
  }

  // Total unique credits (no double counting for the absolute total)
  const totalCredits = allRelevantCourseIds.reduce((sum, id) => {
    const course = catalog.find((c) => c.id === id);
    return sum + (course?.credits || 0);
  }, 0);

  return {
    components: componentProgress,
    totalCredits,
  };
}
