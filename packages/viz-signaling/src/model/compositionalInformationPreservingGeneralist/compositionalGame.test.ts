import { describe, expect, it } from "vitest";
import { compositionalInformationPreservingGeneralistModel } from "./compositionalGame";

describe("compositionalInformationPreservingGeneralistModel", () => {
  it("uses the paper-specified visible name and a modest replacement-harness description", () => {
    expect(compositionalInformationPreservingGeneralistModel.type).toBe(
      "information-preserving-generalist",
    );
    expect(compositionalInformationPreservingGeneralistModel.label).toBe(
      "Information-Preserving Generalist",
    );
    expect(
      compositionalInformationPreservingGeneralistModel.reference,
    ).toContain("Freeborn");
    expect(
      compositionalInformationPreservingGeneralistModel.description,
    ).toContain("replacement-harness variant");
    expect(
      compositionalInformationPreservingGeneralistModel.description,
    ).toContain("independence-style assumption");
    expect(
      compositionalInformationPreservingGeneralistModel.showsTraditionalStructureDiagnostics,
    ).toBe(false);
  });
});
