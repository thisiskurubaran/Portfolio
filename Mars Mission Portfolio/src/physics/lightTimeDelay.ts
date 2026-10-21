import { AU_KM, C_KM_S } from "./constants";

/** One way signal delay in seconds across a distance in AU. */
export function lightTimeSeconds(distanceAu: number): number {
  return (distanceAu * AU_KM) / C_KM_S;
}
