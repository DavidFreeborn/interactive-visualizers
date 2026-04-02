import type { CompositionalModelDefinition } from "../compositionalShared/types";
import {
  createCompositionalGeneralistModelDefinition,
  createInitialCompositionalGeneralistState,
  deriveCompositionalGeneralistPolicies,
  playCompositionalGeneralistRound,
} from "../compositionalGeneralist/compositionalGame";
import { applyCompositionalGeneralistMessageReplacement } from "../compositionalGeneralist/replacement";
import type { CompositionalInformationPreservingGeneralistState } from "./types";

export const createInitialCompositionalInformationPreservingGeneralistState =
  createInitialCompositionalGeneralistState;

export const deriveCompositionalInformationPreservingGeneralistPolicies =
  deriveCompositionalGeneralistPolicies;

export const playCompositionalInformationPreservingGeneralistRound =
  playCompositionalGeneralistRound;

export const compositionalInformationPreservingGeneralistModel: CompositionalModelDefinition<CompositionalInformationPreservingGeneralistState> =
  createCompositionalGeneralistModelDefinition({
    type: "information-preserving-generalist",
    label: "Information-Preserving Generalist",
    description:
      "Shared Generalist core with a preserving replacement-harness variant. In ordinary no-replacement play it matches the other Generalist variant; under the explicit replacement harness, affected pair rows operationalize preservation of the unreplaced component under an independence-style assumption.",
    applyMessageReplacement(state, config, spec) {
      return applyCompositionalGeneralistMessageReplacement(state, config, {
        ...spec,
        variant: "information-preserving",
      });
    },
  });
