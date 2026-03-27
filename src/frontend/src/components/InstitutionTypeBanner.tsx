import { Building2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  INSTITUTION_TYPE_OPTIONS,
  getInstitutionConfig,
} from "../utils/institutionConfig";

export function InstitutionTypeBanner() {
  const { institutionSettings, updateInstitutionSettings } = useApp();
  const config = getInstitutionConfig(institutionSettings.institutionType);

  const colorMap: Record<string, string> = {
    university: "bg-blue-100 text-blue-800 border-blue-200",
    nce: "bg-purple-100 text-purple-800 border-purple-200",
    polytechnic: "bg-orange-100 text-orange-800 border-orange-200",
    secondary: "bg-green-100 text-green-800 border-green-200",
    primary: "bg-yellow-100 text-yellow-800 border-yellow-200",
    pre_nursery: "bg-pink-100 text-pink-800 border-pink-200",
  };
  const colorClass = colorMap[config.type] ?? colorMap.university;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${colorClass} no-print`}
      data-ocid="institution_type.toggle"
    >
      <Building2 className="w-3 h-3" />
      <span>{config.label}</span>
      <select
        className="bg-transparent border-none outline-none text-xs cursor-pointer font-medium"
        value={institutionSettings.institutionType ?? "university"}
        onChange={(e) =>
          updateInstitutionSettings({
            ...institutionSettings,
            institutionType: e.target.value,
          })
        }
        title="Switch institution type"
        data-ocid="institution_type.select"
      >
        {INSTITUTION_TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
