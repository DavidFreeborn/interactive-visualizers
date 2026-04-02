import type {
  CompositionalModelDefinition,
  CompositionalModelType,
} from "./types";
import { compositionalTraditionalModel } from "../compositionalTraditional/compositionalGame";
import { compositionalMinimalistModel } from "../compositionalMinimalist/compositionalGame";
import { compositionalInformationErasingGeneralistModel } from "../compositionalInformationErasingGeneralist/compositionalGame";
import { compositionalInformationPreservingGeneralistModel } from "../compositionalInformationPreservingGeneralist/compositionalGame";

const registry: Record<
  CompositionalModelType,
  CompositionalModelDefinition<any>
> = {
  traditional: compositionalTraditionalModel,
  minimalist: compositionalMinimalistModel,
  "information-erasing-generalist":
    compositionalInformationErasingGeneralistModel,
  "information-preserving-generalist":
    compositionalInformationPreservingGeneralistModel,
};

export interface CompositionalModelOption {
  type: CompositionalModelType;
  label: string;
  description: string;
  reference: string;
  referenceUrl: string;
  showsTraditionalStructureDiagnostics: boolean;
}

export const COMPOSITIONAL_MODEL_OPTIONS: CompositionalModelOption[] = (
  Object.keys(registry) as CompositionalModelType[]
).map((type) => ({
  type,
  label: registry[type].label,
  description: registry[type].description,
  reference: registry[type].reference,
  referenceUrl: registry[type].referenceUrl,
  showsTraditionalStructureDiagnostics:
    registry[type].showsTraditionalStructureDiagnostics,
}));

export function getCompositionalModelDefinition(
  modelType: CompositionalModelType,
): CompositionalModelDefinition<any> {
  return registry[modelType];
}
