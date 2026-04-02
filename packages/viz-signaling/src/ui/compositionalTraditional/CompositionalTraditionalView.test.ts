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
    expect(screen.getByText("Approximate Regime")).toBeTruthy();
    expect(screen.getByText("Mutual information")).toBeTruthy();
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

    fireEvent.click(screen.getByText("Reset"));

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

    fireEvent.click(screen.getByText("Reset"));

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
    fireEvent.click(screen.getByText("Apply config"));

    await waitFor(() => {
      expect(getRoundValue()).toBe(0);
    });
  });

  it("renders a single public forgetting button without the old configuration controls", () => {
    render(React.createElement(CompositionalTraditionalView));

    expect(screen.getByText("Apply Forgetting")).toBeTruthy();
    expect(
      screen.getByText(
        'Replaces the sender\'s learned red message with the novel message "rouge".',
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

  it("applies forgetting, marks both charts, and relabels red as rouge", async () => {
    render(React.createElement(CompositionalTraditionalView));

    fireEvent.click(screen.getByTestId("compositional-apply-forgetting-button"));

    await waitFor(() => {
      expect(
        screen.getByText(
          'The sender\'s learned red message was replaced with the novel message "rouge".',
        ),
      ).toBeTruthy();
    });

    expect(screen.getAllByText("rouge dress").length).toBeGreaterThanOrEqual(2);
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
          'The sender\'s learned red message was replaced with the novel message "rouge".',
        ),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Reset"));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Replaces the sender\'s learned red message with the novel message "rouge".',
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

  it("switching models resets the simulation and updates the visible model label", async () => {
    render(React.createElement(CompositionalTraditionalView));

    fireEvent.click(screen.getByText("Fast"));
    fireEvent.click(screen.getByText("Step"));

    await waitFor(() => {
      expect(getRoundValue()).toBe(1);
    });

    fireEvent.change(screen.getByTestId("compositional-model-select"), {
      target: { value: "information-preserving-generalist" },
    });

    await waitFor(() => {
      expect(getRoundValue()).toBe(0);
    });

    expect(
      screen.getAllByText("4x(2+2)x4 Information-Preserving Generalist model"),
    ).toHaveLength(2);
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
    fireEvent.click(screen.getByText("Reset"));

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(getRoundValue()).toBe(0);
    expect(screen.queryByText(/Success:|Failure:/)).toBeNull();
    vi.useRealTimers();
  });

  it("keeps the public status driven by the approximate regime label", () => {
    render(React.createElement(CompositionalTraditionalView));

    const mutualInformationLabel = screen.getAllByText("Mutual information")[0];
    const approximateRegimeLabel = screen.getByText("Approximate Regime");

    expect(screen.getByText("Approximate Regime")).toBeTruthy();
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
