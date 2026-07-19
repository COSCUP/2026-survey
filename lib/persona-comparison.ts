import type { BarDatum } from "./dashboard-data";

export type PersonaComparisonDatum = {
  label: string;
  detail?: string;
  cohortValue: number;
  populationValue: number;
  cohortRate: number;
  populationRate: number;
  cohortRank: number;
  populationRank: number | null;
  rankDelta: number | null;
};

function competitionRanks(data: BarDatum[]) {
  const values = data.map((item) => item.value);
  return new Map(data.map((item) => [
    item.label,
    1 + values.filter((value) => value > item.value).length,
  ]));
}

export function buildPersonaComparison(
  cohort: BarDatum[],
  population: BarDatum[],
  cohortTotal: number,
  populationTotal: number,
): PersonaComparisonDatum[] {
  const populationByLabel = new Map(population.map((item) => [item.label, item]));
  const cohortRanks = competitionRanks(cohort);
  const populationRanks = competitionRanks(population);

  return cohort.map((item) => {
    const populationItem = populationByLabel.get(item.label);
    const cohortRank = cohortRanks.get(item.label) || 1;
    const populationRank = populationRanks.get(item.label) ?? null;
    return {
      label: item.label,
      detail: item.detail,
      cohortValue: item.value,
      populationValue: populationItem?.value || 0,
      cohortRate: cohortTotal > 0 ? item.value / cohortTotal : 0,
      populationRate: populationTotal > 0 ? (populationItem?.value || 0) / populationTotal : 0,
      cohortRank,
      populationRank,
      rankDelta: populationRank == null ? null : populationRank - cohortRank,
    };
  });
}
