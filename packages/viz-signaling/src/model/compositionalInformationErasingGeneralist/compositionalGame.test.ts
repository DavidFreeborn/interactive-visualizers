import { describe, expect, it } from "vitest";
import { compositionalInformationErasingGeneralistModel } from "./compositionalGame";

describe("compositionalInformationErasingGeneralistModel", () => {
  it("uses the paper-specified visible name and a modest replacement-harness description", () => {
    expect(compositionalInformationErasingGeneralistModel.type).toBe(
      "information-erasing-generalist",
    );
    expect(compositionalInformationErasingGeneralistModel.label).toBe(
      "Information-Erasing Generalist",
    );
    expect(compositionalInformationErasingGeneralistModel.reference).toContain(
      "Freeborn",
    );
    expect(
      compositionalInformationErasingGeneralistModel.description,
    ).toContain("replacement-harness variant");
    expect(
      compositionalInformationErasingGeneralistModel.description,
    ).toContain("ordinary no-replacement play");
    expect(
      compositionalInformationErasingGeneralistModel.showsTraditionalStructureDiagnostics,
    ).toBe(false);
  });
});
