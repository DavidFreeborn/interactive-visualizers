// @vitest-environment jsdom

import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CompositionalTraditionalView } from "./CompositionalTraditionalView";

function getRoundValue(): number {
  const text =
    screen.getByTestId("compositional-round-value").textContent ?? "0";
  return Number.parseInt(text.replace(/,/g, ""), 10);
}

describe("CompositionalTraditionalView", () => {
  it("a new random run discards pending receiver and bias changes", () => {
    render(React.createElement(CompositionalTraditionalView));
    fireEvent.change(screen.getByTestId("compositional-model-select"), { target: { value: "minimalist" } });
    fireEvent.click(screen.getByTestId("compositional-signaling-bias-checkbox"));
    expect(screen.getByText("Unapplied changes")).toBeTruthy();
    fireEvent.click(screen.getByText("New random run"));
    expect((screen.getByTestId("compositional-model-select") as HTMLSelectElement).value).toBe("traditional");
    expect((screen.getByTestId("compositional-signaling-bias-checkbox") as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByText("Unapplied changes")).toBeNull();
    expect(getRoundValue()).toBe(0);
  });

  it("applying settings cancels the old round animation", () => {
    vi.useFakeTimers();
    render(React.createElement(CompositionalTraditionalView));
    fireEvent.click(screen.getByText("Step"));
    fireEvent.change(screen.getByTestId("compositional-model-select"), { target: { value: "minimalist" } });
    fireEvent.click(screen.getByText("Restart with settings"));
    act(() => { vi.advanceTimersByTime(2000); });
    expect(getRoundValue()).toBe(0);
    expect(screen.queryByText(/Success:|Failure:/)).toBeNull();
    expect(screen.getByText("4x(2+2)x4 Minimalist model")).toBeTruthy();
    vi.useRealTimers();
  });
  it("renders the compositional app with joint mutual information public and richer diagnostics in debug", () => {
    render(React.createElement(CompositionalTraditionalView));

    expect(screen.getByText("Compositional signaling games")).toBeTruthy();
    const barrettLink = screen.getByRole("link", {
      name: /Barrett JA, Cochran C, Skyrms B\./,
    }) as HTMLAnchorElement;
    expect(barrettLink.href).toBe(
      "https://www.cambridge.org/core/journals/philosophy-of-science/article/abs/on-the-evolution-of-compositional-language/E65AF2A9D2DB2B8E3C8B4AA0C7273592",
    );
    expect(screen.getByText("Based on the models in")).toBeTruthy();
    expect(screen.queryByTestId("compositional-seed-input")).toBeNull();
    expect(screen.getByText("Approximate regime")).toBeTruthy();
    expect(screen.getByText("State-to-pair information")).toBeTruthy();
    expect(screen.queryByText("I(S ; M_A)")).toBeNull();
    expect(screen.queryByText("I(S ; M_B)")).toBeNull();
    expect(screen.queryByText("Expected success")).toBeNull();
    expect(
      screen.queryByText("Strict canonical traditional criterion"),
    ).toBeNull();

    fireEvent.click(screen.getByText("Show"));
    expect(screen.getByText("Expected success")).toBeTruthy();
    expect(screen.getByText("A-message information")).toBeTruthy();
    expect(screen.getByText("B-message information")).toBeTruthy();
    expect(screen.getByText("Joint mutual information")).toBeTruthy();
    expect(
      screen.getByText("Strict canonical traditional criterion"),
    ).toBeTruthy();
    expect(screen.getByTestId("compositional-seed-input")).toBeTruthy();
  });

  it("steps once and resets the round display", async () => {
    render(React.createElement(CompositionalTraditionalView));

    fireEvent.click(screen.getByText("Fast"));
    fireEvent.click(screen.getByText("Step"));

    await waitFor(() => {
      expect(getRoundValue()).toBe(1);
    });

    expect(
      screen
        .getByTestId("compositional-success-chart")
        .getAttribute("data-point-count"),
    ).toBe("2");

    fireEvent.click(screen.getByText("New random run"));

    await waitFor(() => {
      expect(getRoundValue()).toBe(0);
    });
  });

  it("draws a fresh random seed on reset while keeping seed control in debug", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(React.createElement(CompositionalTraditionalView));

    fireEvent.click(screen.getByText("Show"));
    const seedInput = screen.getByTestId(
      "compositional-seed-input",
    ) as HTMLInputElement;
    expect(seedInput.value).not.toBe("2147483648");

    fireEvent.click(screen.getByText("New random run"));

    await waitFor(() => {
      expect(
        (screen.getByTestId("compositional-seed-input") as HTMLInputElement)
          .value,
      ).toBe("2147483648");
    });

    randomSpy.mockRestore();
  });

  it("applies the signaling-bias checkbox through the shared config reset path", async () => {
    render(React.createElement(CompositionalTraditionalView));

    const biasCheckbox = screen.getByTestId(
      "compositional-signaling-bias-checkbox",
    ) as HTMLInputElement;
    expect(biasCheckbox.checked).toBe(true);

    fireEvent.click(screen.getByText("Fast"));
    fireEvent.click(screen.getByText("Step"));

    await waitFor(() => {
      expect(getRoundValue()).toBe(1);
    });

    fireEvent.click(biasCheckbox);
    expect(biasCheckbox.checked).toBe(false);
    fireEvent.click(screen.getByText("Restart with settings"));

    await waitFor(() => {
      expect(getRoundValue()).toBe(0);
    });
  });

  it("renders a single public forgetting button without the old configuration controls", () => {
    render(React.createElement(CompositionalTraditionalView));

    expect(screen.getByText("Replace B0 message")).toBeTruthy();
    expect(
      screen.getByText(
        'Replaces Sender B’s B0 with a new message; states and actions stay the same.',
      ),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("compositional-forgetting-enabled-checkbox"),
    ).toBeNull();
    expect(
      screen.queryByTestId("compositional-forgetting-trigger-mode-select"),
    ).toBeNull();
    expect(
      screen.queryByTestId("compositional-forgetting-scheduled-round-input"),
    ).toBeNull();
    expect(screen.queryByTestId("compositional-forgetting-status")).toBeNull();
    expect(screen.queryByTestId("compositional-forgetting-panel")).toBeNull();
  });

  it("applies forgetting, marks both charts, and preserves the state and action meanings", async () => {
    render(React.createElement(CompositionalTraditionalView));

    fireEvent.click(screen.getByTestId("compositional-apply-forgetting-button"));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Sender B’s B0 was replaced with a new message.',
        ),
      ).toBeTruthy();
    });

    expect(screen.getAllByText("red dress").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByTestId("line-chart-marker-forgetting")).toHaveLength(
      2,
    );
    expect(screen.queryByTestId("compositional-forgetting-panel")).toBeNull();
    expect(
      (
        screen.getByTestId(
          "compositional-apply-forgetting-button",
        ) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("reset restores the pre-forgetting public state", async () => {
    render(React.createElement(CompositionalTraditionalView));
    fireEvent.click(screen.getByTestId("compositional-apply-forgetting-button"));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Sender B’s B0 was replaced with a new message.',
        ),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByText("New random run"));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Replaces Sender B’s B0 with a new message; states and actions stay the same.',
        ),
      ).toBeTruthy();
    });

    expect(screen.queryAllByTestId("line-chart-marker-forgetting")).toHaveLength(
      0,
    );
    expect(
      (
        screen.getByTestId(
          "compositional-apply-forgetting-button",
        ) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    expect(screen.queryByText("rouge dress")).toBeNull();
  });

  it("stages a receiver change without losing results, then restarts explicitly", async () => {
    render(React.createElement(CompositionalTraditionalView));

    fireEvent.click(screen.getByText("Fast"));
    fireEvent.click(screen.getByText("Step"));

    await waitFor(() => {
      expect(getRoundValue()).toBe(1);
    });

    fireEvent.change(screen.getByTestId("compositional-model-select"), {
      target: { value: "information-preserving-generalist" },
    });
    expect(screen.getByText("Unapplied changes")).toBeTruthy();
    expect(getRoundValue()).toBe(1);
    expect(screen.getByText("4x(2+2)x4 Traditional model")).toBeTruthy();
    fireEvent.click(screen.getByText("Restart with settings"));

    await waitFor(() => {
      expect(getRoundValue()).toBe(0);
    });

    expect(screen.getByText("4x(2+2)x4 Information-Preserving Generalist model")).toBeTruthy();
    expect(
      screen.getByRole("link", {
        name: /David Peter Wallis Freeborn \(2025\)/,
      }),
    ).toHaveProperty(
      "href",
      "https://link.springer.com/article/10.1007/s11229-025-05184-3",
    );
    expect(screen.queryByRole("link", { name: /Barrett JA/ })).toBeNull();
  });

  it("plays and pauses without continuing after pause", () => {
    vi.useFakeTimers();
    render(React.createElement(CompositionalTraditionalView));

    fireEvent.click(screen.getByText("Fast"));
    fireEvent.click(screen.getByTestId("compositional-play-pause-button"));

    act(() => {
      vi.advanceTimersByTime(220);
    });

    const playingRound = getRoundValue();
    expect(playingRound).toBeGreaterThan(0);

    fireEvent.click(screen.getByTestId("compositional-play-pause-button"));

    act(() => {
      vi.advanceTimersByTime(220);
    });

    expect(getRoundValue()).toBe(playingRound);
    vi.useRealTimers();
  });

  it("does not leave a stale animation result after reset", () => {
    vi.useFakeTimers();
    render(React.createElement(CompositionalTraditionalView));

    fireEvent.click(screen.getByText("Step"));
    fireEvent.click(screen.getByText("New random run"));

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(getRoundValue()).toBe(0);
    expect(screen.queryByText(/Success:|Failure:/)).toBeNull();
    vi.useRealTimers();
  });

  it("keeps the public status driven by the approximate regime label", () => {
    render(React.createElement(CompositionalTraditionalView));

    const mutualInformationLabel = screen.getAllByText("State-to-pair information")[0];
    const approximateRegimeLabel = screen.getByText("Approximate regime");

    expect(screen.getByText("Approximate regime")).toBeTruthy();
    expect(screen.getByText("Not yet coordinated")).toBeTruthy();
    expect(
      screen.queryByText("Strict canonical traditional criterion"),
    ).toBeNull();
    expect(
      Boolean(
        mutualInformationLabel.compareDocumentPosition(approximateRegimeLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
  });

  it("does not show traditional-only structural diagnostics for non-traditional models", () => {
    render(React.createElement(CompositionalTraditionalView));

    fireEvent.change(screen.getByTestId("compositional-model-select"), {
      target: { value: "minimalist" },
    });
    expect(screen.getByText("Unapplied changes")).toBeTruthy();
    fireEvent.click(screen.getByText("Restart with settings"));
    fireEvent.click(screen.getByText("Show"));

    expect(
      screen.queryByText("Strict canonical traditional criterion"),
    ).toBeNull();
    expect(
      screen.getByText(
        "Traditional structural diagnostics are shown only for the Traditional receiver.",
      ),
    ).toBeTruthy();
  });
});
