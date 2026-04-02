import type { CompositionalModelDefinition } from "../compositionalShared/types";
import {
  createCompositionalGeneralistModelDefinition,
  createInitialCompositionalGeneralistState,
  deriveCompositionalGeneralistPolicies,
  playCompositionalGeneralistRound,
} from "../compositionalGeneralist/compositionalGame";
import { applyCompositionalGeneralistMessageReplacement } from "../compositionalGeneralist/replacement";
import type { CompositionalInformationErasingGeneralistState } from "./types";

export const createInitialCompositionalInformationErasingGeneralistState =
  createInitialCompositionalGeneralistState;

export const deriveCompositionalInformationErasingGeneralistPolicies =
  deriveCompositionalGeneralistPolicies;

export const playCompositionalInformationErasingGeneralistRound =
  playCompositionalGeneralistRound;

export const compositionalInformationErasingGeneralistModel: CompositionalModelDefinition<CompositionalInformationErasingGeneralistState> =
  createCompositionalGeneralistModelDefinition({
    type: "information-erasing-generalist",
    label: "Information-Erasing Generalist",
    description:
      "Shared Generalist core with an erasing replacement-harness variant. In ordinary no-replacement play it matches the other Generalist variant; under the explicit replacement harness, novel-message pair structures are initialized flat.",
    applyMessageReplacement(state, config, spec) {
      return applyCompositionalGeneralistMessageReplacement(state, config, {
        ...spec,
        variant: "information-erasing",
      });
    },
  });
