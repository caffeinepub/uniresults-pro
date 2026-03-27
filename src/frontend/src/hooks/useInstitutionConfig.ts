import { useApp } from "../context/AppContext";
import {
  type InstitutionConfig,
  getInstitutionConfig,
} from "../utils/institutionConfig";

export function useInstitutionConfig(): InstitutionConfig {
  const { institutionSettings } = useApp();
  return getInstitutionConfig(institutionSettings?.institutionType);
}
